// Same Butterchurn engine and preset versions used by Webamp's MilkDrop bundle.
// Keep them in a lazy chunk, away from the ordinary player's startup path.
import butterchurn from "butterchurn";
import presets from "butterchurn-presets/dist/minimal.js";
import { createMilkDropInput } from "./milkdrop-test-signal.js";

export function createMilkDrop(context, canvas, node, width, height) {
  const visualizer = butterchurn.createVisualizer(context, canvas, {
    width,
    height,
    pixelRatio: 1,
    textureRatio: 1,
  });
  const input = createMilkDropInput(context, visualizer, node);
  const pack = presets.default || presets;
  const preset = structuredClone(
    pack["Flexi, martin + geiss - dedicated to the sherwin maxawow"],
  );
  // Keep the approved colors and flowing texture, but make kick attacks visible.
  // The original hides its waveform (alpha .001) and mostly moves with time.
  // Comparing bass with its smoothed level keeps steady idle harmonics calm.
  preset.frame_eqs_eel += `
    beat = min(1, max(0, bass - bass_att));
    zoom = 1 - beat * 0.035;
    wave_a = beat * 0.65;
  `;
  return Promise.resolve(visualizer.loadPreset(preset, 0)).then(
    () => {
      visualizer.setTestSignal = input.setTestSignal;
      visualizer.dispose = () => {
        input.dispose();
        visualizer.loseGLContext();
      };
      return visualizer;
    },
    (error) => {
      input.dispose();
      visualizer.loseGLContext();
      throw error;
    },
  );
}
