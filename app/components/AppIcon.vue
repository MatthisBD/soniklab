<script setup lang="ts">
defineProps<{ name: string }>()
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <!-- billetterie / helloasso -->
    <g v-if="name === 'ticket'">
      <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z" />
      <path d="M14 6v12" stroke-dasharray="2 2" />
    </g>

    <!-- to-do / gestion -->
    <g v-else-if="name === 'checklist'">
      <path d="M4 5h10M4 12h10M4 19h10" />
      <path d="M18.5 4.5 20 6l2.2-3" />
      <path d="M18.5 11.5 20 13l2.2-3" />
      <path d="M18.5 18.5 20 20l2.2-3" />
    </g>

    <!-- réseaux / broadcast -->
    <g v-else-if="name === 'broadcast'">
      <circle cx="12" cy="12" r="2.2" />
      <path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M5.8 5.8a9 9 0 0 0 0 12.4M18.2 5.8a9 9 0 0 1 0 12.4" />
    </g>

    <!-- docs / folder -->
    <g v-else-if="name === 'folder'">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <path d="M3 11h18" />
    </g>

    <!-- flèche sortante -->
    <g v-else-if="name === 'arrow'">
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </g>

    <!-- fallback : point -->
    <circle v-else cx="12" cy="12" r="3" />
  </svg>
</template>
