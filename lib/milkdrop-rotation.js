// One shuffled pass visits every preset before refilling. A new pass cannot
// repeat the effect that just finished, including at the shuffle boundary.
export function createPresetRotation(
  names,
  { loadPreset, onChange, random = Math.random },
) {
  let remaining = [],
    current,
    pending,
    elapsed = 0,
    disposed = false;
  function choose() {
    if (!remaining.length) {
      remaining = [...names];
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
      }
      if (remaining.length > 1 && remaining[0] === current)
        [remaining[0], remaining[1]] = [remaining[1], remaining[0]];
    }
    return remaining.shift();
  }
  function next(blend = 3) {
    if (disposed) return Promise.resolve();
    if (pending) return pending;
    elapsed = 0;
    const name = choose();
    pending = Promise.resolve()
      .then(async () => {
        if (disposed) return;
        await loadPreset(name, blend);
        if (!disposed) {
          current = name;
          onChange(name);
        }
      })
      .finally(() => {
        pending = null;
      });
    return pending;
  }
  return {
    next,
    advance(seconds) {
      if (disposed || pending || !Number.isFinite(seconds) || seconds <= 0)
        return;
      elapsed += seconds;
      if (elapsed >= 15) return next();
    },
    dispose() {
      disposed = true;
      return (pending || Promise.resolve()).catch(() => {});
    },
  };
}
