// Same Butterchurn engine and preset versions used by Webamp's MilkDrop bundle.
// Keep them in a lazy chunk, away from the ordinary player's startup path.
import butterchurn from "butterchurn";
import presets from "butterchurn-presets/dist/minimal.js";
import { createMilkDropInput } from "./milkdrop-test-signal.js";
import { createPresetRotation } from "./milkdrop-rotation.js";

export function createMilkDrop(context, canvas, node, width, height) {
  const visualizer = butterchurn.createVisualizer(context, canvas, {
    width,
    height,
    pixelRatio: 1,
    textureRatio: 1,
  });
  const input = createMilkDropInput(context, visualizer, node);
  const pack = presets.default || presets;
  const original = "Flexi, martin + geiss - dedicated to the sherwin maxawow";
  let disposed = false;
  const rotation = createPresetRotation(Object.keys(pack), {
    loadPreset(name, blend) {
      const preset = structuredClone(pack[name]);
      if (name === original) {
        // Retain the bass response added to the original, nearly invisible wave.
        preset.frame_eqs_eel += `
          beat = min(1, max(0, bass - bass_att));
          zoom = 1 - beat * 0.035;
          wave_a = beat * 0.65;
        `;
      }
      return visualizer.loadPreset(preset, blend);
    },
    onChange(name) {
      canvas.dataset.milkdropPreset = name;
    },
  });
  function dispose() {
    if (disposed) return;
    disposed = true;
    input.dispose();
    // Compilation is async. Let an in-flight load finish before losing GL.
    rotation.dispose().then(() => visualizer.loseGLContext());
  }
  return rotation.next(0).then(
    () => {
      visualizer.setTestSignal = input.setTestSignal;
      visualizer.advancePreset = rotation.advance;
      visualizer.nextPreset = rotation.next;
      visualizer.dispose = dispose;
      return visualizer;
    },
    (error) => {
      dispose();
      throw error;
    },
  );
}
