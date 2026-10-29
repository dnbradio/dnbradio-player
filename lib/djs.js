export const djProfiles = Object.freeze({
  djaffirmation: Object.freeze({
    id: "djaffirmation",
    name: "DJ Affirmation",
    image: "dj-affirmation.webp",
    alt: "DJ Affirmation wearing blue headphones",
  }),
  drastic: Object.freeze({
    id: "drastic",
    name: "Drastic",
    image: "dj-drastic.webp",
    alt: "Drastic wearing sunglasses and holding a can",
  }),
});

export function djProfile(value) {
  return typeof value === "string" && Object.hasOwn(djProfiles, value)
    ? djProfiles[value]
    : null;
}
