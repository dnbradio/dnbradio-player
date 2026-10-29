import { reactive } from "vue";

export function createAudioMotion(
  audio,
  profile,
  onUnavailable,
  canAnalyse = () => true,
  canAnimate = canAnalyse,
) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const Context = window.AudioContext || window.webkitAudioContext;
  const state = reactive({
    enabled: true,
    reduced: reduced.matches,
    available: Boolean(Context),
    contextState: "uninitialized",
  });
  let context,
    analyser,
    source,
    bins,
    head,
    frame = 0;
  let bass = 0,
    mids = 0,
    treble = 0,
    lastBass = 0,
    lastMid = 0;
  const events = new AbortController();

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    if (head) head.style.transform = "none";
    bass = mids = treble = lastBass = lastMid = 0;
  }
  function average(low, high) {
    const from = Math.max(
      1,
      Math.floor((low * analyser.fftSize) / context.sampleRate),
    );
    const to = Math.min(
      bins.length,
      Math.ceil((high * analyser.fftSize) / context.sampleRate),
    );
    let sum = 0;
    for (let i = from; i < to; i++) sum += bins[i];
    return sum / Math.max(1, to - from) / 255;
  }
  function animate() {
    frame = 0;
    if (
      !canAnimate() ||
      !head ||
      !analyser ||
      context.state !== "running" ||
      !state.available ||
      !state.enabled ||
      state.reduced ||
      audio.paused ||
      audio.readyState < 2 ||
      document.hidden
    ) {
      stop();
      return;
    }
    analyser.getByteFrequencyData(bins);
    bass += (average(35, 180) - bass) * 0.22;
    mids += (average(180, 2400) - mids) * 0.15;
    treble += (average(2400, 12000) - treble) * 0.25;
    const tilt = Math.max(-9, Math.min(9, (mids - lastMid) * 230));
    const jitter = Math.max(
      -2.5,
      Math.min(2.5, (bass - lastBass) * treble * 180),
    );
    head.style.transform = `translate(${jitter.toFixed(2)}px,${(-bass * 19).toFixed(2)}px) rotate(${tilt.toFixed(2)}deg) scale(${(1 + bass * 0.065).toFixed(3)})`;
    lastMid += (mids - lastMid) * 0.08;
    lastBass += (bass - lastBass) * 0.1;
    frame = requestAnimationFrame(animate);
  }
  function start() {
    if (!state.available || !canAnalyse()) return;
    if (context && !source && audio.readyState >= 2 && !audio.paused) {
      try {
        source = context.createMediaElementSource(audio);
        source.connect(analyser);
      } catch {
        unavailable();
        return;
      }
    }
    if (!frame) animate();
  }
  function unavailable() {
    if (!state.available) return;
    disable();
    onUnavailable();
  }
  function disable() {
    state.available = false;
    stop();
    events.abort();
    source?.disconnect();
    analyser?.disconnect();
    if (context && context.state !== "closed") context.close().catch(() => {});
  }
  function resume() {
    if (
      !state.available ||
      !canAnalyse() ||
      (!context && navigator.userActivation?.isActive === false)
    )
      return;
    try {
      if (!context) {
        context = new Context();
        context.addEventListener(
          "statechange",
          () => {
            state.contextState = context.state;
            if (context.state === "running") start();
            else stop();
          },
          { signal: events.signal },
        );
        analyser = context.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.72;
        bins = new Uint8Array(analyser.frequencyBinCount);
        analyser.connect(context.destination);
      }
      context
        .resume()
        .then(start)
        .catch(() => {
          unavailable();
        });
    } catch {
      unavailable();
    }
  }
  for (const event of ["pause", "waiting", "ended", "error"])
    audio.addEventListener(event, stop, { signal: events.signal });
  audio.addEventListener("playing", start, { signal: events.signal });
  document.addEventListener(
    "visibilitychange",
    () => {
      stop();
      if (!document.hidden) start();
    },
    { signal: events.signal },
  );
  reduced.addEventListener(
    "change",
    () => {
      state.reduced = reduced.matches;
      stop();
      if (!state.reduced) start();
    },
    { signal: events.signal },
  );

  return {
    profile,
    state,
    get context() {
      return context;
    },
    get node() {
      return analyser;
    },
    get initialized() {
      return Boolean(context);
    },
    disable,
    resume,
    attach(element) {
      head = element;
      start();
    },
    detach() {
      stop();
      head = null;
    },
    toggle() {
      state.enabled = !state.enabled;
      stop();
      if (state.enabled) {
        resume();
        start();
      }
    },
  };
}
