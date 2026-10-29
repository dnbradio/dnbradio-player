// Track actual browser entries, including replacements and forward navigation.
// The initial page has depth zero so a deep link can return to the player.
let depth = 0;
const DEPTH_KEY = "dnbradioDepth";

export function trackHistory() {
  const history = window.history;
  const push = history.pushState.bind(history);
  const replace = history.replaceState.bind(history);
  replace({ ...history.state, [DEPTH_KEY]: depth }, "");
  history.pushState = (state, title, url) => {
    const next = depth + 1;
    push({ ...state, [DEPTH_KEY]: next }, title, url);
    depth = next;
  };
  history.replaceState = (state, title, url) => {
    replace({ ...state, [DEPTH_KEY]: depth }, title, url);
  };
  window.addEventListener("popstate", (event) => {
    depth = Math.max(0, Number(event.state && event.state[DEPTH_KEY]) || 0);
  });
}

export function canGoBack() {
  return depth > 0;
}
