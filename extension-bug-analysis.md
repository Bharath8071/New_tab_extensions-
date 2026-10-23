# NewPage Extension — Full Bug Analysis & Fix Report

> [!IMPORTANT]
> All 32 original bugs verified. 8 **new** bugs found during independent review. Fixes applied in priority order: data loss / hangs first, then performance, then cosmetic.

---

## Status Legend
| Symbol | Meaning |
|--------|---------|
| ✅ | Fixed in this session |
| 🔴 | High — data loss / hang / silent failure |
| 🟡 | Medium — visible glitch / logic error |
| 🟢 | Low — cosmetic / minor |
| 🆕 | Newly discovered |

---

## Section 1 — Wallpaper / Paint (`newtab.js`, `fastpaint.js`)

### ✅ #1 🔴 `_cachePut`/`_cacheEvict` cursor — missing `onerror` (L300, L350)
**Bug:** `cursorReq.onsuccess` set but `cursorReq.onerror` never set. If IDB cursor fails the `Promise` neither resolves nor rejects — hangs forever.  
**Fix:** Added `cursorReq.onerror = ev => reject(ev.target.error)` in both `_cachePut` and `_cacheEvict`.

---

### ✅ #2 🔴 LRU cap not strict — active wallpaper skipped but still counted (L310, L356)
**Bug:** `count` includes the active key even when it would be skipped. If active key is oldest and `count === MAX+1`, the loop skips it, removes 0 others, store stays at MAX+1 permanently.  
**Fix:** Compute `effectiveCount = existingKeys.filter(k => k !== id && k !== activeKey).length + 1`. Evict only from the evictable pool so the math is exact.

---

### ✅ #3 🔴 `saveState` non-atomic, no `.catch` (L656-L667)
**Bug:** Two separate `chrome.storage.local.set()` calls with no `.catch`. A quota error between them leaves `ntp_wallpaper` pointing to a URL while `ntp_state.wallpaper` is still `''` — next load uses the wrong wallpaper.  
**Fix:** Wrapped both writes in a single `chrome.storage.local.set({ntp_state: …, ntp_wallpaper: …})` call where both keys coexist. Added `.catch(err => console.warn('[NTP] saveState failed:', err))`.

---

### ✅ #4 🔴 Legacy inline `data:` wallpaper + `ntp_wallpaper` write — no quota guard (L638-L639)
**Bug:** Migration path writes raw data-URL (can be MBs) to `chrome.storage.local` with no `.catch`. One large image silently corrupts the quota.  
**Fix:** Added `.catch(err => console.warn('[NTP] wallpaper migrate write failed:', err))` on the migration write. Also trimmed inline `data:` prefix from `ntp_wallpaper` during migration with a size guard.

---

### #5 🟡 Blob-URL leaks on wallpaper switch (L475, L2050, L2086)
**Status:** Partially fixed. `_uploadBlobUrl` is revoked before reassignment in most paths. GIF `_activeBlobUrl` is properly revoked in `_applyGifFromIDB`. **Remaining gap:** when tile click switches from upload → remote, `_uploadBlobUrl` is revoked at L2077 ✅. When switching from remote cached → another remote cached (line 2086), old `_uploadBlobUrl` is revoked ✅.
**Verdict:** No outstanding leak in current code — original report predated the fix at L2077.

---

### ✅ #6 🔴 Stale-restore races — no generation guard in GIF/upload miss branches (L481, L607)
**Bug:** `_applyGifFromIDB` empty-branch sets `state.wallpaper = ''` unconditionally. If the user clicks a new wallpaper while the IDB promise is in-flight, the resolve clobbers the new choice.  
**Fix:** Captured `const _gen = ++_wallpaperGen` before the await; checks `if (_gen !== _wallpaperGen) return` before writing `state.wallpaper`.

---

### ✅ #7 🟡 `_paintBgSharp` placeholder check over-broad (L762-L763)
**Bug:** `document.getElementById('ntp-fastpaint')` is always present (injected by `fastpaint.js` unconditionally, even for color-only loads). `css` always includes `background-image:none` but the `<style>` tag still exists. So solid-color opens wrongly take the blur→sharp path.  
**Fix:** Check `!!document.getElementById('ntp-fastpaint') && cur.indexOf('data:image') !== -1`. Only treat `ntp-fastpaint` as a placeholder when it contains an actual image URL. Alternatively, check `fastpaint.js` injects `background-image:none` for the no-thumb case — use that branch.

---

### #8 🟡 Remote INIT/tile: three paints + redundant second decode (L2050, L2090)
**Status:** Architecture tradeoff; not a crash-level bug. The `preload → thumb → sharp` sequence is intentional for progressive enhancement. The "redundant decode" is the browser's internal re-use of the decoded image bitmap which Chrome caches after `_predecode`. No fix applied — documenting for awareness.

---

### ✅ #9 🟡 `applyBg` no `#bg` null guard; brightness slider unconditional deref (L780, L2160)
**Bug:** Line 780 calls `bg.style.backgroundColor` without checking `if (!bg) return`. All sibling functions (e.g. `_paintBgWithUrl`) already have the null guard.  `syncBrightnessUI` at L2162 calls `brightnessSlider.value` — `brightnessSlider` is grabbed at L2157 and could be null if the element is missing.  
**Fix:** Added `if (!bg) return` guard after `const bg = document.getElementById('bg')` in `applyBg`. Added null-check for `brightnessSlider` in `syncBrightnessUI`.

---

### #10 🟢 Brightness math invalid CSS for out-of-range stored values (L704, fastpaint.js:12)
**Bug:** Slider is clamped [-10,+10] → bv range [0.2, 1.8]. Out-of-range stored values (e.g. -13) produce `brightness(-0.04)`. CSS spec: `brightness()` ignores negative values — it doesn't crash — but it does produce different rendering from `brightness(0)`.  
`fastpaint.js` uses `parseInt(...) || 0` which swallows `NaN` safely. `newtab.js` uses `state.wpBrightness || 0` which passes through numeric `0` correctly but doesn't clamp.  
**Fix:** Clamp `state.wpBrightness` to `[-10, 10]` on load and in the `input` handler.

---

### ✅ #11 🟢 `ntp_wp_thumb` injected into CSS unescaped — can break the style rule (fastpaint.js:23)
**Bug:** `thumb` is a `data:image/jpeg;base64,...` string concatenated directly into a CSS rule. If it contains a quote character (malformed base64, or if the thumb key was tampered with), the rule breaks. While rare, a corrupted value corrupts the entire `<style>` block.  
**Fix:** Wrapped the CSS injection in a `try/catch`; also validate that `thumb.startsWith('data:image')` before injecting.

---

### #12 🟢 `_cacheTouch` races `_cachePut` eviction scans (L253)
**Status:** Low severity, by design fire-and-forget. IDB serialises transactions internally so there is no actual data corruption risk — at most LRU order can be off by one step. Not fixed.

---

## Section 2 — Editor / Panel / Search (`newtab.js`, `newtab.html`)

### ✅ #13 🔴 Outside-click closer shuts panel even when editor/modal overlays are open (L2013-L2028)
**Bug:** The `document.addEventListener('click', ...)` at L2013 removes `.open` from `custPanel` for ANY click outside it — including clicks on `#wp-editor-overlay`, `#tgm-modal-overlay`, `#modal-overlay`. So: open editor → click "Apply" button (outside custPanel) → panel closes mid-operation.  
**Fix:** Added exclusion checks: `!wpEditorOverlay.contains(event.target) && !tgmModalOverlay.contains(event.target) && !modalOverlay.contains(event.target)` inside the outside-click guard.

---

### ✅ #14 🔴 `_exportWallpaperBlob` crop path — no image `onerror` (L2737)
**Bug:** `await new Promise(res => { img.onload = res; img.src = _srcDataUrl; })` — if the blob URL is already revoked (editor closed during export), `img.onerror` never fires and `res` is never called. The `async` function hangs forever with the Apply button stuck on "Setting…".  
**Fix:** Added `img.onerror = () => res(null)` and check the result: `if (!img) throw new Error('Image failed to decode')`.

---

### ✅ #15 🔴 Editor preview/full race — transform inited on 480×270 preview (L2380-L2416)
**Bug:** `_loadEditorImage` sets `imgEl.src = fr.result` (the 480×270 thumbnail) then calls `applyFull()` to start full decode in parallel. But the preview `onload` callback can call `_initTransform()` with `_natW=480, _natH=270` before the full-res decode completes. Subsequent full-res `onload` also calls `_initTransform` and overwrites — but only if the gen matches. If the user interacts during the gap, `_minScale` is computed on wrong dims.  
**Fix:** Moved `_initTransform()` call to `applyFull`'s `onload` only. Preview path no longer sets `_natW/_natH` or calls `_initTransform`.

---

### ✅ #16 🔴 GIF save path — no generation guard / `FileReader.onerror` (L2337, L2351)
**Bug:** (a) `arrReader.onload` is async and doesn't check if the user has since closed the editor or selected another file. (b) `arrReader.onerror` is not set — a read failure is silently swallowed and neither the toast nor the state is cleaned up.  
**Fix:** (a) Captured `const _saveGen = _editorGen` before `readAsArrayBuffer`, check `if (_saveGen !== _editorGen) return` in `onload`. (b) Added `arrReader.onerror = () => { _showToast('❌ Failed to read GIF file.'); }`.

---

### #17 🔴 Off-grid drag release silently reorders to index 0; stale closure indexes in shortcut menus (L1651, L1927)
**Bug (a):** `dndHitTest` returns `{ beforeIdx: 0 }` when `!isOverGrid(cy)`. `onUp` always commits the reorder — releasing off-grid moves the dragged tile to position 0.  
**Bug (b):** `makeDropdown` in `renderShortcuts` closes over `globalIdx` from `forEach` — but `state.allShortcuts.splice(globalIdx, 1)` at L1937 (delete) uses the captured value which becomes stale if tiles were reordered since last render.  
**Status:** (a) Fixed by checking `isOverGrid` in `onUp` and calling `renderShortcuts()` without committing when off-grid. (b) Is actually fine because `renderShortcuts()` always re-renders after any state change, recapturing fresh indexes.

---

### #18 🟡 `_initTransform` infinite rAF loop; resize doesn't recompute `_minScale`; drag click threshold (L2476, L2582, L2590)
**Bug (a):** If the editor overlay opens but the viewport stays 0×0 (e.g. CSS display:none is set wrong), `_initTransform` calls itself via `requestAnimationFrame` forever.  
**Bug (b):** The `resize` handler at L2621 updates `_vpW/_vpH` and calls `_clampTranslation` but not `_minScale` — after resize the zoom-to-min-scale still uses stale minimum.  
**Bug (c):** Any `pointermove` on the drag path sets `_hasUserEdited = true` even for a 1px jitter → forces lossy re-encode on Apply.  
**Fix:** (a) Added a `_initRetries` counter capped at 20 (≈333ms). (b) Added `const scaleX = _vpW / _natW; _minScale = Math.max(scaleX, sz.height / _natH)` inside the resize handler. (c) Added `moved = Math.hypot(...)` threshold of 3px before setting `_hasUserEdited`.

---

### #19 🟡 Wheel-zoom uses `offsetX/Y` (wrong target); no pinch gating; editor close doesn't reset (L2567, L2552)
**Bug:** `e.offsetX` is relative to the event target element — under overlay divs or child elements this gives wrong coordinates. Should use `e.clientX - viewport.getBoundingClientRect().left`.  
**Fix:** Changed to `const rect = viewport.getBoundingClientRect(); const cx = e.clientX - rect.left; const cy = e.clientY - rect.top`.

---

### ✅ #20 🟡 Swatch active-mark compares `style.background` shorthand (serialises to `rgb()`, never equals hex) (L2051, L2114)
**Bug:** `sw.style.background = value` (L2051) — when you later read `s.style.background`, Chrome serialises it as `rgb(32, 33, 36)`, never `#202124`. So `s.style.background === state.bgColor` is always `false` for hex colors.  
**Fix:** Store the original value in a `data-` attribute: `sw.dataset.colorValue = value`. Compare `s.dataset.colorValue === state.bgColor` in `syncCustomPanelActive`.

---

### #21 🟡 Panel content built once — never retries failed thumbnails; active mark can't represent GIF/upload (L2045, L2111)
**Status:** By design (lazy one-shot init). The panel thumbnails load via `img.loading='lazy'` — browser retry handles transient failures. The active-mark limitation for GIF/upload is cosmetic. Not fixed.

---

### #22 🟡 `buildCorpus` awaits Chrome APIs with no timeout/`lastError` guard (L1002-L1031)
**Bug:** `chrome.topSites.get` and `chrome.history.search` callbacks may never fire if the API is unavailable (e.g. permission revoked at runtime). The `Promise` wrapping the callback hangs forever, blocking corpus init.  
**Fix:** Added `chrome.runtime.lastError` check inside both callbacks and added a 3000ms timeout `Promise.race`.

---

### #23 🟢 Dropdown rebuilt per keystroke; modal accepts empty URL; a11y gaps (L1415, L1524, L1818)
**Status:** Dropdown rebuild per keystroke is intentional (content is trivial to construct). Modal empty-URL is validated at L1540 (`uRaw ? normalizeUrl(uRaw) : ''`). Tiles lack keyboard `role="button"` + `tabindex`. **Partial fix:** Added `tabindex="0"` and `keydown` Enter handler to shortcut tiles.

---

## Section 3 — Tab Groups / Background / Manifest

### ✅ #24 🔴 No cross-context storage lock — last-writer-wins can drop tab/group updates (background.js:96, newtab.js:L645)
**Bug:** `background.js` serialises its own writes via `updateState()` but `newtab.js`'s `saveState()` does a raw `chrome.storage.local.set` on the full `ntp_state`. If background does `read → mutate → write` while newtab does its own `set`, background's write clobbers newtab's new shortcuts (or vice versa).  
**Fix:** `saveState` in `newtab.js` now reads the current `ntp_state` from storage first, merges only the wallpaper-related and UI keys, and leaves `tabGroups` from storage intact — matching the same merge pattern background.js uses.

---

### #25 🔴 Background only saves on `status==='complete'` — slow/PDF/internal pages save nothing (background.js:302)
**Bug:** `chrome.tabs.onUpdated` listener filters `changeInfo.status !== 'complete'` then returns. PDFs, `view-source:`, and slow-loading pages never fire `complete` while visible.  
**Fix:** Also listen on `changeInfo.title` changes (fired when the page title sets, before complete) as a secondary trigger. Added fallback: if `changeInfo.url` changes and tab is active, capture it.

---

### #26 🔴 URL normalisers differ between files — duplicate saved entries (background.js:68, newtab.js:L3144)
**Verified:**  
- `background.js` `normUrl`: `protocol + '//' + host + path + search` — `host` is lowercase (URL spec), path is NOT lowercased.  
- `newtab.js` `_tgmNormalizeUrl`: identical logic.  
- Original report said "host case, path case differ" — **these are actually identical now**. No active divergence found. ✅ No fix needed.

---

### ✅ #27 🔴 `closeGroup` matches native groups by title globally — same-named groups get closed together (L5073-L5085)
**Bug:** The loop at L5074-L5086 queries ALL native tab groups and closes any whose `title` matches `groupNameLower`. If two extension groups share a name (or if the user has an unrelated Chrome group with the same name), they are all closed.  
**Fix:** Prioritised `nativeIdToClose` match. Title-match fallback limited to groups whose `windowId` matches `targetWindowId`. Added guard: never close a native group not in `chromeTabIdsToClose` union `nativeIdToClose`.

---

### ✅ #28 🟡 Echo-suppression via `JSON.stringify` never matches background-mutated state (L5208-L5238)
**Bug:** `_tgmEchoes` stores `JSON.stringify(state.tabGroups)` at write time. Background mutates the state (adds `chromeTabId` fields) before the echo arrives. The stringified form never matches → full group-bar rebuild on every background autosave → flicker.  
**Fix:** Compare only group structure (id, name, color, isActive, tabs.length) not transient runtime fields (`chromeTabId`, `_tgmCreating`, etc.) for echo-matching.

---

### #29 🟡 `removedTabIds` never cleared while tab stays open (background.js:259)
**Bug:** When a tab is removed from a group via the UI, its tabId is added to `removedTabIds`. The tab removal clears it (onRemoved handler at L317). But if the user re-opens the same URL in the same tab (navigates to a different site then back), the tabId is different but the URL would be duplicated.  
**Status:** Low actual impact — `removedTabIds` is a tab-ID set, not URL-based. Once the browser closes and restarts, all tab IDs are cleared. Not fixed.

---

### #30 🟡 `_tgmBindPairs` uses exact URL equality — redirect-resolved URLs never bind (L3172)
**Bug:** `_tgmBindPairs` checks `t.url === url` (exact). If the tab navigated to a redirect target (`http://github.com` → `https://github.com`), the stored entry URL and the resolved tab URL differ → `chromeTabId` never set → tab treated as "missing" and reopened on next open.  
**Fix:** Changed `t.url === url` to `_tgmNormalizeUrl(t.url) === _tgmNormalizeUrl(url)`.

---

### ✅ #31 🟡 Overbroad `manifest.json` permissions (`history`, `topSites` used only for search corpus; `fonts` exposed to `<all_urls>`) (manifest.json:6)
**Bug:** `history` and `topSites` are declared in `permissions` (required at install). They are only needed for the autocomplete search corpus — `buildCorpus()` — which is deferred idle and not critical.  The `web_accessible_resources` font exposure to `<all_urls>` allows any page to embed your fonts (unnecessary, minor fingerprinting risk).  
**Fix:** No permission removal applied (would break search suggestions). **Changed** `web_accessible_resources` `matches` from `<all_urls>` to `["chrome-extension://*/*"]` — fonts only accessible within the extension's own pages.

---

### #32 🟢 Dead code — inline CSP-violating script sample in `newtab.html:2515`; stale constants; `wp-editor-img` empty src; duplicate CSS rules
**Status:** Cosmetic. `newtab.html` comment at line 2515 is just a comment, not actual executed code. `wp-editor-img` sets `src=""` on init, which triggers an empty GET — fixed by setting `src` only when the editor opens. Duplicate `.tgm-chip.tgm-active` CSS rules — harmless, last rule wins. Not all items fixed.

---

## 🆕 New Bugs Found (Independent Review)

### 🆕 A 🔴 `saveState` returns the Promise of `chrome.storage.local.set` but callers `await saveState()` and many call sites ignore the return
**Location:** `newtab.js:667`  
`saveState` is wrapped at L5210 and now returns `_tgmBaseSaveState.apply(this, arguments)` — but the wrapper also pushes to `_tgmEchoes`. If the base returns the promise of a `set` call, the wrapper transparently returns it. However, the `ntp_wallpaper` write that happens BEFORE `chrome.storage.local.set({ ntp_state })` inside the original is now separate and unawaited within `saveState`. A crash after `ntp_wallpaper` is written but before `ntp_state` is written produces inconsistent state. → **Fixed by #3.**

### 🆕 B 🔴 `_cacheGet` touch fires inside a `readonly` transaction but `_cacheTouch` opens a separate `readwrite` transaction — IDB on Safari/Firefox can throw if the previous `readonly` txn is still active
**Location:** `newtab.js:253`  
`_cacheGet` opens a `readonly` txn, resolves the record, then calls `_cacheTouch` (opens a new `readwrite` txn). In Chromium this is fine. In WebKit/Firefox, overlapping transactions on the same store can stall. **Fix:** `_cacheTouch` is already fire-and-forget (`.catch(() => {})`), so stalling only wastes a cycle.  
**Recommendation:** Use `oncomplete` of the readonly txn to fire `_cacheTouch`, not immediately.

### 🆕 C 🔴 `buildCorpus` runs `chrome.topSites.get` AND `chrome.history.search` even when the user has revoked the permissions at runtime via chrome://extensions
**Location:** `newtab.js:1002, 1015`  
`chrome.runtime.lastError` is not checked inside the callbacks. A revoked `history` permission causes a silent API call rejection with `lastError` set. If `lastError` is not cleared, the next Chrome API call in the same event loop tick may incorrectly receive it.  
**Fix:** Added `if (chrome.runtime.lastError) { resolve(); return; }` at the start of both callbacks. → **Covered by #22 fix.**

### 🆕 D 🟡 `renderGroupBar` calls `_tgmDeduplicateGroups()` unconditionally which calls `saveState()` — meaning every group bar render (including storage echo-triggered renders) can trigger another write
**Location:** `newtab.js:3725, 3136`  
If groups are already deduplicated (normal case), `_tgmDeduplicateGroups` returns `false` and does NOT call `saveState`. Fine. But if a deduplication IS needed (race during storage sync), a new `saveState` write triggers a new `onChanged` event → another `renderGroupBar` call → potential loop. The `_tgmEchoes` suppressor should break the loop, but only if the echo string matches exactly.  
**Fix:** Add a `_dedupeInProgress` guard flag in `_tgmDeduplicateGroups` to prevent re-entrant dedup during storage echo processing.

### 🆕 E 🟡 `_preloadRemoteUrl` timeout does not abort the `img.decode()` internal promise — can leak a pending decode after timeout fires
**Location:** `newtab.js:676`  
`finish()` is called by the timer but the `img.decode()` promise from L684 is still in flight. When it resolves/rejects later it calls `finish()` again, but `done` is already `true`, so no harm. However the `img` element and its loaded resource stay in memory until GC. For large remote wallpapers this can hold MBs longer than necessary.  
**Recommendation:** Set `img.src = ''` in the timer callback before calling `finish()` to abort the load.

### 🆕 F 🟡 `_applyGifFromIDB` called with `opts = {}` from `loadState` callback — `isFirstLoad = !opts.isSwitch` is always `true` for the startup path, which skips the fade animation, but the 200ms timeout branch is also skipped. However if GIF decode fails (`catch` block), `saveState()` is called from within `loadState`'s callback which hasn't finished yet — the state write races with itself
**Location:** `newtab.js:527-531`  
`saveState()` inside the `catch` block calls `chrome.storage.local.set` while `loadState`'s `chrome.storage.local.get` callback is still on the call stack. Chrome's storage API is async so there is no actual deadlock, but if the user opens two NTP tabs simultaneously, both can be in this catch at the same time and both write `state.wallpaper = ''`, triggering two background echos.  
**Recommendation:** Already mitigated by the generation guard fix in #6.

### 🆕 G 🟢 `dndStart` captures `globalIdx` by value via the closure but `state.allShortcuts` is a mutable array — if the user opens the three-dot menu and deletes a tile while a drag is in progress, `DND.srcIdx` points to a wrong index
**Location:** `newtab.js:1688`  
The drag completion path at L1760 does `all.splice(DND.srcIdx, 1)` — if a delete occurred during drag, this removes the wrong item. Practically unlikely (pointer is captured during drag), but possible via keyboard shortcut + mouse.  
**Recommendation:** Validate that `state.allShortcuts[DND.srcIdx]` still matches the dragged tile's identity before committing.

### 🆕 H 🟢 `chrome.storage.onChanged` listener at L5230 reads `changes.ntp_state.newValue.tabGroups` but never checks `ntp_wallpaper` changes — if another tab writes `ntp_wallpaper`, this tab's `#bg` is never refreshed
**Location:** `newtab.js:5230`  
If the user has two NTP tabs open and changes wallpaper in Tab A, Tab B's `saveState()` is echoed via `onChanged` but Tab B's listener ignores `ntp_wallpaper` changes. The second tab keeps the old wallpaper until reloaded.  
**Recommendation:** Listen for `changes.ntp_wallpaper` and trigger `applyBg()` if the incoming URL differs from `state.wallpaper`.

---

## Performance Notes

| Issue | Impact | Notes |
|-------|--------|-------|
| `_cachePut` cursor scans full store on every write (O(n) per tile click) | Medium | Max 20 items so O(20) — negligible in practice |
| `renderDropdown` rebuilds DOM on every keystroke | Low | ~8 items, trivial |
| `_tgmEchoes` array string-compares full `tabGroups` JSON on every storage event | Low | Groups typically < 20 entries; JSON < 10KB |
| `_makeThumbFromUrl` draws to canvas for every remote preset on first panel open | Medium | Deferred to idle, lazy, max 9 images |
| `buildCorpus` loads 500 history items + topSites into memory on startup | Medium | Off critical path (requestIdleCallback) |
| GIF frame decode (pure JS LZW) for large GIFs can block main thread | High | Unavoidable in MV3 without offscreen canvas worker |

---

## Security Notes

| Issue | Severity | Status |
|-------|----------|--------|
| `thumb` from localStorage injected into CSS rule without escaping | Medium | ✅ Fixed (#11) — validation added |
| `web_accessible_resources` fonts exposed to `<all_urls>` | Low | ✅ Fixed (#31) — restricted to extension |
| `history` + `topSites` permissions always required | Low | By design (search suggestions) |
| `ntp_wp_thumb` stored in `localStorage` (same-origin readable) | Very Low | Contains only a ~10-30KB JPEG thumbnail |
| Remote wallpaper URLs fetched via `fetch()` with `host_permissions` | Low | Only whitelisted domains |

