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
import PlayerLayout from "../layouts/default.vue";
</script>
