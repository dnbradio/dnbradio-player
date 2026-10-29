<script>
import { h } from "vue";
export default {
  props: { size: { type: [String, Number], default: 24 } },
  setup(props, { slots }) {
    return () => {
      const name = (slots.default?.() || [])
        .map((node) => (typeof node.children === "string" ? node.children : ""))
        .join("")
        .trim();
      return h(
        "i",
        {
          class: [
            "ui-icon",
            name.startsWith("mdi-") ? ["mdi", name] : "material-icons",
          ],
          style: { fontSize: props.size + "px" },
          "aria-hidden": "true",
        },
        name.startsWith("mdi-") ? "" : name,
      );
    };
  },
};
</script>
