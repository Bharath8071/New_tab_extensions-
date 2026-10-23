// BUG FIX: Converted from callback-style to async/await (MV3 best practice)
(async () => {
  const r = await chrome.storage.local.get(['ntp_state']);
  const shortcuts = r.ntp_state?.allShortcuts;
  document.getElementById('c').textContent = Array.isArray(shortcuts) ? shortcuts.length : '–';
})();

document.getElementById('r').addEventListener('click', async () => {
  const r = await chrome.storage.local.get(['ntp_state']);
  const s = r.ntp_state || {};
  delete s.allShortcuts;
  await chrome.storage.local.set({ ntp_state: s });
  // newtab.js falls back to its built-in defaults on next load
  document.getElementById('c').textContent = '–';
});
