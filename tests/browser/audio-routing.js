// Test-only graph tracing: prove synthetic analyser input cannot reach speakers.
export function instrumentAudioRouting() {
  const edges = new Map(),
    sources = [],
    analysers = [];
  const connect = AudioNode.prototype.connect;
  const disconnect = AudioNode.prototype.disconnect;
  AudioNode.prototype.connect = function (target, ...args) {
    const result = connect.call(this, target, ...args);
    if (target instanceof AudioNode) {
      if (!edges.has(this)) edges.set(this, new Set());
      edges.get(this).add(target);
    }
    return result;
  };
  AudioNode.prototype.disconnect = function (...args) {
    const result = disconnect.apply(this, args);
    if (args[0] instanceof AudioNode) edges.get(this)?.delete(args[0]);
    else edges.delete(this);
    return result;
  };
  const createSource = BaseAudioContext.prototype.createBufferSource;
  BaseAudioContext.prototype.createBufferSource = function () {
    const source = createSource.call(this);
    const stop = source.stop;
    source.stop = function (...args) {
      source.testStopped = true;
      return stop.apply(this, args);
    };
    sources.push(source);
    return source;
  };
  const createAnalyser = BaseAudioContext.prototype.createAnalyser;
  BaseAudioContext.prototype.createAnalyser = function () {
    const analyser = createAnalyser.call(this);
    analysers.push(analyser);
    return analyser;
  };
  window.milkdropRouting = {
    activeSources: () => sources.filter((source) => !source.testStopped),
    hasAudiblePath() {
      return sources.some((source) => {
        if (source.testStopped) return false;
        const queue = [source],
          seen = new Set();
        while (queue.length) {
          const node = queue.pop();
          if (node === source.context.destination) return true;
          if (seen.has(node)) continue;
          seen.add(node);
          queue.push(...(edges.get(node) || []));
        }
        return false;
      });
    },
    peak() {
      let peak = 0;
      for (const analyser of analysers) {
        const bins = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(bins);
        peak = Math.max(peak, ...bins);
      }
      return peak;
    },
  };
}
