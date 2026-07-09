const toggle = document.getElementById('toggle-enabled');

chrome.storage?.sync?.get(['wcdyd_enabled'], (result) => {
  toggle.checked = result.wcdyd_enabled !== false; // default on
});

toggle.addEventListener('change', () => {
  chrome.storage?.sync?.set({ wcdyd_enabled: toggle.checked });
});
