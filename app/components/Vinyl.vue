<script setup lang="ts">
withDefaults(defineProps<{ paused?: boolean }>(), { paused: false })
</script>

<template>
  <svg
    viewBox="0 0 200 200"
    class="h-full w-full"
    role="img"
    aria-label="Disque vinyle SONIKLAB"
  >
    <defs>
      <radialGradient id="sheen" cx="38%" cy="32%" r="75%">
        <stop offset="0%" stop-color="#3a3a3f" />
        <stop offset="45%" stop-color="#141417" />
        <stop offset="100%" stop-color="#050506" />
      </radialGradient>
    </defs>

    <g class="vinyl-spin" :class="{ paused }" style="transform-origin: 100px 100px">
      <!-- corps du disque -->
      <circle cx="100" cy="100" r="96" fill="url(#sheen)" stroke="#2a2a2e" stroke-width="1" />

      <!-- sillons -->
      <g fill="none" stroke="#ffffff" stroke-opacity="0.06">
        <circle cx="100" cy="100" r="88" />
        <circle cx="100" cy="100" r="80" />
        <circle cx="100" cy="100" r="72" />
        <circle cx="100" cy="100" r="64" />
        <circle cx="100" cy="100" r="56" />
        <circle cx="100" cy="100" r="48" />
      </g>

      <!-- reflet -->
      <path
        d="M40 60 A 70 70 0 0 1 150 45"
        fill="none"
        stroke="#ffffff"
        stroke-opacity="0.12"
        stroke-width="6"
        stroke-linecap="round"
      />

      <!-- étiquette centrale -->
      <circle cx="100" cy="100" r="34" fill="#f3f1ea" />
      <circle cx="100" cy="100" r="34" fill="none" stroke="#0a0a0a" stroke-opacity="0.15" />
      <text
        x="100"
        y="92"
        text-anchor="middle"
        fill="#0a0a0a"
        font-family="Anton, sans-serif"
        font-size="13"
        letter-spacing="0.5"
      >
        SONIK
      </text>
      <text
        x="100"
        y="106"
        text-anchor="middle"
        fill="#0a0a0a"
        font-family="Anton, sans-serif"
        font-size="13"
        letter-spacing="0.5"
      >
        LAB
      </text>
      <text
        x="100"
        y="120"
        text-anchor="middle"
        fill="#0a0a0a"
        font-family="Space Mono, monospace"
        font-size="5"
        letter-spacing="1.5"
      >
        33 ⅓ RPM
      </text>

      <!-- trou central -->
      <circle cx="100" cy="100" r="3" fill="#0a0a0a" />
    </g>
  </svg>
</template>
