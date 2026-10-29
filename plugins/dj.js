import { djProfile } from "../lib/djs.js";

export default function ({ route, app }, inject) {
  const profile = djProfile(route.query.dj);
  inject("djProfile", profile);
  if (!profile) return;
  app.router.beforeEach((to) =>
    to.query.dj === profile.id
      ? true
      : {
          path: to.path,
          query: { ...to.query, dj: profile.id },
          hash: to.hash,
        },
  );
}
