// Counts in-app history entries so Back can leave a deep-linked page for the
// player instead of leaving the site.
let depth = 0;
let popping = false;

export function trackHistory(router) {
  window.addEventListener("popstate", () => {
    popping = true;
  });
  router.afterEach((to, from) => {
    if (!from.name) {
      return;
    }
    depth = popping ? Math.max(0, depth - 1) : depth + 1;
    popping = false;
  });
}

export function canGoBack() {
  return depth > 0;
}
