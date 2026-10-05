<script setup lang="ts">
import type { SettingKey } from '~/composables/useShowcase'

// Mentions légales + données personnelles (LCEN art. 6 III, RGPD).
// Les infos de l'association se règlent dans /admin → Textes & réseaux.
useSeoMeta({
  title: 'SONIKLAB — Mentions légales',
  description: "Mentions légales, propriété intellectuelle et données personnelles du site de l'association SONIKLAB.",
})

const UPDATED = '5 octobre 2026'

const settings = useSiteSettings()
const val = (key: SettingKey) => settings.value[key]?.trim() ?? ''
const assoName = computed(() => val('legal_name') || 'SONIKLAB')
const year = new Date().getFullYear()

const identity = computed(() =>
  [
    { label: 'Éditeur', value: `Association ${assoName.value}, association loi 1901` },
    { label: 'Siège social', value: val('legal_address') },
    { label: 'N° RNA', value: val('legal_rna') },
    { label: 'SIRET', value: val('legal_siret'), optional: true },
    { label: 'Directeur·rice de la publication', value: val('legal_director') },
    { label: 'Téléphone', value: val('legal_phone') },
  ].filter((r) => r.value || !r.optional),
)

useReveal()
</script>

<template>
  <div class="relative">
    <SiteHeader />

    <section class="border-b border-line">
      <div class="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <p class="font-mono text-xs uppercase tracking-[0.25em] text-ash">// infos légales</p>
        <h1 class="mt-3 font-display text-5xl uppercase leading-[0.98] tracking-[0.015em] sm:text-7xl">
          Mentions <span class="glitch inline-block">légales</span>
        </h1>
        <p class="mt-4 font-mono text-xs uppercase tracking-widest text-ash">Dernière mise à jour : {{ UPDATED }}</p>
      </div>
    </section>

    <article class="legal mx-auto max-w-3xl px-5 py-12 md:py-16">
      <!-- 1. Éditeur -->
      <h2>1. Éditeur du site</h2>
      <p>
        Le site <strong>soniklab.fr</strong> est édité par l'association {{ assoName }}, association régie par la
        loi du 1<sup>er</sup> juillet 1901.
      </p>
      <dl class="mt-5 grid gap-x-6 gap-y-2 border border-line bg-grave p-5 sm:grid-cols-[auto_1fr]">
        <template v-for="r in identity" :key="r.label">
          <dt class="font-mono text-[0.7rem] uppercase tracking-widest text-ash">{{ r.label }}</dt>
          <dd class="text-bone" :class="!r.value && 'italic text-ash'">{{ r.value || 'à compléter' }}</dd>
        </template>
        <dt class="font-mono text-[0.7rem] uppercase tracking-widest text-ash">Contact</dt>
        <dd>
          <CopyText v-if="settings.contact_email" :text="settings.contact_email" class="text-bone hover:text-smoke" />
          <span v-else class="italic text-ash">à compléter</span>
        </dd>
      </dl>

      <!-- 2. Hébergement -->
      <h2>2. Hébergement</h2>
      <p>
        <strong>Site :</strong> Cloudflare, Inc. — 101 Townsend Street, San Francisco, CA 94107, États-Unis —
        +1 (650) 319-8930 —
        <a href="https://www.cloudflare.com" target="_blank" rel="noopener noreferrer">cloudflare.com</a>.
      </p>
      <p>
        <strong>Base de données et images :</strong> Supabase, Inc. —
        <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">supabase.com</a> — données
        hébergées dans l'Union européenne (Paris, France).
      </p>
      <p>
        <strong>Nom de domaine :</strong> OVH SAS — 2 rue Kellermann, 59100 Roubaix, France.
      </p>

      <!-- 3. Propriété intellectuelle -->
      <h2>3. Propriété intellectuelle</h2>
      <p>
        Le nom <strong>{{ assoName }}</strong>, son <strong>logo</strong>, l'identité graphique du site, ses textes
        et ses créations visuelles sont la propriété exclusive de l'association {{ assoName }}, sauf mention
        contraire. Ils sont protégés par le Code de la propriété intellectuelle.
      </p>
      <p>
        Toute reproduction, représentation, modification, adaptation ou utilisation, totale ou partielle, de ces
        éléments — en particulier du logo — sur quelque support que ce soit (flyers, affiches, réseaux sociaux,
        vêtements, sites…) est <strong>interdite sans l'autorisation écrite préalable</strong> de l'association.
        Toute utilisation non autorisée constitue une contrefaçon sanctionnée par les articles L.335-2 et suivants
        du Code de la propriété intellectuelle.
      </p>
      <p>
        Les photos, vidéos, affiches et visuels des artistes et des événements restent la propriété de leurs
        auteurs respectifs (photographes, graphistes, artistes) et sont publiés avec leur accord. Les noms et
        logos des partenaires et collaborateurs appartiennent à leurs titulaires.
      </p>
      <p>
        Pour toute demande d'utilisation (presse, partenariat, affiche d'événement), écrivez-nous : on répond
        vite et on dit souvent oui.
      </p>

      <!-- 4. Données personnelles -->
      <h2 id="donnees">4. Données personnelles</h2>
      <p>
        L'association {{ assoName }} est responsable des traitements de données réalisés sur ce site, dans le
        respect du Règlement général sur la protection des données (RGPD) et de la loi Informatique et Libertés.
      </p>
      <h3>Formulaire « Booking & collab »</h3>
      <ul>
        <li><strong>Données collectées :</strong> nom ou structure, email, téléphone (facultatif), lien (facultatif) et message.</li>
        <li><strong>Finalité :</strong> répondre à votre demande (booking, collaboration, projet).</li>
        <li><strong>Base légale :</strong> votre consentement, donné en cochant la case avant l'envoi.</li>
        <li><strong>Destinataires :</strong> les seuls membres de l'association en charge des demandes. Rien n'est vendu ni transmis à des tiers.</li>
        <li><strong>Durée de conservation :</strong> le temps de traiter la demande, puis au maximum 3 ans après le dernier échange.</li>
      </ul>
      <h3>Tombolas</h3>
      <ul>
        <li><strong>Données collectées :</strong> nom, email et/ou téléphone (pour prévenir les gagnants), nombre de tickets, montant et moyen de paiement.</li>
        <li><strong>Finalité :</strong> attribuer les numéros de tickets, réaliser le tirage au sort et remettre les lots.</li>
        <li><strong>Base légale :</strong> l'exécution du règlement de la tombola, accepté en prenant un ticket.</li>
        <li>
          <strong>Destinataires :</strong> les seuls membres de l'association. Les gagnants sont publiés sur le site sous
          la forme « numéro de ticket + prénom et initiale du nom ».
        </li>
        <li><strong>Durée de conservation :</strong> au plus tard un an après le tirage, puis effacement.</li>
        <li>
          Si vous prenez vos tickets en ligne, le paiement est traité par la plateforme utilisée (HelloAsso), selon sa
          propre politique de confidentialité.
        </li>
      </ul>
      <h3>Vos droits</h3>
      <p>
        Vous pouvez à tout moment accéder à vos données, les rectifier, les faire effacer, vous opposer à leur
        traitement, en demander la limitation ou la portabilité, et retirer votre consentement, en écrivant à
        l'adresse de contact ci-dessus. Si vous estimez que vos droits ne sont pas respectés, vous pouvez
        adresser une réclamation à la CNIL
        (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">cnil.fr</a>).
      </p>

      <!-- 5. Cookies & mesure d'audience -->
      <h2>5. Cookies et mesure d'audience</h2>
      <p>
        Ce site <strong>n'utilise aucun cookie publicitaire ni outil de pistage</strong> (pas de Google
        Analytics, pas de pixel de réseau social). C'est pourquoi aucun bandeau de consentement n'est affiché.
      </p>
      <ul>
        <li>
          <strong>Compteur de visites :</strong> anonyme. Il enregistre seulement, dans votre navigateur, la date
          de votre dernier passage, pour ne pas vous compter deux fois. Aucune adresse IP ni aucun identifiant
          n'est conservé : seul un total de visites par jour est enregistré.
        </li>
        <li>
          <strong>Polices de caractères :</strong> chargées depuis les serveurs de Google Fonts, qui reçoivent à
          cette occasion votre adresse IP.
        </li>
        <li>
          <strong>Vidéos :</strong> les vidéos YouTube des galeries utilisent le mode « confidentialité renforcée »
          et ne se chargent que si vous ouvrez la vidéo.
        </li>
        <li>
          <strong>Espace membres :</strong> la connexion des membres de l'association est conservée dans leur
          navigateur ; elle ne concerne pas les visiteurs.
        </li>
      </ul>

      <!-- 6. Responsabilité -->
      <h2>6. Liens et responsabilité</h2>
      <p>
        Le site contient des liens vers d'autres sites (réseaux sociaux, billetteries, plateformes d'écoute…).
        L'association n'est pas responsable de leur contenu. Elle s'efforce de publier des informations exactes
        et à jour (dates, lieux, horaires) mais ne peut garantir l'absence d'erreur ou de changement de dernière
        minute.
      </p>

      <!-- 7. Droit applicable -->
      <h2>7. Droit applicable</h2>
      <p>Les présentes mentions sont soumises au droit français.</p>

      <p class="mt-12 font-mono text-xs uppercase tracking-widest text-ash">
        © {{ year }} {{ assoName }} — tous droits réservés.
      </p>
    </article>

    <SiteFooter />
  </div>
</template>

<style scoped>
/* Mise en forme du texte légal (titres, paragraphes, listes, liens). */
.legal h2 {
  margin-top: 3rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-line);
  font-family: var(--font-display);
  font-size: 1.75rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}
.legal h2:first-child {
  margin-top: 0;
}
.legal h3 {
  margin-top: 1.75rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-ash);
}
.legal p,
.legal li {
  margin-top: 0.9rem;
  line-height: 1.7;
  color: var(--color-smoke);
}
.legal ul {
  margin-top: 0.5rem;
  list-style: square;
  padding-left: 1.25rem;
}
.legal li {
  margin-top: 0.5rem;
}
.legal strong {
  color: var(--color-bone);
  font-weight: 600;
}
.legal a {
  color: var(--color-bone);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.legal a:hover {
  color: var(--color-smoke);
}
.legal h2[id] {
  scroll-margin-top: 5rem;
}
</style>
