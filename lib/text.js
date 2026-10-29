// Stream metadata arrives HTML-escaped, sometimes URI-encoded, and sometimes
// with backslash-escaped quotes. It is shown as plain text, never as HTML.
const NAMED_ENTITIES = {
  amp: "&",
  apos: "'",
  quot: '"',
  lt: "<",
  gt: ">",
  nbsp: " ",
};

export function decodeEntities(text) {
  return String(text).replace(
    /&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi,
    (match, entity) => {
      if (entity[0] === "#") {
        const code =
          entity[1].toLowerCase() === "x"
            ? parseInt(entity.slice(2), 16)
            : parseInt(entity.slice(1), 10);
        return Number.isInteger(code) && code >= 0 && code <= 0x10ffff
          ? String.fromCodePoint(code)
          : match;
      }
      const named = NAMED_ENTITIES[entity.toLowerCase()];
      return named === undefined ? match : named;
    }
  );
}

export function cleanMeta(value) {
  if (value === null || value === undefined) {
    return "";
  }
  let text = String(value).replace(/\\'/g, "'");
  if (/%[0-9a-f]{2}/i.test(text)) {
    try {
      text = decodeURIComponent(text);
    } catch (error) {
      // A literal "%" in a title ("100% Dub") is not an escape.
    }
  }
  return decodeEntities(text)
    .replace("(Original Title)", "")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripTags(html) {
  return decodeEntities(
    String(html || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]*>/g, "")
  );
}
