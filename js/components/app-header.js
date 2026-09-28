import { getState } from '../state/store.js';
import { LOCATIONS } from '../data/catalog.js';
import { icon } from '../utils/icons.js';

function locName() {
  const id = getState().locationId;
  return LOCATIONS.find((l) => l.id === id)?.name || 'Jaipur';
}

function profileInitial() {
  const name = getState().user?.name?.trim() || 'R';
  return name[0]?.toUpperCase() || 'R';
}

function locationRow() {
  const loc = locName();
  return `
    <button type="button" class="loc" data-action="pick-location" aria-label="Change area">
      <span class="pinic">${icon('pin', 26)}</span>
      <span class="loc-text">
        <b>${loc} ${icon('down', 16)}</b>
        <span class="mut xs">Jaipur, Rajasthan</span>
      </span>
    </button>`;
}

/** Home: location + search pill */
export function headerHome() {
  return `
  <header class="app-top">
    <div class="hdr">
      ${locationRow()}
      <a href="#/profile" class="avb" aria-label="Profile">${profileInitial()}</a>
    </div>
    <div class="searchrow">
      <button type="button" class="search-fake" data-action="open-search">
        ${icon('search', 20)}
        <span>Search discussions, reviews, areas…</span>
      </button>
    </div>
  </header>`;
}

/** Community tab — same shell as Home, with live search + filters */
export function headerCommunity(searchValue = '', filterCount = 0) {
  const badge =
    filterCount > 0
      ? `<span class="comm-filter-badge" aria-label="${filterCount} filters active">${filterCount}</span>`
      : '';
  return `
  <header class="app-top">
    <div class="hdr">
      ${locationRow()}
      <a href="#/profile" class="avb" aria-label="Profile">${profileInitial()}</a>
    </div>
    <div class="searchrow searchrow--with-filter">
      <form class="sbox" id="explore-search-form" role="search">
        ${icon('search', 20)}
        <input
          type="search"
          name="q"
          id="explore-q"
          value="${searchValue.replace(/"/g, '&quot;')}"
          placeholder="Search threads, reviews, areas…"
          autocomplete="off"
          aria-label="Search community"
        />
      </form>
      <button
        type="button"
        class="comm-filter-btn${filterCount ? ' has-filters' : ''}"
        data-open-community-filter
        aria-label="Filter threads"
      >
        ${icon('filter', 22)}
        ${badge}
      </button>
    </div>
  </header>`;
}

/** @deprecated vendor search header — use headerCommunity on Explore tab */
export function headerExplore(searchValue = '') {
  return headerCommunity(searchValue);
}

/** Inner screens: back + title */
export function headerSub(title, { subtitle = '', back = '#/' } = {}) {
  return `
  <header class="app-top app-top--sub">
    <div class="subhdr">
      <button type="button" class="icon-btn" data-nav-back="${back}" aria-label="Back">${icon('back', 22)}</button>
      <div class="subhdr-titles">
        <h1>${title}</h1>
        ${subtitle ? `<p class="mut xs">${subtitle}</p>` : ''}
      </div>
      <a href="#/profile" class="avb avb--sm" aria-label="Profile">${profileInitial()}</a>
    </div>
  </header>`;
}
