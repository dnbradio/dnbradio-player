<template>
  <component :is="$route.meta.bare ? 'div' : PlayerLayout">
    <RouterView
      :key="
        $route.name?.includes('webamp') || $route.name === 'embed'
          ? $route.fullPath
          : undefined
      "
    />
  </component>
</template>
<script setup>
import { watch } from "vue";
import { useRoute } from "vue-router";
import PlayerLayout from "../layouts/default.vue";
const route = useRoute();
watch(
  () => route.meta.surface,
  (surface) => {
    document.documentElement.classList.toggle(
      "broadcast-overlay",
      surface === "widget",
    );
    document.documentElement.classList.toggle(
      "dnb-embed",
      surface === "webamp",
    );
  },
  { immediate: true },
);
</script>
