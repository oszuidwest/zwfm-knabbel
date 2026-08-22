<script lang="ts">
  import { getMediaUrl } from '$lib/api/client'
  import { getAuthContext } from '$lib/stores/auth.svelte'
  import { statusColors, statusLabels } from '$lib/utils/labels'
  import { formatDuration, formatRelativeTime } from '$lib/utils/format'
  import { resolveInternalHref } from '$lib/utils/routes'
  import {
    ArchiveX,
    CircleCheckBig,
    FileText,
    Pencil,
    Podcast,
    Radio,
    Zap,
  } from '$lib/components/icons'
  import { PageHeader } from '$lib/components/ui'

  let { data } = $props()
  const auth = getAuthContext()

  const canCreateStory = $derived(auth.can('stories', 'write'))
  const canGenerate = $derived(auth.can('bulletins', 'generate'))

  // Dry time-of-day greetings; every entry addresses the user by {name}.
  const GREETINGS: Record<
    'night' | 'morning' | 'afternoon' | 'early_evening' | 'late_evening',
    string[]
  > = {
    night: [
      'Hey {name}, nog wakker?',
      'Hallo {name}, de nacht is voor de diehards',
      'Dag {name}, zelfs Babbel gaapt',
      'Hey {name}, met Babbel de nacht door',
      'Hi {name}, iemand moet het doen',
      'Hallo {name}, heel West-Brabant slaapt, maar jij niet',
      'Dag {name}, de zender draait door en jij ook',
      'Ha {name}, ZuidWest slaapt nooit',
    ],
    morning: [
      'Morgen {name}, alweer een dag vol nieuws',
      'Hey {name}, eerst koffie en dan nieuws',
      'Hallo {name}, de regio rekent op je',
      'Dag {name}, Babbel is wakker. Jij ook?',
      'Ha {name}, tijd om te babbelen',
      'Hey {name}, West-Brabant ontwaakt met ons nieuws',
      'Dag {name}, ZuidWest draait al, nu het nieuws nog',
      'Hey {name}, de ochtendspits wacht op ons nieuws',
      'Hallo {name}, verse bulletins bij het ontbijt',
      'Hi {name}, de studio ruikt nog naar koffie',
    ],
    afternoon: [
      'Hallo {name}, lunch gehad? De bulletins niet',
      'Dag {name}, het nieuws neemt geen pauze',
      'Ha {name}, even bijbabbelen?',
      'Hey {name}, middagdienst? Iemand moet het doen',
      'Hallo {name}, West-Brabant wil weten wat er speelt',
      'Dag {name}, de ether wacht op vers nieuws',
      'Hey {name}, ZuidWest draait door. Jij ook?',
      'Hi {name}, Babbel staat te trappelen',
      'Hallo {name}, Babbel heeft er zin in vanmiddag',
      'Dag {name}, West-Brabant is klaar voor een update',
      'Ha {name}, de middag klinkt beter met nieuws',
    ],
    early_evening: [
      'Hallo {name}, nog even de avond door',
      'Dag {name}, avonddienst? Respect.',
      'Hallo {name}, West-Brabant rekent op nieuws',
      'Ha {name}, de studio is van jou vanavond',
      'Hallo {name}, de avondploeg is compleet',
      'Hey {name}, de avond is nog jong',
      'Hi {name}, prime-time voor het radionieuws',
    ],
    late_evening: [
      'Hey {name}, het nieuws slaapt nooit',
      'Ha {name}, nog even Babbel voor het slapen?',
      'Hey {name}, de late uurtjes tellen dubbel',
      'Hi {name}, de avondploeg is compleet!',
      'Ha {name}, Babbel blijft op tot jij klaar bent',
      'Dag {name}, de laatste loodjes van vandaag',
      'Hallo {name}, bijna bedtijd?',
    ],
  }

  const hour = new Date().getHours()
  const daypart =
    hour < 5
      ? 'night'
      : hour < 12
        ? 'morning'
        : hour < 18
          ? 'afternoon'
          : hour < 21
            ? 'early_evening'
            : 'late_evening'
  const greetingSeed = Math.random()
  const firstName = $derived(
    (auth.user?.full_name || auth.user?.username || '').trim().split(' ')[0] || 'collega'
  )
  const greeting = $derived.by(() => {
    const pool = GREETINGS[daypart]
    return pool[Math.floor(greetingSeed * pool.length)].replace('{name}', firstName)
  })
  const todayLabel = new Date().toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  interface StatTile {
    label: string
    value: number
    href: string
    icon: typeof Radio
    accent: string
    tint: string
    show: boolean
  }

  const statTiles: StatTile[] = $derived([
    {
      label: 'Actieve berichten',
      value: data.stats.active,
      href: '/stories?status=active',
      icon: CircleCheckBig,
      accent: 'text-success/60',
      tint: 'sm:hover:bg-success/5',
      show: data.canStories,
    },
    {
      label: 'Breaking actief',
      value: data.stats.breaking,
      href: '/stories?status=active',
      icon: Zap,
      accent: 'text-error/60',
      tint: 'sm:hover:bg-error/5',
      show: data.canStories,
    },
    {
      label: 'Concepten',
      value: data.stats.drafts,
      href: '/stories?status=draft',
      icon: Pencil,
      accent: 'text-warning/60',
      tint: 'sm:hover:bg-warning/5',
      show: data.canStories,
    },
    {
      label: 'Bulletins vandaag',
      value: data.stats.today,
      href: '/bulletins',
      icon: Podcast,
      accent: 'text-primary/60',
      tint: 'sm:hover:bg-primary/5',
      show: data.canBulletins,
    },
  ])

  function isFresh(createdAt: string): boolean {
    return Date.now() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000
  }
</script>

<div class="space-y-6">
  <PageHeader
    title={greeting}
    subtitle={todayLabel}
    actionHref="/stories/new"
    actionLabel="Nieuw bericht"
    canAction={canCreateStory}
  />

  {#if statTiles.some(tile => tile.show)}
    <div
      class="stats w-full bg-base-100 max-sm:grid-flow-row max-sm:grid-cols-2 max-sm:gap-3 max-sm:bg-transparent"
    >
      {#each statTiles.filter(tile => tile.show) as tile (tile.label)}
        {@const Icon = tile.icon}
        <a
          href={resolveInternalHref(tile.href)}
          class="stat transition-colors {tile.tint} max-sm:gap-x-2 max-sm:rounded-box max-sm:border-0 max-sm:bg-base-100 max-sm:p-4"
        >
          <div class="stat-figure {tile.accent}">
            <Icon
              aria-hidden="true"
              class="h-8 w-8 max-sm:h-6 max-sm:w-6"
            />
          </div>
          <div class="stat-title max-sm:whitespace-normal">{tile.label}</div>
          <div class="stat-value">{tile.value}</div>
        </a>
      {/each}
    </div>
  {/if}

  {#if data.stationBulletins.length > 0}
    <section class="space-y-3">
      <h2 class="text-lg font-semibold">Laatste bulletin per zender</h2>
      <div class="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(20rem,1fr))]">
        {#each data.stationBulletins as { station, bulletin } (station.id)}
          <div class="card bg-base-100 card-sm">
            <div class="card-body">
              <div class="flex items-center justify-between gap-2">
                <h3 class="card-title min-w-0 text-base">
                  <Radio
                    aria-hidden="true"
                    class="h-4 w-4 shrink-0 text-primary"
                  />
                  <span class="truncate">{station.name}</span>
                </h3>
                {#if bulletin}
                  <span
                    class="badge badge-sm {isFresh(bulletin.created_at)
                      ? 'badge-success'
                      : 'badge-warning'}"
                  >
                    {formatRelativeTime(bulletin.created_at)}
                  </span>
                {/if}
              </div>

              {#if bulletin}
                <div class="flex flex-wrap items-center gap-3 text-sm text-base-content/60">
                  <span>{formatDuration(bulletin.duration_seconds)}</span>
                  <span>{bulletin.story_count ?? 0} berichten</span>
                </div>

                {#if bulletin.file_purged_at}
                  <div
                    role="alert"
                    class="alert"
                  >
                    <ArchiveX
                      aria-hidden="true"
                      class="h-4 w-4 shrink-0"
                    />
                    <span>Audio is opgeruimd</span>
                  </div>
                {:else if bulletin.audio_url}
                  <audio
                    controls
                    preload="metadata"
                    class="h-10 w-full"
                  >
                    <source
                      src={getMediaUrl(bulletin.audio_url)}
                      type="audio/wav"
                    />
                    Je browser ondersteunt geen audio weergave.
                  </audio>
                {/if}

                <div class="card-actions justify-end">
                  <a
                    href={resolveInternalHref(`/bulletins/${bulletin.id}`)}
                    class="btn btn-ghost btn-sm"
                  >
                    Details
                  </a>
                </div>
              {:else}
                <p class="text-sm text-base-content/60">Nog geen bulletin gegenereerd.</p>
                {#if canGenerate}
                  <div class="card-actions justify-end">
                    <a
                      href={resolveInternalHref('/bulletins/new')}
                      class="btn btn-ghost btn-sm"
                    >
                      Genereren
                    </a>
                  </div>
                {/if}
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <div class="grid gap-4 lg:grid-cols-2">
    {#if data.canStories}
      <ul class="list rounded-box bg-base-100">
        <li class="flex items-center justify-between p-4 pb-2">
          <span class="text-xs tracking-wide text-base-content/60">Recente berichten</span>
          <a
            href={resolveInternalHref('/stories')}
            class="link text-xs link-hover"
          >
            Alle berichten
          </a>
        </li>
        {#if data.recentStories.length === 0}
          <li class="p-4 pt-2 text-sm text-base-content/60">Nog geen berichten.</li>
        {:else}
          {#each data.recentStories as story (story.id)}
            <li class="list-row items-center">
              <div>
                <FileText
                  aria-hidden="true"
                  class="h-5 w-5 text-base-content/40"
                />
              </div>
              <div class="min-w-0">
                <a
                  href={resolveInternalHref(`/stories/${story.id}/edit`)}
                  class="flex items-center gap-1.5 font-medium hover:text-primary hover:underline"
                >
                  <span class="truncate">{story.title}</span>
                  {#if story.is_breaking}
                    <Zap
                      aria-hidden="true"
                      class="h-3.5 w-3.5 shrink-0 fill-current text-primary"
                    />
                  {/if}
                </a>
                <div class="text-xs text-base-content/60">
                  {formatRelativeTime(story.created_at)}
                </div>
              </div>
              <span class="badge badge-sm {statusColors[story.status] ?? ''}">
                {statusLabels[story.status] ?? story.status}
              </span>
            </li>
          {/each}
        {/if}
      </ul>
    {/if}

    {#if data.canBulletins}
      <ul class="list rounded-box bg-base-100">
        <li class="flex items-center justify-between p-4 pb-2">
          <span class="text-xs tracking-wide text-base-content/60">Recente bulletins</span>
          <a
            href={resolveInternalHref('/bulletins')}
            class="link text-xs link-hover"
          >
            Alle bulletins
          </a>
        </li>
        {#if data.recentBulletins.length === 0}
          <li class="p-4 pt-2 text-sm text-base-content/60">Nog geen bulletins.</li>
        {:else}
          {#each data.recentBulletins as bulletin (bulletin.id)}
            <li class="list-row items-center">
              <div>
                <Podcast
                  aria-hidden="true"
                  class="h-5 w-5 text-base-content/40"
                />
              </div>
              <div class="min-w-0">
                <a
                  href={resolveInternalHref(`/bulletins/${bulletin.id}`)}
                  class="flex items-center gap-1.5 font-medium hover:text-primary hover:underline"
                >
                  <span class="truncate">{bulletin.station_name ?? 'Onbekende zender'}</span>
                </a>
                <div class="text-xs text-base-content/60">
                  {formatRelativeTime(bulletin.created_at)}
                </div>
              </div>
              <span class="text-sm text-base-content/60">
                {formatDuration(bulletin.duration_seconds)}
              </span>
            </li>
          {/each}
        {/if}
      </ul>
    {/if}
  </div>
</div>
