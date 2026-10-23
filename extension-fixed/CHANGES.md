# Changes (review fixes) – replace these 6 files in your extension folder

Files: background.js (rewritten), newtab.js, newtab.html, popup.html, popup.js, manifest.json
Your fonts/ folder and icon.png are untouched. Reload the extension at chrome://extensions after copying.

## High
1. Stale group refs: group looked up by id after awaits (`_tgmGetGroup`); saveState echoes are ignored; external storage changes are merged INTO existing objects.
2. Lock: background.js now backs off while ANY group is creating/closing (10s safety expiry). openGroupInNewWindow and add-tab flows also take the lock now.
3. URL matching: `_tgmNormalizeUrl` (host lowercase, no #hash, no trailing slash, query kept). Sync never closes tabs any more; it only adds missing ones.
4. Auto-save is per tab: each saved entry stores `chromeTabId`; navigation updates that entry in place (persisted in storage, survives service-worker restarts).
5. Add Current Tab / tab picker group the existing tab; no duplicate tab is created.

## Medium
- Brown no longer turns grey on native group events.
- Removing a saved tab ungroups (does not close) its live tab; page loads no longer pull ungrouped tabs back into the active group (grouping happens on tab creation only).
- Delete dialog says it closes open tabs.
- closeGroup persists inactive + _tgmClosing before creating the replacement tab.
- Active chip's left accent is solid (borderColor set before borderLeftColor).

## Outside TGM (approved)
- Shortcut URLs normalised on save and on click; GIF brightness filter targets #bg; unload -> pagehide.

## Cleanup
- Removed inline oncontextmenu (CSP), moved .tgm-hidden CSS into the TGM block, removed dead tabIdToUrl / message handlers / _tgmSendMessage / .tgm-open.
- popup text + reset button label match the single shortcut grid; manifest name/version (11.1).

## Known limits
- background.js and newtab.js still each write the whole `ntp_state` object; background writes are serialised, but a write from each side within the same few ms can still overwrite the other.
- Close Group / Delete Group still match native groups by NAME across all windows.
- While a group is Active, every NEW tab is grouped into it (by design).
