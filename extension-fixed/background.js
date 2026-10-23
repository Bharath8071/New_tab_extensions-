// ═══════════════════════════════════════════════════════
// TAB GROUP MANAGER — background.js (MV3 Service Worker)
// Two-way sync with Chrome's native tabGroups API
//
// MV3 note: this worker is stopped after ~30s idle, so NOTHING
// important is kept in memory. Tab <-> saved-entry bindings live in
// storage (tabs[i].chromeTabId).
// ═══════════════════════════════════════════════════════

// Master toggle: true = two-way sync with Chrome native tab groups; false = pure link collector
const ENABLE_CHROME_GROUP_SYNC = false;

function isChromeGroupSyncEnabled(stateObj) {
  if (stateObj && typeof stateObj.syncChromeGroups === 'boolean') {
    return stateObj.syncChromeGroups;
  }
  return ENABLE_CHROME_GROUP_SYNC;
}

const HEX_TO_CHROME_COLOR = {
  '#1a73e8': 'blue',
  '#34a853': 'green',
  '#fbbc04': 'yellow',
  '#ea4335': 'red',
  '#9c27b0': 'purple',
  '#ff5722': 'orange',
  '#00bcd4': 'cyan',
  '#e91e63': 'pink',
  '#607d8b': 'grey',
  '#795548': 'grey',   // Chrome has no brown: shares 'grey'
};

const CHROME_COLOR_TO_HEX = {
  'blue': '#1a73e8',
  'green': '#34a853',
  'yellow': '#fbbc04',
  'red': '#ea4335',
  'purple': '#9c27b0',
  'orange': '#ff5722',
  'cyan': '#00bcd4',
  'pink': '#e91e63',
  'grey': '#607d8b',
};

function hexToChromeColor(hex) {
  if (!hex || typeof hex !== 'string') return 'blue';
  return HEX_TO_CHROME_COLOR[hex.toLowerCase()] || 'blue';
}

function chromeColorToHex(colorName) {
  if (!colorName || typeof colorName !== 'string') return '#1a73e8';
  return CHROME_COLOR_TO_HEX[colorName.toLowerCase()] || '#1a73e8';
}

// URL prefixes that must never be saved to a group
const SKIP_PREFIXES = [
  'chrome://', 'about:', 'chrome-extension://', 'chrome-search://',
  'chrome-untrusted://', 'edge://', 'devtools://', 'view-source:',
  'data:', 'blob:', 'javascript:', 'file:',
];

function shouldSkipUrl(url) {
  if (!url || typeof url !== 'string' || url.trim() === '') return true;
  return SKIP_PREFIXES.some(p => url.startsWith(p));
}

// Same normaliser as newtab.js: lowercase host, no hash, no trailing slash, KEEP query
function normUrl(u) {
  try {
    const x = new URL(u);
    let path = x.pathname.replace(/\/+$/, '');
    return x.protocol + '//' + x.host + path + x.search;
  } catch (_) {
    return (u || '').trim();
  }
}

const LOCK_MS = 10000;          // creation/closing locks auto-expire
const NO_GROUP = -1;            // chrome.tabGroups.TAB_GROUP_ID_NONE

// True while ANY group is being opened / created / closed by the new-tab page.
// (Previously only the active group's lock was honoured, so opening Group B
//  while Group A was active let this worker hijack B's tabs into A.)
function isBusy(s) {
  const now = Date.now();
  return (s.tabGroups || []).some(g =>
    (g._tgmCreating && now - (g._tgmCreatingTime || 0) < LOCK_MS) ||
    (g._tgmClosing  && now - (g._tgmClosingTime  || 0) < LOCK_MS)
  );
}

// ─── Serialised read-modify-write on ntp_state ───
// Every write from this worker goes through here so two listeners can never
// interleave a stale read with a write.
let _stateQueue = Promise.resolve();
function updateState(fn) {
  const run = _stateQueue.catch(() => {}).then(async () => {
    const r = await chrome.storage.local.get(['ntp_state']);
    const s = r.ntp_state;
    if (!s || !Array.isArray(s.tabGroups)) return false;
    const changed = await fn(s);
    if (changed) await chrome.storage.local.set({ ntp_state: s });
    return !!changed;
  });
  _stateQueue = run.catch(() => {});
  return run;
}

// Safe groupTab helper with retries (transient browser locks while dragging)
async function safeGroupTab(tabId, groupId = null, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const tab = await chrome.tabs.get(tabId).catch(() => null);
      if (!tab) return null;
      if (groupId) return await chrome.tabs.group({ tabIds: [tabId], groupId });
      return await chrome.tabs.group({ tabIds: [tabId] });
    } catch (err) {
      if (attempt < retries - 1) {
        await new Promise(r => setTimeout(r, 60 * (attempt + 1)));
      } else {
        console.warn('[TGM] safeGroupTab error:', err);
      }
    }
  }
  return null;
}

// ─── Put a NEWLY CREATED tab into the active group ───
// Only called from tabs.onCreated. Page loads in existing tabs no longer pull
// them into the group (that made removed/ungrouped tabs jump back in).
let _groupingMutex = Promise.resolve();

function ensureTabInActiveGroup(tabId) {
  if (tabId == null || tabId < 0) return _groupingMutex;

  _groupingMutex = _groupingMutex.catch(() => {}).then(async () => {
    try {
      const r = await chrome.storage.local.get(['ntp_state']);
      const s = r.ntp_state;
      if (!s || !Array.isArray(s.tabGroups)) return;

      const active = s.tabGroups.find(g => g.isActive === true);
      if (!active || isBusy(s)) return;

      let tab = null;
      try { tab = await chrome.tabs.get(tabId); } catch (_) { return; }
      if (!tab || tab.pinned) return;

      if (!isChromeGroupSyncEnabled(s)) {
        // Native group sync is OFF: track this new tab under active group so loaded URLs get captured,
        // without grouping into Chrome native tab groups
        await updateState(st => {
          const act = st.tabGroups.find(g => g.isActive === true);
          if (!act || isBusy(st)) return false;
          act.chromeTabIds = act.chromeTabIds || [];
          if (!act.chromeTabIds.includes(tabId)) {
            act.chromeTabIds.push(tabId);
            return true;
          }
          return false;
        });
        return;
      }

      if (tab.groupId !== NO_GROUP) return;   // already in some group: respect it

      const nameLower = (active.name || '').trim().toLowerCase();
      let native = null;
      try {
        const winGroups = await chrome.tabGroups.query({ windowId: tab.windowId });
        native = (winGroups || []).find(g =>
          (active.nativeGroupId && g.id === active.nativeGroupId) ||
          (g.title && g.title.trim().toLowerCase() === nameLower)
        ) || null;
      } catch (_) {}

      if (native) {
        await safeGroupTab(tabId, native.id);
        if (active.nativeGroupId !== native.id) {
          await updateState(st => {
            const g = st.tabGroups.find(x => x.id === active.id);
            if (!g) return false;
            g.nativeGroupId = native.id;
            g.hasCreatedNativeGroup = true;
            return true;
          });
        }
      } else {
        const newId = await safeGroupTab(tabId, null);
        if (newId) {
          await chrome.tabGroups.update(newId, {
            title: active.name,
            color: hexToChromeColor(active.color),
            collapsed: false,
          }).catch(() => {});
          await updateState(st => {
            const g = st.tabGroups.find(x => x.id === active.id);
            if (!g) return false;
            g.nativeGroupId = newId;
            g.hasCreatedNativeGroup = true;
            return true;
          });
        }
      }
    } catch (err) {
      console.warn('[TGM bg] ensureTabInActiveGroup error:', err);
    }
  });

  return _groupingMutex;
}

chrome.tabs.onCreated.addListener(tab => {
  ensureTabInActiveGroup(tab.id);
});

// ─── Auto-save: one saved entry PER TAB (not per page visited) ───
// Entry <-> live tab binding is stored as tabs[i].chromeTabId.
//  • tab already bound      -> update that entry in place (navigation)
//  • same URL, unbound      -> adopt it (tab opened from the saved list)
//  • otherwise              -> append a new entry
async function saveTabToActiveGroup(tabId, tab) {
  if (!tab || !tab.url || shouldSkipUrl(tab.url)) return;

  const r = await chrome.storage.local.get(['ntp_state']).catch(() => ({}));
  const s = r && r.ntp_state;
  if (!s || !Array.isArray(s.tabGroups)) return;

  const syncOn = isChromeGroupSyncEnabled(s);

  let ng = null;
  if (syncOn) {
    if (tab.groupId == null || tab.groupId === NO_GROUP) {
      const act = s.tabGroups.find(g => g.isActive === true);
      if (act && Array.isArray(act.chromeTabIds) && act.chromeTabIds.includes(tabId) && act.nativeGroupId) {
        await safeGroupTab(tabId, act.nativeGroupId).catch(() => {});
        try { ng = await chrome.tabGroups.get(act.nativeGroupId); } catch (_) {}
      }
      if (!ng) return;
    } else {
      try { ng = await chrome.tabGroups.get(tab.groupId); } catch (_) { return; }
      if (!ng) return;
    }
  }

  const favicon = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(tab.url)}&size=64`;
  const title = tab.title || tab.url;
  const n = normUrl(tab.url);

  await updateState(st => {
    const active = st.tabGroups.find(g => g.isActive === true);
    if (!active) return false;

    if (syncOn) {
      const nameMatch = ng && ng.title && active.name &&
        ng.title.trim().toLowerCase() === active.name.trim().toLowerCase();
      if (ng && ng.id !== active.nativeGroupId && !nameMatch) return false;
    } else {
      const isTracked = Array.isArray(active.chromeTabIds) && active.chromeTabIds.includes(tabId);
      const isAlreadyBound = (active.tabs || []).some(t => t.chromeTabId === tabId);
      if (!isTracked && !isAlreadyBound) {
        // If the group is active and empty (just created & activated), or this tab is active
        // and hasn't been explicitly removed, adopt it so the first opened page is saved!
        const isExplicitlyRemoved = Array.isArray(active.removedTabIds) && active.removedTabIds.includes(tabId);
        const isEmptyGroup = !active.tabs || active.tabs.length === 0;
        if (!isExplicitlyRemoved && (isEmptyGroup || tab.active)) {
          active.chromeTabIds = active.chromeTabIds || [];
          if (!active.chromeTabIds.includes(tabId)) active.chromeTabIds.push(tabId);
        } else {
          return false;
        }
      }
    }

    active.tabs = active.tabs || [];
    const bound = active.tabs.find(t => t.chromeTabId === tabId);

    if (bound) {
      const dup = active.tabs.find(t => t !== bound && normUrl(t.url) === n);
      if (dup) {                       // navigated onto a URL we already hold
        active.tabs.splice(active.tabs.indexOf(bound), 1);
        if (dup.chromeTabId == null) dup.chromeTabId = tabId;
        return true;
      }
      if (bound.url === tab.url && bound.title === title) return false;
      bound.url = tab.url;
      bound.title = title;
      bound.favicon = favicon;
      return true;
    }

    const unbound = active.tabs.find(t => t.chromeTabId == null && normUrl(t.url) === n);
    if (unbound) { unbound.chromeTabId = tabId; return true; }

    if (active.tabs.some(t => normUrl(t.url) === n)) return false;  // held by another live tab

    active.tabs.push({ title, url: tab.url, favicon, chromeTabId: tabId });
    return true;
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  saveTabToActiveGroup(tabId, tab).catch(err =>
    console.warn('[TGM background] onUpdated error:', err));
});

// ─── Tab closed: unbind it (saved entry stays, so the user can reopen it) ───
chrome.tabs.onRemoved.addListener(tabId => {
  updateState(s => {
    let changed = false;
    for (const g of s.tabGroups) {
      if (Array.isArray(g.chromeTabIds) && g.chromeTabIds.includes(tabId)) {
        g.chromeTabIds = g.chromeTabIds.filter(id => id !== tabId);
        changed = true;
      }
      if (Array.isArray(g.removedTabIds) && g.removedTabIds.includes(tabId)) {
        g.removedTabIds = g.removedTabIds.filter(id => id !== tabId);
        changed = true;
      }
      for (const t of (g.tabs || [])) {
        if (t.chromeTabId === tabId) { delete t.chromeTabId; changed = true; }
      }
    }
    return changed;
  }).catch(() => {});
});

// ─── Browser restarted: tab IDs are meaningless now ───
chrome.runtime.onStartup.addListener(() => {
  updateState(s => {
    let changed = false;
    for (const g of s.tabGroups) {
      if (Array.isArray(g.chromeTabIds) && g.chromeTabIds.length) { g.chromeTabIds = []; changed = true; }
      for (const t of (g.tabs || [])) {
        if (t.chromeTabId != null) { delete t.chromeTabId; changed = true; }
      }
    }
    return changed;
  }).catch(() => {});
});

// ─── Two-way sync: native group title/colour changed in Chrome ───
chrome.tabGroups.onUpdated.addListener(tabGroup => {
  updateState(s => {
    if (!isChromeGroupSyncEnabled(s)) return false;
    const group = s.tabGroups.find(g => g.nativeGroupId === tabGroup.id);
    if (!group) return false;

    let modified = false;
    if (tabGroup.title && tabGroup.title !== group.name) {
      group.name = tabGroup.title;
      modified = true;
    }
    // Only adopt Chrome's colour if it differs from what OUR colour maps to.
    // (Brown maps to 'grey'; without this guard any collapse/rename event
    //  turned brown into blue-grey.)
    if (tabGroup.color && hexToChromeColor(group.color) !== tabGroup.color) {
      const hex = chromeColorToHex(tabGroup.color);
      if (hex && hex !== group.color) {
        group.color = hex;
        modified = true;
      }
    }
    return modified;
  }).catch(err => console.warn('[TGM bg] tabGroups.onUpdated error:', err));
});

// ─── Two-way sync: native group dissolved/closed in Chrome ───
chrome.tabGroups.onRemoved.addListener(tabGroup => {
  updateState(s => {
    if (!isChromeGroupSyncEnabled(s)) return false;
    const group = s.tabGroups.find(g => g.nativeGroupId === tabGroup.id);
    if (!group) return false;
    group.nativeGroupId = null;
    group.hasCreatedNativeGroup = false;
    group.isActive = false;
    group.chromeTabIds = [];
    return true;
  }).catch(err => console.warn('[TGM bg] tabGroups.onRemoved error:', err));
});
