export const widgetTypes = [
  "alerts",
  "upnext",
  "nowplaying",
  "donators",
  "listeners",
  "marquee",
  "socials",
  "chat",
  "vis",
];
export const staticRoutes = [
  "/",
  "/darkstep",
  "/webamp",
  "/embed",
  "/chat",
  "/home",
  "/archive",
  ...["square", "portrait", "landscape"].map(
    (shape) => "/x-card-test/" + shape,
  ),
  ...[1, 2, 3, 4, 5].flatMap((id) => [
    `/stations/${id}`,
    ...[
      "schedule",
      "podcast",
      "chat",
      "donate",
      "webamp",
      "embed",
      ...widgetTypes.map((type) => "widget-" + type),
    ].map((page) => `/stations/${id}/${page}`),
  ]),
];
