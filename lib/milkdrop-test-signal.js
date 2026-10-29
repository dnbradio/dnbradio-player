// This source feeds only MilkDrop's analyser branch. It is never connected to
// the player's media element, DJ analyser, or AudioContext.destination.
export function createMilkDropInput(context, visualizer, liveNode) {
  let demo = null,
    buffer = null,
    disposed = false;
  visualizer.connectAudio(liveNode);

  function makeBuffer() {
    // Seamless sustained harmonics with a 24-second breathing cycle. No
    // percussion, noise, sharp attacks, or rapid changes in band energy.
    const duration = 24;
    const result = context.createBuffer(
      1,
      Math.round(context.sampleRate * duration),
      context.sampleRate,
    );
    const samples = result.getChannelData(0);
    for (let i = 0; i < samples.length; i++) {
      const time = i / context.sampleRate;
      const phase = (2 * Math.PI * time) / duration;
      const low = 0.18 * (1 + 0.03 * Math.sin(phase));
      const warm = 0.1 * (1 + 0.025 * Math.sin(phase + (2 * Math.PI) / 3));
      const mid = 0.045 * (1 + 0.02 * Math.sin(phase + (4 * Math.PI) / 3));
      const high = 0.012 * (1 + 0.015 * Math.sin(phase * 2));
      samples[i] =
        low * Math.sin(2 * Math.PI * 55 * time) +
        warm * Math.sin(2 * Math.PI * 110 * time) +
        mid * Math.sin(2 * Math.PI * 330 * time) +
        high * Math.sin(2 * Math.PI * 880 * time);
    }
    return result;
  }
  function stopDemo() {
    if (!demo) return;
    visualizer.disconnectAudio(demo);
    demo.stop();
    demo.disconnect();
    demo = null;
  }
  return {
    setTestSignal(enabled) {
      if (disposed || enabled === Boolean(demo)) return;
      if (enabled) {
        buffer ||= makeBuffer();
        visualizer.disconnectAudio(liveNode);
        demo = context.createBufferSource();
        demo.buffer = buffer;
        demo.loop = true;
        visualizer.connectAudio(demo);
        demo.start();
      } else {
        stopDemo();
        visualizer.connectAudio(liveNode);
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (demo) stopDemo();
      else visualizer.disconnectAudio(liveNode);
      buffer = null;
    },
  };
}
