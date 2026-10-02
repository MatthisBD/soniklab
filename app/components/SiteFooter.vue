<script setup lang="ts">
const year = new Date().getFullYear()
const auth = useAuth()
const settings = useSiteSettings()

const socials = computed(() =>
  [
    { label: 'Instagram', icon: 'instagram', url: settings.value.instagram_url },
    { label: 'SoundCloud', icon: 'soundcloud', url: settings.value.soundcloud_url },
    { label: 'Email', icon: 'mail', url: settings.value.contact_email && `mailto:${settings.value.contact_email}` },
    { label: 'Soutenir', icon: 'heart', url: settings.value.helloasso_url },
  ].filter((s) => s.url),
)
</script>

<template>
  <footer class="border-t border-line">
    <div class="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p class="font-display text-2xl uppercase tracking-wide">SONIKLAB</p>
        <p class="mt-1 max-w-xs text-sm text-ash">
          Association & collectif techno — fête de la musique, guinguettes, bars & open airs.
        </p>
        <div v-if="socials.length" class="mt-4 flex gap-2">
          <a
            v-for="s in socials"
            :key="s.label"
            :href="s.url"
            :title="s.label"
            target="_blank"
            rel="noopener noreferrer"
            class="border border-line p-2 text-smoke transition-colors hover:border-bone hover:bg-bone hover:text-void"
          >
            <AppIcon :name="s.icon" class="h-4 w-4" />
            <span class="sr-only">{{ s.label }}</span>
          </a>
        </div>
      </div>
      <div class="h-10 w-40 self-end sm:self-center">
        <Equalizer :bars="40" />
      </div>
      <p class="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-ash">
        © {{ year }} · fait avec ❤ & 909<template v-if="auth.isAdmin.value"> ·
        <NuxtLink to="/qg" class="transition-colors hover:text-bone">QG</NuxtLink> ·
        <NuxtLink to="/budget" class="transition-colors hover:text-bone">budget</NuxtLink> ·
        <NuxtLink to="/admin" class="transition-colors hover:text-bone">admin</NuxtLink></template>
      </p>
    </div>
  </footer>
</template>
