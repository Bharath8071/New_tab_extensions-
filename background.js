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

// Notion allows ~3 requests/second. Updating a page deletes one block per old
// tab, so a burst can hit 429; retry those using Retry-After when provided.
// (5xx is not retried: a create/append that actually succeeded would duplicate
// a row or bullets on the retry.)
async function _notionFetch(url, opts, retries = 2) {
  for (let attempt = 0; ; attempt++) {
    const resp = await fetch(url, opts);
    if (resp.ok) return resp;
    if (resp.status === 429 && attempt < retries) {
      const after = parseFloat(resp.headers && resp.headers.get('Retry-After'));
      // Cap the wait: an hour-long Retry-After must not hang the sync chain.
      const wait  = Number.isFinite(after) ? Math.min(after * 1000, 10000) : 1000 * (attempt + 1);
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
    [titleProp]:   { title:     [{ text: { content: (group.name || 'Unnamed').slice(0, 2000) } }] },
    'Color': { rich_text: [{ text: { content: (group.color || '#607d8b').slice(0, 100) } }] },
    'Tabs':  { number:    tabCount },
  };
}

// Make sure the target database has the properties this extension writes.
// Missing "Color" (rich_text) / "Tabs" (number) are created via PATCH database,
// and the actual title-property name is resolved from the schema (Notion lets
// users rename it, so it isn't always "Name").
async function _notionEnsureSchema(token, dbId) {
  const resp = await fetch(`${NOTION_API}/databases/${dbId}`, {
    method:  'GET',
    headers: _notionHeaders(token),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    const err = new Error(`Notion GET failed (${resp.status}): ${body}`);
    err.status = resp.status;
    throw err;
  }
  const db = await resp.json();
  const props = (db && db.properties) || {};

  const missing = {};
  if (!props.Color) missing.Color = { rich_text: {} };
  if (!props.Tabs)  missing.Tabs  = { number:    {} };

  if (Object.keys(missing).length) {
    const patchResp = await fetch(`${NOTION_API}/databases/${dbId}`, {
      method:  'PATCH',
      headers: _notionHeaders(token),
      body:    JSON.stringify({ properties: missing }),
    });
    if (!patchResp.ok) {
      const body = await patchResp.text().catch(() => '');
      const err = new Error(`Notion PATCH database failed (${patchResp.status}): ${body}`);
      err.status = patchResp.status;
      throw err;
    }
  }

  // Resolve the title property (title type), falling back to "Name".
  for (const [name, prop] of Object.entries(props)) {
    if (prop && prop.type === 'title') return name;
  }
  return 'Name';
}

async function _notionCreatePage(token, dbId, group, tabCount, titleProp) {
  const resp = await _notionFetch(`${NOTION_API}/pages`, {
    method:  'POST',
    headers: _notionHeaders(token),
    body:    JSON.stringify({
      parent:     { database_id: dbId },
      properties: _notionProperties(group, tabCount, titleProp),
    }),
  });
  return resp.json();
}

async function _notionUpdatePage(token, pageId, group, tabCount, titleProp) {
  const resp = await _notionFetch(`${NOTION_API}/pages/${pageId}`, {
    method:  'PATCH',
    headers: _notionHeaders(token),
    body:    JSON.stringify({ properties: _notionProperties(group, tabCount, titleProp) }),
  });
  return resp.json();
}

// Append saved tabs as bullet blocks to a Notion page body
async function _notionAppendTabs(token, pageId, tabs) {
  if (!tabs || tabs.length === 0) return;

  const children = tabs.map(t => ({
    object: 'block',
    type:   'bulleted_list_item',
    bulleted_list_item: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: ((t.title || t.url || 'Untitled') + ' — ').slice(0, 400),
          },
        },
        {
          type: 'text',
          text: {
            content: (t.url || '').slice(0, 2000),
            link:    t.url ? { url: t.url.slice(0, 2000) } : undefined,
          },
        },
      ],
    },
  }));

  // Notion limits: 100 blocks per PATCH request
  for (let i = 0; i < children.length; i += 100) {
    await _notionFetch(`${NOTION_API}/blocks/${pageId}/children`, {
      method:  'PATCH',
      headers: _notionHeaders(token),
      body:    JSON.stringify({ children: children.slice(i, i + 100) }),
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

// Make the page body match the group's current tabs. Only bulleted-list blocks
// (the ones this integration writes) are replaced; other page content is kept.
async function _notionReplaceTabs(token, pageId, tabs) {
  const wanted   = (tabs || []).map(t => (t.title || t.url || 'Untitled') + ' — ' + (t.url || ''));
  const children = await _notionGetChildren(token, pageId);
  const ours     = children.filter(b => b && b.type === 'bulleted_list_item');
  const current  = ours.map(_notionBlockText);
  if (current.length === wanted.length && current.every((text, i) => text === wanted[i])) return;

  for (const block of ours) {
    // A failed delete would let the append duplicate bullets, so stop here and
    // leave the old body for the next sync to retry.
    await _notionFetch(`${NOTION_API}/blocks/${block.id}`, {
      method:  'DELETE',
      headers: _notionHeaders(token),
    });
  }
  await _notionAppendTabs(token, pageId, tabs);
}

function _notionPageTitle(page) {
  try {
    return (page.properties.Name.title || [])
      .map(t => (t && (t.plain_text || (t.text && t.text.content))) || '')
      .join('').trim();
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
    return { ok: true, count: 0 };
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
      const title = _notionPageTitle(page).toLowerCase();
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
  let firstError = null;
  for (const group of groups) {
    const tabs = Array.isArray(group.tabs) ? group.tabs : [];
    let pageId = map[group.id] || null;
    let created = false;
    try {
      if (pageId) {
        try {
          await _notionUpdatePage(token, pageId, group, tabs.length, titleProp);
        } catch (err) {
          if (err && err.status === 404) { pageId = null; } // deleted in Notion → recreate
          else throw err;
        }
      }
      if (!pageId) {
        const page = await _notionCreatePage(token, dbId, group, tabs.length, titleProp);
        pageId = page.id;
        created = true;
        map[group.id] = pageId;
        mapDirty = true;
      }
      if (created) {
        // New page: nothing to compare against yet.
        await _notionAppendTabs(token, pageId, tabs);
      } else {
        await _notionReplaceTabs(token, pageId, tabs);
      }
      synced++;
    } catch (err) {
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

  if (synced === 0 && firstError) return { ok: false, error: firstError };
  return { ok: true, count: synced };
}

// Only push when the visible group data changed. Runtime fields this worker
// writes (active marks, chromeTabIds, removedTabIds) must not trigger a sync.
function _notionGroupSig(groups) {
  try {
    return JSON.stringify((groups || []).map(g => ({
      id:    g && g.id,
      name:  (g && g.name) || '',
      color: (g && g.color) || '',
      type:  (g && g.type) || '',
      tabs:  (g && Array.isArray(g.tabs) ? g.tabs : []).map(t => [
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
