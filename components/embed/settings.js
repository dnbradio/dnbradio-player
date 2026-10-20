const STORAGE_KEY = "dnbradio-embed";

// Storage can be blocked for third-party frames, so settings are best-effort.
export function loadSettings() {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || {};
  } catch (err) {
    return {};
  }
}

export function saveSettings(settings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.log("cannot save embed settings", err.message);
  }
}
