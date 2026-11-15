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
  // Fix #25: also save on url/title changes — PDFs, internal pages, and slow-loading
  // tabs may never fire status==='complete' but do fire url or title changes.
  if (changeInfo.status !== 'complete' && !changeInfo.url && !changeInfo.title) return;
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

// ═══════════════════════════════════════════════════════
// CONTEXT MENU — "Add to Group" submenu
// ═══════════════════════════════════════════════════════

const CTX_PARENT_ID = 'tgm_add_to_group';
const CTX_NEW_GROUP = 'tgm_new_group';

// Normalise URL — same logic as normUrl() above
function ctxNormUrl(u) {
  try {
    const x = new URL(u);
    return x.protocol + '//' + x.host + x.pathname.replace(/\/+$/, '') + x.search;
  } catch (_) { return (u || '').trim(); }
}

// Build (or rebuild) the full submenu from current ntp_state.
// Called on install, startup, and whenever ntp_state changes.
//
// Fix #14, part 1: rebuilds are SERIALIZED through a queue. Every step used
// to contain an await, so two ntp_state writes a few ms apart let runs
// interleave — run 2's removeAll() landed mid-run-1, and the second
// tgm_add_to_group create failed with "Cannot create item with duplicate id".
// Part 2: rebuilds are SKIPPED when nothing the menu shows has changed
// (only group ids + names appear in it), so slider moves / tab auto-saves
// no longer churn the menu and wake the worker for nothing.
let _menuQueue = Promise.resolve();
// null = "never built". Must differ from '' — an empty menu (no groups yet)
// also produces an empty signature, so '' as the initial value would skip
// the very first build on a fresh install.
let _menuSig   = null;

function rebuildContextMenu(force) {
  if (force) _menuSig = null; // menu starts empty after install/startup → must rebuild
  _menuQueue = _menuQueue.then(_doRebuild).catch(err => {
    console.warn('[TGM ctx] context menu rebuild failed:', err);
  });
  return _menuQueue;
}

// create() wrapper: read runtime.lastError immediately (or catch the throw)
// so failures are logged by us instead of surfacing as
// "Unchecked runtime.lastError" noise.
function _ctxCreate(props) {
  try {
    chrome.contextMenus.create(props);
    if (chrome.runtime.lastError) console.warn('[TGM ctx] create failed:', chrome.runtime.lastError.message);
  } catch (err) {
    console.warn('[TGM ctx] create threw:', err);
  }
}

async function _doRebuild() {
  // Read FIRST (before touching the menu): a failed read must not wipe a
  // working menu, and must not record a signature either.
  const r = await chrome.storage.local.get(['ntp_state']).catch(() => null);
  if (!r) return;
  const groups = (r.ntp_state && Array.isArray(r.ntp_state.tabGroups))
    ? r.ntp_state.tabGroups
    : [];

  // Signature = exactly what the menu displays: group ids, names and order.
  // Parent + "Create New Group" are constants and don't affect it.
  const sig = groups.map(g => `${g.id}:${g.name || ''}`).join('|');
  if (sig === _menuSig) return; // menu already shows exactly this
  _menuSig = sig;

  await chrome.contextMenus.removeAll();

  // Parent item — always visible on http/https pages
  _ctxCreate({
    id:                  CTX_PARENT_ID,
    title:               'Add to Group',
    contexts:            ['page'],
    documentUrlPatterns: ['http://*/*', 'https://*/*'],
  });

  if (groups.length === 0) {
    // No groups yet — offer to create one
    _ctxCreate({
      id:                  CTX_NEW_GROUP,
      parentId:            CTX_PARENT_ID,
      title:               '➕ Create New Group',
      contexts:            ['page'],
      documentUrlPatterns: ['http://*/*', 'https://*/*'],
    });
    return;
  }

  // One child per saved group
  for (const g of groups) {
    _ctxCreate({
      id:                  `tgm_group_${g.id}`,
      parentId:            CTX_PARENT_ID,
      title:               g.name || 'Unnamed Group',
      contexts:            ['page'],
      documentUrlPatterns: ['http://*/*', 'https://*/*'],
    });
  }

  // "Create New Group" always at the bottom
  _ctxCreate({
    id:                  CTX_NEW_GROUP,
    parentId:            CTX_PARENT_ID,
    title:               '➕ Create New Group',
    contexts:            ['page'],
    documentUrlPatterns: ['http://*/*', 'https://*/*'],
  });
}

// Rebuild on install and browser startup — force, because the menu starts
// empty then (extension reload wipes it; browser restart too) and the
// signature check would otherwise skip the rebuild.
chrome.runtime.onInstalled.addListener(() => rebuildContextMenu(true));
chrome.runtime.onStartup.addListener(()   => rebuildContextMenu(true));

// Rebuild whenever ntp_state changes (group added / renamed / deleted on New Tab page)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.ntp_state) {
    rebuildContextMenu();
  }
});

// ── Handle clicks on context menu items ──
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.url) return;

  // "Create New Group" → open New Tab page
  if (info.menuItemId === CTX_NEW_GROUP) {
    chrome.tabs.create({ url: 'chrome://newtab/' });
    return;
  }

  // Group items are prefixed with 'tgm_group_'
  if (!String(info.menuItemId).startsWith('tgm_group_')) return;

  const groupId  = String(info.menuItemId).replace('tgm_group_', '');
  const tabUrl   = tab.url;
  const tabTitle = tab.title || tabUrl;
  const normalized = ctxNormUrl(tabUrl);

  // Track whether we hit a duplicate
  let isDuplicate = false;
  let targetGroupName = '';

  // Read → check → write atomically via updateState
  await updateState(s => {
    const g = s.tabGroups.find(x => String(x.id) === groupId);
    if (!g) return false;

    targetGroupName = g.name || 'Group';
    g.tabs = g.tabs || [];

    // Duplicate check
    if (g.tabs.some(t => ctxNormUrl(t.url) === normalized)) {
      isDuplicate = true;
      return false; // nothing to save
    }

    const favicon = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(tabUrl)}&size=64`;
    g.tabs.push({ title: tabTitle, url: tabUrl, favicon });
    return true;
  });

  // If group wasn't found via updateState, try to read the name directly
  if (!targetGroupName) {
    const r2 = await chrome.storage.local.get(['ntp_state']).catch(() => ({}));
    const g2 = ((r2.ntp_state || {}).tabGroups || []).find(x => String(x.id) === groupId);
    targetGroupName = g2 ? (g2.name || 'Group') : 'Group';
  }

  // Build toast message
  const toastMsg = isDuplicate
    ? `Already in "${targetGroupName}"`
    : `✓ Added to "${targetGroupName}"`;

  // Inject toast into the current page via scripting API
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: (msg) => {
      // Remove any existing TGM toast to avoid stacking
      const old = document.getElementById('__tgm_toast__');
      if (old) old.remove();

      const t = document.createElement('div');
      t.id = '__tgm_toast__';
      t.textContent = msg;
      Object.assign(t.style, {
        position:       'fixed',
        bottom:         '28px',
        left:           '50%',
        transform:      'translateX(-50%) translateY(20px)',
        background:     'rgba(32,33,36,0.93)',
        backdropFilter: 'blur(10px)',
        webkitBackdropFilter: 'blur(10px)',
        color:          '#e8eaed',
        padding:        '10px 22px',
        borderRadius:   '10px',
        fontSize:       '14px',
        fontFamily:     'system-ui, -apple-system, sans-serif',
        fontWeight:     '500',
        zIndex:         '2147483647',
        boxShadow:      '0 4px 20px rgba(0,0,0,0.45)',
        border:         '1px solid rgba(255,255,255,0.1)',
        transition:     'opacity 0.3s ease, transform 0.3s ease',
        opacity:        '0',
        pointerEvents:  'none',
        lineHeight:     '1.4',
      });
      document.body.appendChild(t);

      // Animate in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          t.style.opacity   = '1';
          t.style.transform = 'translateX(-50%) translateY(0)';
        });
      });

      // Animate out + remove
      setTimeout(() => {
        t.style.opacity   = '0';
        t.style.transform = 'translateX(-50%) translateY(10px)';
        setTimeout(() => { if (t.parentNode) t.remove(); }, 350);
      }, 2800);
    },
    args: [toastMsg],
  }).catch(() => {
    // Silently fail if scripting isn't allowed on this page (e.g. PDF viewer)
    console.warn('[TGM ctx] Could not inject toast on this page.');
  });
});

// ═══════════════════════════════════════════════════════
// BOOKMARK SYNC — background.js
// Two-way mirror: extension tab groups ↔ Chrome Bookmarks
//
// Layout in Chrome Bookmarks:
//   Bookmarks Bar
//   └── Tab Groups            ← parent folder (auto-created)
//       ├── Work              ← one subfolder per tab group
//       │   ├── GitHub
//       │   └── Jira
//       └── Research
//           └── MDN
//
// Source-of-truth rules:
//   • Tabs added to a group  → bookmark created inside that folder
//   • Tabs removed from a group → bookmark deleted
//   • Group renamed/deleted  → folder renamed/deleted
//   • Bookmark added to folder externally → tab added to group (merge)
//   • Group folder deleted externally    → folder auto-recreated on next sync
// ═══════════════════════════════════════════════════════

const BM_PARENT_TITLE  = 'Tab Groups';   // name of the root folder we manage
const BM_MAP_KEY       = 'bm_sync_map';  // storage key: { parentId, groups: { [groupId]: folderId } }

// Find the Bookmarks Bar node id (Chrome's built-in id is '1')
const BM_BAR_ID = '1';

// ── Helpers ──────────────────────────────────────────────

async function _bmGetOrCreateParent() {
  // Look for an existing "Tab Groups" folder directly under the Bookmarks Bar
  const children = await chrome.bookmarks.getChildren(BM_BAR_ID).catch(() => []);
  const existing = children.find(n => n.title === BM_PARENT_TITLE && !n.url);
  if (existing) return existing.id;

  // Create it
  const created = await chrome.bookmarks.create({ parentId: BM_BAR_ID, title: BM_PARENT_TITLE });
  return created.id;
}

async function _bmGetFolderChildren(folderId) {
  try {
    return await chrome.bookmarks.getChildren(folderId);
  } catch (_) { return null; } // null = folder doesn't exist
}

async function _bmFolderExists(folderId) {
  if (!folderId) return false;
  try {
    const results = await chrome.bookmarks.get(folderId);
    return !!(results && results[0] && !results[0].url);
  } catch (_) { return false; }
}

function _bmValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /^https?:\/\/.+/.test(url.trim());
}

// ── Read stored map ────────────────────────────────────────────

async function _bmReadMap() {
  const r = await chrome.storage.local.get([BM_MAP_KEY]).catch(() => ({}));
  const raw = r[BM_MAP_KEY];
  if (!raw || typeof raw !== 'object') return { parentId: null, groups: {} };
  return {
    parentId: raw.parentId || null,
    groups:   (raw.groups && typeof raw.groups === 'object') ? raw.groups : {},
  };
}

async function _bmSaveMap(map) {
  await chrome.storage.local.set({ [BM_MAP_KEY]: map }).catch(() => {});
}

// ── Main sync function ─────────────────────────────────────────

async function bookmarkSyncAllGroups(options = {}) {
  const r = await chrome.storage.local.get(['bm_sync_enabled', 'ntp_state']).catch(() => ({}));
  if (!r.bm_sync_enabled && !options.force) return { ok: true, count: 0, skipped: true };

  const groups = (r.ntp_state && Array.isArray(r.ntp_state.tabGroups))
    ? r.ntp_state.tabGroups.filter(g => g.type !== 'note') // skip note groups
    : [];

  const map = await _bmReadMap();
  let mapDirty = false;

  // Ensure parent folder exists
  let parentId = map.parentId;
  const parentOk = parentId ? await _bmFolderExists(parentId) : false;
  if (!parentOk) {
    parentId = await _bmGetOrCreateParent();
    map.parentId = parentId;
    mapDirty = true;
  }

  const parentChildren = await chrome.bookmarks.getChildren(parentId).catch(() => []);

  let synced = 0;
  let failed = 0;
  let firstError = null;
  const syncedGroupIds = new Set();

  for (const group of groups) {
    syncedGroupIds.add(group.id);
    const tabs = Array.isArray(group.tabs) ? group.tabs.filter(t => _bmValidUrl(t && t.url)) : [];
    const subGroups = Array.isArray(group.subGroups) ? group.subGroups : [];

    let folderId = map.groups[group.id] || null;

    try {
      // ── Step 1: Ensure group folder exists ──
      const folderExists = folderId ? await _bmFolderExists(folderId) : false;
      if (!folderExists) {
        const sibling = parentChildren.find(n => !n.url && n.title === (group.name || 'Unnamed') && n.id !== folderId);
        if (sibling && !Object.values(map.groups).includes(sibling.id)) {
          folderId = sibling.id;
        } else {
          const folder = await chrome.bookmarks.create({ parentId, title: group.name || 'Unnamed' });
          folderId = folder.id;
        }
        map.groups[group.id] = folderId;
        mapDirty = true;
      } else {
        const folderNode = (await chrome.bookmarks.get(folderId).catch(() => []))[0];
        if (folderNode && folderNode.title !== (group.name || 'Unnamed')) {
          await chrome.bookmarks.update(folderId, { title: group.name || 'Unnamed' }).catch(() => {});
        }
      }

      // ── Step 2: Read folder children (bookmarks + sub-folders) ──
      const folderChildren = await _bmGetFolderChildren(folderId);
      if (folderChildren === null) {
        delete map.groups[group.id];
        mapDirty = true;
        continue;
      }

      const bmByUrl  = new Map(); // url → bookmark node (direct children only)
      const bmFolders = [];       // sub-folder nodes
      for (const child of folderChildren) {
        if (child.url) bmByUrl.set(child.url, child);
        else bmFolders.push(child);
      }

      const tabUrls = new Set(tabs.map(t => t.url));

      // ── Step 3: Sync direct-child bookmarks (group.tabs) ──
      for (const tab of tabs) {
        if (!bmByUrl.has(tab.url)) {
          await chrome.bookmarks.create({
            parentId: folderId, title: tab.title || tab.url, url: tab.url,
          }).catch(err => { console.warn('[TGM BM] Could not create bookmark:', tab.url, err); });
        } else {
          const existing = bmByUrl.get(tab.url);
          if (existing && existing.title !== (tab.title || tab.url)) {
            await chrome.bookmarks.update(existing.id, { title: tab.title || tab.url }).catch(() => {});
          }
        }
      }

      // Merge: bookmarks in folder but not in group → adopt into group.tabs
      const newTabs = [];
      for (const [url, bm] of bmByUrl) {
        if (!tabUrls.has(url)) newTabs.push({ title: bm.title || url, url });
      }
      if (newTabs.length > 0) {
        await updateState(st => {
          const g = (st.tabGroups || []).find(x => x.id === group.id);
          if (!g) return false;
          g.tabs = g.tabs || [];
          let changed = false;
          for (const nt of newTabs) {
            if (!g.tabs.some(t => t.url === nt.url)) { g.tabs.push(nt); changed = true; }
          }
          return changed;
        });
      }

      // Delete bookmarks for tabs removed from the group
      for (const [url, bm] of bmByUrl) {
        if (!tabUrls.has(url) && !newTabs.some(t => t.url === url)) {
          await chrome.bookmarks.remove(bm.id).catch(() => {});
        }
      }

      // ── Step 4: Sync sub-groups ↔ sub-folders ──
      // Build maps: subId→subFolderId (stored) and subFolderTitle→node (live)
      map.subGroups = map.subGroups || {};
      map.subGroups[group.id] = map.subGroups[group.id] || {};
      const subMap = map.subGroups[group.id]; // { [subId]: folderId }

      const bmFolderByTitle = new Map();
      for (const f of bmFolders) {
        if (!bmFolderByTitle.has(f.title)) bmFolderByTitle.set(f.title, []);
        bmFolderByTitle.get(f.title).push(f);
      }

      // Track which sub-folder IDs we manage (to detect new external sub-folders)
      const managedSubFolderIds = new Set(Object.values(subMap));

      // 4a: Sync each extension sub-group to its bookmark sub-folder
      const syncedSubIds = new Set();
      for (const sub of subGroups) {
        syncedSubIds.add(sub.id);
        const subTabs = Array.isArray(sub.tabs) ? sub.tabs.filter(t => _bmValidUrl(t && t.url)) : [];
        let subFolderId = subMap[sub.id] || null;

        const subFolderExists = subFolderId ? await _bmFolderExists(subFolderId) : false;
        if (!subFolderExists) {
          // Try to adopt an existing sub-folder with the same name
          const candidates = bmFolderByTitle.get(sub.name || 'Unnamed') || [];
          const adoptable = candidates.find(f => !managedSubFolderIds.has(f.id));
          if (adoptable) {
            subFolderId = adoptable.id;
          } else {
            const sf = await chrome.bookmarks.create({ parentId: folderId, title: sub.name || 'Unnamed' });
            subFolderId = sf.id;
          }
          subMap[sub.id] = subFolderId;
          managedSubFolderIds.add(subFolderId);
          mapDirty = true;
        } else {
          // Rename sub-folder if sub-group was renamed
          const sfNode = (await chrome.bookmarks.get(subFolderId).catch(() => []))[0];
          if (sfNode && sfNode.title !== (sub.name || 'Unnamed')) {
            await chrome.bookmarks.update(subFolderId, { title: sub.name || 'Unnamed' }).catch(() => {});
          }
        }

        // Sync sub-folder bookmarks ↔ sub-group tabs
        const sfChildren = await _bmGetFolderChildren(subFolderId);
        if (!sfChildren) { delete subMap[sub.id]; mapDirty = true; continue; }

        const sfByUrl = new Map();
        for (const c of sfChildren) { if (c.url) sfByUrl.set(c.url, c); }
        const subTabUrls = new Set(subTabs.map(t => t.url));

        // Add missing bookmarks
        for (const tab of subTabs) {
          if (!sfByUrl.has(tab.url)) {
            await chrome.bookmarks.create({
              parentId: subFolderId, title: tab.title || tab.url, url: tab.url,
            }).catch(() => {});
          } else {
            const ex = sfByUrl.get(tab.url);
            if (ex && ex.title !== (tab.title || tab.url)) {
              await chrome.bookmarks.update(ex.id, { title: tab.title || tab.url }).catch(() => {});
            }
          }
        }

        // Adopt external bookmarks into sub-group
        const newSubTabs = [];
        for (const [url, bm] of sfByUrl) {
          if (!subTabUrls.has(url)) newSubTabs.push({ title: bm.title || url, url });
        }
        if (newSubTabs.length > 0) {
          await updateState(st => {
            const g = (st.tabGroups || []).find(x => x.id === group.id);
            if (!g) return false;
            g.subGroups = g.subGroups || [];
            const s = g.subGroups.find(x => x.id === sub.id);
            if (!s) return false;
            s.tabs = s.tabs || [];
            let changed = false;
            for (const nt of newSubTabs) {
              if (!s.tabs.some(t => t.url === nt.url)) { s.tabs.push(nt); changed = true; }
            }
            return changed;
          });
        }

        // Delete bookmarks for sub-tabs that were removed
        for (const [url, bm] of sfByUrl) {
          if (!subTabUrls.has(url) && !newSubTabs.some(t => t.url === url)) {
            await chrome.bookmarks.remove(bm.id).catch(() => {});
          }
        }
      }

      // 4b: Delete sub-folders for removed sub-groups
      for (const [subId, subFolderId] of Object.entries(subMap)) {
        if (!syncedSubIds.has(subId)) {
          await chrome.bookmarks.removeTree(subFolderId).catch(() => {});
          delete subMap[subId];
          mapDirty = true;
        }
      }

      // 4c: Import external sub-folders (created directly in Chrome) as new sub-groups
      for (const f of bmFolders) {
        if (!managedSubFolderIds.has(f.id)) {
          // External sub-folder not tracked yet → create a sub-group for it
          const sfChildren = await _bmGetFolderChildren(f.id) || [];
          const newSubTabs = sfChildren
            .filter(c => c.url && _bmValidUrl(c.url))
            .map(c => ({ title: c.title || c.url, url: c.url }));

          await updateState(st => {
            const g = (st.tabGroups || []).find(x => x.id === group.id);
            if (!g) return false;
            g.subGroups = g.subGroups || [];
            // Don't duplicate by name
            if (g.subGroups.some(s => s.name === f.title)) return false;
            const newSub = { id: 'sg_' + Date.now() + '_' + f.id.slice(-4), name: f.title, tabs: newSubTabs };
            g.subGroups.push(newSub);
            // Register in map
            subMap[newSub.id] = f.id;
            mapDirty = true;
            return true;
          });
        }
      }

      synced++;
    } catch (err) {
      failed++;
      if (!firstError) firstError = String((err && err.message) || err);
      console.warn('[TGM BM] sync error for group:', group.name, err);
    }
  }

  // ── Step 5: Delete folders for groups that were removed ──
  for (const [groupId, folderId] of Object.entries(map.groups)) {
    if (!syncedGroupIds.has(groupId)) {
      await chrome.bookmarks.removeTree(folderId).catch(() => {});
      delete map.groups[groupId];
      if (map.subGroups) delete map.subGroups[groupId];
      mapDirty = true;
    }
  }

  if (mapDirty) await _bmSaveMap(map);

  return { ok: true, count: synced, failed, firstError: failed > 0 ? firstError : null };
}

// ── Change signature: only run sync when group data actually changes ──
function _bmGroupSig(groups) {
  try {
    return JSON.stringify(
      (groups || [])
        .filter(g => g.type !== 'note')
        .map(g => ({
          id:        g.id,
          name:      (g.name || ''),
          tabs:      (Array.isArray(g.tabs) ? g.tabs : [])
                       .filter(t => _bmValidUrl(t && t.url))
                       .map(t => [t.url, t.title || '']),
          subGroups: (Array.isArray(g.subGroups) ? g.subGroups : [])
                       .map(s => ({
                         id:   s.id,
                         name: s.name || '',
                         tabs: (Array.isArray(s.tabs) ? s.tabs : [])
                                 .filter(t => _bmValidUrl(t && t.url))
                                 .map(t => [t.url, t.title || '']),
                       })),
        }))
    );
  } catch (_) { return ''; }
}

function _bmGroupsChanged(ov, nv) {
  return _bmGroupSig(ov && ov.tabGroups) !== _bmGroupSig(nv && nv.tabGroups);
}

// ── Debounce / serialise ──────────────────────────────────────────

let _bmSyncChain    = Promise.resolve();
let _bmDebounceTimer = null;

function _runBookmarkSync(options) {
  const run = _bmSyncChain.catch(() => {}).then(() => bookmarkSyncAllGroups(options));
  _bmSyncChain = run.catch(() => {});
  return run;
}

function _scheduleBookmarkSync() {
  clearTimeout(_bmDebounceTimer);
  _bmDebounceTimer = setTimeout(() => {
    _runBookmarkSync()
      .then(r => {
        if (r && !r.ok && !r.skipped) console.warn('[TGM BM] Auto-sync failed:', r.firstError || r);
        else if (r && r.ok && !r.skipped && r.count > 0) {
          console.log(`[TGM BM] Auto-sync: ${r.count} group(s) synced.`);
        }
      })
      .catch(err => console.warn('[TGM BM] Auto-sync error:', err));
  }, 2000);
}

// ── Listen for ntp_state changes (group tabs changed) ─────────────
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  const justEnabled = !!(changes.bm_sync_enabled && changes.bm_sync_enabled.newValue === true);
  if (justEnabled) { _scheduleBookmarkSync(); return; }
  if (!changes.ntp_state) return;
  chrome.storage.local.get(['bm_sync_enabled']).then(r => {
    if (!r.bm_sync_enabled) return;
    if (_bmGroupsChanged(changes.ntp_state.oldValue, changes.ntp_state.newValue)) {
      _scheduleBookmarkSync();
    }
  }).catch(() => {});
});

// ── Listen for bookmark changes (two-way: bookmarks → groups) ─────
// Fires when user manually adds/removes a bookmark in Chrome
chrome.bookmarks.onCreated.addListener((id, bookmark) => {
  if (!bookmark.url) return; // folder created, not a bookmark
  chrome.storage.local.get(['bm_sync_enabled', BM_MAP_KEY]).then(r => {
    if (!r.bm_sync_enabled) return;
    const map = r[BM_MAP_KEY];
    if (!map || !map.groups) return;
    // Check if this bookmark's parent is one of our group folders
    const groupId = Object.keys(map.groups).find(gid => map.groups[gid] === bookmark.parentId);
    if (!groupId) return;
    if (!_bmValidUrl(bookmark.url)) return;
    // Merge the new bookmark into the group's tab list
    updateState(st => {
      const g = (st.tabGroups || []).find(x => x.id === groupId);
      if (!g) return false;
      g.tabs = g.tabs || [];
      if (g.tabs.some(t => t.url === bookmark.url)) return false;
      g.tabs.push({ title: bookmark.title || bookmark.url, url: bookmark.url });
      return true;
    }).catch(() => {});
  }).catch(() => {});
});

chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
  chrome.storage.local.get(['bm_sync_enabled', BM_MAP_KEY]).then(r => {
    if (!r.bm_sync_enabled) return;
    const map = r[BM_MAP_KEY];
    if (!map || !map.groups) return;

    // Was the removed item one of our managed group folders?
    const groupId = Object.keys(map.groups).find(gid => map.groups[gid] === id);
    if (groupId) {
      // Folder deleted externally → schedule a sync which will recreate it
      _scheduleBookmarkSync();
      return;
    }

    // Was it a bookmark inside one of our folders?
    const parentGroupId = Object.keys(map.groups).find(gid => map.groups[gid] === removeInfo.parentId);
    if (!parentGroupId) return;

    // Remove matching tab from the group
    if (removeInfo.node && removeInfo.node.url) {
      const url = removeInfo.node.url;
      updateState(st => {
        const g = (st.tabGroups || []).find(x => x.id === parentGroupId);
        if (!g || !Array.isArray(g.tabs)) return false;
        const before = g.tabs.length;
        g.tabs = g.tabs.filter(t => t.url !== url);
        return g.tabs.length !== before;
      }).catch(() => {});
    }
  }).catch(() => {});
});

chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
  // Title update: sync title change back to the group tab entry
  if (!changeInfo.url && !changeInfo.title) return;
  chrome.storage.local.get(['bm_sync_enabled', BM_MAP_KEY]).then(r => {
    if (!r.bm_sync_enabled) return;
    const map = r[BM_MAP_KEY];
    if (!map || !map.groups) return;
    // Need to find parent of the changed bookmark
    chrome.bookmarks.get(id).then(nodes => {
      const bm = nodes && nodes[0];
      if (!bm || !bm.url || !bm.parentId) return;
      const parentGroupId = Object.keys(map.groups).find(gid => map.groups[gid] === bm.parentId);
      if (!parentGroupId) return;
      if (!_bmValidUrl(bm.url)) return;
      updateState(st => {
        const g = (st.tabGroups || []).find(x => x.id === parentGroupId);
        if (!g || !Array.isArray(g.tabs)) return false;
        const t = g.tabs.find(x => x.url === bm.url);
        if (!t) return false;
        const newTitle = bm.title || bm.url;
        if (t.title === newTitle) return false;
        t.title = newTitle;
        return true;
      }).catch(() => {});
    }).catch(() => {});
  }).catch(() => {});
});

// ── Manual "Sync Now" message from newtab.js ─────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === 'BOOKMARK_SYNC_NOW') {
    _runBookmarkSync({ force: true })
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ ok: false, error: String(err) }));
    return true;
  }
});

// ═══════════════════════════════════════════════════════
// NOTION SYNC — background.js
// Mirror tab groups into a Notion database (upsert, push-only)
// ═══════════════════════════════════════════════════════

const NOTION_API     = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';
// group.id → page.id, scoped to the database it was built for, so renaming a
// group updates its existing row instead of creating another one.
const NOTION_MAP_KEY = 'notion_page_map';

function _notionHeaders(token) {
  return {
    'Authorization':  `Bearer ${token}`,
    'Notion-Version': NOTION_VERSION,
    'Content-Type':   'application/json',
  };
}

// Notion allows ~3 requests/second average per integration token.
// Enforce minimum ~350ms between requests to stay safely below rate limits.
let _notionLastRequestTime = 0;
const NOTION_MIN_INTERVAL_MS = 350;

async function _notionFetch(url, opts, retries = 4) {
  for (let attempt = 0; ; attempt++) {
    const now = Date.now();
    const elapsed = now - _notionLastRequestTime;
    if (elapsed < NOTION_MIN_INTERVAL_MS) {
      await new Promise(r => setTimeout(r, NOTION_MIN_INTERVAL_MS - elapsed));
    }
    _notionLastRequestTime = Date.now();

    let resp;
    try {
      resp = await fetch(url, opts);
    } catch (netErr) {
      if (attempt < retries) {
        const wait = 1000 * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      throw netErr;
    }

    if (resp.ok) return resp;

    // 429 Too Many Requests: use Retry-After or exponential backoff with jitter
    if (resp.status === 429 && attempt < retries) {
      const headerVal = resp.headers && resp.headers.get('Retry-After');
      const after = headerVal ? parseFloat(headerVal) : NaN;
      const wait = Number.isFinite(after)
        ? Math.min(Math.max(after * 1000, 1500), 15000)
        : Math.min(1500 * Math.pow(2, attempt) + Math.random() * 500, 15000);
      console.warn(`[TGM Notion] Rate limited (429). Retrying in ${Math.round(wait)}ms (attempt ${attempt + 1}/${retries})...`);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }

    // 502/503/504 transient Notion gateway errors
    if ((resp.status === 502 || resp.status === 503 || resp.status === 504) && attempt < retries) {
      const wait = 1500 * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }

    let body = '';
    try { body = await resp.text(); } catch (_) {}
    const err = new Error(`Notion ${(opts && opts.method) || 'GET'} failed (${resp.status}): ${body}`);
    err.status = resp.status;
    throw err;
  }
}

// Query every page in the database (needed only when seeding new group ids)
async function _notionQueryDb(token, dbId) {
  const results = [];
  let cursor = null;
  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const resp = await _notionFetch(`${NOTION_API}/databases/${dbId}/query`, {
      method:  'POST',
      headers: _notionHeaders(token),
      body:    JSON.stringify(body),
    });
    const data = await resp.json();
    results.push(...(data.results || []));
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);
  return { results };
}

function _notionProperties(group, tabCount, titleProp = 'Name') {
  return {
    [titleProp]: { title:     [{ text: { content: (group.name || 'Unnamed').slice(0, 2000) } }] },
    'Color':     { rich_text: [{ text: { content: (group.color || '#607d8b').slice(0, 100) } }] },
    'Tabs':      { number:    tabCount },
  };
}

// Make sure the target database has the properties this extension writes.
// Missing "Color" (rich_text) / "Tabs" (number) are created via PATCH database,
// and the actual title-property name is resolved from the schema (Notion lets
// users rename it, so it isn't always "Name").
async function _notionEnsureSchema(token, dbId) {
  const resp = await _notionFetch(`${NOTION_API}/databases/${dbId}`, {
    method:  'GET',
    headers: _notionHeaders(token),
  });
  const db = await resp.json();
  const props = (db && db.properties) || {};

  const missing = {};
  if (!props.Color) missing.Color = { rich_text: {} };
  if (!props.Tabs)  missing.Tabs  = { number:    {} };

  if (Object.keys(missing).length) {
    await _notionFetch(`${NOTION_API}/databases/${dbId}`, {
      method:  'PATCH',
      headers: _notionHeaders(token),
      body:    JSON.stringify({ properties: missing }),
    });
  }

  // Resolve the title property (title type), falling back to "Name".
  for (const [name, prop] of Object.entries(props)) {
    if (prop && prop.type === 'title') return name;
  }
  return 'Name';
}

function _notionValidUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (/^https?:\/\/.+/i.test(trimmed)) {
    return trimmed.slice(0, 2000);
  }
  return null;
}

// Generate Notion blocks for both Tab Groups and Note Groups
function _notionBuildGroupBlocks(group) {
  if (!group) return [];

  // Note groups: checklist or text
  if (group.type === 'note') {
    if (group.noteMode === 'text' || (!group.checklist && group.textContent)) {
      const text = (group.textContent || '').trim();
      if (!text) return [];
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      return lines.map(line => ({
        object: 'block',
        type:   'paragraph',
        paragraph: {
          rich_text: [{
            type: 'text',
            text: { content: line.slice(0, 2000) },
          }],
        },
      }));
    }

    const items = Array.isArray(group.checklist) ? group.checklist : [];
    return items.map(item => ({
      object: 'block',
      type:   'to_do',
      to_do: {
        rich_text: [{
          type: 'text',
          text: { content: ((item && item.text) || 'Untitled item').slice(0, 2000) },
        }],
        checked: !!(item && item.done),
      },
    }));
  }

  // Standard tab group: bulleted list of tabs
  const tabs = Array.isArray(group.tabs) ? group.tabs : [];
  return tabs.map(t => {
    const validUrl = _notionValidUrl(t && t.url);
    const displayTitle = ((t && (t.title || t.url)) || 'Untitled') + ' — ';
    const displayUrl = (t && t.url) || '';
    return {
      object: 'block',
      type:   'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: displayTitle.slice(0, 400),
            },
          },
          {
            type: 'text',
            text: {
              content: displayUrl.slice(0, 2000),
              link:    validUrl ? { url: validUrl } : undefined,
            },
          },
        ],
      },
    };
  });
}

function _notionGroupCount(group) {
  if (!group) return 0;
  if (group.type === 'note') {
    if (Array.isArray(group.checklist) && group.checklist.length > 0) {
      return group.checklist.length;
    }
    return (group.textContent && group.textContent.trim()) ? 1 : 0;
  }
  return Array.isArray(group.tabs) ? group.tabs.length : 0;
}

async function _notionCreatePage(token, dbId, group, tabCount, titleProp, initialBlocks = []) {
  const body = {
    parent:     { database_id: dbId },
    properties: _notionProperties(group, tabCount, titleProp),
  };
  if (Array.isArray(initialBlocks) && initialBlocks.length > 0) {
    body.children = initialBlocks;
  }
  const resp = await _notionFetch(`${NOTION_API}/pages`, {
    method:  'POST',
    headers: _notionHeaders(token),
    body:    JSON.stringify(body),
  });
  return resp.json();
}

async function _notionUpdatePage(token, pageId, group, tabCount, titleProp) {
  const resp = await _notionFetch(`${NOTION_API}/pages/${pageId}`, {
    method:  'PATCH',
    headers: _notionHeaders(token),
    body:    JSON.stringify({
      archived:   false,
      properties: _notionProperties(group, tabCount, titleProp),
    }),
  });
  return resp.json();
}

async function _notionAppendBlocks(token, pageId, blocks) {
  if (!blocks || blocks.length === 0) return;
  for (let i = 0; i < blocks.length; i += 100) {
    await _notionFetch(`${NOTION_API}/blocks/${pageId}/children`, {
      method:  'PATCH',
      headers: _notionHeaders(token),
      body:    JSON.stringify({ children: blocks.slice(i, i + 100) }),
    });
  }
}

async function _notionGetChildren(token, pageId) {
  const blocks = [];
  let cursor = null;
  do {
    const q = `?page_size=100${cursor ? `&start_cursor=${encodeURIComponent(cursor)}` : ''}`;
    const resp = await _notionFetch(`${NOTION_API}/blocks/${pageId}/children${q}`, {
      headers: _notionHeaders(token),
    });
    const data = await resp.json();
    blocks.push(...(data.results || []));
    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);
  return blocks;
}

function _notionBlockText(block) {
  const type = block && block.type;
  const rich = type && block[type] && block[type].rich_text;
  if (!Array.isArray(rich)) return '';
  return rich.map(x => (x && (x.plain_text || (x.text && x.text.content))) || '').join('');
}

function _notionBlockSig(b) {
  if (!b) return '';
  const type = b.type;
  if (!type) return '';
  if (type === 'bulleted_list_item') {
    return 'bullet:' + _notionBlockText(b);
  }
  if (type === 'to_do') {
    const checked = !!(b.to_do && b.to_do.checked);
    return `todo:${checked}:${_notionBlockText(b)}`;
  }
  if (type === 'paragraph') {
    return 'p:' + _notionBlockText(b);
  }
  return type + ':' + _notionBlockText(b);
}

function _notionNewBlockSig(b) {
  if (!b) return '';
  const type = b.type;
  if (!type || !b[type]) return '';
  const rich = b[type].rich_text;
  const text = Array.isArray(rich)
    ? rich.map(x => (x && x.text && x.text.content) || '').join('')
    : '';
  if (type === 'bulleted_list_item') return 'bullet:' + text;
  if (type === 'to_do') return `todo:${!!(b.to_do && b.to_do.checked)}:${text}`;
  if (type === 'paragraph') return 'p:' + text;
  return type + ':' + text;
}

// Make the page body match the group's current blocks.
// Only our generated blocks (bulleted_list_item, to_do, paragraph) are replaced;
// other custom page blocks added by the user are kept.
async function _notionReplaceContent(token, pageId, blocks) {
  const children = await _notionGetChildren(token, pageId);
  const ours = children.filter(b => b && (
    b.type === 'bulleted_list_item' || b.type === 'to_do' || b.type === 'paragraph'
  ));

  const current = ours.map(_notionBlockSig);
  const wanted  = (blocks || []).map(_notionNewBlockSig);

  // If page content already matches, return immediately (zero API calls)
  if (current.length === wanted.length && current.every((sig, i) => sig === wanted[i])) {
    return;
  }

  for (const block of ours) {
    if (block && block.id) {
      await _notionFetch(`${NOTION_API}/blocks/${block.id}`, {
        method:  'DELETE',
        headers: _notionHeaders(token),
      });
    }
  }
  await _notionAppendBlocks(token, pageId, blocks);
}

// Extract page title dynamically regardless of property name
function _notionPageTitle(page, titleProp) {
  try {
    if (!page || !page.properties) return '';
    if (titleProp && page.properties[titleProp] && page.properties[titleProp].title) {
      return (page.properties[titleProp].title || [])
        .map(t => (t && (t.plain_text || (t.text && t.text.content))) || '')
        .join('').trim();
    }
    for (const key of Object.keys(page.properties)) {
      const p = page.properties[key];
      if (p && p.type === 'title' && Array.isArray(p.title)) {
        return p.title
          .map(t => (t && (t.plain_text || (t.text && t.text.content))) || '')
          .join('').trim();
      }
    }
    if (page.properties.Name && Array.isArray(page.properties.Name.title)) {
      return page.properties.Name.title
        .map(t => (t && (t.plain_text || (t.text && t.text.content))) || '')
        .join('').trim();
    }
    return '';
  } catch (_) { return ''; }
}

// { v:1, dbId, pages:{ [groupId]: pageId } } — a map from another database is
// ignored (its page ids are meaningless there).
function _notionReadMap(raw, dbId) {
  if (!raw || raw.dbId !== dbId || !raw.pages || typeof raw.pages !== 'object') return {};
  const pages = {};
  for (const id of Object.keys(raw.pages)) {
    if (typeof raw.pages[id] === 'string') pages[id] = raw.pages[id];
  }
  return pages;
}

// ── Main sync: create missing rows, update existing ones ──
async function notionSyncAllGroups() {
  const r = await chrome.storage.local.get([
    'notion_token', 'notion_db_id', 'notion_sync_enabled', 'ntp_state', NOTION_MAP_KEY,
  ]).catch(() => ({}));

  if (!r.notion_sync_enabled) return { ok: true, count: 0, skipped: true };

  const token  = (r.notion_token || '').trim();
  const dbId   = (r.notion_db_id || '').replace(/-/g, '').trim();
  const groups = (r.ntp_state && Array.isArray(r.ntp_state.tabGroups))
    ? r.ntp_state.tabGroups
    : [];

  if (!token || !dbId) {
    return { ok: false, error: 'Notion token or Database ID not configured.' };
  }

  // Make sure the database has the properties we write, and learn the real
  // title-property name before creating/updating any rows.
  let titleProp = 'Name';
  try {
    titleProp = await _notionEnsureSchema(token, dbId);
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }

  const map = _notionReadMap(r[NOTION_MAP_KEY], dbId);
  let mapDirty = false;

  if (groups.length === 0) {
    if (Object.keys(map).length) {
      await chrome.storage.local.set({ [NOTION_MAP_KEY]: { v: 1, dbId, pages: {} } }).catch(() => {});
    }
    return { ok: true, count: 0, failed: 0 };
  }

  // First run (or a group added after the map was built): adopt pages created
  // by older versions by exact name instead of adding a duplicate row.
  if (groups.some(g => !map[g.id])) {
    let existing = [];
    try {
      existing = (await _notionQueryDb(token, dbId)).results || [];
    } catch (err) {
      return { ok: false, error: String(err) };
    }
    const used = new Set(Object.keys(map).map(id => map[id]));
    const byName = new Map();
    for (const page of existing) {
      if (page.archived) continue;
      const title = _notionPageTitle(page, titleProp).toLowerCase();
      if (!title) continue;
      if (!byName.has(title)) byName.set(title, []);
      byName.get(title).push(page);
    }
    for (const group of groups) {
      if (map[group.id]) continue;
      const key = (group.name || 'Unnamed').trim().toLowerCase();
      const match = (byName.get(key) || []).find(p => !used.has(p.id));
      if (match) {
        map[group.id] = match.id;
        used.add(match.id);
        mapDirty = true;
      }
    }
  }

  let synced = 0;
  let failed = 0;
  let firstError = null;

  for (const group of groups) {
    const count = _notionGroupCount(group);
    const blocks = _notionBuildGroupBlocks(group);
    let pageId = map[group.id] || null;
    let created = false;

    try {
      if (pageId) {
        try {
          await _notionUpdatePage(token, pageId, group, count, titleProp);
        } catch (err) {
          const isNotFound = err && (err.status === 404 || (err.message && err.message.includes('object_not_found')));
          if (isNotFound) {
            pageId = null; // deleted in Notion → recreate
          } else {
            throw err;
          }
        }
      }

      if (!pageId) {
        // Create page with initial blocks (up to 100) in ONE request
        const initialBlocks = blocks.slice(0, 100);
        const page = await _notionCreatePage(token, dbId, group, count, titleProp, initialBlocks);
        pageId = page.id;
        created = true;
        map[group.id] = pageId;
        mapDirty = true;
      }

      if (created) {
        if (blocks.length > 100) {
          await _notionAppendBlocks(token, pageId, blocks.slice(100));
        }
      } else {
        await _notionReplaceContent(token, pageId, blocks);
      }
      synced++;
    } catch (err) {
      failed++;
      if (!firstError) firstError = String((err && err.message) || err);
      console.warn('[TGM Notion] sync error for group:', group.name, err);
    }
  }

  // Rows for deleted groups stay in Notion (nothing is ever deleted there), but
  // their mappings are dropped so the map doesn't grow forever.
  const live = new Set(groups.map(g => g.id));
  for (const id of Object.keys(map)) {
    if (!live.has(id)) { delete map[id]; mapDirty = true; }
  }

  if (mapDirty) {
    try {
      await chrome.storage.local.set({ [NOTION_MAP_KEY]: { v: 1, dbId, pages: map } });
    } catch (err) {
      console.warn('[TGM Notion] could not save page map:', err);
    }
  }

  if (synced === 0 && firstError) {
    return { ok: false, error: firstError, count: 0, failed };
  }
  return {
    ok: true,
    count: synced,
    failed,
    firstError: failed > 0 ? firstError : null,
  };
}

// Only push when the visible group data changed. Runtime fields this worker
// writes (active marks, chromeTabIds, removedTabIds) must not trigger a sync.
function _notionGroupSig(groups) {
  try {
    return JSON.stringify((groups || []).map(g => ({
      id:          g && g.id,
      name:        (g && g.name) || '',
      color:       (g && g.color) || '',
      type:        (g && g.type) || '',
      noteMode:    (g && g.noteMode) || '',
      textContent: (g && g.textContent) || '',
      checklist:   (g && Array.isArray(g.checklist) ? g.checklist : []).map(c => [
        (c && c.text) || '', !!(c && c.done),
      ]),
      tabs:        (g && Array.isArray(g.tabs) ? g.tabs : []).map(t => [
        (t && t.title) || '', (t && t.url) || '',
      ]),
    })));
  } catch (_) { return ''; }
}

function _notionGroupsChanged(ov, nv) {
  return _notionGroupSig(ov && ov.tabGroups) !== _notionGroupSig(nv && nv.tabGroups);
}

// Serialize syncs so a debounced run and a manual "Sync Now" never create the
// same page twice.
let _notionSyncChain = Promise.resolve();
function _runNotionSync() {
  const run = _notionSyncChain.catch(() => {}).then(() => notionSyncAllGroups());
  _notionSyncChain = run.catch(() => {});
  return run;
}

// ── Debounced auto-sync: fires 3 s after the last relevant change ──
let _notionDebounceTimer = null;
function _scheduleNotionSync() {
  clearTimeout(_notionDebounceTimer);
  _notionDebounceTimer = setTimeout(() => {
    _runNotionSync()
      .then(r => {
        if (r && !r.ok && !r.skipped) console.warn('[TGM Notion] Auto-sync failed:', r.error);
        else if (r && r.ok && !r.skipped && r.count > 0) {
          console.log(`[TGM Notion] Auto-sync: ${r.count} group(s) synced.`);
        }
      })
      .catch(err => console.warn('[TGM Notion] Auto-sync error:', err));
  }, 3000);
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  const groupsChanged = changes.ntp_state && _notionGroupsChanged(
    changes.ntp_state.oldValue, changes.ntp_state.newValue
  );
  const justEnabled = !!(changes.notion_sync_enabled && changes.notion_sync_enabled.newValue === true);
  if (groupsChanged || justEnabled) _scheduleNotionSync();
});

// ── Respond to manual "Sync Now" message from newtab.js ──
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === 'NOTION_SYNC_NOW') {
    _runNotionSync()
      .then(result => sendResponse(result))
      .catch(err   => sendResponse({ ok: false, error: String(err) }));
    return true; // keeps the message channel open for async response
  }
});
