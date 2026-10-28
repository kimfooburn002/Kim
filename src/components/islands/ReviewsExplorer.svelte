<script lang="ts">
  import { tick } from 'svelte';
  import type { Post, ReviewTier } from '../../lib/types';
  import ReviewCard from '../ReviewCard.svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import { captureElement } from '../../lib/screenshot';

  type Layout = 'wide' | 'cover' | 'tier';
  type Props = {
    posts: Post[];
    totalReviews: number;
  };

  type BookFilter = 'all' | 'book' | 'series';
  type CompletionFilter = 'all' | 'completed' | 'ongoing';
  const STATUS_TAGS = ['completed', 'ongoing'] as const;

  const SOURCE_TAGS = ['amazon', 'audiobook', 'royal-road'] as const;
  type SourceTag = (typeof SOURCE_TAGS)[number];
  const SOURCE_LABELS: Record<SourceTag, string> = {
    amazon: 'Amazon',
    audiobook: 'Audiobook',
    'royal-road': 'Royal Road',
  };

  const LAYOUT_OPTIONS: Layout[] = ['cover', 'tier', 'wide'];

  let { posts, totalReviews }: Props = $props();

  const TIER_DESCRIPTIONS: Record<ReviewTier, string> = {
    'π': 'I wrote this. Opinion is biased',
    S: 'Adore. Caused severe book hangover, scratched almost every itch!',
    A: 'Amazing! Usually have one or two things that did not land perfectly',
    B: 'Enjoyed, decent to pass the time :)',
    C: 'Kinda meh. Future works might be better with experience',
    D: 'Tried but not for me',
    E: 'Was great, but halfway through, it got questionable',
    F: 'Expectations was not met so dropped with some resentment',
    G: 'On My Radar',
  };

  const TIER_LABEL_STYLES: Record<ReviewTier, { grad: string; scrim: number }> = {
    'π': { grad: 'var(--grad-m)', scrim: 0.5 },
    S: { grad: 'var(--grad-s)', scrim: 0.5 },
    A: { grad: 'var(--grad-a)', scrim: 0.5 },
    B: { grad: 'var(--grad-b)', scrim: 0.5 },
    C: { grad: 'var(--grad-c)', scrim: 0.5 },
    D: { grad: 'var(--grad-d)', scrim: 0.5 },
    E: { grad: 'var(--grad-e)', scrim: 0.5 },
    F: { grad: 'var(--grad-f)', scrim: 0.5 },
    G: { grad: 'var(--grad-g)', scrim: 0.5 },
  };

  const LINK_TAG_MAP: Record<string, string> = {
    amazon: 'amazon',
    audible: 'audiobook',
    royal_road: 'royal-road',
  };

  function withDefaultBookTag(post: Post) {
    return !post.tags.includes('book') && !post.tags.includes('series')
      ? ['book']
      : [];
  }

  const augmentedPosts = $derived.by(() => {
    return posts.map((post) => {
      const extras: string[] = [];
      for (const link of post.links) {
        const t = LINK_TAG_MAP[link.name];
        if (t) extras.push(t);
      }

      const defaultBookTag = withDefaultBookTag(post);

      const completed =
        !post.tags.includes('ongoing') && !post.tags.includes('completed')
          ? ['completed']
          : [];

      return {
        ...post,
        tags: [...post.tags, ...extras, ...defaultBookTag, ...completed],
      };
    });
  });

  const SPECIAL_TAGS = [
    ...STATUS_TAGS,
    ...SOURCE_TAGS,
    'book',
    'series',
  ] as const;

  const allTags = $derived(
    Array.from(
      new Set(
        augmentedPosts
          .flatMap((p) => p.tags)
          .filter((tag) => !SPECIAL_TAGS.includes(tag as (typeof SPECIAL_TAGS)[number]))
      )
    ).sort()
  );

  const defaultLayout: Layout =
    typeof globalThis !== 'undefined' &&
    (globalThis as { screen?: { width: number } }).screen?.width !== undefined &&
    (globalThis as { screen: { width: number } }).screen.width > 1280
      ? 'wide'
      : 'cover';

  function slugFromAbslink(abslink: string): string {
    return abslink.replace(/\/$/, '').split('/').pop() ?? abslink;
  }

  function readInitialState(): {
    layout: Layout;
    byRank: boolean;
    activations: Record<string, boolean>;
    searchTerm: string;
    readingList: SvelteSet<string>;
    showReadingList: boolean;
    completionFilter: CompletionFilter;
    sourceActivations: Record<string, boolean>;
    bookFilter: BookFilter;
  } {
    const out = {
      layout: defaultLayout,
      byRank: true,
      activations: {} as Record<string, boolean>,
      searchTerm: '',
      readingList: new SvelteSet<string>(),
      showReadingList: false,
      completionFilter: 'all' as CompletionFilter,
      sourceActivations: {} as Record<string, boolean>,
      bookFilter: 'all' as BookFilter,
    };
    if (typeof window === 'undefined') return out;
    const params = new URLSearchParams(window.location.search);
    if (params.has('o')) out.byRank = params.get('o') === '1';
    if (params.has('l')) out.layout = params.get('l') as Layout;
    if (params.has('status')) {
      const status = params.get('status');
      if (status === 'completed' || status === 'ongoing') {
        out.completionFilter = status;
      }
    }
    if (params.has('source')) {
      for (const t of params.get('source')!.split('_').filter(Boolean)) {
        out.sourceActivations[t] = true;
      }
    }
    if (params.has('book')) {
      const book = params.get('book');
      if (book === 'book' || book === 'series') {
        out.bookFilter = book;
      }
    }
    if (params.has('include')) {
      for (const t of params.get('include')!.split('_').filter(Boolean)) {
        out.activations[t] = true;
      }
    }
    if (params.has('exclude')) {
      for (const t of params.get('exclude')!.split('_').filter(Boolean)) {
        out.activations[t] = false;
      }
    }
    if (params.has('reading-list')) {
      const slugs = params.get('reading-list')!.split('~').filter(Boolean);
      out.readingList = new SvelteSet(slugs);
      if (slugs.length > 0) out.showReadingList = true;
    } else if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('reading-list');
        if (stored) {
          out.readingList = new SvelteSet(JSON.parse(stored) as string[]);
        }
      } catch {
        // ignore parse errors
      }
    }
    return out;
  }
  const initial = readInitialState();

  let layout = $state<Layout>(initial.layout);
  let byRank = $state(initial.byRank);
  let tagActivations = $state<Record<string, boolean>>({ ...initial.activations });
  let searchTerm = $state(initial.searchTerm);
  let readingList = $state<SvelteSet<string>>(initial.readingList);
  let showReadingList = $state(initial.showReadingList);
  let completionFilter = $state<CompletionFilter>(initial.completionFilter);
  let sourceActivations = $state<Record<SourceTag, boolean>>({
    amazon: false,
    audiobook: false,
    'royal-road': false,
  });
  let bookFilter = $state<BookFilter>(initial.bookFilter);

  $effect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (!byRank) params.set('o', '0');
    if (layout !== defaultLayout) params.set('l', layout);
    if (completionFilter !== 'all') params.set('status', completionFilter);
    if (bookFilter !== 'all') params.set('book', bookFilter);

    const activeSources = Object.entries(sourceActivations)
      .filter(([, active]) => active)
      .map(([tag]) => tag);

    if (activeSources.length) params.set('source', activeSources.join('_'));

    const include: string[] = [];
    const exclude: string[] = [];
    for (const [k, v] of Object.entries(tagActivations)) {
      if (v === true) include.push(k);
      else if (v === false) exclude.push(k);
    }
    if (include.length) params.set('include', include.join('_'));
    if (exclude.length) params.set('exclude', exclude.join('_'));
    const rlSlugs = Array.from(readingList);
    if (rlSlugs.length) params.set('reading-list', rlSlugs.join('~'));
    const args = params.toString();
    const newUrl = `${location.origin}${location.pathname}${args ? '?' + args : ''}`;
    history.pushState({ path: newUrl }, '', newUrl);

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('reading-list', JSON.stringify(rlSlugs));
      } catch {
        // ignore storage errors
      }
    }
  });

  function toggleBookmark(slug: string) {
    if (readingList.has(slug)) {
      readingList.delete(slug);
      if (readingList.size === 0) showReadingList = false;
    } else {
      readingList.add(slug);
    }
  }

  function clearReadingList() {
    readingList.clear();
    showReadingList = false;
  }

  function clickTag(tag: string) {
    if (tag in tagActivations) {
      if (tagActivations[tag] === true) {
        tagActivations = { ...tagActivations, [tag]: false };
      } else {
        const next = { ...tagActivations };
        delete next[tag];
        tagActivations = next;
      }
    } else {
      tagActivations = { ...tagActivations, [tag]: true };
    }
  }

  function reset() {
    tagActivations = {};
    searchTerm = '';
    layout = defaultLayout;
    byRank = true;
    showReadingList = false;
    completionFilter = 'all';
    sourceActivations = {
      amazon: false,
      audiobook: false,
      'royal-road': false,
    };
    bookFilter = 'all';
  }

  let capturing = $state(false);
  let captureFailed = $state(false);

  async function screenshot() {
    if (capturing || visiblePosts.length === 0) return;
    capturing = true;
    captureFailed = false;
    await tick();
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      const root = document.querySelector<HTMLElement>(
        layout === 'tier' ? '#all-card-wrapper' : '[data-capture-root]'
      );
      if (root) await captureElement(root, layout);
    } catch (err) {
      console.error('Screenshot failed:', err);
      captureFailed = true;
      setTimeout(() => (captureFailed = false), 4000);
    } finally {
      capturing = false;
    }
  }

  const visiblePosts = $derived.by(() => {
    const term = searchTerm.toLowerCase();
    const words = term ? term.split(/\s+/).filter(Boolean) : [];
    return augmentedPosts
      .filter((post) => {
        if (showReadingList && !readingList.has(slugFromAbslink(post.abslink))) {
          return false;
        }
        if (completionFilter === 'completed' && !post.tags.includes('completed')) {
          return false;
        }
        if (completionFilter === 'ongoing' && !post.tags.includes('ongoing')) {
          return false;
        }
        if (bookFilter === 'book' && !post.tags.includes('book')) {
          return false;
        }
        if (bookFilter === 'series' && !post.tags.includes('series')) {
          return false;
        }
        const activeSources = Object.entries(sourceActivations)
          .filter(([, active]) => active)
          .map(([tag]) => tag as SourceTag);

        if (activeSources.length) {
          const matchesAnySource = activeSources.some((tag) => post.tags.includes(tag));
          if (!matchesAnySource) return false;
        }
        for (const [tag, active] of Object.entries(tagActivations)) {
          if (active === true && !post.tags.includes(tag)) return false;
          if (active === false && post.tags.includes(tag)) return false;
        }
        if (words.length) {
          for (const w of words) {
            if (!post.search_term.includes(w)) return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (layout === 'tier' || byRank) return a.weight - b.weight;
        return a.date < b.date ? 1 : -1;
      });
  });

  const groupedPosts = $derived.by(() => {
    if (layout !== 'tier') return [{ tier: null as ReviewTier | null, posts: visiblePosts }];
    const groups: { tier: ReviewTier; posts: Post[] }[] = [];
    let current: { tier: ReviewTier; posts: Post[] } | null = null;
    for (const post of visiblePosts) {
      if (!current || current.tier !== post.review) {
        current = { tier: post.review, posts: [] };
        groups.push(current);
      }
      current.posts.push(post);
    }
    return groups;
  });

  function activeClass(tag: string): string {
    if (Object.keys(tagActivations).length === 0) return 'active-nan';
    if (tagActivations[tag] === true) return 'active-true';
    if (tagActivations[tag] === false) return 'active-false';
    return 'active-undefined';
  }

  function shortSummary(post: Post): string {
    let sb = `* **${post.name}**: ([review](${post.abslink}), `;
    for (const link of post.links) sb += `[${link.name}](${link.link}), `;
    return sb.slice(0, -2) + `): ${post.description}\n`;
  }
  function longSummary(post: Post): string {
    let sb = `### **${post.name}** ｜  by *${post.author}*\n\n**Links:** [review](${post.abslink}), `;
    for (const link of post.links) sb += `[${link.name}](${link.link}), `;
    sb = sb.slice(0, -2) + '\n\n';
    sb += `**Summary:** ${post.description}\n\n`;
    sb += `**Hook:** ${post.sentence}\n\n*********\n`;
    return sb;
  }
  function superShortSummary(post: Post): string {
    let sb = `* **${post.name}**: [review](${post.abslink}), `;
    for (const link of post.links) sb += `[${link.name}](${link.link}), `;
    return sb.slice(0, -2) + '\n';
  }
  function superDuperShortSummary(post: Post): string {
    return `* [**${post.name}**](${post.abslink}) by ${post.author}\n`;
  }

  $effect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === 's' || e.key === 'S') {
        void screenshot();
        return;
      }
      const fns: Record<string, (post: Post) => string> = {
        c: shortSummary,
        C: longSummary,
        x: superShortSummary,
        X: superDuperShortSummary,
      };
      const fn = fns[e.key];
      if (!fn) return;
      const content = visiblePosts.map(fn).join('');
      navigator.clipboard?.writeText(content).catch(() => {});
    };
    window.addEventListener('keypress', handler);
    return () => window.removeEventListener('keypress', handler);
  });

  type ChipState = 'active-true' | 'active-false' | 'active-undefined';

  function chipState(active: boolean, anySelected: boolean): ChipState {
    if (active) return 'active-true';
    return anySelected ? 'active-undefined' : 'active-false';
  }

  function sourceChipState(tag: SourceTag): ChipState {
    return chipState(sourceActivations[tag], Object.values(sourceActivations).some(Boolean));
  }

  function completionChipState(value: CompletionFilter): ChipState {
    return chipState(completionFilter === value, completionFilter !== 'all');
  }

  function bookChipState(value: BookFilter): ChipState {
    return chipState(bookFilter === value, bookFilter !== 'all');
  }
</script>

<div id="preamble">
  <p>
    {totalReviews} reviews with <em>my</em> rankings based on what I personally enjoy
    reading. You may have opposite tastes. The below inputs should make finding
    something easier. If you have questions, recommendations, or want to know when
    new reviews or releases are out, join the
    <a
      href="https://discord.gg/tfn4HVEaDz"
      class="font-bold"
      style="color: #7289da"
    >discord</a>.
  </p>
</div>

<div id="toggle-input" class="max-w-7xl mx-auto">
  <div class="justify-center flex flex-wrap items-center">
    {#each LAYOUT_OPTIONS as opt, i (opt)}
      {@const isActive = layout === opt}
      {@const last = LAYOUT_OPTIONS.length - 1}
      {@const rounded = i === 0 ? 'rounded-l-md' : i === last ? 'rounded-r-md' : ''}
      <label
        for={`layout_${opt}`}
        class="inline-flex items-center py-2 rounded-md cursor-pointer"
      >
        <input
          id={`layout_${opt}`}
          checked={isActive}
          name="layout"
          type="radio"
          value={opt}
          class="hidden peer"
          onclick={() => (layout = opt as Layout)}
        />
        <span
          class="px-4 py-2 text-lg sm:text-base {rounded} {isActive
            ? 'bg-green-500 text-green-50'
            : 'bg-green-700 text-green-400 hover:bg-green-500 hover:text-green-50'}"
        >
          {opt === 'tier' ? 'Tier List' : opt[0].toUpperCase() + opt.slice(1)}
        </span>
      </label>
    {/each}

    <label
      for="sort-order"
      class="pl-4 inline-flex items-center p-2 rounded-md cursor-pointer"
    >
      <input
        id="sort-order"
        type="checkbox"
        checked={byRank}
        class="hidden peer"
        onclick={(e) => (byRank = (e.currentTarget as HTMLInputElement).checked)}
      />
      <span
        class="px-4 py-2 rounded-l-md text-lg sm:text-base {byRank
          ? 'bg-green-500 text-green-50'
          : 'bg-green-700 text-green-400 hover:bg-green-500 hover:text-green-50'}"
      >
        Rank
      </span>
      <span
        class="px-4 py-2 rounded-r-md text-lg sm:text-base {byRank
          ? 'bg-green-700 text-green-400 hover:bg-green-500 hover:text-green-50'
          : 'bg-green-500 text-green-50'}"
      >
        Recent
      </span>
    </label>

    <input
      oninput={(e) => (searchTerm = (e.currentTarget as HTMLInputElement).value)}
      type="text"
      id="search-input"
      name="search"
      bind:value={searchTerm}
      class="bg-green-700 rounded-md text-green-400 m-2 focus:text-green-100 outline-none focus:ring-2 focus:ring-green-400"
      placeholder="Search..."
    />

    {#if readingList.size > 0}
      <div class="inline-flex items-center m-2 overflow-hidden rounded-md">
        <button
          type="button"
          class={`inline-flex items-center gap-1 px-4 py-2 cursor-pointer text-lg sm:text-base ${          
            showReadingList
              ? 'bg-green-500 text-green-50'
              : 'bg-green-700 text-green-300 hover:bg-green-500 hover:text-green-50'
          } rounded-l-md`}
          onclick={() => (showReadingList = !showReadingList)}
          title={showReadingList ? 'Show all reviews' : 'Show reading list only'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 26"
            width="16"
            height="16"
            fill={showReadingList ? 'currentColor' : 'none'}
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            class="inline-block"
          >
            <path d="M5 2a2 2 0 0 0-2 2v20l9-4 9 4V4a2 2 0 0 0-2-2H5z" />
          </svg>
          Show TBR List ({readingList.size})
        </button>

        <button
          type="button"
          class="inline-flex items-center px-4 py-2 bg-accent-700 text-cream-200 hover:bg-accent-600 cursor-pointer rounded-r-md text-lg sm:text-base"
          onclick={clearReadingList}
          title="Remove all books from your reading list"
        >
          Clear TBR List
        </button>
      </div>
    {/if}

    <button
      type="button"
      class="inline-flex items-center gap-2 m-2 px-4 py-2 h-[38px] sm:h-[38px] bg-green-700 hover:bg-green-500 disabled:hover:bg-green-700 rounded-md cursor-pointer disabled:cursor-default text-green-[...]
      onclick={screenshot}
      disabled={capturing || visiblePosts.length === 0}
      title="Screenshot"
      aria-label="Download a screenshot of the current view"
    >
      {#if capturing}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2

