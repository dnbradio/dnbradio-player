const random = (min, max) => min + Math.random() * (max - min);

// Shared by the real player and the standalone mockup. This layer never owns
// playback or an AudioContext: MilkDrop reads the player's existing audio graph.
export function createBackgroundVisualizer(
  host,
  { getAudio, onStatus = () => {} },
) {
  const particlesCanvas = document.createElement("canvas");
  const milkCanvas = document.createElement("canvas");
  host.append(particlesCanvas, milkCanvas);
  for (const canvas of [particlesCanvas, milkCanvas]) {
    Object.assign(canvas.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
    });
  }
  const ctx = particlesCanvas.getContext("2d");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const events = new AbortController();
  let mode = "off",
    frame = 0,
    width,
    height,
    particles = [],
    renderer,
    graph;
  let pending = false,
    failed = false,
    destroyed = false,
    generation = 0,
    lastTime = 0;
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    setInput("inactive");
  }
  function setInput(input) {
    if (host.dataset.milkdropInput === input) return;
    renderer?.setTestSignal(input === "test");
    host.dataset.milkdropInput = input;
    if (renderer)
      onStatus(input === "test" ? "MilkDrop · silent test signal" : "");
  }
  function resize() {
    width = Math.min(innerWidth, 1280);
    height = Math.min(innerHeight, 1280);
    particlesCanvas.width = width;
    particlesCanvas.height = height;
    milkCanvas.width = width;
    milkCanvas.height = height;
    renderer?.setRendererSize(width, height);
    particles = Array.from({ length: mode === "rain" ? 90 : 40 }, () => ({
      x: random(0, width),
      y: random(0, height),
      radius: random(0.5, 2),
      opacity: random(0.12, 0.65),
      velocity: random(1, 5),
    }));
    update();
  }
  function paint(delta) {
    ctx.fillStyle = mode === "rain" ? "rgba(8,14,17,.7)" : "rgba(20,20,20,.6)";
    ctx.fillRect(0, 0, width, height);
    for (const p of particles) {
      if (mode === "rain") {
        p.y += p.velocity * 4 * delta;
        p.x -= p.velocity * 0.6 * delta;
        if (p.y > height + 24) {
          p.y = -24;
          p.x = random(0, width);
        }
        if (p.x < -24) p.x = width + 24;
      } else {
        p.x -= p.velocity * delta;
        if (p.x < -8) p.x = width + 8;
      }
      ctx.beginPath();
      ctx.lineWidth = mode === "rain" ? 1 : p.radius * 2;
      ctx.strokeStyle =
        mode === "rain"
          ? `rgba(155,191,209,${p.opacity})`
          : `rgba(255,255,255,${p.opacity})`;
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(
        p.x + (mode === "rain" ? 3 : p.radius * 4),
        p.y - (mode === "rain" ? p.velocity * 6 : 0),
      );
      ctx.stroke();
    }
  }
  function tick(time) {
    frame = 0;
    if (destroyed || mode === "off" || reduced.matches || document.hidden) {
      stop();
      return;
    }
    const seconds = lastTime ? Math.max(0, (time - lastTime) / 1000) : 0;
    const delta = lastTime ? Math.min(2, seconds * 60) : 1;
    lastTime = time;
    if (mode === "milkdrop") {
      const current = getAudio();
      if (
        !renderer ||
        !current ||
        current.node !== graph?.node ||
        current.context.state !== "running"
      ) {
        stop();
        return;
      }
      try {
        setInput(current.paused ? "test" : "live");
        if (!current.paused)
          renderer.advancePreset(seconds)?.catch((error) => {
            console.warn("MilkDrop preset failed to load", error);
          });
        // Let idle visuals drift at one fifth of the live visualizer's pace.
        renderer.render(
          current.paused ? { elapsedTime: (delta / 60) * 0.2 } : undefined,
        );
      } catch {
        failed = true;
        setInput("inactive");
        onStatus("MilkDrop unavailable. Stars and rain are still available.");
        return;
      }
    } else paint(delta);
    frame = requestAnimationFrame(tick);
  }
  function disposeRenderer() {
    generation++;
    renderer?.dispose();
    renderer = graph = null;
    host.dataset.milkdropInput = "inactive";
  }
  async function loadMilkDrop() {
    if (pending || failed || destroyed || mode !== "milkdrop") return;
    const current = getAudio();
    if (!current) {
      onStatus("Press play to start MilkDrop.");
      return;
    }
    if (renderer) {
      update();
      return;
    }
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2");
    if (!gl) {
      failed = true;
      onStatus(
        "MilkDrop requires WebGL 2. Stars and rain are still available.",
      );
      return;
    }
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    pending = true;
    const version = generation;
    try {
      const { createMilkDrop } = await import("./milkdrop.js");
      if (destroyed || version !== generation) return;
      const next = await createMilkDrop(
        current.context,
        milkCanvas,
        current.node,
        width,
        height,
      );
      if (
        destroyed ||
        version !== generation ||
        mode !== "milkdrop" ||
        getAudio()?.node !== current.node
      ) {
        next.dispose();
        return;
      }
      graph = current;
      renderer = next;
      renderer.render(); // One still frame when motion is reduced.
      onStatus(reduced.matches ? "MilkDrop: reduced motion" : "");
    } catch (error) {
      if (
        destroyed ||
        version !== generation ||
        getAudio()?.node !== current.node
      )
        return;
      console.warn("MilkDrop failed to initialize", error);
      failed = true;
      onStatus("MilkDrop unavailable. Stars and rain are still available.");
    } finally {
      pending = false;
      if (!destroyed) update();
    }
  }
  function update() {
    stop();
    if (destroyed || document.hidden || mode === "off") return;
    if (mode === "milkdrop") {
      const current = getAudio();
      if (renderer && current?.node !== graph?.node) disposeRenderer();
      if (!renderer) {
        loadMilkDrop();
        return;
      }
      if (reduced.matches) return;
    } else paint(0);
    if (!reduced.matches) frame = requestAnimationFrame(tick);
  }
  async function nextPreset() {
    const active = renderer;
    if (destroyed || mode !== "milkdrop" || !active) return;
    try {
      // Idle rendering runs at one fifth speed; keep manual blends near 3s.
      const blend = reduced.matches ? 0 : getAudio()?.paused ? 0.6 : 3;
      await active.nextPreset(blend);
      if (destroyed || renderer !== active || mode !== "milkdrop") return;
      active.render();
      update();
    } catch (error) {
      console.warn("MilkDrop preset failed to load", error);
    }
  }
  let taps = 0,
    lastTap = 0,
    tapX = 0,
    tapY = 0;
  document.addEventListener(
    "click",
    (event) => {
      if (
        mode !== "milkdrop" ||
        event.button !== 0 ||
        event.defaultPrevented ||
        (event.target instanceof Element &&
          event.target.closest(
            "button, a, input, select, textarea, [role=button], [role=dialog], dialog, [contenteditable], .player__marquee, .player__logo",
          ))
      ) {
        taps = 0;
        return;
      }
      const nearby =
        Math.hypot(event.clientX - tapX, event.clientY - tapY) < 40;
      taps = nearby && event.timeStamp - lastTap < 600 ? taps + 1 : 1;
      lastTap = event.timeStamp;
      tapX = event.clientX;
      tapY = event.clientY;
      if (taps === 3 || event.detail === 3) {
        taps = 0;
        nextPreset();
      }
    },
    { signal: events.signal },
  );
  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key.toLowerCase() !== "n" ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        (event.target instanceof Element &&
          event.target.closest(
            "input, textarea, select, [contenteditable], [role=dialog], dialog",
          ))
      )
        return;
      if (mode === "milkdrop") {
        event.preventDefault();
        nextPreset();
      }
    },
    { signal: events.signal },
  );
  function setMode(value) {
    if (mode === "milkdrop" && value !== "milkdrop") {
      stop();
      disposeRenderer();
    }
    taps = 0;
    mode = ["off", "stars", "milkdrop", "rain"].includes(value) ? value : "off";
    host.dataset.visualization = mode;
    host.hidden = mode === "off";
    particlesCanvas.hidden = mode === "milkdrop";
    milkCanvas.hidden = mode !== "milkdrop";
    milkCanvas.style.opacity = ".28";
    onStatus("");
    resize();
  }
  document.addEventListener("visibilitychange", update, {
    signal: events.signal,
  });
  reduced.addEventListener("change", update, { signal: events.signal });
  window.addEventListener("resize", resize, { signal: events.signal });
  return {
    setMode,
    update,
    destroy() {
      destroyed = true;
      generation++;
      stop();
      events.abort();
      disposeRenderer();
      particlesCanvas.remove();
      milkCanvas.remove();
    },
  };
}
