// ═══════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════

// Master toggle: true = two-way sync with Chrome native tab groups; false = pure link collector
const ENABLE_CHROME_GROUP_SYNC = false;

function isChromeGroupSyncEnabled() {
  if (typeof state !== 'undefined' && state && typeof state.syncChromeGroups === 'boolean') {
    return state.syncChromeGroups;
  }
  return ENABLE_CHROME_GROUP_SYNC;
}

const EXTRA_DEFAULTS = [
  
];

const UI_ALPHA = 0.25; // 0.0 = fully transparent, 1.0 = fully opaque

// Load-stage timing (diagnostic): window.__ntpPerf in console shows where cold ms go
function _perfMark(name) {
  try {
    (window.__ntpPerf = window.__ntpPerf || []).push({ m: name, t: Math.round(performance.now()) });
  } catch (_) {}
}
_perfMark('js-eval');
// const SHOW_LOGO = true; // true = show Google logo, false = hide it
const SHOW_LOGO = false; // true = show Google logo, false = hide it

// const PIN_AT_BAR = [
// { name: "Google",   url: "https://google.com" },
//   { name: "YouTube",  url: "https://youtube.com" },
//   { name: "ChatGPT",  url: "https://chat.openai.com" },
//   { name: "LinkedIn", url: "https://linkedin.com" },
//   { name: "GitHub",   url: "https://github.com" }
// ];

// const TOP_DEFAULTS = [
//   { name: "1",   url: "" },
//   { name: "2",   url: "" },
//   { name: "3",   url: "" },
//   { name: "4",   url: "" },
//   { name: "5",   url: "" },
//   { name: "6",   url: "" },
//   { name: "7",   url: "" },
//   { name: "8",   url: "" },
//   { name: "9",   url: "" },  
// ];


const TOP_DEFAULTS = [
  { name: "Mama",   url: "https://chatgpt.com/" },
  { name: "Gemini",   url: "https://gemini.google.com/" },
  { name: "Linkedin",   url: "https://www.linkedin.com/in/bharath-mani/" },
  { name: "Github",   url: "https://github.com/Bharath8071" },
  { name: "Leetcode",   url: "https://leetcode.com/u/mbhari8070/" },
  { name: "Notion",   url: "https://www.notion.so/" },
  { name: "WEB VR",   url: "https://technology.panasonic.eu/av-digital-world/" },
  { name: "Reddit",   url: "https://www.reddit.com/" },
  { name: "Mail",   url: "https://mail.google.com/mail/u/1/#inbox" },
  // { name: "Portfolio",   url: ""},
  
];

const BG_COLORS = [
  { label: "Dark",     value: "#202124" },
  { label: "Navy",     value: "#0d1b2a" },
  { label: "Forest",   value: "#0f2418" },
  { label: "Maroon",   value: "#1f0a0a" },
  { label: "Purple",   value: "#1a0a2e" },
  { label: "Slate",    value: "#1c1f26" },
  { label: "Midnight", value: "#0a0a0f" },
  { label: "Teal",     value: "#062a2a" },
  { label: "White",    value: "oklch(95.1% 0.026 236.824)" },
  { label: "Gray",     value: "#2d2d2d" }
];

const WALLPAPERS = [
  // `url` = full-res wallpaper. `thumb` = tiny grid-only preview (~90px tiles).
  // Never use thumb as a wallpaper — quality would collapse.
  { label: "Space",      url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2074",       thumb: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=60&w=400" },
  { label: "Mountain",   url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80",       thumb: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=60" },
  { label: "Ocean",      url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1920&q=80",       thumb: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400&q=60" },
  { label: "Forest",     url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80",       thumb: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=60" },
  { label: "City",       url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920&q=80",       thumb: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=60" },
  { label: "Nature",     url: "https://pbs.twimg.com/media/FdYDpFlX0A87jku?format=jpg&name=4096x4096",          thumb: "https://pbs.twimg.com/media/FdYDpFlX0A87jku?format=jpg&name=small" },
  { label: "Aurora",     url: "https://images8.alphacoders.com/136/thumb-1920-1363709.png",                     thumb: "https://images8.alphacoders.com/136/thumb-350-1363709.png" },
  { label: "Anime Girl", url: "https://images3.alphacoders.com/131/thumb-1920-1313942.png",                     thumb: "https://images3.alphacoders.com/131/thumb-350-1313942.png" },
  { label: "Your Name",  url: "https://images6.alphacoders.com/790/thumb-1920-790867.jpg",                      thumb: "https://images6.alphacoders.com/790/thumb-350-790867.jpg" },
];

const DEFAULT_WALLPAPER = WALLPAPERS[0].url;

const COLORS = ['#5f6368','#1a73e8','#34a853','#ea4335','#fbbc04','#9c27b0','#ff5722','#00bcd4','#4caf50','#e91e63'];
const MAX_HISTORY = 20;

// (lerp animation globals removed — ghost uses direct top/left positioning)

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════
function colorFor(name) {
  let h = 0;
  for (const c of name) h = (h + c.charCodeAt(0)) % COLORS.length;
  return COLORS[h];
}
function faviconUrl(url) {
  try {
    const u = new URL(url).href;
    const encoded = encodeURIComponent(u);

    return [
      // 🔥 1st: Chrome internal (BEST)
      `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encoded}&size=64`,

      // 🔥 LAST: Google fallback
      `https://www.google.com/s2/favicons?sz=64&domain_url=${u}`
    ];
  } catch {
    return null;
  }
}

function createSVG(svgString) {
  const div = document.createElement('div');
  div.innerHTML = svgString;
  return div.firstChild;
}

function normalizeUrl(url) {
  return /^(https?:\/\/)/i.test(url) ? url : `https://${url}`;
}

function _showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  Object.assign(t.style, {
    position: 'fixed', bottom: '32px', left: '50%',
    transform: 'translateX(-50%)',
    background: '#333', color: '#fff',
    padding: '10px 18px', borderRadius: '8px',
    fontSize: '13px', zIndex: '99999',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    transition: 'opacity 0.4s', opacity: '1',
    maxWidth: '380px', textAlign: 'center',
    pointerEvents: 'none'
  });
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 400);
  }, 3500);
}

// ═══════════════════════════════════════════════════════
//  INDEXEDDB — wallpaper cache (GIFs + uploads + presets)
// ═══════════════════════════════════════════════════════
const NTP_IDB_NAME        = 'ntp_wallpaper_db';
const NTP_IDB_VERSION     = 3;                  // bumped: ensures by_ts index exists
const NTP_IDB_STORE       = 'wallpapers';       // existing: GIF ArrayBuffer
const NTP_CACHE_STORE     = 'cached_wallpapers';// LRU blob cache
const NTP_CACHE_MAX       = 20;                 // strictly max 20 images in IndexedDB (LRU eviction)
const MIN_WALLPAPER_BYTES = 100;                // reject empty / corrupted (0-byte) files
const MAX_WALLPAPER_BYTES = 25 * 1024 * 1024;   // reject strange / oversized files (> 25MB)

let _idbPromise = null; // singleton: one open per page-load, reused by all ops
function _openIDB() {
  if (_idbPromise) return _idbPromise;
  _idbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(NTP_IDB_NAME, NTP_IDB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      // Keep existing GIF store untouched (no data loss on upgrade)
      if (!db.objectStoreNames.contains(NTP_IDB_STORE)) {
        db.createObjectStore(NTP_IDB_STORE);
      }
      // LRU cache store — keyPath 'id', indexed by timestamp for LRU eviction
      if (!db.objectStoreNames.contains(NTP_CACHE_STORE)) {
        const store = db.createObjectStore(NTP_CACHE_STORE, { keyPath: 'id' });
        store.createIndex('by_ts', 'timestamp');
      } else {
        const store = req.transaction.objectStore(NTP_CACHE_STORE);
        if (!store.indexNames.contains('by_ts')) {
          store.createIndex('by_ts', 'timestamp');
        }
      }
    };
    req.onsuccess = e => {
      const db = e.target.result;
      // Handle concurrent tab version conflicts gracefully
      db.onversionchange = () => { db.close(); _idbPromise = null; };
      db.onclose = () => { _idbPromise = null; };
      resolve(db);
    };
    req.onerror = e => { _idbPromise = null; reject(e.target.error); };
    req.onblocked = () => { /* another tab holds old version — onsuccess still fires */ };
  });
  return _idbPromise;
}
// Warm the connection ASAP so first wallpaper read doesn't pay open() latency
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(() => { _openIDB().catch(() => {}); }, { timeout: 500 });
} else {
  setTimeout(() => { _openIDB().catch(() => {}); }, 0);
}

// ── GIF helpers (unchanged API) ──────────────────────────
async function _idbSaveGif(arrayBuffer) {
  const db = await _openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(NTP_IDB_STORE, 'readwrite');
    tx.oncomplete = () => { resolve(); };
    tx.onerror    = e => { reject(e.target.error); };
    tx.objectStore(NTP_IDB_STORE).put(arrayBuffer, 'custom_gif');
  });
}

async function _idbLoadGif() {
  const db = await _openIDB();
  return new Promise((resolve, reject) => {
    let result = null;
    const tx  = db.transaction(NTP_IDB_STORE, 'readonly');
    tx.oncomplete = () => { resolve(result); };
    tx.onerror   = e => { reject(e.target.error); };
    const req = tx.objectStore(NTP_IDB_STORE).get('custom_gif');
    req.onsuccess = e => { result = e.target.result || null; };
    req.onerror = e => { reject(e.target.error); };
  });
}

async function _idbDeleteGif() {
  const db = await _openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(NTP_IDB_STORE, 'readwrite');
    tx.oncomplete = () => { resolve(); };
    tx.onerror    = e => { reject(e.target.error); };
    tx.objectStore(NTP_IDB_STORE).delete('custom_gif');
  });
}

// ── LRU Wallpaper Cache (uploads + presets, strictly capped at 20) ──
// Record shape: { id: string, blob: Blob, mimeType: string, size: number, timestamp: number }

async function _cacheGet(id) {
  const db = await _openIDB();
  const rec = await new Promise((resolve, reject) => {
    const tx = db.transaction(NTP_CACHE_STORE, 'readonly');
    tx.onerror = e => { reject(e.target.error); };
    const req = tx.objectStore(NTP_CACHE_STORE).get(id);
    req.onsuccess = e => { resolve(e.target.result || null); };
    req.onerror = e => { reject(e.target.error); };
  });
  // LRU touch is fire-and-forget: never block wallpaper paint on a write
  if (rec) _cacheTouch(id).catch(() => {});
  return rec;
}

// Separate write txn, never awaited on the hot paint path
async function _cacheTouch(id) {
  const db = await _openIDB();
  return new Promise(resolve => {
    try {
      const tx = db.transaction(NTP_CACHE_STORE, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
      const store = tx.objectStore(NTP_CACHE_STORE);
      const req = store.get(id);
      req.onsuccess = e => {
        const rec = e.target.result;
        if (rec) { rec.timestamp = Date.now(); store.put(rec); }
      };
    } catch (_) { resolve(); }
  });
}

async function _cachePut(id, blob, mimeType) {
  // Validate strange or excessive size
  if (!blob || !(blob instanceof Blob)) {
    throw new Error('Invalid image blob');
  }
  if (blob.size < MIN_WALLPAPER_BYTES) {
    throw new Error('Image file is empty or corrupted');
  }
  if (blob.size > MAX_WALLPAPER_BYTES) {
    throw new Error(`Image size (${(blob.size / (1024 * 1024)).toFixed(1)}MB) exceeds 25MB limit`);
  }

  const db = await _openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(NTP_CACHE_STORE, 'readwrite');
    tx.oncomplete = () => { resolve(); };
    tx.onerror = e => { reject(e.target.error); };

    const store = tx.objectStore(NTP_CACHE_STORE);
    let index = null;
    try { index = store.index('by_ts'); } catch (_) { index = null; }

    const existingKeys = [];
    const cursorReq = index ? index.openCursor() : store.openCursor();

    // Fix #1: cursor failure must reject the promise, never hang it forever
    cursorReq.onerror = ev => { reject(ev.target.error); };

    cursorReq.onsuccess = ev => {
      const cursor = ev.target.result;
      if (cursor) {
        existingKeys.push(cursor.primaryKey);
        cursor.continue();
      } else {
        // Fix #2: only count evictable keys so the strict cap works even when
        // the active wallpaper key is among the oldest (previously it was counted
        // but skipped, letting the store sit at MAX+1 permanently).
        const isUpdate = existingKeys.includes(id);
        const activeKey = state.wallpaper === '__upload__' ? 'custom_upload' : state.wallpaper;
        const evictable = existingKeys.filter(k => k !== id && k !== activeKey);
        // effectiveCount: evictable pool + this new write (1 if new, 0 if update) + protected keys already in store
        const protectedInStore = existingKeys.filter(k => k !== id && k === activeKey).length;
        const effectiveCount = evictable.length + (isUpdate ? 0 : 1) + protectedInStore;

        if (effectiveCount > NTP_CACHE_MAX) {
          const toRemoveCount = effectiveCount - NTP_CACHE_MAX;
          let removed = 0;
          for (const oldKey of evictable) {
            if (removed >= toRemoveCount) break;
            store.delete(oldKey);
            removed++;
          }
        }

        // Store new/updated record
        store.put({
          id,
          blob,
          mimeType: mimeType || blob.type || 'image/png',
          size: blob.size,
          timestamp: Date.now()
        });
      }
    };
  });
}

async function _cacheEvict() {
  const db = await _openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(NTP_CACHE_STORE, 'readwrite');
    tx.oncomplete = () => { resolve(); };
    tx.onerror    = e => { reject(e.target.error); };

    const store = tx.objectStore(NTP_CACHE_STORE);
    let index = null;
    try { index = store.index('by_ts'); } catch (_) { index = null; }

    const allKeys = [];
    const cursorReq = index ? index.openCursor() : store.openCursor();
    // Fix #1: cursor failure must reject, never hang
    cursorReq.onerror = e => { reject(e.target.error); };
    cursorReq.onsuccess = e => {
      const cursor = e.target.result;
      if (cursor) {
        allKeys.push(cursor.primaryKey);
        cursor.continue();
      } else {
        if (allKeys.length > NTP_CACHE_MAX) {
          const activeKey = state.wallpaper === '__upload__' ? 'custom_upload' : state.wallpaper;
          const toDelete = allKeys.slice(0, allKeys.length - NTP_CACHE_MAX);
          toDelete.forEach(k => {
            if (k !== activeKey) store.delete(k);
          });
        }
      }
    };
  });
}

async function _cacheDelete(id) {
  const db = await _openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(NTP_CACHE_STORE, 'readwrite');
    tx.oncomplete = () => { resolve(); };
    tx.onerror    = e => { reject(e.target.error); };
    tx.objectStore(NTP_CACHE_STORE).delete(id);
  });
}

// Background caching for remote wallpapers (enabled by host_permissions in manifest)
async function _cacheRemoteWallpaper(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return;
    const blob = await res.blob();
    if (blob.size < MIN_WALLPAPER_BYTES || blob.size > MAX_WALLPAPER_BYTES) return;
    await _cachePut(url, blob, blob.type || 'image/jpeg');
    // Store instant placeholder only if this is still the active wallpaper
    if (state.wallpaper === url) _saveThumbForUpload(blob);
  } catch (err) {
    console.warn('[NTP] Background cache of remote wallpaper skipped:', err);
  }
}

// ── Instant thumbnail placeholder (the big perceived-speed win) ──
// A ~320px JPEG dataURL (~10-30KB) lives in chrome.storage.local alongside
// state, so it paints synchronously in the SAME storage callback — zero extra
// round-trips, zero IndexedDB open. Full-res blob swaps in when decoded.
async function _makeThumbDataUrl(blob) {
  try {
    const bmp = await createImageBitmap(blob);
    const MAX_W = 320; // placeholder only: big enough for a smooth blur-up, tiny vs full-res
    const scale = Math.min(1, MAX_W / bmp.width);
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(bmp, 0, 0, w, h);
    if (typeof bmp.close === 'function') bmp.close();
    return new Promise(resolve => {
      c.toBlob(b => {
        if (!b) { resolve(null); return; }
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = () => resolve(null);
        fr.readAsDataURL(b);
      }, 'image/jpeg', 0.7);
    });
  } catch (_) { return null; }
}

function _saveThumbForUpload(blob) {
  // Fire-and-forget: storage write must never block the "wallpaper set" toast
  _makeThumbDataUrl(blob).then(thumb => {
    if (!thumb) return;
    chrome.storage.local.set({ ntp_wp_thumb: thumb });
    // Sync mirror for <head> fast paint on next cold load (best-effort, quota-safe: ~10-30KB)
    try { localStorage.setItem('ntp_wp_thumb', thumb); } catch (_) {}
  }).catch(() => {});
}

// Sync mirror of paint-critical values so <head> can paint before any async API.
// Only color + tiny thumb live here; full-res blob stays in IndexedDB untouched.
function _mirrorFastPaint() {
  try {
    localStorage.setItem('ntp_bg_color', state.bgColor || '#202124');
    localStorage.setItem('ntp_wp_brightness', String(state.wpBrightness || 0));
  } catch (_) {}
}

// Pre-decode off the critical path so the swap never flashes half-decoded
function _predecode(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (img.decode) img.decode().then(resolve).catch(resolve);
      else resolve();
    };
    img.onerror = () => resolve();
    img.src = url;
  });
}

// Load a cached blob and apply it to #bg as a blob URL.
// Returns the object URL string on success, null if not cached.
let _uploadBlobUrl = null; // separate tracker for upload blob URL

async function _applyUploadFromCache(id) {
  try {
    const rec = await _cacheGet(id);
    if (!rec) return null;

    if (_uploadBlobUrl) {
      URL.revokeObjectURL(_uploadBlobUrl);
      _uploadBlobUrl = null;
    }
    _uploadBlobUrl = URL.createObjectURL(rec.blob);
    return _uploadBlobUrl;
  } catch (err) {
    console.warn('[NTP] _applyUploadFromCache failed:', err);
    return null;
  }
}

// Holds the active blob URL so we can revoke it on next apply
let _activeBlobUrl = null;

// Fix #6: monotonic generation counter — incremented on every wallpaper switch.
// Any async path (IDB load, upload miss) checks its captured gen before writing state
// so a slow resolve cannot clobber a newer user choice.
let _wallpaperGen = 0;

async function _applyGifFromIDB(opts = {}) {
  const _gen = ++_wallpaperGen;          // capture gen at call time
  const isFirstLoad = !opts.isSwitch; // first paint: bg is empty, no fade-out needed
  try {
    const buffer = await _idbLoadGif();
    if (!buffer) {
      // Fix #6: only reset state if no newer wallpaper switch happened
      if (_gen !== _wallpaperGen) return;
      state.wallpaper = '';
      saveState();
      applyBg();
      return;
    }

    if (_activeBlobUrl) {
      URL.revokeObjectURL(_activeBlobUrl);
      _activeBlobUrl = null;
    }

    const blob = new Blob([buffer], { type: 'image/gif' });
    _activeBlobUrl = URL.createObjectURL(blob);

    // Decode first frame BEFORE painting so the swap never shows blank
    await _predecode(_activeBlobUrl);

    const bg = document.getElementById('bg');
    if (!bg) return;

    if (isFirstLoad) {
      // Fast path: blur-up swap, let the CSS body.loaded fade handle reveal
      _paintBgSharp(_activeBlobUrl);
      return;
    }

    // ── Fade out → swap image → fade back in (only when switching wallpapers) ──
    // This gives a clean cross-fade instead of a hard pop
    bg.style.transition = 'opacity 200ms ease, transform 0s';
    bg.style.opacity = '0';

    // Wait for fade-out to complete
    await new Promise(resolve => setTimeout(resolve, 200));

    // Paint the GIF
    _paintBgWithUrl(_activeBlobUrl);

    // Fade back in with the GIF showing
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bg.style.transition = 'opacity 350ms cubic-bezier(0.22, 1, 0.36, 1)';
        bg.style.opacity = '1';
      });
    });

  } catch (err) {
    console.error('[NTP] Failed to load GIF from IndexedDB:', err);
    // Fix #6: don't clobber a newer wallpaper choice made while we were awaiting
    if (_gen === _wallpaperGen) {
      state.wallpaper = '';
      saveState();
      applyBg();
    }
  }
}

// Revoke blob URLs when tab closes to free memory
window.addEventListener('pagehide', () => {
  if (_activeBlobUrl)  URL.revokeObjectURL(_activeBlobUrl);
  if (_uploadBlobUrl)  URL.revokeObjectURL(_uploadBlobUrl);
});

// ═══════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════
let state = {
  allShortcuts:   [...TOP_DEFAULTS, ...EXTRA_DEFAULTS].slice(0, 20),
  showShortcuts:  true,
  bgColor:    '#202124',
  wallpaper:  DEFAULT_WALLPAPER,
  searchHistory: [],
  wpBrightness:  -4
};

function loadState(cb) {
  chrome.storage.local.get(['ntp_state', 'ntp_wallpaper', 'ntp_wp_thumb'], r => {
    _perfMark('storage-ok');
    if (r.ntp_state) {
      const loaded = r.ntp_state;
      
      // Migrate old two-array format to new unified format
      let _migrated = false;
      if (loaded.topShortcuts || loaded.extraShortcuts) {
        const top = loaded.topShortcuts || [];
        const extra = loaded.extraShortcuts || [];
        loaded.allShortcuts = [...top, ...extra].slice(0, 20);
        loaded.showShortcuts = loaded.showTop !== false && loaded.showExtra !== false; // both must be true
        delete loaded.topShortcuts;
        delete loaded.extraShortcuts;
        delete loaded.showTop;
        delete loaded.showExtra;
        _migrated = true;
      }
      
      // Handle legacy individual show flags
      if (loaded.showTopRow !== undefined || loaded.showExtraRow !== undefined) {
        loaded.showShortcuts = loaded.showTopRow !== false && loaded.showExtraRow !== false;
        delete loaded.showTopRow;
        delete loaded.showExtraRow;
        _migrated = true;
      }
      
      Object.assign(state, loaded);
      // BUG FIX: Persist the migrated state so the old keys don't re-appear next load
      if (_migrated) { chrome.storage.local.set({ ntp_state: state }); }
    }
    
    // Ensure arrays exist
    if (!Array.isArray(state.allShortcuts)) state.allShortcuts = [...TOP_DEFAULTS, ...EXTRA_DEFAULTS].slice(0, 20);
    if (!Array.isArray(state.searchHistory)) state.searchHistory = [];
    if (!Array.isArray(state.tabGroups)) state.tabGroups = [];

    // Paint the solid color synchronously — zero flash of wrong color.
    // Image itself is owned by the INIT blur-up chain (skipImage avoids
    // an early full-res pop that the chain would then repaint = flicker).
    applyBg(true);

    // Seed the sync <head> mirror for the NEXT cold load (best-effort)
    _mirrorFastPaint();
    try {
      if (r.ntp_wp_thumb) localStorage.setItem('ntp_wp_thumb', r.ntp_wp_thumb);
    } catch (_) {}

    // ── CRITICAL: GIF check MUST run BEFORE ntp_wallpaper restore ──
    // ntp_wallpaper can hold a stale static URL from before the GIF was set.
    // If we restore ntp_wallpaper first it silently overwrites '__gif__' and
    // _applyGifFromIDB() is never called → old wallpaper shows on every reload.
    if (state.wallpaper === '__gif__') {
      // Wipe stale ntp_wallpaper so it can never poison a future load
      chrome.storage.local.remove('ntp_wallpaper');
      cb(); // render UI immediately — don't block on GIF decode
      _applyGifFromIDB(); // fast first-load path: pre-decodes, no 200ms fade wait
      return;
    }

    // ── Uploaded image (blob in IDB cache) ──
    // Non-blocking: paint thumbnail (if any) instantly, render UI, swap full-res in.
    if (state.wallpaper === '__upload__') {
      chrome.storage.local.remove('ntp_wallpaper');
      if (r.ntp_wp_thumb) { _paintBgThumb(r.ntp_wp_thumb); _perfMark('thumb-inline'); }
      cb();
      _applyUploadFromCache('custom_upload').then(async blobUrl => {
        if (blobUrl) {
          _perfMark('blob-ok');
          await _predecode(blobUrl);
          _perfMark('decoded');
          _paintBgSharp(blobUrl);
          _perfMark('sharp');
        }
        else { state.wallpaper = ''; chrome.storage.local.remove('ntp_wp_thumb'); try { localStorage.removeItem('ntp_wp_thumb'); } catch (_) {} saveState(); applyBg(); }
      });
      return;
    }

    // Restore static wallpaper from separate storage key (new format)
    if (r.ntp_wallpaper) {
      state.wallpaper = r.ntp_wallpaper;
    }
    // Migrate: wallpaper still inlined in old ntp_state — split it out now
    else if (state.wallpaper && !r.ntp_wallpaper) {
      chrome.storage.local.set({ ntp_wallpaper: state.wallpaper });
    }

    cb();
  });
}
function saveState() {
  const isGif           = state.wallpaper === '__gif__';
  const isUpload        = state.wallpaper === '__upload__';
  const isMarker        = isGif || isUpload;
  const isRealWallpaper = state.wallpaper && !isMarker;

  // Strip large base64 strings from ntp_state — keep markers or '' as-is
  const stateToSave = isRealWallpaper
    ? { ...state, wallpaper: '' }
    : { ...state };

  // Fix #3: atomic write — both keys in one set() so a quota error or crash
  // between two separate writes can never leave ntp_wallpaper and ntp_state
  // pointing at inconsistent values.
  const payload = { ntp_state: stateToSave };

  if (isRealWallpaper) {
    // Store image URL separately to avoid re-serializing on every save
    payload.ntp_wallpaper = state.wallpaper;
  } else {
    // Marker (__gif__ / __upload__) or cleared — remove any stale static URL
    // so it can NEVER overwrite a marker on next load.
    // We can't remove inside set(), so do a separate remove; the marker in ntp_state
    // takes priority anyway because loadState checks it first.
    chrome.storage.local.remove('ntp_wallpaper');
  }

  _mirrorFastPaint();

  // Fix #3/#4: single atomic write + quota error guard
  return chrome.storage.local.set(payload)
    .catch(err => console.warn('[NTP] saveState failed (quota?):', err));
}

// ═══════════════════════════════════════════════════════
//  BACKGROUND
// ═══════════════════════════════════════════════════════

// Preload a remote URL (decode it) with a safety timeout so a hung fetch
// can never trap the tile spinner forever. Resolves on load, error, or timeout.
function _preloadRemoteUrl(url, timeoutMs = 10000) {
  return new Promise(resolve => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    const timer = setTimeout(finish, timeoutMs);
    const img = new Image();
    img.onload = () => {
      clearTimeout(timer);
      if (img.decode) img.decode().then(finish).catch(finish);
      else finish();
    };
    img.onerror = () => { clearTimeout(timer); finish(); };
    img.src = url;
    if (img.complete && img.naturalWidth > 0) {
      clearTimeout(timer);
      finish();
    }
  });
}

// Shared helper: paint #bg with any ready URL (blob URL, dataURL, or remote URL)
function _paintBgWithUrl(url) {
  const bg = document.getElementById('bg');
  if (!bg) return;
  bg.style.backgroundImage    = `url("${url}")`;
  bg.style.backgroundSize     = 'cover';
  bg.style.backgroundPosition = 'center';
  bg.style.backgroundRepeat   = 'no-repeat';
  const bv = 1.0 + (state.wpBrightness || 0) * 0.08;
  bg.style.filter = `brightness(${bv.toFixed(2)})`;
}

// Thumb from a remote URL (placeholder for blur-up). Image is browser-cached by
// preload time so this is fast. crossOrigin keeps the canvas readable;
// failure just resolves null and callers fall back to a direct paint.
function _makeThumbFromUrl(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.decoding = 'async';
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const scale = Math.min(1, 320 / (img.naturalWidth || 320));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL('image/jpeg', 0.7));
      } catch (_) { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// Persist a thumb dataURL for the next cold load (both async + sync mirrors)
function _persistThumbDataUrl(thumb) {
  if (!thumb) return;
  try { chrome.storage.local.set({ ntp_wp_thumb: thumb }); } catch (_) {}
  try { localStorage.setItem('ntp_wp_thumb', thumb); } catch (_) {}
}

// Thumb placeholder paint: same image as <head> fast paint, pre-blurred so the
// later _paintBgSharp swap starts from blur (no sharp→blur jump mid-load).
function _paintBgThumb(url) {
  const bg = document.getElementById('bg');
  if (!bg) return;
  bg.style.backgroundImage    = `url("${url}")`;
  bg.style.backgroundSize     = 'cover';
  bg.style.backgroundPosition = 'center';
  bg.style.backgroundRepeat   = 'no-repeat';
  const bv = 1.0 + (state.wpBrightness || 0) * 0.08;
  const bvDim = bv * 0.75; // placeholder scrim: 25% dimmer, lifts on swap
  bg.style.filter = `blur(5px) brightness(${bvDim.toFixed(2)})`;
}

// Blur-up swap: #bg holds the blurred thumb (from <head> fast paint) and the
// full-res image crossfades from blur(3px) → blur(0). Same filter function
// list on both ends so the transition interpolates instead of popping.
// Falls back to an instant paint when no placeholder exists.
function _paintBgSharp(url) {
  const bg = document.getElementById('bg');
  if (!bg) return;
  const bv = (1.0 + (state.wpBrightness || 0) * 0.08).toFixed(2);
  const cur = bg.style.backgroundImage || '';
  // Fix #7: ntp-fastpaint always exists (even for color-only loads) — only use it as a
  // placeholder signal when it actually contains a data:image URL in its CSS text.
  const fpEl = document.getElementById('ntp-fastpaint');
  const fpHasImage = fpEl && fpEl.textContent.indexOf('data:image') !== -1;
  const hasPlaceholder = cur.indexOf('data:image') !== -1 || fpHasImage;
  if (!hasPlaceholder) { _paintBgWithUrl(url); return; }

  bg.style.transition = 'none';
  bg.style.backgroundSize     = 'cover';
  bg.style.backgroundPosition = 'center';
  bg.style.backgroundRepeat   = 'no-repeat';
  bg.style.filter = `blur(5px) brightness(${(bv * 0.75).toFixed(2)})`;
  void bg.offsetWidth; // reflow: lock in the blurred start frame
  bg.style.transition = 'opacity 250ms cubic-bezier(0.22, 1, 0.36, 1), filter 250ms cubic-bezier(0.22, 1, 0.36, 1)';
  bg.style.backgroundImage = `url("${url}")`;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    bg.style.filter = `blur(0px) brightness(${bv})`;
  }));
}

function applyBg(skipImage) {
  const bg = document.getElementById('bg');
  const color = state.bgColor || '#202124';

  document.documentElement.style.setProperty('--bg-color', color);
  // backgroundColor (not the background shorthand): the shorthand would wipe
  // the <html> fast-paint thumb and cause a black flash before #bg fades in.
  document.documentElement.style.backgroundColor = color;
  document.body.style.background = 'transparent';

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.content = color;

  // Initial load: color/meta only. The INIT blur-up chain owns first image
  // paint — painting a URL here would pop the full image in early and the
  // chain would repaint it (flicker), especially for legacy inline URLs.
  if (skipImage) return;

  // Fix #9: guard against #bg not yet in DOM
  if (!bg) return;

  bg.style.backgroundColor = color;

  // Explicitly cleared wallpaper or color swatch mode
  if (!state.wallpaper) {
    if (_uploadBlobUrl) { URL.revokeObjectURL(_uploadBlobUrl); _uploadBlobUrl = null; }
    if (_activeBlobUrl) { URL.revokeObjectURL(_activeBlobUrl); _activeBlobUrl = null; }
    bg.style.backgroundImage = 'none';
    bg.style.filter = 'none';
    // No wallpaper: clear any stale fast-paint thumb behind #bg too
    document.documentElement.style.backgroundImage = 'none';
    return;
  }

  // GIF: applied via blob URL by _applyGifFromIDB — only update brightness here.
  if (state.wallpaper === '__gif__') {
    const bv = 1.0 + (state.wpBrightness || 0) * 0.08;
    bg.style.filter = `brightness(${bv.toFixed(2)})`;
    return;
  }

  // Active blob URL (from custom upload or cached preset)
  if (_uploadBlobUrl) {
    const bv = 1.0 + (state.wpBrightness || 0) * 0.08;
    bg.style.filter = `brightness(${bv.toFixed(2)})`;
    if (!bg.style.backgroundImage || bg.style.backgroundImage === 'none') {
      _paintBgWithUrl(_uploadBlobUrl);
    }
    return;
  }

  // Blob markers are resolved async by their own loaders — never touch #bg
  // here and never paint the marker string as a URL (renders broken/black).
  // Leave #bg on the head fast-paint rule until the real image arrives.
  if (state.wallpaper === '__gif__' || state.wallpaper === '__upload__') {
    return;
  }

  bg.style.backgroundImage = 'none';
  bg.style.filter = 'none';

  if (state.wallpaper) {
    _paintBgWithUrl(state.wallpaper);
  }
}

function preloadWallpaper() {
  return new Promise(resolve => {
    // Skip for blob markers or empty — those are painted independently
    if (!state.wallpaper || state.wallpaper === '__gif__' || state.wallpaper === '__upload__') {
      resolve(); return;
    }
    let settled = false;
    const finish = () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    };

    // Safety timeout: never block page render for more than 1800ms
    const timer = setTimeout(finish, 1800);

    const img = new Image();
    const done = () => {
      clearTimeout(timer);
      if (img.decode) {
        img.decode().then(finish).catch(finish);
      } else {
        finish();
      }
    };

    img.onload  = done;
    img.onerror = () => { clearTimeout(timer); finish(); };
    img.src = state.wallpaper;

    if (img.complete && img.naturalWidth > 0) {
      done();
    }
  });
}


// ═══════════════════════════════════════════════════════
//  SEARCH HISTORY (our own searches)
// ═══════════════════════════════════════════════════════
function addToHistory(query) {
  if (!query || query.length < 2) return;
  state.searchHistory = [query, ...state.searchHistory.filter(h => h !== query)].slice(0, MAX_HISTORY);
  saveState();
}

function getHistoryMatches(q) {
  if (!q) return state.searchHistory.slice(0, 8);
  const lower = q.toLowerCase();
  return state.searchHistory.filter(h => h.toLowerCase().includes(lower)).slice(0, 5);
}

// ═══════════════════════════════════════════════════════
//  SMART PREDICTOR ENGINE
//  Sources:
//    1. Our own search history (state.searchHistory)
//    2. Pinned bar sites (state.pinnedAtBar)
//    3. Shortcuts (state.allShortcuts)
//    4. chrome.topSites — your most visited sites from Chrome
//    5. chrome.history  — your recent browsing history titles+URLs
//    6. N-gram next-word predictor built from all of the above
// ═══════════════════════════════════════════════════════

// In-memory corpus built once at startup, updated when history loads
// Each entry: { text, url, score, source }
let _corpus = [];
let _ngrams = new Map(); // "word1 word2" → Map(nextWord → freq)

// Extract clean text tokens from a URL
function urlToText(url) {
  try {
    const u = new URL(url);
    // hostname: strip www., split by dots → "github com" → "github"
    const host = u.hostname.replace(/^www\./, '').split('.')[0];
    // pathname: split by / - and _ → words
    const path = u.pathname.replace(/[/_\-]/g, ' ').replace(/\.\w+$/, '').trim();
    return (host + ' ' + path).trim();
  } catch { return ''; }
}

// Tokenise a sentence into lowercase words (min 2 chars)
function tokenise(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
}

// Build bi-gram and tri-gram table from a list of strings
function buildNgrams(texts) {
  _ngrams.clear();
  for (const text of texts) {
    const words = tokenise(text);
    for (let i = 0; i < words.length - 1; i++) {
      // bigram key: words[i]
      const k1 = words[i];
      if (!_ngrams.has(k1)) _ngrams.set(k1, new Map());
      const m1 = _ngrams.get(k1);
      m1.set(words[i+1], (m1.get(words[i+1]) || 0) + 1);

      // trigram key: "words[i] words[i+1]"
      if (i < words.length - 2) {
        const k2 = words[i] + ' ' + words[i+1];
        if (!_ngrams.has(k2)) _ngrams.set(k2, new Map());
        const m2 = _ngrams.get(k2);
        m2.set(words[i+2], (m2.get(words[i+2]) || 0) + 1);
      }
    }
  }
}

// Given the last 1-2 typed words, predict what word comes next
function predictNextWords(typedWords, topN = 4) {
  const results = new Map();
  const len = typedWords.length;
  if (len === 0) return [];

  // Try trigram first (last 2 words)
  if (len >= 2) {
    const key = typedWords[len-2] + ' ' + typedWords[len-1];
    const map = _ngrams.get(key);
    if (map) map.forEach((freq, w) => results.set(w, (results.get(w) || 0) + freq * 2));
  }

  // Bigram (last word)
  const key1 = typedWords[len-1];
  const map1 = _ngrams.get(key1);
  if (map1) map1.forEach((freq, w) => results.set(w, (results.get(w) || 0) + freq));

  return [...results.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([w]) => w);
}

// Build the full corpus from all sources (called async at init)
async function buildCorpus() {
  const texts = [];
  const entries = []; // { text, url, score, source }

  // Source 1: our own search history
  for (const q of state.searchHistory) {
    texts.push(q);
    entries.push({ text: q, url: null, score: 10, source: 'history' });
  }

  // Source 2: pinned suggestions (search bar specific)
  

  // Source 2.5: shortcuts from unified list
  // for (const sc of state.allShortcuts) {
  //   const t = sc.name + ' ' + urlToText(sc.url);
  //   texts.push(t);
  //   entries.push({
  //     text: sc.name,
  //     url: sc.url,
  //     score: 8,
  //     source: 'shortcuts'
  //   });
  // }

  // Source 3: chrome.topSites (most visited — already used for top row)
  // Fix #22: race with 3s timeout so a revoked permission or hung API can't stall init forever
  await Promise.race([
    new Promise(resolve => {
      try {
        chrome.topSites.get(sites => {
          if (chrome.runtime.lastError) { resolve(); return; }
          for (const s of (sites || [])) {
            const name = s.title || urlToText(s.url);
            const t = name + ' ' + urlToText(s.url);
            texts.push(t);
            entries.push({ text: name, url: s.url, score: 20, source: 'topsites' });
          }
          resolve();
        });
      } catch (_) { resolve(); }
    }),
    new Promise(resolve => setTimeout(resolve, 3000))
  ]);

  // Source 4: chrome.history — last 30 days, up to 500 items
  // Fix #22: same timeout + lastError guard
  await Promise.race([
    new Promise(resolve => {
      try {
        const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
        chrome.history.search({ text: '', startTime: since, maxResults: 500 }, items => {
          if (chrome.runtime.lastError) { resolve(); return; }
          for (const item of (items || [])) {
            if (!item.title && !item.url) continue;
            const name  = (item.title || urlToText(item.url)).trim();
            const t     = name + ' ' + urlToText(item.url);
            const score = Math.log2((item.visitCount || 1) + 1) * 3;
            texts.push(t);
            // Only add meaningful titles (not raw URLs) as suggestions
            if (item.title && item.title.length > 1 && item.title.length < 80) {
              entries.push({ text: item.title || new URL(item.url).hostname, url: item.url, score, source: 'chrome' });
            }
          }
          resolve();
        });
      } catch (_) { resolve(); }
    }),
    new Promise(resolve => setTimeout(resolve, 3000))
  ]);

  // Deduplicate entries by text (case-insensitive), keeping highest score
  const seen = new Map();
  for (const e of entries) {
    const key = e.text.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, e);
    } else {
      const existing = seen.get(key);
    
      // 🔥 Prefer entry WITH URL
      if (!existing.url && e.url) {
        seen.set(key, e);
      }
      // Otherwise fallback to score comparison
      else if (existing.url === e.url && existing.score < e.score) {
        seen.set(key, e);
      }
    }
  }
  _corpus = [...seen.values()];

  // Build n-gram table from all collected text
  buildNgrams(texts);
}

// Score a corpus entry against the typed query
function scoreCorpusEntry(entry, q) {
  const text  = entry.text.toLowerCase();
  const lower = q.toLowerCase();
  let score   = entry.score; // base score from source

  if (text.startsWith(lower))            score += 50;
  else if (text.includes(' ' + lower))   score += 30;
  else if (text.includes(lower))         score += 15;
  else return -1; // no match

  // Prefer shorter, cleaner titles
  score -= text.length * 0.1;
  return score;
}

// Main suggestion function — combines corpus matches + n-gram next-word prediction
function getSuggestions(q, limit = 8) {
  const lower = q.toLowerCase().trim();

  // Empty input → recent searches + top pinned
  if (!lower) {
    const recent = state.searchHistory.slice(0, 5).map(t => ({ text: t, url: null, source: 'history' }));
    const topSites = _corpus
        .filter(e => e.source === 'topsites')
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(e => ({ text: e.text, url: e.url, source: 'topsites' }));
    return [...recent, ...topSites].slice(0, limit);
  }

  // Score all corpus entries
  const matches = _corpus
    .map(e => ({ ...e, _s: scoreCorpusEntry(e, lower) }))
    .filter(e => e._s >= 0)
    .sort((a, b) => b._s - a._s)
    .slice(0, limit);

  // If fewer than limit results, try n-gram next-word completion
  if (matches.length < limit) {
    const words     = tokenise(lower);
    const lastWord  = words[words.length - 1] || '';
    const nextWords = predictNextWords(words, 6);

    for (const nw of nextWords) {
      if (matches.length >= limit) break;
      // Build completion: typed text + predicted next word
      const completion = lower + (lower.endsWith(' ') ? '' : ' ') + nw;
      // Only add if not already covered
      const already = matches.some(m => m.text.toLowerCase().startsWith(completion));
      if (!already) {
        matches.push({ text: completion, url: null, source: 'predict', _s: 0 });
      }
    }
  }

  return matches.slice(0, limit);
}

// ═══════════════════════════════════════════════════════
//  AUTOCOMPLETE UI
// ═══════════════════════════════════════════════════════
let acSuggestions = [];
let acEntries     = [];
let acIndex       = -1;

const searchBar  = document.getElementById('search-bar');
// BUG FIX: Guard against null in case DOM is not yet ready
if (searchBar) {
  searchBar.style.background = `rgba(32,33,36,${UI_ALPHA})`;
}
const searchBarStyle = document.createElement('style');
searchBarStyle.textContent = `#search-bar:focus{background:rgba(32,33,36,${UI_ALPHA}) !important;}`;
document.head.appendChild(searchBarStyle);

document.documentElement.style.setProperty('--circle-bg', `rgba(60,64,67,${UI_ALPHA})`);

const mainEl = document.getElementById('main');
const logoEl = document.getElementById('logo');
if (logoEl) {
  const logoHeight = 92;
  const logoMargin = 38;
  const basePadding = 165;
  const hiddenTopPadding = basePadding + logoHeight + logoMargin;

  if (SHOW_LOGO) {
    logoEl.style.display = '';
    mainEl.style.paddingTop = `${basePadding}px`;
  } else {
    logoEl.style.display = 'none';
    mainEl.style.paddingTop = `${hiddenTopPadding}px`;
  }
}

const custPanelEl = document.getElementById('cust-panel');
if (custPanelEl) custPanelEl.style.background = `rgba(41,42,45,${UI_ALPHA})`;

const acDropdown = document.createElement('div');
acDropdown.id = 'ac-dropdown';
// Portaled to body: #search-wrap creates a stacking context (transform) and sits
// before .sc-section in DOM, so a dropdown inside it cannot paint above shortcuts.
document.body.appendChild(acDropdown);

const searchWrap = document.getElementById('search-wrap');

function positionAcDropdown() {
  const rect = searchWrap.getBoundingClientRect();
  acDropdown.style.left = `${Math.round(rect.left)}px`;
  acDropdown.style.top = `${Math.round(rect.top + rect.height + 6)}px`;
  acDropdown.style.width = `${Math.round(rect.width)}px`;
}

let acPositionListenersBound = false;
function bindAcPositionListeners() {
  if (acPositionListenersBound) return;
  acPositionListenersBound = true;
  const reposition = () => {
    if (acDropdown.classList.contains('open')) positionAcDropdown();
  };
  window.addEventListener('resize', reposition);
  window.addEventListener('scroll', reposition, true);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', reposition);
    window.visualViewport.addEventListener('scroll', reposition);
  }
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(reposition).observe(searchWrap);
  }
}

const acStyle = document.createElement('style');
acStyle.textContent = `
#ac-dropdown {
  display: none;
  position: fixed;
  /* left, top, width set by positionAcDropdown() */

  background:rgba(32, 33, 36, 0.3);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 14px;
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35);
  z-index: var(--layer-autocomplete, 300);
  max-height: min(420px, calc(100vh - 120px));
  overflow-x: hidden;
  overflow-y: auto;
}
#ac-dropdown.open { display: block; }

.ac-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 16px; cursor: pointer;
  font-size: 14px; color: #e8eaed;
  transition: background 0.1s; user-select: none;
}
.ac-item:hover, .ac-item.selected { background: rgba(255,255,255,0.09); }

.ac-icon { width: 16px; height: 16px; flex-shrink: 0; opacity: 0.5; }
.ac-favicon { width: 16px; height: 16px; border-radius: 3px; flex-shrink: 0; object-fit: contain; }

.ac-text { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ac-text b { color: #fff; font-weight: 600; }

.ac-tag {
  font-size: 10px; color: #9aa0a6;
  background: rgba(255,255,255,0.07);
  border-radius: 4px; padding: 2px 6px; flex-shrink: 0;
}
.ac-del {
  width: 20px; height: 20px; border-radius: 50%;
  background: none; border: none; cursor: pointer;
  color: #9aa0a6; font-size: 13px; display: flex;
  align-items: center; justify-content: center;
  flex-shrink: 0; opacity: 0; transition: opacity 0.1s, background 0.1s;
}
.ac-item:hover .ac-del { opacity: 1; }
.ac-del:hover { background: rgba(255,255,255,0.12); color: #ea4335; }
.ac-sep { height: 1px; background: rgba(255,255,255,0.07); }
`;
document.head.appendChild(acStyle);

const dragStyle = document.createElement('style');
dragStyle.textContent = `
/* Smooth transition for all tiles during drag reorder */
.sc-tile {
  transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),
              opacity  0.15s ease;
  position: relative;
}

/* The tile being dragged — fades in place */
.dnd-source {
  opacity: 0.22;
  transform: scale(0.94);
}

/* Drop indicators — glowing vertical line, NOT moving the tile */
.dnd-drop-before::before,
.dnd-drop-after::after {
  content: '';
  position: absolute;
  top: 6px; bottom: 6px;
  width: 3px;
  border-radius: 3px;
  background: #1a73e8;
  box-shadow: 0 0 10px rgba(26,115,232,0.85);
  z-index: 20;
  pointer-events: none;
}
.dnd-drop-before::before { left:  -3px; }
.dnd-drop-after::after   { right: -3px; }

/* Ghost — positioned via top/left (not transform) so it starts correctly */
#dnd-ghost {
  position: fixed;
  pointer-events: none;
  z-index: var(--layer-dnd-ghost, 10001);
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 88px;
  padding: 8px 4px 6px;
  background: rgba(60,64,67,0.75);
  border-radius: 14px;
  backdrop-filter: blur(8px);
  box-shadow: 0 12px 36px rgba(0,0,0,0.55);
  transform: scale(1.08) rotate(1deg);
  opacity: 0.95;
  will-change: top, left;
}
#dnd-ghost .sc-label {
  color: #fff;
  text-shadow: none;
  margin-top: 6px;
  font-size: 12px;
}
`;
document.head.appendChild(dragStyle);

const SVG_SEARCH  = `<svg class="ac-icon" viewBox="0 0 24 24" fill="none"><path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" stroke="#9aa0a6" stroke-width="2" stroke-linecap="round"/></svg>`;
const SVG_HISTORY = `<svg class="ac-icon" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#9aa0a6" stroke-width="2"/><path d="M12 7v5l3 3" stroke="#9aa0a6" stroke-width="2" stroke-linecap="round"/></svg>`;
const SVG_PREDICT = `<svg class="ac-icon" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#9aa0a6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const SVG_SITE    = `<svg class="ac-icon" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#9aa0a6" stroke-width="2"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" stroke="#9aa0a6" stroke-width="2" stroke-linecap="round"/></svg>`;

function escHtml(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function boldMatch(text, q) {
  if (!q) return escHtml(text);
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return escHtml(text);
  return escHtml(text.slice(0, idx))
       + '<b>' + escHtml(text.slice(idx, idx + q.length)) + '</b>'
       + escHtml(text.slice(idx + q.length));
}

function buildAcItem(entry, q) {
  const el = document.createElement('div');
  el.className = 'ac-item';

  // Icon — use favicon for real sites, otherwise SVG icon
  let iconEl;

  if (entry.url) {  // show favicon for any entry that has a URL
    const img = document.createElement('img');
    img.className = 'ac-favicon';
    img.alt = '';
      
    const sources = faviconUrl(entry.url);
    let index = 0;
      
    function loadNext() {
      if (!sources || index >= sources.length) {
        // All favicon sources failed — show site globe icon instead of empty space
        img.style.display = 'none';
        const fallbackIcon = createSVG(SVG_SITE);
        if (img.parentNode) img.parentNode.insertBefore(fallbackIcon, img);
        return;
      }
      img.src = sources[index++];
    }
    
    img.onload = () => {
      // Reject only truly broken/tiny images (real favicons can be 16x16)
      if (img.naturalWidth < 12 || img.naturalHeight < 12) {
        loadNext();
      }
    };
    
    img.onerror = loadNext;
    
    // 🔥 start
    loadNext();
    
    iconEl = img;
  
  } else if (entry.source === 'history') {
    iconEl = createSVG(SVG_HISTORY);
  } else if (entry.source === 'predict') {
    iconEl = createSVG(SVG_PREDICT);
  } else {
    iconEl = createSVG(SVG_SEARCH);
  }

  // Tag label
  const tagLabels = { history: 'history', predict: 'predict', pinned: 'pinned', topsites: 'visited', chrome: '' };
  const tagText   = tagLabels[entry.source] || '';

  el.appendChild(iconEl);

  const text = document.createElement('span');
  text.className = 'ac-text';
  text.innerHTML = boldMatch(entry.text, q);
  el.appendChild(text);

  
  if (entry.source === 'history') {
    const delBtn = document.createElement('button');
    delBtn.className = 'ac-del';
    delBtn.textContent = '✕';
    
    delBtn.addEventListener('mousedown', e => {
      e.preventDefault();
      e.stopPropagation();
      state.searchHistory = state.searchHistory.filter(h => h !== entry.text);
      saveState();
      renderDropdown(searchBar.value.trim());
    });
    
    el.appendChild(delBtn);
  }
  
  if (tagText) {
    const tag = document.createElement('span');
    tag.className = 'ac-tag';
    tag.textContent = tagText;
    el.appendChild(tag);
  }

  el.addEventListener('mousedown', e => {
    if (e.target.classList.contains('ac-del')) return;
    e.preventDefault();
    searchBar.value = entry.text;
    closeDropdown();
    // If it's a real site, navigate there directly; otherwise search
    if (entry.url) {
      // addToHistory(entry.text);
      window.location.href = normalizeUrl(entry.url);
    } else {
      navigateTo(entry.text);
    }
  });

  return el;
}

function renderDropdown(q) {
  acDropdown.innerHTML = '';
  acSuggestions = [];
  acEntries = [];
  acIndex = -1;

  const suggestions = getSuggestions(q, 8);
  if (suggestions.length === 0) { acDropdown.classList.remove('open'); return; }

  suggestions.forEach(entry => {
    acSuggestions.push(entry.text);
    acEntries.push(entry);
    acDropdown.appendChild(buildAcItem(entry, q));
  });

  // URL shortcut at bottom
  const isUrl = q && (/^(https?:\/\/|www\.)/i.test(q) || /\.\w{2,}(\/|$)/.test(q));
  if (isUrl && !acSuggestions.includes(q)) {
    const sep = document.createElement('div'); sep.className = 'ac-sep';
    acDropdown.appendChild(sep);
    const urlEntry = { text: q, url: q, source: 'url' };
    acSuggestions.push(q);
    acEntries.push(urlEntry);
    acDropdown.appendChild(buildAcItem(urlEntry, q));
  }

  bindAcPositionListeners();
  positionAcDropdown();
  acDropdown.classList.add('open');
}

function closeDropdown() { acDropdown.classList.remove('open'); acIndex = -1; }

function highlightItem(newIndex) {
  const items = acDropdown.querySelectorAll('.ac-item');
  items.forEach((el, i) => el.classList.toggle('selected', i === newIndex));
  acIndex = newIndex;
  if (newIndex >= 0 && acEntries[newIndex]) searchBar.value = acEntries[newIndex].text;
}

let _corpusBuilt = false;
searchBar.addEventListener('input', () => renderDropdown(searchBar.value.trim()));
searchBar.addEventListener('focus', () => {
  renderDropdown(searchBar.value.trim());
});
document.addEventListener('click', e => {
  if (!searchWrap.contains(e.target) && !acDropdown.contains(e.target)) closeDropdown();
});

searchBar.addEventListener('keydown', e => {
  const count = acDropdown.querySelectorAll('.ac-item').length;
  if (e.key === 'ArrowDown') { e.preventDefault(); highlightItem(acIndex < count-1 ? acIndex+1 : 0); return; }
  if (e.key === 'ArrowUp')   { e.preventDefault(); highlightItem(acIndex > 0 ? acIndex-1 : count-1); return; }
  if (e.key === 'Escape')    { closeDropdown(); return; }
  if (e.key === 'Enter') {
    const q = searchBar.value.trim();
    if (!q) return;
    closeDropdown();
    if (acIndex >= 0 && acEntries[acIndex]) {
      const entry = acEntries[acIndex];
      if (entry.url) {
        window.location.href = normalizeUrl(entry.url);
        return;
      }
      navigateTo(entry.text);
      return;
    }

    const exactMatch = acEntries.find(entry => entry.url && entry.text.toLowerCase() === q.toLowerCase());
    if (exactMatch) {
      window.location.href = normalizeUrl(exactMatch.url);
      return;
    }

    navigateTo(q);
  }
});

function navigateTo(q) {
  if (!q) return;

  addToHistory(q);

  // 🔥 Try detect real URL inside text
  const urlMatch = q.match(/https?:\/\/[^\s]+/);

  if (urlMatch) {
    window.location.href = urlMatch[0];
    return;
  }

  const isUrl =
    /^(https?:\/\/|www\.)/i.test(q) ||
    /\.\w{2,}(\/|$)/.test(q);

  window.location.href = isUrl
    ? (q.startsWith('http') ? q : 'https://' + q)
    : `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

// ═══════════════════════════════════════════════════════
//  MODAL
// ═══════════════════════════════════════════════════════
let _modalCb = null;
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle   = document.getElementById('modal-title');
const modalName    = document.getElementById('modal-name');
const modalUrl     = document.getElementById('modal-url');

function openModal({ title, name = '', url = '', onSave }) {
  modalTitle.textContent = title;
  modalName.value = name;
  modalUrl.value  = url;
  modalName.classList.remove('error');
  _modalCb = onSave;
  modalOverlay.classList.add('open');
  setTimeout(() => modalName.focus(), 60);
}
function closeModal() { modalOverlay.classList.remove('open'); }

document.getElementById('modal-cancel').onclick = closeModal;
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
document.getElementById('modal-save').onclick = () => {
  const n = modalName.value.trim();
  const uRaw = modalUrl.value.trim();
  const u = uRaw ? normalizeUrl(uRaw) : '';
  if (!n) { modalName.classList.add('error'); return; }
  closeModal();
  _modalCb && _modalCb({ name: n, url: u });
};
[modalName, modalUrl].forEach(el => el.addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('modal-save').click();
  if (e.key === 'Escape') closeModal();
}));

// ═══════════════════════════════════════════════════════
//  THREE-DOT MENU
// ═══════════════════════════════════════════════════════
let _openDropdown = null;

function closeAllDropdowns() {
  if (_openDropdown) { _openDropdown.classList.remove('open'); _openDropdown = null; }
}
document.addEventListener('click', closeAllDropdowns);

function makeThreeDot() {
  const btn = document.createElement('button');
  btn.className = 'sc-menu-btn';
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 4 16" fill="#e8eaed">
    <circle cx="2" cy="2" r="1.5"/><circle cx="2" cy="8" r="1.5"/><circle cx="2" cy="14" r="1.5"/>
  </svg>`;
  return btn;
}

function makeDropdown(items) {
  const dd = document.createElement('div');
  dd.className = 'sc-dropdown';
  items.forEach(({ icon, label, onClick }) => {
    const btn = document.createElement('button');
    btn.className = 'sc-dd-item';
    btn.innerHTML = `${icon}<span>${label}</span>`;
    btn.addEventListener('click', e => {
      e.preventDefault();   // 🔥 IMPORTANT
      e.stopPropagation();
      closeAllDropdowns();
      onClick();
    });
    dd.appendChild(btn);
  });
  return dd;
}


// ═══════════════════════════════════════════════════════
//  DRAG-AND-DROP ENGINE  (pointer-event based)
//
//  Each row reorders independently:
//    • Top row  → only reorders within top 10
//    • Extra row → only reorders within bottom 10
//
//  Click detection:
//    • pointerdown records position
//    • dndStart receives an onDragActivated callback
//    • When pointer moves > 6px, onDragActivated() is called
//      so the tile knows "this became a drag, don't navigate"
//    • pointerup in buildTile checks _wasDrag before navigating
//    • Result: clicks always work, drags always work, no race
// ═══════════════════════════════════════════════════════

const DND_THRESH = 8;   // px movement to activate drag

const DND = {
  active:    false,   // drag is currently happening
  srcIdx:    null,    // original index in allShortcuts
  srcTile:   null,    // DOM node
  ghost:     null,    // floating clone
  ox: 0, oy: 0,       // pointer offset inside tile
  onActivated: null,  // callback → tells tile "this is a drag"
};

function dndArr() {
  // For unified grid, just return all shortcuts
  return state.allShortcuts;
}

function dndTiles() {
  // All tiles from the unified grid container
  const grid = document.getElementById('shortcuts-grid');
  if (!grid) return [];
  return [...grid.querySelectorAll('.sc-tile:not(.sc-add-tile)')];
}

function dndClearMarks() {
  document.querySelectorAll('.dnd-source,.dnd-drop-before,.dnd-drop-after')
    .forEach(el => el.classList.remove('dnd-source','dnd-drop-before','dnd-drop-after'));
}

function dndMoveGhost(cx, cy) {
  // Position ghost so the pointer stays at the same offset as where user grabbed
  if (!DND.ghost) return;
  DND.ghost.style.left = (cx - DND.ox) + 'px';
  DND.ghost.style.top  = (cy - DND.oy) + 'px';
}

// Detect Y coordinate is over the grid
function isOverGrid(cy) {
  const grid = document.getElementById('shortcuts-grid');
  if (!grid) return false;
  const rect = grid.getBoundingClientRect();
  return cy >= rect.top - 40 && cy <= rect.bottom + 40;
}


// Find insert position in unified grid
function dndHitTest(cx, cy) {
  // Only work if pointer is over the grid
  if (!isOverGrid(cy)) return { beforeIdx: 0 };
  
  const tiles = dndTiles();
  if (!tiles.length) return { beforeIdx: 0 };

  // Find the tile on the same horizontal line as the cursor
  let best = null, bestDist = Infinity;
  for (const t of tiles) {
    const r = t.getBoundingClientRect();
    if (cy < r.top - 20 || cy > r.bottom + 20) continue;
    const dist = Math.abs(cx - (r.left + r.width / 2));
    if (dist < bestDist) { bestDist = dist; best = t; }
  }

  if (!best) {
    // Below/above all tiles — append at end
    return { beforeIdx: dndArr().length };
  }

  const r    = best.getBoundingClientRect();
  const midX = r.left + r.width / 2;
  const tIdx = parseInt(best.dataset.globalIdx, 10);
  const side = cx < midX ? 'before' : 'after';
  return { beforeIdx: side === 'before' ? tIdx : tIdx + 1, tile: best, side };
}

// Detect which row (if any) contains the given Y coordinate
function getRowFromY(cy) {
  const grid = document.getElementById('shortcuts-grid');
  if (!grid) return null;
  const rect = grid.getBoundingClientRect();
  if (cy >= rect.top - 30 && cy <= rect.bottom + 30) return 'grid';
  return null;
}


// Called from buildTile's pointerdown
function dndStart(e, tile, globalIdx, onActivated) {
  const startX = e.clientX, startY = e.clientY;
  DND.srcIdx = globalIdx;
  DND.srcTile = tile;
  DND.active = false;
  DND.onActivated = onActivated;

  const rect = tile.getBoundingClientRect();
  // 👉 anchor near top-right corner
  DND.ox = rect.width * 0.05;
  DND.oy = rect.height * 0.03;
  
  function onMove(ev) {
    const cx    = ev.clientX;
    const cy    = ev.clientY;
    const moved = Math.hypot(cx - startX, cy - startY);

    if (!DND.active) {
      if (moved < DND_THRESH) return;

      // ── Activate drag ──
      DND.active = true;
      if (DND.onActivated) DND.onActivated();  // tells tile: this is a drag

      tile.classList.add('dnd-source');

      // Build ghost — CSS class handles all styling
      const g = document.createElement('div');
      g.id = 'dnd-ghost';
      // Position immediately at pointer so there's no jump on first frame
      g.style.left = (startX - DND.ox) + 'px';
      g.style.top  = (startY - DND.oy) + 'px';
      const circle = tile.querySelector('.sc-circle');
      const lbl    = tile.querySelector('.sc-label');
      if (circle) g.appendChild(circle.cloneNode(true));
      if (lbl)    g.appendChild(lbl.cloneNode(true));
      document.body.appendChild(g);
      DND.ghost = g;

      g.style.transition = 'transform 0.12s ease';
    }

    dndMoveGhost(ev.clientX, ev.clientY);
    dndClearMarks();
    tile.classList.add('dnd-source');   // keep source faded

    const hit = dndHitTest(ev.clientX, ev.clientY);
    if (hit.tile && hit.tile !== tile) {
      hit.tile.classList.add(hit.side === 'before' ? 'dnd-drop-before' : 'dnd-drop-after');
    }
  }

  function onUp(ev) {
    tile.removeEventListener('pointermove', onMove);
    tile.removeEventListener('pointerup',   onUp);
    tile.removeEventListener('pointercancel', onCancel);

    dndClearMarks();

    if (DND.ghost) { DND.ghost.remove(); DND.ghost = null; }

    if (!DND.active) {
      // Tap — no drag happened
      DND.active = false; DND.srcTile = null;
      return;
    }

    // Fix #17: cancel drop when released outside the grid (avoids silent reorder to idx 0)
    if (!isOverGrid(ev.clientY)) {
      DND.active = false; DND.srcTile = null;
      renderShortcuts(); // restore visual state
      return;
    }

    // ── Commit reorder ──
    const hit = dndHitTest(ev.clientX, ev.clientY);
    const toGlobalIdx = hit.beforeIdx;

    // Extract item from global array
    const all = [...state.allShortcuts];
    const [item] = all.splice(DND.srcIdx, 1);

    // Adjust target index if moving forward in same array
    let adjustedToGlobalIdx = toGlobalIdx;
    if (toGlobalIdx > DND.srcIdx) {
      adjustedToGlobalIdx--;
    }

    // Insert into new position
    adjustedToGlobalIdx = Math.max(0, Math.min(adjustedToGlobalIdx, all.length));
    all.splice(adjustedToGlobalIdx, 0, item);

    // Keep only max 20 items
    state.allShortcuts = all.slice(0, 20);

    saveState();

    // Re-render unified grid
    renderShortcuts();

    DND.active = false; DND.srcTile = null;
  }

  function onCancel() {
    tile.removeEventListener('pointermove', onMove);
    tile.removeEventListener('pointerup',   onUp);
    tile.removeEventListener('pointercancel', onCancel);
    dndClearMarks();
    if (DND.ghost) { DND.ghost.remove(); DND.ghost = null; }
    DND.active = false; DND.srcTile = null;
    renderShortcuts();
  }

  tile.setPointerCapture(e.pointerId);
  tile.addEventListener('pointermove',   onMove);
  tile.addEventListener('pointerup',     onUp);
  tile.addEventListener('pointercancel', onCancel);
}

// ═══════════════════════════════════════════════════════
//  TILE BUILDER
// ═══════════════════════════════════════════════════════
function buildTile({ sc, menuItems, globalIdx }) {
  const tile = document.createElement('div');
  tile.className = 'sc-tile';
  tile.dataset.globalIdx = globalIdx;

  const iconLink = document.createElement('a');
  iconLink.className = 'sc-icon-link';
  iconLink.draggable = false;
  iconLink.href = sc.url ? normalizeUrl(sc.url) : '';
  iconLink.target = '_self';
  iconLink.addEventListener('dragstart', e => e.preventDefault());

  // ── Navigation via pointerup (not click) so drag never interferes ──
  let _downX = 0, _downY = 0, _wasDrag = false;

  tile.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    if (e.target.closest('.sc-menu-btn,.sc-dropdown')) return;
    _downX = e.clientX; _downY = e.clientY; _wasDrag = false;
    dndStart(e, tile, globalIdx, () => { _wasDrag = true; });
  });

  // Navigate on pointerup only if it wasn't a drag
  tile.addEventListener('pointerup', e => {
    if (_wasDrag) return;
    const moved = Math.hypot(e.clientX - _downX, e.clientY - _downY);
    if (moved < 6 && sc.url) window.location.href = normalizeUrl(sc.url);
  });

  const circle = document.createElement('div');
  circle.className = 'sc-circle';

  if (sc.url) {
  const img = document.createElement('img');
  img.alt = sc.name;

  img.draggable = false;
  img.addEventListener('dragstart', e => e.preventDefault());
  img.style.pointerEvents = 'none';

  const sources = faviconUrl(sc.url);
  let index = 0;

  function showFallback() {
    img.remove();
    circle.style.background = colorFor(sc.name);

    const span = document.createElement('span');
    span.className = 'sc-initial';
    span.textContent = sc.name.charAt(0).toUpperCase();
    circle.appendChild(span);
  }

  function loadNext() {
    if (!sources || index >= sources.length) {
      showFallback();
      return;
    }
    img.src = sources[index++];
  }

  img.onerror = loadNext;

  img.onload = () => {
    // BUG FIX: Normalize threshold to <12 (matches autocomplete favicon check)
    if (img.naturalWidth < 12) loadNext();
  };

  loadNext(); // 🔥 start loading

  circle.appendChild(img);
}

  const dot = makeThreeDot();
  const dd  = makeDropdown(menuItems);

  dot.addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    if (_openDropdown && _openDropdown !== dd) closeAllDropdowns();
    dd.classList.toggle('open');
    _openDropdown = dd.classList.contains('open') ? dd : null;
  });

  iconLink.appendChild(circle);

  tile.appendChild(dot);       // menu outside link
  tile.appendChild(dd);        // dropdown outside link

  const label = document.createElement('span');
  label.className = 'sc-label';
  label.textContent = sc.name;

  tile.appendChild(iconLink);
  tile.appendChild(label);
  return tile;
}

// ═══════════════════════════════════════════════════════
//  UNIFIED SHORTCUTS GRID
// ═══════════════════════════════════════════════════════
function renderShortcuts() {
  const grid = document.getElementById('shortcuts-grid');
  grid.innerHTML = '';
  
  if (!state.showShortcuts) { 
    grid.style.display = 'none'; 
    return; 
  }
  grid.style.display = '';

  // Render all shortcuts from state.allShortcuts
  state.allShortcuts.forEach((sc, globalIdx) => {
    const tile = buildTile({
      sc, 
      globalIdx,
      menuItems: [
        {
          icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#e8eaed" stroke-width="2" stroke-linecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#e8eaed" stroke-width="2" stroke-linecap="round"/></svg>`,
          label: 'Edit shortcut',
          onClick: () => openModal({
            title: 'Edit Shortcut', 
            name: sc.name, 
            url: sc.url,
            onSave: ({ name, url }) => { 
              state.allShortcuts[globalIdx] = { name, url }; 
              saveState(); 
              renderShortcuts(); 
            }
          })
        },
        {
          icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke="#ea4335" stroke-width="2" stroke-linecap="round"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="#ea4335" stroke-width="2" stroke-linecap="round"/><path d="M10 11v6M14 11v6" stroke="#ea4335" stroke-width="2" stroke-linecap="round"/></svg>`,
          label: 'Remove',
          onClick: () => { 
            state.allShortcuts.splice(globalIdx, 1); 
            saveState(); 
            renderShortcuts(); 
          }
        }
      ]
    });
    tile.style.setProperty('--tile-index', globalIdx);
    grid.appendChild(tile);
  });

  // Show add button only if less than 20 total items
  if (state.allShortcuts.length < 20) {
    const add = document.createElement('div');
    add.className = 'sc-tile sc-add-tile';
    const addCircle = document.createElement('div');
    addCircle.className = 'sc-circle sc-add-circle';
    const plus = document.createElement('span');
    plus.className = 'sc-plus';
    plus.textContent = '+';
    addCircle.appendChild(plus);
    const addLabel = document.createElement('span');
    addLabel.className = 'sc-label';
    addLabel.textContent = 'Add shortcut';
    add.appendChild(addCircle);
    add.appendChild(addLabel);
    add.style.setProperty('--tile-index', state.allShortcuts.length);
    add.onclick = () => openModal({
      title: 'Add Shortcut',
      onSave: ({ name, url }) => { 
        state.allShortcuts.push({ name, url });
        if (state.allShortcuts.length > 20) state.allShortcuts = state.allShortcuts.slice(0, 20);
        saveState(); 
        renderShortcuts(); 
      }
    });
    grid.appendChild(add);
  }
}

// ═══════════════════════════════════════════════════════
//  CUSTOMIZE PANEL
// ═══════════════════════════════════════════════════════
const custPanel = document.getElementById('cust-panel');
const custBtn = document.getElementById('cust-btn');
// BUG FIX: Was calling getElementById('cust-btn') again — use existing custBtn variable
custBtn.onclick = () => {
  custPanel.classList.add('open');
  custBtn.style.display = 'none';
  showCpView('main'); // panel always opens on the main view
  // Build swatches/thumbnails after the slide starts so first open stays smooth
  requestAnimationFrame(() => {
    initCustomPanelContent();
    syncCustomPanelActive();
  });
};
document.getElementById('cp-close').onclick = () => {
  custPanel.classList.remove('open');
  custBtn.style.display = 'flex';
};

// ── Customize panel views: main ↔ settings sub-view ──
// Toggle rows keep their IDs/handlers — only their container moves.
function showCpView(name) {
  const main = document.getElementById('cp-main-view');
  const settings = document.getElementById('cp-settings-view');
  if (main) main.style.display = name === 'settings' ? 'none' : '';
  if (settings) settings.style.display = name === 'settings' ? '' : 'none';
}
document.getElementById('cp-open-settings').onclick = () => showCpView('settings');
document.getElementById('cp-settings-back').onclick = () => showCpView('main');
// ✕ on the Settings header: back to the main panel (NOT the sidebar close)
document.getElementById('cp-settings-x').onclick = () => showCpView('main');

document.addEventListener('click', (event) => {

  // Fix #13: Check if click is OUTSIDE the panel and not on the open button,
  // but also NOT inside any overlay that may be open on top (editor, modals).
  // Without these guards, clicking "Apply" in the wallpaper editor (which is
  // outside custPanel) would close the panel mid-operation.
  const wpEditorOverlay   = document.getElementById('wp-editor-overlay');
  const tgmModalOverlay   = document.getElementById('tgm-modal-overlay');
  const shortcutModalOverlay = document.getElementById('modal-overlay');

  const isInsideOverlay =
    (wpEditorOverlay   && wpEditorOverlay.classList.contains('open')   && wpEditorOverlay.contains(event.target)) ||
    (tgmModalOverlay   && tgmModalOverlay.classList.contains('open')   && tgmModalOverlay.contains(event.target)) ||
    (shortcutModalOverlay && shortcutModalOverlay.classList.contains('open') && shortcutModalOverlay.contains(event.target));

  if (
    !custPanel.contains(event.target) &&
    !custBtn.contains(event.target) &&
    !isInsideOverlay
  ) {

    // Close panel
    custPanel.classList.remove('open');

    // Show button again
    custBtn.style.display = 'flex';
  }
});

function syncToggles() {
  document.getElementById('toggle-shortcuts').className = 'toggle' + (state.showShortcuts ? ' on' : '');
}
document.getElementById('toggle-shortcuts').onclick = function() {
  state.showShortcuts = !state.showShortcuts;
  saveState(); 
  syncToggles(); 
  renderShortcuts();
};

const colorsEl = document.getElementById('cp-colors');
// ── Lazy panel content: swatches + 9 remote thumbnails are built on FIRST
// panel open (rAF after the slide starts), not at page load. This keeps the
// new-tab first paint lean and the opening slide jank-free.
let _cpContentBuilt = false;
function initCustomPanelContent() {
  if (_cpContentBuilt) return;
  _cpContentBuilt = true;
BG_COLORS.forEach(({ label, value }) => {
  const sw = document.createElement('div');
  sw.className = 'cp-swatch' + (state.bgColor === value && !state.wallpaper ? ' active' : '');
  sw.style.background = value; sw.title = label;
  // Fix #20: style.background serialises to rgb() in Chrome, never equals hex.
  // Store the canonical value in a data attribute for reliable comparison.
  sw.dataset.colorValue = value;
  sw.onclick = () => {
    state.bgColor = value; state.wallpaper = '';
    // Increment wallpaper gen to cancel any in-flight async wallpaper loads
    _wallpaperGen++;
    saveState(); applyBg();
  
    colorsEl.querySelectorAll('.cp-swatch').forEach(s => s.classList.remove('active'));
    sw.classList.add('active');
    document.querySelectorAll('.cp-wp').forEach(w => w.classList.remove('active'));
  };
  colorsEl.appendChild(sw);
});

const wpGrid = document.getElementById('cp-wallpapers');
WALLPAPERS.forEach(({ label, url, thumb }) => {
  const tile = document.createElement('div');
  tile.className = 'cp-wp' + (state.wallpaper === url ? ' active' : '');
  const img = document.createElement('img');
  // Grid preview only — tile clicks still set the full-res `url` as wallpaper
  img.src = thumb || url; img.alt = label; img.loading = 'lazy'; img.decoding = 'async';
  const lbl = document.createElement('div');
  lbl.className = 'cp-wp-label'; lbl.textContent = label;
  tile.appendChild(img); tile.appendChild(lbl);
  tile.onclick = async () => {
    if (tile.classList.contains('cp-wp-loading')) return; // already working
    tile.classList.add('cp-wp-loading');
    try {
      // Clear any upload blob URL so the remote URL paints correctly
      if (_uploadBlobUrl) { URL.revokeObjectURL(_uploadBlobUrl); _uploadBlobUrl = null; }

      state.wallpaper = url;
      state.bgColor = '#000000';
      saveState();

      // Fast check: is this image already cached in IndexedDB?
      const cached = await _cacheGet(url);
      if (cached && cached.blob) {
        _uploadBlobUrl = URL.createObjectURL(cached.blob);
        await _predecode(_uploadBlobUrl);
        _paintBgSharp(_uploadBlobUrl);
        _saveThumbForUpload(cached.blob); // refresh instant placeholder for next load
      } else {
        // Wait until the remote image actually decodes so the spinner
        // covers the whole fetch — then blur-up swap + cache in background.
        await _preloadRemoteUrl(url);
        const thumb = await _makeThumbFromUrl(url);
        if (thumb) { _paintBgThumb(thumb); _persistThumbDataUrl(thumb); }
        _paintBgSharp(url);
        _cacheRemoteWallpaper(url);
      }
    } finally {
      tile.classList.remove('cp-wp-loading');
    }

    document.querySelectorAll('.cp-wp').forEach(w => w.classList.remove('active'));
    tile.classList.add('active');
    colorsEl.querySelectorAll('.cp-swatch').forEach(s => s.classList.remove('active'));
  };
  wpGrid.appendChild(tile);
});
} // ── end initCustomPanelContent ──

// Refresh active marks from current state on every panel open (content built once)
function syncCustomPanelActive() {
  document.querySelectorAll('#cp-colors .cp-swatch').forEach(s => {
    // Fix #20: use data-color-value attribute — style.background serialises to rgb()
    // in Chrome and would never match the hex stored in state.bgColor.
    const cv = s.dataset.colorValue || s.style.background;
    s.classList.toggle('active', !state.wallpaper && cv === state.bgColor);
  });
  document.querySelectorAll('.cp-wp').forEach(w => w.classList.remove('active'));
  if (state.wallpaper && state.wallpaper !== '__gif__' && state.wallpaper !== '__upload__') {
    const tiles = document.querySelectorAll('#cp-wallpapers .cp-wp');
    WALLPAPERS.forEach(({ url }, i) => {
      if (url === state.wallpaper && tiles[i]) tiles[i].classList.add('active');
    });
  }
}

document.getElementById('cp-upload-btn').onclick = () => document.getElementById('cp-file-input').click();
document.getElementById('cp-file-input').onchange = function() {
  const file = this.files[0]; if (!file) return;
  this.value = ''; // reset so same file can be re-selected
  openWallpaperEditor(file);
};

document.getElementById('cp-clear-wp').onclick = () => {
  // Revoke active blob URL if any
  if (_activeBlobUrl) {
    URL.revokeObjectURL(_activeBlobUrl);
    _activeBlobUrl = null;
  }
  // Reset bg element now (before applyBg, in case it still holds the blob URL)
  const bg = document.getElementById('bg');
  bg.style.backgroundImage = 'none';
  bg.style.filter = 'none';
  // Delete GIF from IndexedDB
  _idbDeleteGif().catch(() => {});
  _cacheDelete('custom_upload').catch(() => {});
  chrome.storage.local.remove('ntp_wp_thumb');
  try { localStorage.removeItem('ntp_wp_thumb'); } catch (_) {}
  state.wallpaper = '';
  saveState();
  applyBg();
  document.querySelectorAll('.cp-wp').forEach(w => w.classList.remove('active'));
  document.querySelectorAll('#cp-colors .cp-swatch').forEach(s => {
    // Same as syncCustomPanelActive: style.background serialises to rgb(),
    // so compare the canonical value stored at creation time.
    const cv = s.dataset.colorValue || s.style.background;
    s.classList.toggle('active', cv === state.bgColor);
  });
};

// ── Brightness slider ──
const brightnessSlider = document.getElementById('cp-brightness');
const brightnessVal    = document.getElementById('cp-brightness-val');

function syncBrightnessUI() {
  if (!brightnessSlider || !brightnessVal) return; // Fix #9: null guard
  // Fix #10: clamp stored value to the slider's valid range to prevent invalid CSS
  const v = Math.max(-10, Math.min(10, typeof state.wpBrightness === 'number' ? state.wpBrightness : 0));
  state.wpBrightness = v; // normalise on read
  brightnessSlider.value = v;
  brightnessVal.textContent = (v > 0 ? '+' : '') + v;
  const pct = ((v + 10) / 20) * 100;
  brightnessSlider.style.background = `linear-gradient(to right, #1a73e8 0%, #1a73e8 ${pct}%, rgba(255,255,255,0.15) ${pct}%, rgba(255,255,255,0.15) 100%)`;
}

if (brightnessSlider) {
  brightnessSlider.addEventListener('input', () => {
    // Fix #10: clamp to [-10,10] so bv = 1 + v*0.08 stays in [0.2, 1.8] (always positive)
    state.wpBrightness = Math.max(-10, Math.min(10, parseInt(brightnessSlider.value, 10)));
    if (brightnessVal) brightnessVal.textContent = (state.wpBrightness > 0 ? '+' : '') + state.wpBrightness;
    // Update track fill so left of thumb = blue
    const pct = ((state.wpBrightness + 10) / 20) * 100;
    brightnessSlider.style.background = `linear-gradient(to right, #1a73e8 0%, #1a73e8 ${pct}%, rgba(255,255,255,0.15) ${pct}%, rgba(255,255,255,0.15) 100%)`;
    applyBg();
  });
  brightnessSlider.addEventListener('change', () => { saveState(); });
}

// ═══════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════
loadState(async () => {
  // Color/meta refresh only — image paint belongs to the blur-up chains below.
  // (Full applyBg here would pop the remote URL in early = start flicker.)
  applyBg(true);
  syncToggles();
  syncBrightnessUI();
  renderShortcuts();

  // ── Reveal UI immediately — wallpaper swaps in underneath when ready ──
  // Blocking body.loaded on image decode was the main perceived delay.
  document.body.classList.add('loaded');
  _perfMark('loaded-ui');

  // Remote preset URLs: serve from IndexedDB blob cache if present (no network),
  // else preload via browser image cache, then cache in background for next time.
  const isBlob   = state.wallpaper === '__gif__' || state.wallpaper === '__upload__';
  const isRemote = !isBlob && state.wallpaper && !state.wallpaper.startsWith('data:');

  if (isRemote) {
    try {
      const cached = await _cacheGet(state.wallpaper);
      if (cached && cached.blob) {
        if (_uploadBlobUrl) { URL.revokeObjectURL(_uploadBlobUrl); _uploadBlobUrl = null; }
        _uploadBlobUrl = URL.createObjectURL(cached.blob);
        await _predecode(_uploadBlobUrl);
        _paintBgSharp(_uploadBlobUrl);
      } else {
        await preloadWallpaper();
        // Blur-up like local wallpapers: blurred-dim placeholder, then sharp swap
        const thumb = await _makeThumbFromUrl(state.wallpaper);
        if (thumb) _paintBgThumb(thumb);
        _paintBgSharp(state.wallpaper);
        _cacheRemoteWallpaper(state.wallpaper);
      }
    } catch (_) {
      await preloadWallpaper().catch(() => {});
      applyBg();
    }
  } else if (!isBlob && state.wallpaper) {
    await preloadWallpaper().catch(() => {});
    _paintBgSharp(state.wallpaper);
  }
  // Blob paths (__gif__ / __upload__) are already painted by their own routines.

  if (document.activeElement === searchBar) {
    renderDropdown(searchBar.value.trim());
  }

  // ── Deferred heavy init: runs AFTER first paint, off the critical path ──
  // buildCorpus hits chrome.topSites + chrome.history; renderGroupBar queries
  // live tabs. Neither is needed for the wallpaper / shortcuts first paint.
  const _runIdle = fn => {
    try {
      if (typeof requestIdleCallback !== 'undefined') {
        requestIdleCallback(() => { try { fn(); } catch (_) {} }, { timeout: 800 });
      } else {
        setTimeout(() => { try { fn(); } catch (_) {} }, 50);
      }
    } catch (_) { setTimeout(() => { try { fn(); } catch (_) {} }, 50); }
  };
  _runIdle(() => {
    if (!_corpusBuilt) { _corpusBuilt = true; buildCorpus(); }
  });
  _runIdle(() => { renderGroupBar(); }); // ═══ TAB GROUP MANAGER init ═══
});

// ═══════════════════════════════════════════════════════
//  PREMIUM WALLPAPER EDITOR
//  — Instagram / WhatsApp / Google Photos style
//  — Supports static images AND animated GIFs
//  — Does NOT touch any existing logic above
// ═══════════════════════════════════════════════════════

(function WallpaperEditor() {

  // ── DOM refs ──
  const overlay   = document.getElementById('wp-editor-overlay');
  const imgEl     = document.getElementById('wp-editor-img');
  const canvas    = document.getElementById('wp-editor-canvas');
  const viewport  = document.getElementById('wp-editor-viewport-wrap');
  const zoomSlider= document.getElementById('wp-zoom');
  const zoomVal   = document.getElementById('wpe-zoom-val');
  const gifBadge  = document.getElementById('wpe-gif-badge');
  const btnClose  = document.getElementById('wp-editor-close');
  const btnCancel = document.getElementById('wpe-cancel');
  const btnApply  = document.getElementById('wpe-apply');
  const btnReset  = document.getElementById('wpe-reset');

  // ── Editor state ──
  let _srcDataUrl = '';   // original file data URL (for canvas preview)
  let _srcFile    = null; // original File/Blob — kept for lossless export
  let _hasUserEdited = false; // true only if user dragged, zoomed, or reset
  let _isGif      = false;
  let _gifFrames  = [];   // { imageData, delay } for GIF playback
  let _gifTimer   = null;
  let _gifFrame   = 0;

  // Natural image dimensions
  let _natW = 0, _natH = 0;

  // Viewport dimensions (set on open)
  let _vpW = 0, _vpH = 0;

  // Transform: offset (px in viewport coords) and scale
  let _tx = 0, _ty = 0, _scale = 1;
  let _minScale = 1;

  // Drag state
  let _drag = false;
  let _dx0 = 0, _dy0 = 0, _tx0 = 0, _ty0 = 0;
  // Fix #18a: cap rAF retries inside _initTransform so viewport-stuck edge cases don't loop forever
  let _initTransformRetries = 0;

  // ── Open editor with a File or URL ──
  let _srcBlobUrl = null;
  let _editorGen = 0; // guards async preview/full loads against reopen/close races

  window.openWallpaperEditor = async function(fileOrUrl) {
    let file = fileOrUrl;

    if (typeof file === 'string') {
      try {
        _showToast('Loading image…');
        const res = await fetch(file);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        file = new File([blob], 'wallpaper.jpg', { type: blob.type || 'image/jpeg' });
      } catch (err) {
        _showToast('❌ Could not load image: ' + err.message);
        return;
      }
    }

    if (!file || !(file instanceof Blob)) {
      _showToast('⚠️ Please select a valid image file.');
      return;
    }

    _isGif = file.type === 'image/gif';

    // Size validation: the 25MB cap applies to static images only.
    // GIFs are exempt (no max) — only the empty/corrupted guard applies.
    if (!_isGif && file.size > MAX_WALLPAPER_BYTES) {
      _showToast(`⚠️ Image is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max limit is 25MB.`);
      return;
    }
    if (file.size < MIN_WALLPAPER_BYTES) {
      _showToast('⚠️ Image file is empty or corrupted.');
      return;
    }

    if (_isGif) {
      // For GIFs: skip crop editor entirely, save ArrayBuffer to 
      // IndexedDB, apply via blob URL
      _showToast('Saving GIF wallpaper…');

      // Read as ArrayBuffer for IndexedDB storage (no size bloat)
      const arrReader = new FileReader();
      // Fix #16a: capture generation so a re-open/close while reading doesn't apply stale data
      const _gifSaveGen = _editorGen;
      arrReader.onload = async e => {
        // Fix #16a: generation guard — user may have closed editor or chosen another file
        if (_gifSaveGen !== _editorGen) return;
        const arrayBuffer = e.target.result;
        try {
          await _idbSaveGif(arrayBuffer);
          state.wallpaper = '__gif__';
          saveState();
          _saveThumbForUpload(new Blob([arrayBuffer], { type: 'image/gif' }));
          await _applyGifFromIDB({ isSwitch: true });
          _showToast('✅ GIF wallpaper set!');
        } catch (err) {
          console.error('[NTP] GIF save failed:', err);
          _showToast('❌ Failed to save GIF: ' + (err.message || 'database error'));
        }
      };
      // Fix #16b: onerror — missing previously; a failed read was silently swallowed
      arrReader.onerror = () => {
        console.error('[NTP] GIF FileReader error');
        _showToast('❌ Failed to read GIF file. Please try again.');
      };
      arrReader.readAsArrayBuffer(file);
      return; // skip editor entirely
    }

    // Static image (jpg/png/webp): open crop editor instantly
    // Keep reference to original File for lossless pass-through
    _srcFile = file;
    _hasUserEdited = false;

    // ⚡ Fast open: URL.createObjectURL is 0ms (no slow Base64 FileReader conversion)
    if (_srcBlobUrl) {
      URL.revokeObjectURL(_srcBlobUrl);
      _srcBlobUrl = null;
    }
    _srcBlobUrl = URL.createObjectURL(file);
    _srcDataUrl = _srcBlobUrl;
    _editorGen++;
    _setupEditor();
  };

  // Progressive viewport load: tiny resized decode paints blurred instantly
  // (even 25MB files preview in ~100-300ms), full-res swaps in on decode for
  // exact transform math. Display-only — export still uses the original file.
  function _loadEditorImage(gen) {
    const blobUrl = _srcBlobUrl;
    let fullApplied = false;

    const applyFull = () => {
      if (gen !== _editorGen || blobUrl !== _srcBlobUrl || fullApplied) return;
      fullApplied = true;
      imgEl.onload = () => {
        if (gen !== _editorGen) return;
        _natW = imgEl.naturalWidth;
        _natH = imgEl.naturalHeight;
        imgEl.style.width = ''; imgEl.style.height = '';
        imgEl.style.objectFit = ''; imgEl.style.filter = ''; imgEl.style.transform = '';
        _initTransform();
      };
      imgEl.onerror = () => {
        if (gen !== _editorGen) return;
        _natW = imgEl.naturalWidth || 0;
        _natH = imgEl.naturalHeight || 0;
        imgEl.style.width = ''; imgEl.style.height = '';
        imgEl.style.objectFit = ''; imgEl.style.filter = ''; imgEl.style.transform = '';
        if (_natW && _natH) _initTransform();
      };
      imgEl.src = blobUrl;
    };

    // Cover-style preview: aspect distortion is invisible under blur + cover
    try {
      createImageBitmap(_srcFile, { resizeWidth: 480, resizeHeight: 270, resizeQuality: 'low' }).then(bmp => {
        if (gen !== _editorGen || fullApplied) { if (bmp.close) bmp.close(); return; }
        const c = document.createElement('canvas');
        c.width = 480; c.height = 270;
        c.getContext('2d').drawImage(bmp, 0, 0, 480, 270);
        if (bmp.close) bmp.close();
        c.toBlob(b => {
          if (!b || gen !== _editorGen || fullApplied) { applyFull(); return; }
          const fr = new FileReader();
          fr.onload = () => {
            if (gen !== _editorGen || fullApplied || !fr.result) { applyFull(); return; }
            // Fix #15: do NOT null imgEl.onload here — applyFull() sets its own onload
            // below. Nulling it would silence the full-res onload that sets _natW/_natH.
            imgEl.onerror = () => applyFull();
            imgEl.src = fr.result;
            applyFull(); // start full decode in parallel; swaps on arrival
          };
          fr.onerror = () => applyFull();
          fr.readAsDataURL(b);
        }, 'image/jpeg', 0.6);
      }).catch(() => applyFull());
    } catch (_) { applyFull(); }
  }

  function _setupEditor() {
    gifBadge.classList.toggle('visible', _isGif);

    // Static-image only: GIFs return early from openWallpaperEditor and never
    // reach here, so the old _isGif/_loadGif branch was unreachable dead code.
    canvas.style.display = 'none';
    imgEl.style.display = 'block';
    // Preview styling: fill viewport blurred until full-res arrives
    imgEl.style.width = '100%';
    imgEl.style.height = '100%';
    imgEl.style.objectFit = 'cover';
    imgEl.style.filter = 'blur(12px)';
    imgEl.style.transform = 'scale(1.05)';
    _loadEditorImage(_editorGen);

    overlay.classList.add('open');
  }

  function _getSafeZoneBounds() {
    const sz = document.getElementById('wpe-safe-zone');
    if (sz && sz.offsetHeight > 0) {
      return {
        top: sz.offsetTop,
        bottom: sz.offsetTop + sz.offsetHeight,
        height: sz.offsetHeight,
        left: sz.offsetLeft,
        right: sz.offsetLeft + sz.offsetWidth,
        width: sz.offsetWidth
      };
    }
    const top = _vpH * 0.075;
    const height = _vpH * 0.84;
    return {
      top: top,
      bottom: top + height,
      height: height,
      left: 0,
      right: _vpW,
      width: _vpW
    };
  }

  function _initTransform() {
    _initTransformRetries = 0; // reset at top — counts retries within this invocation
    _initTransformInner();
  }
  function _initTransformInner() {
    _vpW = viewport.clientWidth || viewport.getBoundingClientRect().width;
    _vpH = viewport.clientHeight || viewport.getBoundingClientRect().height;

    // Fix #18a: cap rAF retries to avoid infinite loop when overlay stays 0×0
    if ((_vpW === 0 || _vpH === 0) && overlay.classList.contains('open')) {
      if (++_initTransformRetries <= 20) {
        requestAnimationFrame(() => _initTransformInner());
      } // else: give up — no valid viewport after ~333ms
      return;
    }

    const sz = _getSafeZoneBounds();

    // Scale so the image fully covers the crop area (safe zone)
    const scaleX = _vpW / _natW;
    const scaleCropY = sz.height / _natH;
    _minScale = Math.max(scaleX, scaleCropY);

    // Start centered between the crop lines
    _scale = _minScale;
    _centerImage();
    _clampTranslation();
    _applyTransform(true);
    _syncSlider();
  }

  function _centerImage() {
    const sz = _getSafeZoneBounds();
    const scaledW = _natW * _scale;
    const scaledH = _natH * _scale;
    _tx = (_vpW - scaledW) / 2;
    _ty = (sz.top + sz.bottom - scaledH) / 2;
  }

  function _clampTranslation() {
    const sz = _getSafeZoneBounds();
    const scaledW = _natW * _scale;
    const scaledH = _natH * _scale;

    // Allow image to move vertically top to bottom to match the crop lines:
    // When dragged down: top edge of image aligns with top crop line (sz.top)
    // When dragged up: bottom edge of image aligns with bottom crop line (sz.bottom)
    const maxTy = sz.top;
    const minTy = sz.bottom - scaledH;

    if (minTy <= maxTy) {
      _ty = Math.min(maxTy, Math.max(minTy, _ty));
    } else {
      _ty = (sz.top + sz.bottom - scaledH) / 2;
    }

    // Horizontal clamping: keep within viewport/crop boundaries
    const minTx = _vpW - scaledW;
    const maxTx = 0;
    if (minTx <= maxTx) {
      _tx = Math.min(maxTx, Math.max(minTx, _tx));
    } else {
      _tx = (_vpW - scaledW) / 2;
    }
  }


  function _applyTransform(skipCanvas) {
    const t = `translate(${_tx}px, ${_ty}px) scale(${_scale})`;
    if (!_isGif) {
      imgEl.style.transform = t;
    } else if (!skipCanvas) {
      canvas.style.transform = t;
    }
  }

  function _syncSlider() {
    // Map _scale range [_minScale … _minScale*3] → slider [50…300]
    const pct = Math.round((_scale / _minScale) * 100);
    zoomSlider.value = Math.min(300, Math.max(50, pct));
    zoomVal.textContent = Math.round((_scale / _minScale) * 100) + '%';
  }

  // ── Slider ──
  zoomSlider.addEventListener('input', () => {
    _hasUserEdited = true;
    const pct = parseInt(zoomSlider.value, 10) / 100;
    const newScale = _minScale * pct;

    // Zoom towards center of safe zone / crop area
    const cx = _vpW / 2;
    const sz = _getSafeZoneBounds();
    const cy = (sz.top + sz.bottom) / 2;
    _tx = cx - (cx - _tx) * (newScale / _scale);
    _ty = cy - (cy - _ty) * (newScale / _scale);
    _scale = newScale;
    _clampTranslation();
    _applyTransform();
    zoomVal.textContent = Math.round(pct * 100) + '%';
  });

  // ── Scroll to zoom ──
  viewport.addEventListener('wheel', e => {
    e.preventDefault();
    _hasUserEdited = true;
    const delta = e.deltaY < 0 ? 1.06 : 0.95;
    const newScale = Math.max(_minScale, Math.min(_minScale * 3, _scale * delta));
    // Fix #19: e.offsetX/Y is relative to the event target (may be a child element).
    // Use clientX/Y minus the viewport's own bounding rect for a correct pivot.
    const rect = viewport.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    _tx = cx - (cx - _tx) * (newScale / _scale);
    _ty = cy - (cy - _ty) * (newScale / _scale);
    _scale = newScale;
    _clampTranslation();
    _applyTransform();
    _syncSlider();
  }, { passive: false });

  // ── Drag ──
  viewport.addEventListener('pointerdown', e => {
    _drag = true;
    _dx0 = e.clientX; _dy0 = e.clientY;
    _tx0 = _tx; _ty0 = _ty;
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener('pointermove', e => {
    if (!_drag) return;
    // Fix #18c: only mark edited once movement exceeds 3px — prevents micro-jitter
    // from a tap forcing a lossy re-encode on apply
    if (!_hasUserEdited && Math.hypot(e.clientX - _dx0, e.clientY - _dy0) > 3) {
      _hasUserEdited = true;
    }
    _tx = _tx0 + (e.clientX - _dx0);
    _ty = _ty0 + (e.clientY - _dy0);
    _clampTranslation();
    _applyTransform();
  });
  viewport.addEventListener('pointerup', e => {
    _drag = false;
    try { viewport.releasePointerCapture(e.pointerId); } catch (_) {}
  });
  viewport.addEventListener('pointercancel', e => {
    _drag = false;
    try { viewport.releasePointerCapture(e.pointerId); } catch (_) {}
  });

  // Keyboard navigation for precision adjustment
  viewport.addEventListener('keydown', e => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      _hasUserEdited = true;
      const step = e.shiftKey ? 10 : 2;
      if (e.key === 'ArrowUp')    _ty -= step;
      if (e.key === 'ArrowDown')  _ty += step;
      if (e.key === 'ArrowLeft')  _tx -= step;
      if (e.key === 'ArrowRight') _tx += step;
      _clampTranslation();
      _applyTransform();
    }
  });

  // Window resize handler to maintain valid transform
  window.addEventListener('resize', () => {
    if (!overlay.classList.contains('open') || _natW === 0) return;
    _vpW = viewport.clientWidth;
    _vpH = viewport.clientHeight;
    // Fix #18b: recompute _minScale with new viewport — stale value lets user zoom below cover-fit
    const sz = _getSafeZoneBounds();
    _minScale = Math.max(_vpW / _natW, sz.height / _natH);
    _scale = Math.max(_scale, _minScale); // prevent current scale going below new floor
    _clampTranslation();
    _applyTransform();
  });

  // ── Reset ──
  btnReset.addEventListener('click', () => {
    _hasUserEdited = true;
    _scale = _minScale;
    _centerImage();
    _clampTranslation();
    _applyTransform();
    _syncSlider();
  });

  // ── Cancel / Close ──
  function _closeEditor() {
    overlay.classList.remove('open');
    _editorGen++; // invalidate any in-flight preview/full loads
    _stopGif();
    imgEl.src = '';
    imgEl.onload = null;
    imgEl.onerror = null;
    imgEl.style.width = ''; imgEl.style.height = '';
    imgEl.style.objectFit = ''; imgEl.style.filter = ''; imgEl.style.transform = '';
    if (_srcBlobUrl) {
      URL.revokeObjectURL(_srcBlobUrl);
      _srcBlobUrl = null;
    }
    _srcDataUrl = '';
    _srcFile = null;
    _hasUserEdited = false;
    _natW = 0;
    _natH = 0;
  }
  btnClose.addEventListener('click',  _closeEditor);
  btnCancel.addEventListener('click', _closeEditor);
  overlay.addEventListener('click', e => { if (e.target === overlay) _closeEditor(); });

  // ── Apply: export image as Blob, store in IDB cache, apply via blob URL ──
  btnApply.addEventListener('click', async () => {
    if (btnApply.disabled) return; // already working — ignore double clicks
    const _origLabel = btnApply.textContent;
    btnApply.disabled = true;
    btnApply.classList.add('wpe-loading');
    btnApply.textContent = 'Setting…';
    // Yield so the spinner paints before heavy canvas/IDB work (drawImage can
    // block the main thread for large crops and would otherwise freeze it out)
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      const blob = await _exportWallpaperBlob();

      // Guard against strange size
      if (blob.size < MIN_WALLPAPER_BYTES) {
        _showToast('⚠️ Image is empty or corrupted.');
        btnApply.disabled = false;
        btnApply.classList.remove('wpe-loading');
        btnApply.textContent = _origLabel;
        return;
      }
      if (blob.size > MAX_WALLPAPER_BYTES) {
        _showToast(`⚠️ Image exceeds 25MB limit (${(blob.size / (1024 * 1024)).toFixed(1)}MB).`);
        btnApply.disabled = false;
        btnApply.classList.remove('wpe-loading');
        btnApply.textContent = _origLabel;
        return;
      }

      // Store blob in LRU cache under 'custom_upload' key (strictly capped at 20 images)
      await _cachePut('custom_upload', blob, blob.type || 'image/png');
      _saveThumbForUpload(blob); // instant placeholder for next new-tab

      // Apply immediately via blob URL (blur-up over the old wallpaper)
      if (_uploadBlobUrl) { URL.revokeObjectURL(_uploadBlobUrl); _uploadBlobUrl = null; }
      _uploadBlobUrl = URL.createObjectURL(blob);
      await _predecode(_uploadBlobUrl);
      _paintBgSharp(_uploadBlobUrl);

      // Set state to upload marker (no huge dataURL in chrome.storage)
      state.wallpaper = '__upload__';
      state.bgColor = '#000000';
      saveState();

      // Clear active states in panel
      document.querySelectorAll('.cp-wp').forEach(w => w.classList.remove('active'));
      document.querySelectorAll('.cp-swatch').forEach(s => s.classList.remove('active'));
      _closeEditor();
      btnApply.disabled = false;
      btnApply.classList.remove('wpe-loading');
      btnApply.textContent = _origLabel;
      _showToast('✅ Wallpaper set!');
    } catch (err) {
      console.error('[NTP] Failed to set wallpaper:', err);
      btnApply.disabled = false;
      btnApply.classList.remove('wpe-loading');
      btnApply.textContent = _origLabel;
      _showToast('❌ Failed to set wallpaper: ' + (err.message || 'unknown error'));
    }
  });

  // Returns a Blob — either the original file (zero quality loss) or a canvas crop (PNG).
  async function _exportWallpaperBlob() {
    // GIF — return original file blob as-is
    if (_isGif && _srcFile) return _srcFile;

    // ── No user edits → return the original File blob directly ──
    // Zero canvas processing, zero re-encoding, zero quality loss.
    if (!_hasUserEdited && _srcFile) {
      return _srcFile;
    }

    // ── User cropped/zoomed → render exact crop at source resolution ──
    const img = new Image();
    // Fix #14: must handle onerror — if the blob URL was revoked (editor closed
    // mid-export) img.onload never fires, hanging the async function forever and
    // leaving the Apply button stuck on "Setting…".
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = () => rej(new Error('Image failed to decode — please try again'));
      img.src = _srcDataUrl;
    });

    const sz = _getSafeZoneBounds();

    // Source coordinates relative to the crop area (safe zone)
    const cropX = Math.max(0, Math.min(_natW - 1, (sz.left - _tx) / _scale));
    const cropY = Math.max(0, Math.min(_natH - 1, (sz.top - _ty) / _scale));
    const cropW = Math.max(1, Math.min(_natW - cropX, sz.width / _scale));
    const cropH = Math.max(1, Math.min(_natH - cropY, sz.height / _scale));

    const outW = Math.round(cropW);
    const outH = Math.round(cropH);

    const offscreen = document.createElement('canvas');
    offscreen.width  = outW;
    offscreen.height = outH;
    offscreen.getContext('2d').drawImage(
      img,
      cropX, cropY, cropW, cropH,
      0,     0,     outW,  outH
    );

    // Use WebP at max quality first (~30-50% smaller than PNG, same pixel
    // dimensions, visually indistinguishable). Canvas has no true-lossless
    // WebP mode, so PNG stays as the bit-exact fallback — never JPEG for
    // the crop path, never any downscaling.
    return new Promise(resolve => {
      offscreen.toBlob(webpBlob => {
        if (webpBlob) { resolve(webpBlob); return; }
        offscreen.toBlob(pngBlob => {
          if (pngBlob) { resolve(pngBlob); return; }
          offscreen.toBlob(jpgBlob => {
            resolve(jpgBlob || _srcFile);
          }, 'image/jpeg', 1.0);
        }, 'image/png');
      }, 'image/webp', 1.0);
    });
  }

  // ══════════════════════════════════════════════
  //  GIF DECODER  (pure JS, no library)
  //  Decodes frames into ImageData array for
  //  smooth playback in canvas while editing.
  // ══════════════════════════════════════════════

  function _playGif() {
    _stopGif();
    const ctx = canvas.getContext('2d');
    function next() {
      if (!_gifFrames.length) return;
      const frame = _gifFrames[_gifFrame];
      ctx.putImageData(frame.imageData, 0, 0);
      // Re-apply transform so it matches the drag state
      canvas.style.transform = `translate(${_tx}px, ${_ty}px) scale(${_scale})`;
      _gifFrame = (_gifFrame + 1) % _gifFrames.length;
      _gifTimer = setTimeout(next, frame.delay || 100);
    }
    next();
  }

  function _stopGif() {
    if (_gifTimer) { clearTimeout(_gifTimer); _gifTimer = null; }
  }

  // ── Minimal GIF89a decoder ──
  // Handles LZW compressed frames, disposal methods, transparent colour
  function _decodeGif(data) {
    let pos = 0;
    const read = n => { const s = data.slice(pos, pos+n); pos += n; return s; };
    const readU8  = () => data[pos++];
    const readU16 = () => { const v = data[pos] | (data[pos+1]<<8); pos+=2; return v; };

    // Header
    const hdr = String.fromCharCode(...read(6));
    if (!hdr.startsWith('GIF')) return null;

    const screenW = readU16(), screenH = readU16();
    const packed  = readU8();
    const bgIdx   = readU8(); readU8(); // aspect

    let globalCT = null;
    const gctFlag = (packed >> 7) & 1;
    const gctSize = 3 * (1 << ((packed & 7) + 1));
    if (gctFlag) { globalCT = read(gctSize); }

    const frames = [];
    let gce = { delay: 100, transIdx: -1, disposal: 0 };
    // Accumulated canvas for disposal
    let accumCanvas = null, accumCtx = null;

    function ensureAccum() {
      if (!accumCanvas) {
        accumCanvas = document.createElement('canvas');
        accumCanvas.width = screenW; accumCanvas.height = screenH;
        accumCtx = accumCanvas.getContext('2d');
      }
    }

    while (pos < data.length) {
      const sentinel = readU8();
      if (sentinel === 0x3B) break; // trailer

      if (sentinel === 0x21) {
        // Extension
        const label = readU8();
        if (label === 0xF9) {
          // Graphic Control Extension
          readU8(); // block size (4)
          const p = readU8();
          gce.disposal  = (p >> 3) & 7;
          gce.delay     = readU16() * 10 || 100;
          const ti = readU8();
          gce.transIdx  = (p & 1) ? ti : -1;
          readU8(); // terminator
        } else {
          // Skip other extensions
          let bsize;
          while ((bsize = readU8()) !== 0) pos += bsize;
        }
        continue;
      }

      if (sentinel === 0x2C) {
        // Image descriptor
        const left = readU16(), top = readU16();
        const fw = readU16(), fh = readU16();
        const ipacked = readU8();
        const lctFlag = (ipacked >> 7) & 1;
        const interlace = (ipacked >> 6) & 1;
        const lctSize = 3 * (1 << ((ipacked & 7) + 1));
        let ct = globalCT;
        if (lctFlag) ct = read(lctSize);

        // Read LZW
        const minCode = readU8();
        let rawData = [];
        let bsize;
        while ((bsize = readU8()) !== 0) {
          rawData.push(...data.slice(pos, pos+bsize));
          pos += bsize;
        }

        // Decode LZW
        const pixels = _lzwDecode(minCode, new Uint8Array(rawData));

        ensureAccum();

        // Disposal: 2 = restore to background, 3 = restore to previous
        if (gce.disposal === 2) {
          accumCtx.clearRect(left, top, fw, fh);
        }

        // Paint frame pixels onto accumCanvas
        const idata = accumCtx.getImageData(0, 0, screenW, screenH);
        const d = idata.data;
        const deinterlaced = interlace ? _deinterlace(pixels, fw, fh) : pixels;

        for (let y = 0; y < fh; y++) {
          for (let x = 0; x < fw; x++) {
            const ci = deinterlaced[y * fw + x];
            if (ci === gce.transIdx) continue;
            const pi = ((top + y) * screenW + (left + x)) * 4;
            const ci3 = ci * 3;
            d[pi]   = ct[ci3];
            d[pi+1] = ct[ci3+1];
            d[pi+2] = ct[ci3+2];
            d[pi+3] = 255;
          }
        }
        accumCtx.putImageData(idata, 0, 0);

        frames.push({
          width: screenW,
          height: screenH,
          delay: gce.delay,
          imageData: accumCtx.getImageData(0, 0, screenW, screenH)
        });

        // Reset GCE for next frame
        gce = { delay: 100, transIdx: -1, disposal: 0 };
        continue;
      }

      // Unknown block — skip
      break;
    }

    return frames.length ? frames : null;
  }

  function _lzwDecode(minCode, data) {
    const clearCode = 1 << minCode;
    const eoi = clearCode + 1;
    let codeSize = minCode + 1;
    let mask = (1 << codeSize) - 1;

    // Code table
    const table = [];
    const reset = () => {
      table.length = 0;
      for (let i = 0; i < clearCode; i++) table[i] = [i];
      table[clearCode] = []; table[eoi] = [];
      codeSize = minCode + 1;
      mask = (1 << codeSize) - 1;
    };
    reset();

    let bits = 0, bitBuf = 0, dataPos = 0;
    const readCode = () => {
      while (bits < codeSize && dataPos < data.length) {
        bitBuf |= data[dataPos++] << bits;
        bits += 8;
      }
      const code = bitBuf & mask;
      bitBuf >>= codeSize; bits -= codeSize;
      return code;
    };

    const out = [];
    let prev = null;
    while (true) {
      const code = readCode();
      if (code === clearCode) { reset(); prev = null; continue; }
      if (code === eoi) break;

      let entry;
      if (code < table.length) {
        entry = table[code];
      } else if (prev !== null && code === table.length) {
        entry = [...prev, prev[0]];
      } else {
        break; // corrupt
      }

      // 🔥 FIX BUG 3: Use a loop instead of spread syntax to avoid "Maximum call stack size exceeded"
      // The spread operator (...) on large arrays causes stack overflow in V8 (Chrome's JS engine)
      // For large GIFs, entry can be thousands of elements
      for (let i = 0; i < entry.length; i++) {
        out.push(entry[i]);
      }

      if (prev !== null && table.length < 4096) {
        table.push([...prev, entry[0]]);
        if (table.length > mask && codeSize < 12) {
          codeSize++; mask = (1 << codeSize) - 1;
        }
      }
      prev = entry;
    }
    return out;
  }

  function _deinterlace(pixels, w, h) {
    const out = new Array(w * h);
    const passes = [
      [0, 8], [4, 8], [2, 4], [1, 2]
    ];
    let src = 0;
    for (const [start, step] of passes) {
      for (let y = start; y < h; y += step) {
        for (let x = 0; x < w; x++) {
          out[y * w + x] = pixels[src++];
        }
      }
    }
    return out;
  }

})(); // end IIFE

// ═══════════════════════════════════════════════════════
// TAB GROUP MANAGER — all new code below, nothing above touched
// ═══════════════════════════════════════════════════════

const GROUP_COLORS = [
  '#1a73e8', '#34a853', '#fbbc04', '#ea4335', '#9c27b0',
  '#ff5722', '#00bcd4', '#e91e63', '#607d8b', '#795548'
];

// ─── Native Chrome Tab Group Color Mapping ───
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
  '#795548': 'grey',
};

function hexToChromeColor(hex) {
  if (!hex || typeof hex !== 'string') return 'blue';
  return HEX_TO_CHROME_COLOR[hex.toLowerCase()] || 'blue';
}

// ─── Toast notification ───
function _tgmShowToast(text) {
  let toast = document.querySelector('.tgm-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'tgm-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

// ─── Helper: clean hostname from URL ───
function _getCleanHostname(urlStr) {
  try {
    const u = new URL(urlStr);
    return u.hostname.replace(/^www\./, '');
  } catch (_) {
    return urlStr;
  }
}

// ─── Helper: deduplicate groups in the top bar state ───
function _tgmDeduplicateGroups() {
  if (!Array.isArray(state.tabGroups)) return false;
  const seen = new Map();
  const deduped = [];
  let modified = false;

  for (const g of state.tabGroups) {
    if (!g || !g.name) continue;
    const key = (g.type === 'note' ? 'note_' : 'group_') + g.name.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, g);
      deduped.push(g);
    } else {
      modified = true;
      const existing = seen.get(key);
      if (g.type === 'note') {
        if (Array.isArray(g.checklist) && g.checklist.length > 0 && (!existing.checklist || existing.checklist.length === 0)) {
          existing.checklist = g.checklist;
        }
        if (g.textContent && !existing.textContent) {
          existing.textContent = g.textContent;
        }
      } else {
        if (Array.isArray(g.tabs)) {
          existing.tabs = existing.tabs || [];
          for (const t of g.tabs) {
            if (!existing.tabs.some(et => et.url === t.url)) {
              existing.tabs.push(t);
            }
          }
        }
        if (g.isActive && !existing.isActive) {
          existing.isActive = true;
        }
      }
    }
  }

  if (modified || deduped.length !== state.tabGroups.length) {
    state.tabGroups = deduped;
    saveState();
    return true;
  }
  return false;
}

// ─── URL normaliser (same rules as background.js) ───
// lowercase host, no #hash, no trailing slash, query string KEPT
function _tgmNormalizeUrl(u) {
  try {
    const x = new URL(u);
    return x.protocol + '//' + x.host + x.pathname.replace(/\/+$/, '') + x.search;
  } catch (_) {
    return (u || '').trim();
  }
}

// ─── Always re-resolve a group by id (objects can be replaced by storage sync) ───
function _tgmGetGroup(groupId) {
  return (state.tabGroups || []).find(g => g.id === groupId) || null;
}

// Saved entries that have no live counterpart among `liveTabs`
function _tgmMissingEntries(group, liveTabs) {
  const ids  = new Set(liveTabs.map(t => t.id));
  const urls = new Set(liveTabs.map(t => _tgmNormalizeUrl(t.url || t.pendingUrl || '')));
  return (group.tabs || []).filter(e =>
    e.url &&
    !(e.chromeTabId != null && ids.has(e.chromeTabId)) &&
    !urls.has(_tgmNormalizeUrl(e.url))
  );
}

// Bind freshly created Chrome tabs to saved entries (looked up on the CURRENT group)
function _tgmBindPairs(group, pairs) {
  for (const [url, id] of pairs) {
    // Fix #30: use normalised comparison so redirect-resolved URLs (e.g. http→https)
    // bind correctly instead of being treated as "missing" and reopened.
    const n = _tgmNormalizeUrl(url);
    const e = (group.tabs || []).find(t => _tgmNormalizeUrl(t.url) === n && t.chromeTabId == null);
    if (e) e.chromeTabId = id;
  }
}
function _tgmBindByUrl(group, liveTabs) {
  const used = new Set((group.tabs || []).map(t => t.chromeTabId).filter(id => id != null));
  for (const e of (group.tabs || [])) {
    if (e.chromeTabId != null) continue;
    const n = _tgmNormalizeUrl(e.url);
    const hit = liveTabs.find(t => !used.has(t.id) && _tgmNormalizeUrl(t.url || t.pendingUrl || '') === n);
    if (hit) { e.chromeTabId = hit.id; used.add(hit.id); }
  }
}

// Run `fn` while the group carries a creation lock (background.js backs off
// from ALL groups while any lock is fresh). The lock is always released.
async function _tgmWithLock(groupId, fn) {
  const g = _tgmGetGroup(groupId);
  if (!g) return;
  g._tgmCreating = true;
  g._tgmCreatingTime = Date.now();
  await saveState();
  try {
    return await fn();
  } finally {
    const g2 = _tgmGetGroup(groupId);
    if (g2) { g2._tgmCreating = false; await saveState(); }
  }
}

// Ungroup (NOT close) the live Chrome tab behind a removed saved entry
async function _tgmDetachFromChrome(group, entry) {
  if (!isChromeGroupSyncEnabled()) return;
  try {
    if (!group || !entry || !group.nativeGroupId) return;
    const tabs = await chrome.tabs.query({ groupId: group.nativeGroupId }).catch(() => []);
    const n = _tgmNormalizeUrl(entry.url);
    const ids = tabs.filter(t =>
      (entry.chromeTabId != null && t.id === entry.chromeTabId) ||
      _tgmNormalizeUrl(t.url || t.pendingUrl || '') === n
    ).map(t => t.id);
    if (ids.length) await chrome.tabs.ungroup(ids).catch(() => {});
  } catch (_) {}
}

// Put an EXISTING Chrome tab into the group's native group (never creates a tab).
// force=false: only if a native group already exists or the group is active.
async function _tgmAttachTab(groupId, tabId, url, force) {
  if (!isChromeGroupSyncEnabled()) return null;
  let group = _tgmGetGroup(groupId);
  if (!group || tabId == null) return null;
  const win = await chrome.windows.getCurrent();
  let native = await _tgmFindMatchingChromeGroup(group, win.id);
  group = _tgmGetGroup(groupId) || group;
  if (!native && group.isActive) native = await _tgmFindMatchingChromeGroup(group);
  if (!native && !force && !group.isActive) return null;

  let nativeId;
  if (native) {
    await chrome.tabs.group({ tabIds: [tabId], groupId: native.id });
    nativeId = native.id;
  } else {
    nativeId = await chrome.tabs.group({ tabIds: [tabId] });
    await chrome.tabGroups.update(nativeId, {
      title: group.name, color: hexToChromeColor(group.color), collapsed: false
    }).catch(() => {});
  }
  group = _tgmGetGroup(groupId) || group;
  group.nativeGroupId = nativeId;
  group.hasCreatedNativeGroup = true;
  group.chromeTabIds = group.chromeTabIds || [];
  if (!group.chromeTabIds.includes(tabId)) group.chromeTabIds.push(tabId);
  _tgmBindPairs(group, [[url, tabId]]);
  await saveState();
  return nativeId;
}

// ─── Per-group creation mutex (permanent duplicate prevention) ───
// Maps group.id -> Promise. Serializes all native group create/attach calls
// for a single extension group so concurrent clicks can never double-create.
const _tgmGroupMutex = new Map();

function _tgmSerialize(groupId, fn) {
  const prev = _tgmGroupMutex.get(groupId) || Promise.resolve();
  const next = prev.then(fn).catch(err => console.warn('[TGM mutex]', err));
  _tgmGroupMutex.set(groupId, next);
  // Don't let the Map grow forever — clean up once the chain resolves
  next.finally(() => {
    if (_tgmGroupMutex.get(groupId) === next) _tgmGroupMutex.delete(groupId);
  });
  return next;
}

// ─── Helper: find existing native Chrome tab group (with automatic duplicate merging) ───
async function _tgmFindMatchingChromeGroup(group, windowId = null) {
  if (!group || !group.name) return null;
  try {
    const groupNameLower = group.name.trim().toLowerCase();

    // Helper: query and filter by ID or name
    const findIn = async (opts) => {
      const allGroups = await chrome.tabGroups.query(opts).catch(() => []);
      if (!allGroups || allGroups.length === 0) return [];
      return allGroups.filter(g =>
        (group.nativeGroupId && g.id === group.nativeGroupId) ||
        (g.title && g.title.trim().toLowerCase() === groupNameLower)
      );
    };

    // 1. Prefer matching by stored nativeGroupId first (most accurate)
    if (group.nativeGroupId) {
      try {
        const byId = await chrome.tabGroups.get(group.nativeGroupId).catch(() => null);
        if (byId) {
          // Verify title still matches (Chrome may have renamed it)
          // Accept even if title drifted — we own this ID
          return byId;
        }
      } catch (_) {}
      // nativeGroupId no longer valid — wipe it so we fall through to name search
      group.nativeGroupId = null;
    }

    // 2. Search by title in target window (or globally)
    const queryOpts = windowId ? { windowId } : {};
    let matches = await findIn(queryOpts);

    // 3. If not found in target window, search globally
    if (matches.length === 0 && windowId) {
      matches = await findIn({});
    }

    if (matches.length === 0) return null;

    // Prefer the group whose ID matches nativeGroupId if any; otherwise first by title
    const primary = matches[0];

    // Merge any duplicate native groups that share the same name into primary
    if (matches.length > 1) {
      for (let i = 1; i < matches.length; i++) {
        const dup = matches[i];
        try {
          const dupTabs = await chrome.tabs.query({ groupId: dup.id });
          if (dupTabs && dupTabs.length > 0) {
            await chrome.tabs.group({ tabIds: dupTabs.map(t => t.id), groupId: primary.id });
          }
        } catch (_) {}
      }
    }

    return primary;
  } catch (err) {
    console.warn('[TGM] _tgmFindMatchingChromeGroup error:', err);
    return null;
  }
}

// ─── Helper: create or attach native Chrome tab group (mutex-serialized) ───
// Wraps the real work in _tgmSerialize so concurrent clicks on the same group
// can never produce two native Chrome groups.
async function _tgmCreateOrAttachNativeGroup(group) {
  if (!group) return null;
  return _tgmSerialize(group.id, () => _tgmCreateOrAttachNativeGroupWork(group));
}

async function _tgmCreateOrAttachNativeGroupWork(group) {
  if (!isChromeGroupSyncEnabled()) return null;
  if (!group || !group.isActive) return null; // bail if deactivated while waiting in queue
  const gid = group.id;
  const fresh = () => _tgmGetGroup(gid) || group;

  try {
    const currentWindow = await chrome.windows.getCurrent();

    // ── Step 1: Find any already-existing matching Chrome group ──
    let existing = await _tgmFindMatchingChromeGroup(fresh(), currentWindow.id);
    if (!existing) existing = await _tgmFindMatchingChromeGroup(fresh());

    if (existing) {
      let g = fresh();
      g.nativeGroupId = existing.id;
      g.hasCreatedNativeGroup = true;
      await chrome.tabGroups.update(existing.id, {
        title: g.name,
        color: hexToChromeColor(g.color),
        collapsed: false
      }).catch(() => {});

      // Add saved tabs that have no live counterpart. NEVER close anything:
      // tabs the user opened / navigated stay untouched.
      const existingTabs = await chrome.tabs.query({ groupId: existing.id }).catch(() => []);
      const pairs = [];
      for (const e of _tgmMissingEntries(fresh(), existingTabs)) {
        try {
          const t = await chrome.tabs.create({ url: e.url, windowId: existing.windowId, active: false });
          if (t && t.id) {
            pairs.push([e.url, t.id]);
            await chrome.tabs.group({ tabIds: [t.id], groupId: existing.id }).catch(() => {});
          }
        } catch (_) {}
      }

      const finalTabs = await chrome.tabs.query({ groupId: existing.id }).catch(() => []);
      g = fresh();
      _tgmBindPairs(g, pairs);
      _tgmBindByUrl(g, finalTabs);
      if (finalTabs.length > 0) {
        g.chromeTabIds = finalTabs.map(t => t.id);
        await saveState();
        await chrome.tabs.update(finalTabs[0].id, { active: true }).catch(() => {});
      } else {
        await saveState();
      }
      return existing.id;
    }

    // ── Step 2: Create new native Chrome tab group ──
    const entries = (fresh().tabs || []).filter(e => e.url).map(e => e.url);
    const tabIds = [];
    const pairs = [];
    if (entries.length > 0) {
      for (const url of entries) {
        try {
          const t = await chrome.tabs.create({ url, windowId: currentWindow.id, active: false });
          if (t && t.id) { tabIds.push(t.id); pairs.push([url, t.id]); }
        } catch (_) {}
      }
    } else {
      // Empty group: attach the current tab so Chrome establishes the native group around it
      let curTab = null;
      try { curTab = await chrome.tabs.getCurrent(); } catch (_) {}
      if (!curTab || !curTab.id) {
        try {
          const [at] = await chrome.tabs.query({ active: true, currentWindow: true });
          curTab = at;
        } catch (_) {}
      }
      if (curTab && curTab.id) {
        tabIds.push(curTab.id);
      } else {
        try {
          const t = await chrome.tabs.create({ windowId: currentWindow.id, active: true });
          if (t && t.id) tabIds.push(t.id);
        } catch (_) {}
      }
    }

    if (tabIds.length > 0) {
      if (!fresh().isActive) {
        await chrome.tabs.remove(tabIds).catch(() => {});
        return null;
      }
      const nativeId = await chrome.tabs.group({ tabIds });
      const g = fresh();
      await chrome.tabGroups.update(nativeId, {
        title: g.name,
        color: hexToChromeColor(g.color),
        collapsed: false
      }).catch(() => {});
      g.nativeGroupId = nativeId;
      g.hasCreatedNativeGroup = true;
      g.chromeTabIds = tabIds;
      _tgmBindPairs(g, pairs);
      await saveState();
      await chrome.tabs.update(tabIds[0], { active: true }).catch(() => {});
      return nativeId;
    }
  } catch (err) {
    console.warn('[TGM] _tgmCreateOrAttachNativeGroupWork error:', err);
  }

  return null;
}

// ─── Active open dropdown tracking & Hover handling ───
let _tgmOpenDd = null;  // { chipEl, ddEl, groupId }
let _tgmHoverCloseTimer = null;
let _tgmHoverOpenTimer = null;

function _tgmScheduleClose() {
  clearTimeout(_tgmHoverOpenTimer);
  clearTimeout(_tgmHoverCloseTimer);
  _tgmHoverCloseTimer = setTimeout(() => {
    _tgmCloseDropdown();
  }, 220);
}

function _tgmCancelClose() {
  clearTimeout(_tgmHoverCloseTimer);
}

function _tgmCloseDropdown() {
  clearTimeout(_tgmHoverOpenTimer);
  clearTimeout(_tgmHoverCloseTimer);
  if (_tgmOpenDd) {
    _tgmOpenDd.ddEl.classList.remove('tgm-dd-open');
    _tgmOpenDd.ddEl.remove();
    _tgmOpenDd = null;
  }
}

// Close when clicking outside bar / dropdown
document.addEventListener('click', e => {
  if (_tgmOpenDd) {
    const bar = document.getElementById('tgm-bar');
    if (
      !_tgmOpenDd.ddEl.contains(e.target) &&
      bar && !bar.contains(e.target)
    ) {
      _tgmCloseDropdown();
    }
  }
}, true);

// ─── TGM Modal system ───
let _tgmModalCb = null;

function _tgmOpenModal({
  title,
  body,
  inputValue,
  inputPlaceholder,
  showInput,
  showUrlInput,
  urlPlaceholder,
  urlValue,
  tabPickerItems,
  onTabPick,
  showDelete,
  saveBtnText,
  showTypeSlider,
  defaultType,
  showColorPicker,
  onSave,
  onDelete
}) {
  const overlay    = document.getElementById('tgm-modal-overlay');
  const titleEl    = document.getElementById('tgm-modal-title');
  const bodyEl     = document.getElementById('tgm-modal-body');
  const inputEl    = document.getElementById('tgm-modal-input');
  const urlEl      = document.getElementById('tgm-modal-url-input');
  const pickerWrap = document.getElementById('tgm-modal-picker-wrap');
  const pickerList = document.getElementById('tgm-modal-picker-list');
  const saveBtn    = document.getElementById('tgm-modal-save');
  const deleteBtn  = document.getElementById('tgm-modal-delete');
  const sliderEl   = document.getElementById('tgm-modal-type-slider');
  const slideNotes = document.getElementById('tgm-slide-notes');
  const slideGroup = document.getElementById('tgm-slide-group');

  let currentType = defaultType || 'group';

  function setSliderType(t) {
    currentType = t;
    if (t === 'group') {
      if (sliderEl) sliderEl.classList.remove('is-notes');
      if (slideGroup) slideGroup.classList.add('active');
      if (slideNotes) slideNotes.classList.remove('active');
      titleEl.textContent = 'New Tab Group';
      inputEl.placeholder = 'Group name';
      saveBtn.textContent = 'Create Group';
      if (tabPickerItems && tabPickerItems.length > 0) {
        pickerWrap.style.display = '';
      }
    } else {
      if (sliderEl) sliderEl.classList.add('is-notes');
      if (slideNotes) slideNotes.classList.add('active');
      if (slideGroup) slideGroup.classList.remove('active');
      titleEl.textContent = 'New Note';
      inputEl.placeholder = 'Note title (e.g. Work Todos, Ideas)';
      saveBtn.textContent = 'Create Note';
      pickerWrap.style.display = 'none';
    }
  }

  if (showTypeSlider && sliderEl && slideNotes && slideGroup) {
    sliderEl.style.display = 'flex';
    slideGroup.onclick = e => { e.preventDefault(); setSliderType('group'); inputEl.focus(); };
    slideNotes.onclick = e => { e.preventDefault(); setSliderType('note'); inputEl.focus(); };
    setSliderType(currentType);
  } else {
    if (sliderEl) sliderEl.style.display = 'none';
    titleEl.textContent = title;
  }

  if (body) {
    bodyEl.textContent = body;
    bodyEl.style.display = '';
  } else {
    bodyEl.style.display = 'none';
  }

  if (showUrlInput) {
    urlEl.style.display = '';
    urlEl.value = urlValue || '';
    urlEl.placeholder = urlPlaceholder || 'URL (e.g. https://github.com)';
  } else {
    urlEl.style.display = 'none';
    urlEl.value = '';
  }

  inputEl.classList.remove('tgm-invalid');

  if (showInput !== false) {
    inputEl.style.display = '';
    inputEl.value = inputValue || '';
    if (!showTypeSlider) {
      inputEl.placeholder = inputPlaceholder || 'Name';
    }
  } else {
    inputEl.style.display = 'none';
  }

  if (tabPickerItems && tabPickerItems.length > 0 && (!showTypeSlider || currentType === 'group')) {
    pickerWrap.style.display = '';
    pickerList.innerHTML = '';
    tabPickerItems.forEach(tab => {
      const item = document.createElement('div');
      item.className = 'tgm-picker-item';

      const img = document.createElement('img');
      img.className = 'tgm-picker-fav';
      img.alt = '';
      img.src = tab.favIconUrl || tab.favicon ||
        `https://www.google.com/s2/favicons?sz=16&domain_url=${encodeURIComponent(tab.url)}`;
      img.onerror = () => { img.style.display = 'none'; };

      const span = document.createElement('span');
      span.className = 'tgm-picker-text';
      span.textContent = tab.title || tab.url;
      span.title = tab.url;

      item.appendChild(img);
      item.appendChild(span);
      item.addEventListener('click', () => {
        if (onTabPick) onTabPick(tab);
      });
      pickerList.appendChild(item);
    });
  } else {
    pickerWrap.style.display = 'none';
    pickerList.innerHTML = '';
  }

  deleteBtn.style.display = showDelete ? '' : 'none';
  saveBtn.style.display   = showDelete ? 'none' : '';
  if (!showTypeSlider) {
    saveBtn.textContent   = saveBtnText || 'Save';
  }

  // ── Color Picker setup ──
  let _pickedColor = null;
  const colorRow  = document.getElementById('tgm-modal-color-row');
  const hslWrap   = document.getElementById('tgm-hsl-wrap');
  const customBtn = document.getElementById('tgm-color-custom-btn');

  // Always reset HSL state on every modal open
  hslWrap.classList.remove('open');
  customBtn.classList.remove('active');
  customBtn.onclick = null;

  if (showColorPicker) {
    colorRow.style.display = '';

    // Clear previously injected swatches (keep label span + customBtn)
    Array.from(colorRow.children).forEach(child => {
      if (!child.classList.contains('tgm-color-label') && child !== customBtn) {
        colorRow.removeChild(child);
      }
    });

    // Inject 6 preset swatches from the first 6 GROUP_COLORS
    const PRESETS = GROUP_COLORS.slice(0, 6);
    PRESETS.forEach(hex => {
      const sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'tgm-color-swatch';
      sw.style.background = hex;
      sw.title = hex;
      sw.addEventListener('click', () => {
        colorRow.querySelectorAll('.tgm-color-swatch').forEach(s => s.classList.remove('selected'));
        customBtn.classList.remove('active');
        hslWrap.classList.remove('open');
        sw.classList.add('selected');
        _pickedColor = hex;
      });
      colorRow.insertBefore(sw, customBtn);
    });

    // Rainbow button toggles HSL wheel
    customBtn.onclick = () => {
      const opening = !hslWrap.classList.contains('open');
      hslWrap.classList.toggle('open', opening);
      customBtn.classList.toggle('active', opening);
      if (opening) {
        // Deselect any preset swatch
        colorRow.querySelectorAll('.tgm-color-swatch').forEach(s => s.classList.remove('selected'));
        _tgmUpdateHslPreview();
        _pickedColor = _tgmGetHslHex();
      }
    };

    // Each time the HSL sliders move, update the picked color for this modal
    window._tgmHslPickCb = (hex) => { _pickedColor = hex; };
  } else {
    colorRow.style.display = 'none';
    window._tgmHslPickCb = null;
  }

  _tgmModalCb = {
    onSave,
    onDelete,
    // Name is required for group/note create & rename modals (name input, no URL field)
    requireName: showInput !== false && !showUrlInput,
    getType: () => currentType,
    getPickedColor: () => _pickedColor
  };
  overlay.classList.add('open');

  if (showUrlInput) {
    setTimeout(() => urlEl.focus(), 60);
  } else if (showInput !== false) {
    setTimeout(() => inputEl.focus(), 60);
  }
}

function _tgmCloseModal() {
  document.getElementById('tgm-modal-overlay').classList.remove('open');
  // Collapse HSL wheel whenever modal closes
  const hw = document.getElementById('tgm-hsl-wrap');
  if (hw) hw.classList.remove('open');
  const cb = document.getElementById('tgm-color-custom-btn');
  if (cb) cb.classList.remove('active');
  _tgmModalCb = null;
}

document.getElementById('tgm-modal-cancel').addEventListener('click', _tgmCloseModal);
document.getElementById('tgm-modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('tgm-modal-overlay')) _tgmCloseModal();
});
document.getElementById('tgm-modal-save').addEventListener('click', () => {
  if (_tgmModalCb && _tgmModalCb.onSave) {
    const inputEl     = document.getElementById('tgm-modal-input');
    const inputVal    = inputEl.value.trim();
    const urlVal      = document.getElementById('tgm-modal-url-input').value.trim();
    const cb          = _tgmModalCb.onSave;
    const type        = _tgmModalCb.getType ? _tgmModalCb.getType() : null;
    const pickedColor = _tgmModalCb.getPickedColor ? _tgmModalCb.getPickedColor() : null;

    // Empty name: red stroke on the input and keep the modal open
    if (_tgmModalCb.requireName && !inputVal) {
      inputEl.classList.add('tgm-invalid');
      inputEl.focus();
      return;
    }

    _tgmCloseModal();
    cb(inputVal, urlVal, type, pickedColor);
  } else {
    _tgmCloseModal();
  }
});
document.getElementById('tgm-modal-delete').addEventListener('click', () => {
  if (_tgmModalCb && _tgmModalCb.onDelete) {
    const cb = _tgmModalCb.onDelete;
    _tgmCloseModal();
    cb();
  }
});
document.getElementById('tgm-modal-input').addEventListener('keydown', e => {
  if (e.key === 'Enter')  document.getElementById('tgm-modal-save').click();
  if (e.key === 'Escape') _tgmCloseModal();
});
document.getElementById('tgm-modal-input').addEventListener('input', e => {
  e.target.classList.remove('tgm-invalid');
});
document.getElementById('tgm-modal-url-input').addEventListener('keydown', e => {
  if (e.key === 'Enter')  document.getElementById('tgm-modal-save').click();
  if (e.key === 'Escape') _tgmCloseModal();
});

// ─── HSL color helpers ───

function _tgmHslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => {
    const k = (n + h / 30) % 12;
    const val = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(val * 255).toString(16).padStart(2, '0');
  };
  return '#' + f(0) + f(8) + f(4);
}

function _tgmGetHslHex() {
  const h = +document.getElementById('tgm-hsl-hue').value;
  const s = +document.getElementById('tgm-hsl-sat').value;
  const l = +document.getElementById('tgm-hsl-lit').value;
  return _tgmHslToHex(h, s, l);
}

function _tgmUpdateHslPreview() {
  const h   = +document.getElementById('tgm-hsl-hue').value;
  const s   = +document.getElementById('tgm-hsl-sat').value;
  const l   = +document.getElementById('tgm-hsl-lit').value;
  const hex = _tgmHslToHex(h, s, l);
  const preview = document.getElementById('tgm-hsl-preview');
  if (preview) preview.style.background = hex;
  // Update saturation track colour to reflect current hue & lightness
  const satEl = document.getElementById('tgm-hsl-sat');
  if (satEl) {
    satEl.style.background =
      `linear-gradient(to right, hsl(${h},0%,${l}%), hsl(${h},100%,${l}%))`;
  }
  return hex;
}

// Wire HSL slider input events once at page load
;['tgm-hsl-hue', 'tgm-hsl-sat', 'tgm-hsl-lit'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    const hex = _tgmUpdateHslPreview();
    if (window._tgmHslPickCb) window._tgmHslPickCb(hex);
  });
});

// ─── X-Axis Locked Pointer Dragging & Push-Aside Animation state ───
let _tgmJustDragged = false;

function _tgmApplyPushAside(fromIndex, toIndex) {
  const scroll = document.getElementById('tgm-chips-scroll');
  if (!scroll) return;
  const chips = Array.from(scroll.querySelectorAll('.tgm-chip'));
  if (fromIndex < 0 || toIndex < 0) return;

  const stride = 143; // 135px chip width + 8px gap

  chips.forEach((c, idx) => {
    if (idx === fromIndex) return; // Dragged chip follows cursor directly

    if (fromIndex < toIndex) {
      // Dragging right: sibling items from (fromIndex + 1) to toIndex slide left (-143px)
      if (idx > fromIndex && idx <= toIndex) {
        c.style.transform = `translateX(-${stride}px)`;
      } else {
        c.style.transform = '';
      }
    } else if (fromIndex > toIndex) {
      // Dragging left: sibling items from toIndex to (fromIndex - 1) slide right (+143px)
      if (idx >= toIndex && idx < fromIndex) {
        c.style.transform = `translateX(${stride}px)`;
      } else {
        c.style.transform = '';
      }
    } else {
      c.style.transform = '';
    }
  });
}

function _tgmResetPushAside() {
  const scroll = document.getElementById('tgm-chips-scroll');
  if (!scroll) return;
  scroll.classList.remove('tgm-is-dragging');
  scroll.querySelectorAll('.tgm-chip').forEach(c => {
    c.style.transform = '';
    c.classList.remove('tgm-pointer-dragging', 'tgm-dragging', 'tgm-drag-target');
  });
}

// ─── Render the top bar chips ───
function renderGroupBar() {
  syncTabGroupsVisibility();
  if (state.showTabGroups === false) return;

  const bar = document.getElementById('tgm-bar');
  if (bar) bar.oncontextmenu = e => e.preventDefault();

  const scroll = document.getElementById('tgm-chips-scroll');
  if (!scroll) return;
  scroll.innerHTML = '';

  // Block right-click context menu and native drag on the bar container
  scroll.oncontextmenu = e => e.preventDefault();
  scroll.ondragstart = e => e.preventDefault();

  _tgmDeduplicateGroups();

  (state.tabGroups || []).forEach((group, index) => {
    const isNote = group.type === 'note';
    const isActive = !isNote && !!group.isActive;
    const chip = document.createElement('button');
    chip.className = 'tgm-chip' + (isActive ? ' tgm-active' : '') + (isNote ? ' tgm-chip-note' : '');
    chip.dataset.groupId = group.id;

    // Right-click: cleanly close and dissolve open tabs (same as the Close button inside dropdown)
    chip.addEventListener('contextmenu', e => {
      e.preventDefault();
      e.stopPropagation();
      _tgmCloseDropdown();
      closeGroup(group.id);
    });
    chip.addEventListener('dragstart', e => e.preventDefault());

    if (isActive) {
      // Colour accent only for ACTIVE group chips. Note chips show colour via
      // their tgm-dot only (set below) — no whole-chip tint.
      chip.style.borderColor = group.color + '80';   // shorthand first...
      chip.style.borderLeftColor = group.color;      // ...then the solid left accent
      chip.style.background = group.color + '26';
    } else {
      chip.style.borderLeftColor = '';
      chip.style.borderColor = '';
      chip.style.background = '';
    }

    const dot = document.createElement('span');
    dot.className = 'tgm-dot';
    dot.style.background = group.color;
    dot.style.color = group.color;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'tgm-chip-name';
    nameSpan.textContent = group.name;
    nameSpan.title = group.name;

    chip.appendChild(dot);
    chip.appendChild(nameSpan);

    if (isActive) {
      const badge = document.createElement('span');
      badge.className = 'tgm-chip-badge';
      badge.textContent = 'ACTIVE';
      chip.appendChild(badge);
    }

    const arrow = document.createElement('span');
    arrow.className = 'tgm-arrow';
    arrow.textContent = '▾';
    chip.appendChild(arrow);

    // ── X-Axis Locked Pointer Dragging & Reordering ──
    chip.addEventListener('pointerdown', e => {
      if (e.button !== 0) return; // Only primary mouse button

      const startX = e.clientX;
      let isDragging = false;
      let currentTargetIndex = index;
      const groups = state.tabGroups || [];
      const totalChips = groups.length;
      const stride = 143; // 135px chip width + 8px gap

      const onPointerMove = moveEvent => {
        const deltaX = moveEvent.clientX - startX;
        if (!isDragging) {
          if (Math.abs(deltaX) > 4) {
            isDragging = true;
            _tgmCloseDropdown();
            clearTimeout(_tgmHoverOpenTimer);
            try { chip.setPointerCapture(e.pointerId); } catch (_) {}
            chip.classList.add('tgm-pointer-dragging');
            if (scroll) scroll.classList.add('tgm-is-dragging');
          } else {
            return;
          }
        }

        // Strictly constrain deltaX so the chip stays within the tab strip bounds
        const minDeltaX = -index * stride;
        const maxDeltaX = (totalChips - 1 - index) * stride;
        const clampedDeltaX = Math.max(minDeltaX, Math.min(maxDeltaX, deltaX));

        // LOCKED STRICTLY TO X-AXIS: zero vertical translation
        chip.style.transform = `translateX(${clampedDeltaX}px)`;

        // Calculate nearest target slot
        const targetIndex = Math.max(0, Math.min(totalChips - 1, Math.round(index + clampedDeltaX / stride)));
        if (targetIndex !== currentTargetIndex) {
          currentTargetIndex = targetIndex;
          _tgmApplyPushAside(index, currentTargetIndex);
        }
      };

      const onPointerUp = async upEvent => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);

        try {
          if (chip.hasPointerCapture(e.pointerId)) {
            chip.releasePointerCapture(e.pointerId);
          }
        } catch (_) {}

        if (!isDragging) return;

        _tgmJustDragged = true;
        setTimeout(() => { _tgmJustDragged = false; }, 120);

        const fromIdx = index;
        const toIdx = currentTargetIndex;

        _tgmResetPushAside();

        if (fromIdx !== toIdx && fromIdx >= 0 && toIdx >= 0 && state.tabGroups) {
          const [movedGroup] = state.tabGroups.splice(fromIdx, 1);
          state.tabGroups.splice(toIdx, 0, movedGroup);
          await saveState();
        }

        renderGroupBar();
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    });

    // ── Open on Mouse Hover detection ──
    chip.addEventListener('mouseenter', () => {
      if (_tgmJustDragged || chip.classList.contains('tgm-pointer-dragging') || (scroll && scroll.classList.contains('tgm-is-dragging'))) return;
      _tgmCancelClose();
      if (_tgmOpenDd && _tgmOpenDd.groupId === group.id) return;

      const delay = _tgmOpenDd ? 30 : 90;
      clearTimeout(_tgmHoverOpenTimer);
      _tgmHoverOpenTimer = setTimeout(() => {
        _tgmCloseDropdown();
        _tgmOpenDropdown(group.id, chip);
      }, delay);
    });

    chip.addEventListener('mouseleave', e => {
      clearTimeout(_tgmHoverOpenTimer);
      if (_tgmOpenDd && _tgmOpenDd.ddEl && e.relatedTarget && _tgmOpenDd.ddEl.contains(e.relatedTarget)) {
        return;
      }
      _tgmScheduleClose();
    });

    // Click toggle fallback
    chip.addEventListener('click', e => {
      e.stopPropagation();
      if (_tgmJustDragged) return;
      clearTimeout(_tgmHoverOpenTimer);
      _tgmCancelClose();
      if (_tgmOpenDd && _tgmOpenDd.groupId === group.id) {
        _tgmCloseDropdown();
        return;
      }
      _tgmCloseDropdown();
      _tgmOpenDropdown(group.id, chip);
    });

    scroll.appendChild(chip);
  });
}

// ─── Build & show the dropdown panel for a NOTE ───
function _tgmOpenNoteDropdown(group, chipEl) {
  const dd = document.createElement('div');
  dd.className = 'tgm-dropdown tgm-dropdown-note tgm-dd-open';

  // Ensure fields exist
  group.noteMode = group.noteMode || 'checklist';
  group.checklist = Array.isArray(group.checklist) ? group.checklist : [];
  group.textContent = group.textContent || '';

  // 1. Header
  const header = document.createElement('div');
  header.className = 'tgm-dd-header';

  const dot = document.createElement('span');
  dot.className = 'tgm-dot';
  dot.style.background = group.color;
  dot.style.color = group.color;
  dot.style.boxShadow = `0 0 8px ${group.color}80`;
  dot.style.flexShrink = '0';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'tgm-dd-title-wrap';

  const nameEl = document.createElement('span');
  nameEl.className = 'tgm-dd-name';
  nameEl.textContent = group.name;
  nameEl.title = group.name;

  titleWrap.appendChild(dot);
  titleWrap.appendChild(nameEl);

  // Mode Switcher: [ Checklist | Text ]
  const modeToggle = document.createElement('div');
  modeToggle.className = 'tgm-note-mode-toggle';

  const btnChecklist = document.createElement('button');
  btnChecklist.className = 'tgm-note-mode-btn' + (group.noteMode === 'checklist' ? ' active' : '');
  btnChecklist.textContent = 'Checklist';

  const btnText = document.createElement('button');
  btnText.className = 'tgm-note-mode-btn' + (group.noteMode === 'text' ? ' active' : '');
  btnText.textContent = 'Text';

  modeToggle.appendChild(btnChecklist);
  modeToggle.appendChild(btnText);

  // Rename Button
  const renameBtn = document.createElement('button');
  renameBtn.className = 'tgm-dd-hbtn';
  renameBtn.title = 'Rename Note';
  renameBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  renameBtn.addEventListener('click', e => {
    e.stopPropagation();
    _tgmCloseDropdown();
    _tgmOpenModal({
      title: 'Rename Note',
      showColorPicker: true, // same picker as group rename — the modal renders it
      showInput: true,
      inputValue: group.name,
      saveBtnText: 'Rename',
      onSave: (newName, _url, _type, pickedColor) => {
        const trimmed = (newName || '').trim();
        if (!trimmed) return;
        group.name = trimmed;
        // Notes have no native Chrome group — just store the colour locally
        if (pickedColor) group.color = pickedColor;
        saveState();
        renderGroupBar();
        _tgmShowToast(`Note renamed to "${trimmed}"`);
      }
    });
  });

  // Delete Button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'tgm-dd-hbtn tgm-dd-hbtn-del';
  deleteBtn.title = 'Delete Note';
  deleteBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
  deleteBtn.addEventListener('click', e => {
    e.stopPropagation();
    _tgmCloseDropdown();
    _tgmOpenModal({
      title: `Delete "${group.name}"?`,
      body: 'This note and all its contents will be permanently deleted.',
      showInput: false,
      showDelete: true,
      onDelete: () => {
        _tgmDeletedIds.add(group.id); // prevent storage-merge from re-adding this note
        state.tabGroups = (state.tabGroups || []).filter(g => g.id !== group.id);
        saveState();
        renderGroupBar();
        _tgmShowToast(`Note "${group.name}" deleted.`);
      }
    });
  });

  header.appendChild(titleWrap);
  header.appendChild(modeToggle);
  header.appendChild(renameBtn);
  header.appendChild(deleteBtn);
  dd.appendChild(header);

  // 2. Body
  const body = document.createElement('div');
  body.className = 'tgm-note-body';
  dd.appendChild(body);

  // 3. Footer
  const footer = document.createElement('div');
  footer.className = 'tgm-note-footer';

  const statusWrap = document.createElement('div');
  statusWrap.className = 'tgm-note-saved-status';
  statusWrap.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> <span>Saved</span>`;

  const footerBtns = document.createElement('div');
  footerBtns.className = 'tgm-note-footer-btns';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'tgm-note-btn tgm-note-btn-copy';
  copyBtn.title = 'Copy note content to clipboard';
  copyBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Copy All</span>`;

  const clearAllBtn = document.createElement('button');
  clearAllBtn.className = 'tgm-note-btn tgm-note-btn-clear';
  clearAllBtn.title = 'Clear content';
  clearAllBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg><span>Clear All</span>`;

  footerBtns.appendChild(copyBtn);
  footerBtns.appendChild(clearAllBtn);

  footer.appendChild(statusWrap);
  footer.appendChild(footerBtns);
  dd.appendChild(footer);

  // Synchronous immediate save for click actions (checkboxes, deletes, adds, clears)
  function saveImmediate() {
    clearTimeout(saveTimer);
    group.updatedAt = Date.now();
    saveState();
    statusWrap.style.opacity = '1';
    const statusText = statusWrap.querySelector('span');
    if (statusText) statusText.textContent = 'Saved';
  }

  // Debounced auto-save for typing in text input and textarea
  let saveTimer = null;
  function triggerAutoSave() {
    statusWrap.style.opacity = '0.5';
    const statusText = statusWrap.querySelector('span');
    if (statusText) statusText.textContent = 'Saving...';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveImmediate();
    }, 250);
  }

  // Copy button handler
  copyBtn.addEventListener('click', e => {
    e.stopPropagation();
    let textToCopy = '';
    if (group.noteMode === 'checklist') {
      textToCopy = (group.checklist || []).map(item => `[${item.done ? 'x' : ' '}] ${item.text}`).join('\n');
    } else {
      textToCopy = group.textContent || '';
    }
    if (!textToCopy.trim()) {
      _tgmShowToast('Note is empty');
      return;
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
      const span = copyBtn.querySelector('span');
      if (span) {
        const orig = span.textContent;
        span.textContent = 'Copied!';
        setTimeout(() => { span.textContent = orig; }, 1500);
      }
    });
  });

  // Clear handler (clears checklist in checklist mode, or clears text in text mode)
  clearAllBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (group.noteMode === 'checklist') {
      if (!group.checklist || group.checklist.length === 0) return;
      group.checklist = [];
      saveImmediate();
      renderChecklistView();
      _tgmShowToast('Checklist cleared');
    } else {
      if (!group.textContent) return;
      group.textContent = '';
      const ta = body.querySelector('.tgm-note-textarea');
      if (ta) ta.value = '';
      saveImmediate();
      _tgmShowToast('Note cleared');
    }
  });

  // Render checklist view
  function renderChecklistView() {
    body.innerHTML = '';
    clearAllBtn.style.display = '';

    const listWrap = document.createElement('div');
    listWrap.className = 'tgm-note-checklist-wrap';

    const itemsList = document.createElement('div');
    itemsList.className = 'tgm-note-items-list';

    if (!group.checklist || group.checklist.length === 0) {
      const emptyNotice = document.createElement('div');
      emptyNotice.className = 'tgm-note-empty-notice';
      emptyNotice.textContent = 'No tasks yet. Add one below!';
      itemsList.appendChild(emptyNotice);
    } else {
      group.checklist.forEach((item, idx) => {
        const itemRow = document.createElement('div');
        itemRow.className = 'tgm-checklist-item' + (item.done ? ' done' : '');

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'tgm-checklist-cb';
        cb.checked = !!item.done;
        cb.addEventListener('change', e => {
          e.stopPropagation();
          item.done = cb.checked;
          if (item.done) itemRow.classList.add('done');
          else itemRow.classList.remove('done');
          saveImmediate();
        });

        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.className = 'tgm-checklist-input';
        textInput.value = item.text || '';
        textInput.placeholder = 'Task...';
        textInput.addEventListener('input', () => {
          item.text = textInput.value;
          triggerAutoSave();
        });
        textInput.addEventListener('keydown', ev => {
          if (ev.key === 'Enter') {
            ev.preventDefault();
            const addInput = listWrap.querySelector('.tgm-checklist-add-input');
            if (addInput) addInput.focus();
          }
        });

        const delBtn = document.createElement('button');
        delBtn.className = 'tgm-checklist-del';
        delBtn.innerHTML = '&times;';
        delBtn.title = 'Delete task';
        delBtn.addEventListener('click', e => {
          e.stopPropagation();
          group.checklist.splice(idx, 1);
          saveImmediate();
          renderChecklistView();
        });

        itemRow.appendChild(cb);
        itemRow.appendChild(textInput);
        itemRow.appendChild(delBtn);
        itemsList.appendChild(itemRow);
      });
    }

    const addRow = document.createElement('div');
    addRow.className = 'tgm-checklist-add-row';

    const addIcon = document.createElement('span');
    addIcon.className = 'tgm-checklist-add-icon';
    addIcon.textContent = '+';

    const addInput = document.createElement('input');
    addInput.type = 'text';
    addInput.className = 'tgm-checklist-add-input';
    addInput.placeholder = 'Add a task... (Press Enter)';

    addInput.addEventListener('keydown', ev => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        const val = addInput.value.trim();
        if (!val) return;
        group.checklist = group.checklist || [];
        group.checklist.push({
          id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          text: val,
          done: false
        });
        saveImmediate();
        renderChecklistView();
        setTimeout(() => {
          const fresh = body.querySelector('.tgm-checklist-add-input');
          if (fresh) fresh.focus();
        }, 30);
      }
    });

    addRow.appendChild(addIcon);
    addRow.appendChild(addInput);

    listWrap.appendChild(itemsList);
    listWrap.appendChild(addRow);
    body.appendChild(listWrap);
  }

  // Render text view
  function renderTextView() {
    body.innerHTML = '';
    clearAllBtn.style.display = '';

    const textWrap = document.createElement('div');
    textWrap.className = 'tgm-note-text-wrap';

    const textarea = document.createElement('textarea');
    textarea.className = 'tgm-note-textarea';
    textarea.placeholder = 'Write your notes, scratchpad, ideas here...';
    textarea.value = group.textContent || '';

    textarea.addEventListener('input', () => {
      group.textContent = textarea.value;
      triggerAutoSave();
    });

    textWrap.appendChild(textarea);
    body.appendChild(textWrap);
  }

  // Initial view
  if (group.noteMode === 'text') renderTextView();
  else renderChecklistView();

  // Mode toggling
  btnChecklist.addEventListener('click', e => {
    e.stopPropagation();
    if (group.noteMode === 'checklist') return;
    group.noteMode = 'checklist';
    btnChecklist.classList.add('active');
    btnText.classList.remove('active');
    triggerAutoSave();
    renderChecklistView();
  });

  btnText.addEventListener('click', e => {
    e.stopPropagation();
    if (group.noteMode === 'text') return;
    group.noteMode = 'text';
    btnText.classList.add('active');
    btnChecklist.classList.remove('active');
    triggerAutoSave();
    renderTextView();
  });

  // Hover and close: keep open while focused in note inputs
  dd.addEventListener('mouseenter', () => {
    _tgmCancelClose();
  });
  dd.addEventListener('mouseleave', e => {
    if (chipEl && e.relatedTarget && chipEl.contains(e.relatedTarget)) {
      return;
    }
    const activeEl = document.activeElement;
    if (activeEl && dd.contains(activeEl) && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
      return;
    }
    _tgmScheduleClose();
  });

  // Append and position
  document.body.appendChild(dd);
  const chipRect = chipEl.getBoundingClientRect();
  dd.style.left = Math.min(Math.max(10, chipRect.left), window.innerWidth - 350) + 'px';
  dd.style.top  = (chipRect.bottom + 6) + 'px';

  _tgmOpenDd = { chipEl, ddEl: dd, groupId: group.id };
}

// ─── Build & show the dropdown panel for a group ───
// Shared empty-state markup for a group with no saved tabs
const TGM_EMPTY_TABS_HTML = `
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3"/>
    <path d="M3 9h18"/>
    <path d="M9 21V9"/>
  </svg>
  <div class="tgm-empty-title">No tabs saved yet</div>
  <div class="tgm-empty-desc">Open pages while Active to save them</div>
`;

function _tgmOpenDropdown(groupId, chipEl) {
  const group = (state.tabGroups || []).find(g => g.id === groupId);
  if (!group) return;

  if (group.type === 'note') {
    _tgmOpenNoteDropdown(group, chipEl);
    return;
  }

  const dd = document.createElement('div');
  dd.className = 'tgm-dropdown tgm-dd-open';

  // ── Header: dot + name & count + active toggle + rename + delete ──
  const header = document.createElement('div');
  header.className = 'tgm-dd-header';

  const dot = document.createElement('span');
  dot.className = 'tgm-dot';
  dot.style.background = group.color;
  dot.style.color = group.color;
  dot.style.boxShadow = `0 0 8px ${group.color}80`;
  dot.style.flexShrink = '0';

  const titleWrap = document.createElement('div');
  titleWrap.className = 'tgm-dd-title-wrap';

  const nameEl = document.createElement('span');
  nameEl.className = 'tgm-dd-name';
  nameEl.textContent = group.name;

  const tabCount = (group.tabs || []).length;
  const countBadge = document.createElement('span');
  countBadge.className = 'tgm-dd-badge';
  countBadge.textContent = `${tabCount} tab${tabCount === 1 ? '' : 's'}`;

  titleWrap.appendChild(nameEl);
  titleWrap.appendChild(countBadge);

  // Active / Inactive toggle button (with Native Tab Group sync)
  const activeToggle = document.createElement('button');
  activeToggle.className = 'tgm-active-toggle' + (group.isActive ? ' is-active' : '');
  activeToggle.title = group.isActive
    ? 'Click to make Inactive'
    : (isChromeGroupSyncEnabled() ? 'Click to make Active (links with native Chrome group)' : 'Click to make Active (automatically saves new tabs)');

  const statusDot = document.createElement('span');
  statusDot.className = 'tgm-status-dot';
  const statusText = document.createElement('span');
  statusText.textContent = group.isActive ? 'Active' : 'Set Active';
  activeToggle.appendChild(statusDot);
  activeToggle.appendChild(statusText);

  activeToggle.addEventListener('click', async e => {
    e.stopPropagation();
    const cur = () => _tgmGetGroup(groupId) || group;
    if (cur().isActive) {
      // ── Deactivate ──
      const g = cur();
      g.isActive = false;
      g.nativeGroupId = null;
      g.hasCreatedNativeGroup = false;
      g._tgmCreating = false;
      await saveState();
      _tgmCloseDropdown();
      renderGroupBar();
      _tgmShowToast(`"${g.name}" is now Inactive.`);
    } else {
      // ── Activate ──
      (state.tabGroups || []).forEach(x => { x.isActive = false; });
      let g = cur();
      g.isActive = true;

      // Track all open new tab pages (including current tab) under this active group so the first opened page is saved!
      g.chromeTabIds = g.chromeTabIds || [];
      try {
        const allTabs = await chrome.tabs.query({}).catch(() => []);
        for (const t of allTabs) {
          if (t && t.id != null) {
            const u = t.url || t.pendingUrl || '';
            const isNtp = !u || u === 'chrome://newtab/' || u === 'chrome://newtab' ||
                          u.startsWith('chrome-extension://') || u.startsWith('about:blank');
            if (isNtp && !g.chromeTabIds.includes(t.id)) {
              g.chromeTabIds.push(t.id);
            }
          }
        }
      } catch (_) {}

      if (!isChromeGroupSyncEnabled()) {
        g.nativeGroupId = null;
        g.hasCreatedNativeGroup = false;
        g._tgmCreating = false;
        await saveState();
        _tgmCloseDropdown();
        renderGroupBar();
        _tgmShowToast(`"${g.name}" is now Active. Next tabs will be saved here.`);
        return;
      }

      g._tgmCreating = true;
      g._tgmCreatingTime = Date.now();
      await saveState();
      renderGroupBar();
      _tgmShowToast(`Connecting "${g.name}" in Chrome Tab Bar...`);

      try {
        const nativeId = await _tgmCreateOrAttachNativeGroup(cur());
        g = cur();                       // re-resolve after the awaits
        if (nativeId) {
          g.nativeGroupId = nativeId;
          g.hasCreatedNativeGroup = true;
        }
        g._tgmCreating = false;
        await saveState();
        _tgmCloseDropdown();
        renderGroupBar();
        _tgmShowToast(`"${g.name}" is now Active. Next tabs will be added here.`);
      } catch (err) {
        cur()._tgmCreating = false;
        await saveState();
        console.warn('[TGM] activate error:', err);
      }
    }
  });

  const renameBtn = document.createElement('button');
  renameBtn.className = 'tgm-dd-hbtn';
  renameBtn.title = 'Rename group';
  renameBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`;
  renameBtn.addEventListener('click', e => {
    e.stopPropagation();
    _tgmCloseDropdown();
    renameGroup(groupId);
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'tgm-dd-hbtn tgm-dd-hbtn-del';
  deleteBtn.title = 'Delete group';
  deleteBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
  deleteBtn.addEventListener('click', e => {
    e.stopPropagation();
    _tgmCloseDropdown();
    deleteGroup(groupId);
  });

  header.appendChild(dot);
  header.appendChild(titleWrap);
  header.appendChild(activeToggle);
  header.appendChild(renameBtn);
  header.appendChild(deleteBtn);
  dd.appendChild(header);

  // ── Tab list ──
  const tabList = document.createElement('div');
  tabList.className = 'tgm-dd-tabs';

  if (!group.tabs || group.tabs.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'tgm-dd-empty';
    empty.innerHTML = TGM_EMPTY_TABS_HTML;
    tabList.appendChild(empty);
  } else {
    group.tabs.forEach((tab, idx) => {
      const row = document.createElement('div');
      row.className = 'tgm-tab-row';

      const fav = document.createElement('img');
      fav.className = 'tgm-tab-favicon';
      fav.alt = '';
      fav.src = tab.favicon ||
        `https://www.google.com/s2/favicons?sz=16&domain_url=${encodeURIComponent(tab.url)}`;
      fav.onerror = () => { fav.style.display = 'none'; };

      const titleSpan = document.createElement('span');
      titleSpan.className = 'tgm-tab-title';
      titleSpan.textContent = tab.title || tab.url;
      titleSpan.title = tab.url;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'tgm-tab-remove';
      removeBtn.title = 'Remove from group';
      removeBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
      removeBtn.addEventListener('click', async e => {
        e.stopPropagation();
        const g = _tgmGetGroup(groupId) || group;
        const i = (g.tabs || []).findIndex(t => t.url === tab.url);
        if (i < 0) return;
        const ddEl = row.closest('.tgm-dropdown'); // capture before the row is removed
        const [removed] = g.tabs.splice(i, 1);
        if (removed && removed.chromeTabId != null) {
          g.chromeTabIds = (g.chromeTabIds || []).filter(id => id !== removed.chromeTabId);
          g.removedTabIds = g.removedTabIds || [];
          if (!g.removedTabIds.includes(removed.chromeTabId)) {
            g.removedTabIds.push(removed.chromeTabId);
          }
        }

        // Update the open dropdown in place — no close/reopen, so no flicker
        row.remove();
        const left = (g.tabs || []).length;
        const badge = ddEl && ddEl.querySelector('.tgm-dd-badge');
        if (badge) badge.textContent = `${left} tab${left === 1 ? '' : 's'}`;
        if (left === 0 && ddEl) {
          const list = ddEl.querySelector('.tgm-dd-tabs');
          if (list) list.innerHTML = `<div class="tgm-dd-empty">${TGM_EMPTY_TABS_HTML}</div>`;
        }

        // Ungroup (don't close) the live tab, otherwise its next page load re-saves it
        await _tgmDetachFromChrome(g, removed);
        await saveState();
        _tgmShowToast(`Removed tab from "${g.name}".`);
      });

      // Click row → open URL
      row.addEventListener('click', e => {
        if (e.target.closest('.tgm-tab-remove')) return;
        window.location.href = tab.url;
      });

      row.appendChild(fav);
      row.appendChild(titleSpan);
      row.appendChild(removeBtn);
      tabList.appendChild(row);
    });
  }
  dd.appendChild(tabList);

  // ── Action buttons: Open Here / Close Group / Open in New Window ──
  const actions = document.createElement('div');
  actions.className = 'tgm-dd-actions';

  const openHere = document.createElement('button');
  openHere.className = 'tgm-btn-open';
  openHere.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg><span>Open Here</span>`;
  openHere.title = 'Open saved tabs in current window (does not activate group)';
  openHere.addEventListener('click', e => {
    e.stopPropagation();
    _tgmCloseDropdown();
    openGroupInCurrentWindow(groupId);
  });

  const closeBtn = document.createElement('button');
  closeBtn.className = 'tgm-btn-close';
  closeBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg><span>Close</span>`;
  closeBtn.title = 'Cleanly close and dissolve open tabs without Chrome saving duplicate ghosts';
  closeBtn.addEventListener('click', e => {
    e.stopPropagation();
    _tgmCloseDropdown();
    closeGroup(groupId);
  });

  const openWin = document.createElement('button');
  openWin.className = 'tgm-btn-new-win';
  openWin.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg><span>New Window</span>`;
  openWin.title = 'Open saved tabs in a new window (does not activate group)';
  openWin.addEventListener('click', e => {
    e.stopPropagation();
    _tgmCloseDropdown();
    openGroupInNewWindow(groupId);
  });

  actions.appendChild(openHere);
  actions.appendChild(openWin);
  actions.appendChild(closeBtn);

  dd.appendChild(actions);

  // ── Hover handling on dropdown panel ──
  dd.addEventListener('mouseenter', () => {
    _tgmCancelClose();
  });
  dd.addEventListener('mouseleave', e => {
    if (chipEl && e.relatedTarget && chipEl.contains(e.relatedTarget)) {
      return;
    }
    _tgmScheduleClose();
  });

  // ── Position dropdown ──
  document.body.appendChild(dd);
  const chipRect = chipEl.getBoundingClientRect();
  dd.style.left = Math.min(Math.max(10, chipRect.left), window.innerWidth - 330) + 'px';
  dd.style.top  = (chipRect.bottom + 6) + 'px';

  _tgmOpenDd = { chipEl, ddEl: dd, groupId };
}

// ─── [+] New Group / Note button ───
document.getElementById('tgm-add-btn').addEventListener('click', e => {
  e.stopPropagation();
  _tgmCloseDropdown();
  _tgmOpenModal({
    showTypeSlider: true,
    defaultType: 'group',
    title: 'New Tab Group',
    showColorPicker: true,
    showInput: true,
    inputPlaceholder: 'Group name',
    saveBtnText: 'Create Group',
    onSave: (name, urlVal, type, pickedColor) => {
      const trimmed = (name || '').trim();
      if (!trimmed) return;

      state.tabGroups = state.tabGroups || [];
      _tgmDeduplicateGroups();

      const chosenType = type || 'group';
      const idx   = state.tabGroups.length;
      const color = pickedColor || GROUP_COLORS[idx % GROUP_COLORS.length];

      if (chosenType === 'note') {
        const newNote = {
          id: 'note_' + Date.now(),
          type: 'note',
          name: trimmed,
          color,
          noteMode: 'checklist',
          checklist: [],
          textContent: '',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        state.tabGroups.push(newNote);
        saveState();
        renderGroupBar();
        _tgmShowToast(`Note "${trimmed}" created!`);

        setTimeout(() => {
          const chipEl = document.querySelector(`.tgm-chip[data-group-id="${newNote.id}"]`);
          if (chipEl) {
            _tgmCloseDropdown();
            _tgmOpenDropdown(newNote.id, chipEl);
          }
        }, 100);
      } else {
        // Avoid duplicate groups in top colour bar
        const alreadyExists = state.tabGroups.some(g => (g.type !== 'note') && g.name.trim().toLowerCase() === trimmed.toLowerCase());
        if (alreadyExists) {
          _tgmShowToast(`A group named "${trimmed}" already exists in the top bar!`);
          return;
        }

        state.tabGroups.push({
          id: 'tg_' + Date.now(),
          type: 'group',
          name: trimmed,
          color,
          isActive: false,
          nativeGroupId: null,
          hasCreatedNativeGroup: false,
          chromeTabIds: [],
          tabs: [],
        });
        saveState();
        renderGroupBar();
        _tgmShowToast(`Group "${trimmed}" created! Click it to add tabs.`);
      }
    }
  });
});

// ─── Option 1: Right-click creates a new tab inside this group ───
async function _tgmCreateNewTabInGroup(groupId) {
  const group = _tgmGetGroup(groupId);
  if (!group || group.type === 'note') return;

  try {
    const win = await chrome.windows.getCurrent();

    if (!isChromeGroupSyncEnabled()) {
      // If native Chrome group sync is disabled, create an active new tab
      await chrome.tabs.create({ windowId: win.id, active: true });
      _tgmShowToast(`Opened new tab for "${group.name}"`);
      return;
    }

    // Check if the group is already live in this window
    let native = await _tgmFindMatchingChromeGroup(group, win.id);
    if (!native && group.isActive) {
      native = await _tgmFindMatchingChromeGroup(group);
    }

    let tab;
    if (native) {
      // Group already exists in Chrome: create tab inside its window and append to group
      tab = await chrome.tabs.create({ windowId: native.windowId, active: true });
      await chrome.tabs.group({ tabIds: [tab.id], groupId: native.id }).catch(() => {});
    } else {
      // Group is not live yet: create tab, turn it into a new native group matching this group
      tab = await chrome.tabs.create({ windowId: win.id, active: true });
      const newNativeId = await chrome.tabs.group({ tabIds: [tab.id] });
      await chrome.tabGroups.update(newNativeId, {
        title: group.name,
        color: hexToChromeColor(group.color),
        collapsed: false
      }).catch(() => {});
      group.nativeGroupId = newNativeId;
      group.hasCreatedNativeGroup = true;
    }

    if (tab && tab.id) {
      group.chromeTabIds = group.chromeTabIds || [];
      if (!group.chromeTabIds.includes(tab.id)) {
        group.chromeTabIds.push(tab.id);
      }
      await saveState();
    }

    _tgmShowToast(`➕ New tab created in "${group.name}"!`);
  } catch (err) {
    console.warn('[TGM] _tgmCreateNewTabInGroup error:', err);
    _tgmShowToast(`Could not create tab: ${err.message || 'unknown error'}`);
  }
}

// ─── Helper: add tab object to group ───
// existingTabId: a tab that is ALREADY open -> it is grouped, never duplicated.
// without it (manual URL) a Chrome tab is opened only if the group is live.
async function _tgmAddTabObjectToGroup(groupRef, { title, url, favicon, existingTabId }) {
  const groupId = groupRef && groupRef.id;
  const group = _tgmGetGroup(groupId) || groupRef;
  if (!group || !url) return;

  const n = _tgmNormalizeUrl(url);
  if ((group.tabs || []).some(t => _tgmNormalizeUrl(t.url) === n)) {
    _tgmShowToast(`"${title || url}" is already in this group!`);
    return;
  }

  const encoded = encodeURIComponent(url);
  const fav = favicon ||
    `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encoded}&size=64`;
  const label = title || _getCleanHostname(url);

  group.tabs = group.tabs || [];
  const entry = { title: label, url, favicon: fav };
  if (existingTabId != null) entry.chromeTabId = existingTabId;
  group.tabs.push(entry);

  await saveState();
  _tgmCloseDropdown();
  renderGroupBar();
  _tgmShowToast(`Added "${label}" to ${group.name}!`);

  // Reflect it in Chrome if this group is currently live (or active)
  if (!isChromeGroupSyncEnabled()) return;
  try {
    if (existingTabId != null) {
      await _tgmAttachTab(groupId, existingTabId, url, false);
      return;
    }
    await _tgmWithLock(groupId, async () => {
      const win = await chrome.windows.getCurrent();
      let cur = _tgmGetGroup(groupId) || group;
      let native = await _tgmFindMatchingChromeGroup(cur, win.id);
      cur = _tgmGetGroup(groupId) || cur;
      if (!native && cur.isActive) native = await _tgmFindMatchingChromeGroup(cur);
      if (!native && !(_tgmGetGroup(groupId) || cur).isActive) return;   // group not live: just saved
      const t = await chrome.tabs.create({ url, windowId: native ? native.windowId : win.id, active: false });
      if (t && t.id) await _tgmAttachTab(groupId, t.id, url, true);
    });
  } catch (err) {
    console.warn('[TGM] error attaching added tab in Chrome:', err);
  }
}

// ─── Modal to add tab manually (or pick open tab) ───
async function _tgmOpenAddTabModal(groupId) {
  const group = (state.tabGroups || []).find(g => g.id === groupId);
  if (!group) return;

  let openWebTabs = [];
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    openWebTabs = (tabs || []).filter(t => {
      if (!t.url) return false;
      return !t.url.startsWith('chrome://') &&
             !t.url.startsWith('chrome-extension://') &&
             !t.url.startsWith('about:') &&
             !t.url.startsWith('edge://');
    });
  } catch (_) {}

  _tgmOpenModal({
    title: `Add Tab to "${group.name}"`,
    showInput: true,
    inputPlaceholder: 'Tab Title (optional)',
    showUrlInput: true,
    urlPlaceholder: 'URL (e.g. github.com or https://youtube.com)',
    saveBtnText: 'Add Tab',
    tabPickerItems: openWebTabs,
    onTabPick: async tab => {
      _tgmCloseModal();
      const g = _tgmGetGroup(groupId);
      if (!g) return;
      const encoded = encodeURIComponent(tab.url);
      const fav = tab.favIconUrl ||
        `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encoded}&size=64`;

      g.tabs = g.tabs || [];
      const n = _tgmNormalizeUrl(tab.url);
      if (!g.tabs.some(t => _tgmNormalizeUrl(t.url) === n)) {
        g.tabs.push({
          title: tab.title || _getCleanHostname(tab.url),
          url: tab.url,
          favicon: fav,
          chromeTabId: tab.id
        });
      }

      // Group this already-open tab (no new tab is created)
      try {
        await _tgmAttachTab(groupId, tab.id, tab.url, true);
      } catch (err) {
        console.warn('[TGM] onTabPick grouping error:', err);
      }

      await saveState();
      _tgmCloseDropdown();
      renderGroupBar();
      _tgmShowToast(`Added "${tab.title || _getCleanHostname(tab.url)}" to ${g.name}!`);
    },
    onSave: async (titleVal, urlVal) => {
      let rawUrl = (urlVal || '').trim();
      let rawTitle = (titleVal || '').trim();

      if (!rawUrl && rawTitle && (rawTitle.includes('.') || rawTitle.startsWith('http'))) {
        rawUrl = rawTitle;
        rawTitle = '';
      }

      if (!rawUrl) {
        _tgmShowToast('Please enter a URL to add.');
        return;
      }

      if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
        rawUrl = 'https://' + rawUrl;
      }

      try {
        new URL(rawUrl);
      } catch (e) {
        _tgmShowToast('Invalid URL entered.');
        return;
      }

      await _tgmAddTabObjectToGroup(group, {
        title: rawTitle || _getCleanHostname(rawUrl),
        url: rawUrl
      });
    }
  });
}

// ─── addCurrentTabToGroup ───
async function addCurrentTabToGroup(groupId) {
  const group = (state.tabGroups || []).find(g => g.id === groupId);
  if (!group) return;

  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const webTabs = (tabs || []).filter(t => {
      if (!t.url) return false;
      return !t.url.startsWith('chrome://') &&
             !t.url.startsWith('chrome-extension://') &&
             !t.url.startsWith('about:') &&
             !t.url.startsWith('edge://');
    });

    if (webTabs.length === 0) {
      _tgmCloseDropdown();
      _tgmShowToast('No other open web tabs found. Enter a URL manually.');
      _tgmOpenAddTabModal(groupId);
      return;
    }

    if (webTabs.length === 1) {
      _tgmCloseDropdown();
      const targetTab = webTabs[0];
      await _tgmAddTabObjectToGroup(group, {
        title: targetTab.title || targetTab.url,
        url: targetTab.url,
        favicon: targetTab.favIconUrl,
        existingTabId: targetTab.id     // group the open tab; do NOT open a second copy
      });
      return;
    }

    _tgmCloseDropdown();
    _tgmOpenAddTabModal(groupId);
  } catch (err) {
    console.warn('[TGM] addCurrentTabToGroup error:', err);
    _tgmCloseDropdown();
    _tgmOpenAddTabModal(groupId);
  }
}

// ─── openGroupInCurrentWindow ───
async function openGroupInCurrentWindow(groupId) {
  const group = _tgmGetGroup(groupId);
  if (!group) return;
  // The group is NOT made active.

  if (!group.tabs || group.tabs.length === 0) {
    _tgmShowToast(`"${group.name}" is empty! Add tabs first.`);
    return;
  }
  if (!group.tabs.some(t => t.url)) {
    _tgmShowToast(`"${group.name}" has no valid URLs.`);
    return;
  }

  try {
    // Lock covers EVERY group in background.js, so an active Group A can't hijack these tabs
    await _tgmWithLock(groupId, async () => {
      const cur = () => _tgmGetGroup(groupId) || group;
      const currentWindow = await chrome.windows.getCurrent();

      if (!isChromeGroupSyncEnabled()) {
        // Native group sync is OFF: open tabs as regular standalone tabs
        const tabIds = [];
        const pairs = [];
        for (const e of (cur().tabs || []).filter(x => x.url).map(x => x.url)) {
          try {
            const t = await chrome.tabs.create({ url: e, windowId: currentWindow.id, active: false });
            if (t && t.id) { tabIds.push(t.id); pairs.push([e, t.id]); }
          } catch (err) {
            console.warn('[TGM] tab create error:', err);
          }
        }
        if (tabIds.length > 0) {
          const g = cur();
          g.chromeTabIds = tabIds;
          _tgmBindPairs(g, pairs);
          await saveState();
          await chrome.tabs.update(tabIds[0], { active: true }).catch(() => {});
        }
        _tgmShowToast(`Opened "${cur().name}" with ${tabIds.length} tabs!`);
        return;
      }

      const existingGroup = await _tgmFindMatchingChromeGroup(cur(), currentWindow.id);

      if (existingGroup) {
        // Same-named Chrome group exists: update it, add what's missing, close NOTHING
        await chrome.tabGroups.update(existingGroup.id, {
          title: cur().name,
          color: hexToChromeColor(cur().color),
          collapsed: false
        }).catch(() => {});
        cur().nativeGroupId = existingGroup.id;
        cur().hasCreatedNativeGroup = true;

        const existingTabs = await chrome.tabs.query({ groupId: existingGroup.id });
        const pairs = [];
        for (const e of _tgmMissingEntries(cur(), existingTabs)) {
          try {
            const t = await chrome.tabs.create({ url: e.url, windowId: existingGroup.windowId, active: false });
            if (t && t.id) {
              pairs.push([e.url, t.id]);
              await chrome.tabs.group({ tabIds: [t.id], groupId: existingGroup.id });
            }
          } catch (err) {
            console.warn('[TGM] tab create error:', err);
          }
        }

        const finalTabs = await chrome.tabs.query({ groupId: existingGroup.id });
        _tgmBindPairs(cur(), pairs);
        _tgmBindByUrl(cur(), finalTabs);
        if (finalTabs.length > 0) {
          cur().chromeTabIds = finalTabs.map(t => t.id);
          await saveState();
          await chrome.tabs.update(finalTabs[0].id, { active: true }).catch(() => {});
        } else {
          await saveState();
        }
        _tgmShowToast(pairs.length
          ? `Updated "${cur().name}": added ${pairs.length} tab${pairs.length > 1 ? 's' : ''}.`
          : `"${cur().name}" is already open.`);
      } else {
        // No Chrome group with this name: create it
        const tabIds = [];
        const pairs = [];
        for (const e of (cur().tabs || []).filter(x => x.url).map(x => x.url)) {
          try {
            const t = await chrome.tabs.create({ url: e, windowId: currentWindow.id, active: false });
            if (t && t.id) { tabIds.push(t.id); pairs.push([e, t.id]); }
          } catch (err) {
            console.warn('[TGM] tab create error:', err);
          }
        }

        if (tabIds.length > 0) {
          const nativeId = await chrome.tabs.group({ tabIds });
          await chrome.tabGroups.update(nativeId, {
            title: cur().name,
            color: hexToChromeColor(cur().color),
            collapsed: false
          });
          const g = cur();
          g.nativeGroupId = nativeId;
          g.hasCreatedNativeGroup = true;
          g.chromeTabIds = tabIds;
          _tgmBindPairs(g, pairs);
          await saveState();
          await chrome.tabs.update(tabIds[0], { active: true }).catch(() => {});
        }
        _tgmShowToast(`Opened "${cur().name}" with ${tabIds.length} tabs!`);
      }
    });
  } catch (err) {
    console.error('[TGM] openGroupInCurrentWindow error:', err);
    _tgmShowToast('Could not open group: ' + err.message);
  }
}

// ─── openGroupInNewWindow ───
async function openGroupInNewWindow(groupId) {
  const group = _tgmGetGroup(groupId);
  if (!group) return;
  // The group is NOT made active.

  if (!group.tabs || group.tabs.length === 0) {
    _tgmShowToast(`"${group.name}" is empty! Add tabs first.`);
    return;
  }
  const targetUrls = group.tabs.map(t => t.url).filter(Boolean);
  if (targetUrls.length === 0) {
    _tgmShowToast(`"${group.name}" has no valid URLs.`);
    return;
  }

  try {
    await _tgmWithLock(groupId, async () => {
      const cur = () => _tgmGetGroup(groupId) || group;

      if (!isChromeGroupSyncEnabled()) {
        // Native group sync is OFF: open in new window as regular standalone tabs
        const [firstUrl, ...restUrls] = targetUrls;
        const win = await chrome.windows.create({ url: firstUrl, focused: true });
        const tabIds = [];
        const pairs = [];
        if (win.tabs && win.tabs[0]) { tabIds.push(win.tabs[0].id); pairs.push([firstUrl, win.tabs[0].id]); }

        for (const url of restUrls) {
          try {
            const t = await chrome.tabs.create({ url, windowId: win.id, active: false });
            if (t && t.id) { tabIds.push(t.id); pairs.push([url, t.id]); }
          } catch (_) {}
        }

        if (tabIds.length > 0) {
          const g = cur();
          g.chromeTabIds = tabIds;
          _tgmBindPairs(g, pairs);
          await saveState();
        }
        _tgmShowToast(`Opened "${cur().name}" with ${targetUrls.length} tabs in a new window!`);
        return;
      }

      const existingGroup = await _tgmFindMatchingChromeGroup(cur());

      if (existingGroup) {
        // Focus that window instead of creating a duplicate group; add missing, close NOTHING
        await chrome.windows.update(existingGroup.windowId, { focused: true });
        await chrome.tabGroups.update(existingGroup.id, {
          title: cur().name,
          color: hexToChromeColor(cur().color),
          collapsed: false
        }).catch(() => {});
        cur().nativeGroupId = existingGroup.id;
        cur().hasCreatedNativeGroup = true;

        const existingTabs = await chrome.tabs.query({ groupId: existingGroup.id });
        const pairs = [];
        for (const e of _tgmMissingEntries(cur(), existingTabs)) {
          try {
            const t = await chrome.tabs.create({ url: e.url, windowId: existingGroup.windowId, active: false });
            if (t && t.id) {
              pairs.push([e.url, t.id]);
              await chrome.tabs.group({ tabIds: [t.id], groupId: existingGroup.id });
            }
          } catch (_) {}
        }

        const finalTabs = await chrome.tabs.query({ groupId: existingGroup.id });
        _tgmBindPairs(cur(), pairs);
        _tgmBindByUrl(cur(), finalTabs);
        if (finalTabs.length > 0) {
          await chrome.tabs.update(finalTabs[0].id, { active: true }).catch(() => {});
          cur().chromeTabIds = finalTabs.map(t => t.id);
        }
        await saveState();
        _tgmShowToast(`Switched to "${cur().name}".`);
      } else {
        const [firstUrl, ...restUrls] = targetUrls;
        const win = await chrome.windows.create({ url: firstUrl, focused: true });
        const tabIds = [];
        const pairs = [];
        if (win.tabs && win.tabs[0]) { tabIds.push(win.tabs[0].id); pairs.push([firstUrl, win.tabs[0].id]); }

        for (const url of restUrls) {
          try {
            const t = await chrome.tabs.create({ url, windowId: win.id, active: false });
            if (t && t.id) { tabIds.push(t.id); pairs.push([url, t.id]); }
          } catch (_) {}
        }

        if (tabIds.length > 0) {
          const nativeId = await chrome.tabs.group({ tabIds });
          await chrome.tabGroups.update(nativeId, {
            title: cur().name,
            color: hexToChromeColor(cur().color),
            collapsed: false
          });
          const g = cur();
          g.nativeGroupId = nativeId;
          g.hasCreatedNativeGroup = true;
          g.chromeTabIds = tabIds;
          _tgmBindPairs(g, pairs);
        }
        await saveState();
        _tgmShowToast(`Opened "${cur().name}" with ${tabIds.length} tabs in a new window!`);
      }
    });
  } catch (err) {
    console.error('[TGM] openGroupInNewWindow error:', err);
    _tgmShowToast('Could not open new window: ' + err.message);
  }
}

// ─── closeGroup (cleanly closes and dissolves open Chrome tabs) ───
async function closeGroup(groupId) {
  const group = _tgmGetGroup(groupId);
  if (!group) return;

  const groupNameLower = group.name.trim().toLowerCase();
  const nativeIdToClose = group.nativeGroupId;
  const chromeTabIdsToClose = Array.isArray(group.chromeTabIds) ? [...group.chromeTabIds] : [];

  // Mark as closing + inactive and PERSIST FIRST, so background.js can't pull the
  // replacement tab (created below) into the group that is being dissolved.
  group.isActive = false;
  group._tgmCreating = false;
  group._tgmClosing = true;
  group._tgmClosingTime = Date.now();
  await saveState();

  const tabIdsToClose = new Set();
  let targetWindowId = null;

  try {
    if (nativeIdToClose) {
      try {
        const tabs = await chrome.tabs.query({ groupId: nativeIdToClose });
        (tabs || []).forEach(t => {
          if (t && t.id) { tabIdsToClose.add(t.id); if (!targetWindowId) targetWindowId = t.windowId; }
        });
      } catch (_) {}
    }

    try {
      // Fix #27: avoid closing same-named groups in other windows.
      // Title-match is scoped to targetWindowId (derived from nativeIdToClose tabs above).
      // If we have no targetWindowId yet, use the current window only.
      let searchWindowId = targetWindowId;
      if (!searchWindowId) {
        try {
          const curWin = await chrome.windows.getCurrent();
          searchWindowId = curWin && curWin.id;
        } catch (_) {}
      }

      const queryOpts = searchWindowId ? { windowId: searchWindowId } : {};
      const allNativeGroups = await chrome.tabGroups.query(queryOpts).catch(() => []);

      for (const ng of (allNativeGroups || [])) {
        // Only close this native group if it matches by stored ID, OR
        // if it matches by title AND is in the same window as our tracked tabs.
        const matchById    = nativeIdToClose && ng.id === nativeIdToClose;
        const matchByTitle = ng.title && ng.title.trim().toLowerCase() === groupNameLower
                             && searchWindowId && ng.windowId === searchWindowId;
        if (!matchById && !matchByTitle) continue;

        const gTabs = await chrome.tabs.query({ groupId: ng.id }).catch(() => []);
        (gTabs || []).forEach(t => {
          if (t && t.id) { tabIdsToClose.add(t.id); if (!targetWindowId) targetWindowId = t.windowId; }
        });
      }
    } catch (_) {}

    for (const tid of chromeTabIdsToClose) {
      try {
        const t = await chrome.tabs.get(tid).catch(() => null);
        if (t && t.id) { tabIdsToClose.add(t.id); if (!targetWindowId) targetWindowId = t.windowId; }
      } catch (_) {}
    }

    const finalTabIds = Array.from(tabIdsToClose);
    if (finalTabIds.length > 0) {
      // Closing every tab in the window? open a fresh one first so the window survives
      try {
        const win = targetWindowId ? { id: targetWindowId } : await chrome.windows.getCurrent();
        const allWinTabs = await chrome.tabs.query({ windowId: win.id });
        if (allWinTabs.length <= finalTabIds.length) {
          await chrome.tabs.create({ windowId: win.id, active: true });
        }
      } catch (_) {}

      await chrome.tabs.ungroup(finalTabIds).catch(() => {});
      await chrome.tabs.remove(finalTabIds).catch(() => {});
    }
  } catch (e) {
    console.warn('[TGM] closeGroup error:', e);
  }

  const g = _tgmGetGroup(groupId) || group;
  g.chromeTabIds = [];
  g.nativeGroupId = null;
  g.hasCreatedNativeGroup = false;
  g.isActive = false;
  g._tgmCreating = false;
  g._tgmClosing = false;
  (g.tabs || []).forEach(t => { delete t.chromeTabId; });
  await saveState();
  renderGroupBar();

  _tgmShowToast(`Closed and dissolved "${g.name}".`);
}

// ─── deleteGroup ───
function deleteGroup(groupId) {
  const group = (state.tabGroups || []).find(g => g.id === groupId);
  if (!group) return;

  _tgmOpenModal({
    title: 'Delete Group',
    body: `Delete "${group.name}"? This will also close its open tabs in Chrome and cannot be undone.`,
    showInput: false,
    showDelete: true,
    onSave: null,
    onDelete: async () => {
      // Clean up open Chrome tab group tabs if present
      if (isChromeGroupSyncEnabled()) {
        try {
          let nativeGroup = null;
          if (group.nativeGroupId) {
            nativeGroup = await chrome.tabGroups.get(group.nativeGroupId).catch(() => null);
          }
          if (!nativeGroup) {
            nativeGroup = await _tgmFindMatchingChromeGroup(group);
          }
          if (nativeGroup) {
            const tabs = await chrome.tabs.query({ groupId: nativeGroup.id }).catch(() => []);
            if (tabs && tabs.length > 0) {
              const tabIds = tabs.map(t => t.id);
              await chrome.tabs.ungroup(tabIds).catch(() => {});
              await chrome.tabs.remove(tabIds).catch(() => {});
            }
          }
        } catch (_) {}
      }

      const idx = (state.tabGroups || []).findIndex(g => g.id === groupId);
      if (idx !== -1) {
        state.tabGroups.splice(idx, 1);
        _tgmDeletedIds.add(groupId); // prevent storage-merge from re-adding this group
        await saveState();
        renderGroupBar();
        _tgmShowToast(`Deleted group "${group.name}".`);
      }
    }
  });
}

// ─── renameGroup ───
function renameGroup(groupId) {
  const group = (state.tabGroups || []).find(g => g.id === groupId);
  if (!group) return;

  _tgmOpenModal({
    title: 'Rename Group',
    showColorPicker: true,
    showInput: true,
    inputValue: group.name,
    inputPlaceholder: 'Group name',
    saveBtnText: 'Rename',
    onSave: (newName, _url, _type, pickedColor) => {
      const trimmed = (newName || '').trim();
      if (!trimmed) return;

      // Avoid duplicate names in top colour bar
      const alreadyExists = (state.tabGroups || []).some(
        g => g.id !== groupId && g.name.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (alreadyExists) {
        _tgmShowToast(`A group named "${trimmed}" already exists!`);
        return;
      }

      group.name = trimmed;

      // Apply picked colour if the user chose one
      if (pickedColor) {
        group.color = pickedColor;
        if (group.nativeGroupId && isChromeGroupSyncEnabled()) {
          chrome.tabGroups.update(group.nativeGroupId, {
            title: trimmed,
            color: hexToChromeColor(pickedColor)
          }).catch(() => {});
        }
      } else if (group.nativeGroupId && isChromeGroupSyncEnabled()) {
        chrome.tabGroups.update(group.nativeGroupId, { title: trimmed }).catch(() => {});
      }

      saveState();
      renderGroupBar();
      _tgmShowToast(pickedColor
        ? `Renamed to "${trimmed}" with new colour.`
        : `Renamed to "${trimmed}".`);
    }
  });
}

// ─── Live storage sync with background.js ───
// Fix #24: newtab's raw saveState overwrites the full ntp_state object, which can
// clobber concurrent tabGroup updates from background.js (last-writer-wins).
// The wrapper now uses a serialised queue — matching background.js's updateState
// pattern — so every write reads the latest tabGroups from storage first, merges
// them with local state, then writes atomically.
const _tgmEchoes = [];
// Track group IDs that were intentionally deleted so the saveState
// storage-merge step never re-adds them from a stale storage snapshot.
const _tgmDeletedIds = new Set();
let _tgmSaveQueue = Promise.resolve();
const _tgmBaseSaveState = saveState;

saveState = function () {
  // Snapshot tabGroups string NOW (before the async read) for echo tracking
  let _echoSnap = '';
  try { _echoSnap = JSON.stringify(state.tabGroups || []); } catch (_) {}

  const run = _tgmSaveQueue.catch(() => {}).then(async () => {
    try {
      // Fix #24: read latest tabGroups from storage to avoid clobbering
      // background.js mutations that arrived after our last read.
      const r = await chrome.storage.local.get(['ntp_state']).catch(() => ({}));
      const stored = r && r.ntp_state;
      if (stored && Array.isArray(stored.tabGroups) && stored.tabGroups.length > 0) {
        // Only adopt storage tabGroups if they are NEWER than ours.
        // Heuristic: background always writes chromeTabId fields we don't —
        // merge by preferring stored entries for keys newtab doesn't own.
        const storedById = new Map(stored.tabGroups.map(g => [g.id, g]));
        const localById  = new Map((state.tabGroups || []).map(g => [g.id, g]));
        // Keep local structural changes (name, color, tabs array) but restore
        // runtime fields (chromeTabIds, nativeGroupId) from storage if we
        // haven't explicitly changed them in this write cycle.
        state.tabGroups = (state.tabGroups || []).map(lg => {
          const sg = storedById.get(lg.id);
          if (!sg) return lg;
          // Merge: local wins for UI fields; stored wins for runtime tracking fields
          return Object.assign({}, sg, {
            name:    lg.name,
            color:   lg.color,
            type:    lg.type,
            tabs:    lg.tabs,
            isActive: lg.isActive,
            noteMode: lg.noteMode,
            checklist: lg.checklist,
            textContent: lg.textContent,
            showTabGroups: lg.showTabGroups,
          });
        });
        // Append any groups that exist in storage but not locally (added by another tab).
        // Skip groups that were intentionally deleted in this session.
        for (const [id, sg] of storedById) {
          if (!localById.has(id) && !_tgmDeletedIds.has(id)) state.tabGroups.push(sg);
        }
      }
    } catch (_) {}

    // Record echo of what we are about to write (post-merge)
    try {
      _tgmEchoes.push(JSON.stringify(state.tabGroups || []));
      if (_tgmEchoes.length > 30) _tgmEchoes.shift();
    } catch (_) {}

    return _tgmBaseSaveState.apply(this, arguments);
  });

  _tgmSaveQueue = run.catch(() => {});
  return run;
};

// Merge external groups INTO the existing objects so references stay valid
function _tgmMergeGroups(incoming) {
  const old = new Map((state.tabGroups || []).map(g => [g.id, g]));
  state.tabGroups = incoming.map(n => {
    const o = old.get(n.id);
    if (!o) return n;
    for (const k of Object.keys(o)) if (!(k in n)) delete o[k];
    Object.assign(o, n);
    return o;
  });
}

// Fix #28: strip transient runtime fields (chromeTabId, chromeTabIds, nativeGroupId,
// _tgmCreating, etc.) before comparing — background.js adds/mutates these after our
// write, so a full JSON.stringify never matched → flicker on every autosave.
function _tgmStripRuntimeFields(groups) {
  try {
    return (groups || []).map(g => {
      const { chromeTabIds, nativeGroupId, hasCreatedNativeGroup,
              _tgmCreating, _tgmCreatingTime, _tgmClosing, _tgmClosingTime,
              removedTabIds, ...rest } = g;
      rest.tabs = (rest.tabs || []).map(t => {
        const { chromeTabId, ...tr } = t;
        return tr;
      });
      return rest;
    });
  } catch (_) { return groups || []; }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;

  // Fix New-H: propagate wallpaper changes written by another tab
  if (changes.ntp_wallpaper) {
    const newUrl = changes.ntp_wallpaper.newValue;
    // Only act if it's a real URL change and we're not already showing an
    // upload/gif (those have their own restore paths on next open)
    if (newUrl && newUrl !== state.wallpaper &&
        !['__gif__', '__upload__'].includes(state.wallpaper)) {
      state.wallpaper = newUrl;
      applyBg();
    }
  }

  if (!changes.ntp_state || !changes.ntp_state.newValue) return;
  const nv = changes.ntp_state.newValue;
  if (!Array.isArray(nv.tabGroups)) return;

  // Fix #28: compare stripped form so runtime-field-only mutations don't defeat echo detection
  const incomingStripped = JSON.stringify(_tgmStripRuntimeFields(nv.tabGroups));
  let matched = false;
  for (let i = 0; i < _tgmEchoes.length; i++) {
    const echoStripped = JSON.stringify(_tgmStripRuntimeFields(
      (() => { try { return JSON.parse(_tgmEchoes[i]); } catch (_) { return []; } })()
    ));
    if (echoStripped === incomingStripped) {
      _tgmEchoes.splice(0, i + 1); // echo of our own write → nothing to do
      matched = true;
      break;
    }
  }
  if (matched) return;

  if (nv.showTabGroups !== undefined && nv.showTabGroups !== state.showTabGroups) {
    state.showTabGroups = nv.showTabGroups;
    syncTabGroupsVisibility();
  }
  _tgmMergeGroups(nv.tabGroups);
  renderGroupBar();
  if (_tgmOpenDd) {
    const isFocusedInDd = _tgmOpenDd.ddEl && document.activeElement && _tgmOpenDd.ddEl.contains(document.activeElement);
    if (!isFocusedInDd) {
      const openGroupId = _tgmOpenDd.groupId;
      const chip = document.querySelector(`.tgm-chip[data-group-id="${openGroupId}"]`) || _tgmOpenDd.chipEl;
      _tgmCloseDropdown();
      _tgmOpenDropdown(openGroupId, chip);
    }
  }
});

// ─── Tab Groups Bar Visibility (Side Panel Toggle) ───
function syncTabGroupsVisibility() {
  const isEnabled = state.showTabGroups !== false; // default is true
  const bar = document.getElementById('tgm-bar');
  if (bar) {
    if (isEnabled) {
      bar.classList.remove('tgm-hidden');
    } else {
      bar.classList.add('tgm-hidden');
      _tgmCloseDropdown();
    }
  }

  const toggle = document.getElementById('toggle-tab-groups');
  if (toggle) {
    toggle.className = 'toggle' + (isEnabled ? ' on' : '');
  }
}

function setTabGroupsVisibility(enable) {
  state.showTabGroups = !!enable;
  saveState();
  syncTabGroupsVisibility();
  if (enable) {
    renderGroupBar();
    _tgmShowToast('Tab Groups bar enabled.');
  } else {
    _tgmCloseDropdown();
    _tgmShowToast('Tab Groups bar disabled.');
  }
}

function initTabGroupsSidePanelControls() {
  const toggle = document.getElementById('toggle-tab-groups');
  if (toggle) {
    toggle.onclick = () => {
      setTabGroupsVisibility(state.showTabGroups === false);
    };
  }

  syncTabGroupsVisibility();
}

// Initialize side panel controls
initTabGroupsSidePanelControls();




