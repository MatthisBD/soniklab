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

    <!-- soundcloud : nuage + barres -->
    <g v-else-if="name === 'soundcloud'">
      <path d="M11 17V8.5a5 5 0 0 1 9.6 1.9A2.8 2.8 0 0 1 20 17Z" />
      <path d="M8 17v-6M5 17v-4M2 17v-2" />
    </g>

    <!-- instagram -->
    <g v-else-if="name === 'instagram'">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
    </g>

    <!-- mail -->
    <g v-else-if="name === 'mail'">
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="m3.5 6 8.5 7 8.5-7" />
    </g>

    <!-- lecture (vidéo) -->
    <g v-else-if="name === 'play'">
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5v7l5.5-3.5Z" fill="currentColor" />
    </g>

    <!-- lieu -->
    <g v-else-if="name === 'pin'">
      <path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </g>

    <!-- cœur / soutien -->
    <g v-else-if="name === 'heart'">
      <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20Z" />
    </g>

    <!-- photos -->
    <g v-else-if="name === 'image'">
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <circle cx="8.5" cy="9.5" r="1.7" />
      <path d="m3.5 18 5.5-5.5 4 4 3-3 4.5 4.5" />
    </g>

    <!-- menu burger / fermer -->
    <g v-else-if="name === 'menu'">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </g>
    <g v-else-if="name === 'close'">
      <path d="M6 6l12 12M18 6 6 18" />
    </g>

    <!-- chevrons (galerie) -->
    <g v-else-if="name === 'prev'">
      <path d="m15 5-7 7 7 7" />
    </g>
    <g v-else-if="name === 'next'">
      <path d="m9 5 7 7-7 7" />
    </g>

    <!-- œil : afficher / masquer un mot de passe -->
    <g v-else-if="name === 'eye'">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </g>
    <g v-else-if="name === 'eye-off'">
      <path d="M9.9 5.7A9.6 9.6 0 0 1 12 5.5C18 5.5 21.5 12 21.5 12a17 17 0 0 1-3 3.8M6.2 7.2C3.9 8.9 2.5 12 2.5 12S6 18.5 12 18.5c1.8 0 3.3-.6 4.6-1.4" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="M3 3l18 18" />
    </g>

    <!-- cadenas : rubrique privée (visible des admins seulement) -->
    <g v-else-if="name === 'lock'">
      <rect x="5" y="10.5" width="14" height="10" rx="1.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </g>

    <!-- fallback : point -->
    <circle v-else cx="12" cy="12" r="3" />
  </svg>
</template>
