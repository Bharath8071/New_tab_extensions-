chrome.storage.local.get(['ntp_state'], r => {
  const shortcuts = r.ntp_state?.allShortcuts;
  document.getElementById('c').textContent = Array.isArray(shortcuts) ? shortcuts.length : '–';
});

document.getElementById('r').onclick = () => {
  chrome.storage.local.get(['ntp_state'], r => {
    const s = r.ntp_state || {};
    delete s.allShortcuts;
    chrome.storage.local.set({ ntp_state: s }, () => {
      // newtab.js falls back to its built-in defaults on next load
      document.getElementById('c').textContent = '–';
    });
  });
};
