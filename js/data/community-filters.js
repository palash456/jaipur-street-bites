import { LOCATIONS } from './catalog.js';

export const COMMUNITY_FILTER_SORT = [
  { id: 'recent', label: 'Most recent' },
  { id: 'top', label: 'Top upvoted' },
  { id: 'discussed', label: 'Most discussed' },
  { id: 'controversial', label: 'Controversial' },
];

export const COMMUNITY_FILTER_TYPES = [
  { id: 'question', label: 'Questions' },
  { id: 'review', label: 'Reviews' },
  { id: 'discussion', label: 'Discussions' },
];

export const COMMUNITY_FILTER_CUISINES = [
  { id: 'pyaaz-kachori', label: 'Pyaaz kachori' },
  { id: 'samosa', label: 'Samosa' },
  { id: 'chaat', label: 'Chaat' },
  { id: 'gol-gappe', label: 'Gol gappe' },
  { id: 'kulhad-chai', label: 'Kulhad chai' },
  { id: 'lassi', label: 'Lassi' },
  { id: 'ghewar', label: 'Ghewar' },
  { id: 'jalebi', label: 'Jalebi' },
  { id: 'mirchi-bada', label: 'Mirchi bada' },
  { id: 'pav-bhaji', label: 'Pav bhaji' },
  { id: 'dal-baati', label: 'Dal baati' },
  { id: 'rajasthani-thali', label: 'Rajasthani thali' },
  { id: 'momos', label: 'Momos' },
];

export const COMMUNITY_FILTER_TAGS = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'budget', label: 'Under ₹100' },
  { id: 'premium', label: 'Premium / splurge' },
  { id: 'hygiene', label: 'Hygiene focus' },
  { id: 'hidden-gem', label: 'Hidden gem' },
  { id: 'late-night', label: 'Late night' },
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'delivery', label: 'Delivery friendly' },
  { id: 'family', label: 'Family friendly' },
  { id: 'student', label: 'Student picks' },
  { id: 'spicy', label: 'Extra spicy' },
  { id: 'must-try', label: 'Must try' },
  { id: 'festival', label: 'Festival special' },
  { id: 'tourist', label: 'Tourist safe' },
  { id: 'locals-only', label: 'Locals only' },
];

export const COMMUNITY_FILTER_TIME = [
  { id: 'all', label: 'Any time' },
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Past 7 days' },
  { id: 'month', label: 'Past 30 days' },
  { id: 'year', label: 'Past year' },
];

export const COMMUNITY_FILTER_MIN_UP = [
  { id: '', label: 'Any upvotes' },
  { id: '10', label: '10+ upvotes' },
  { id: '50', label: '50+ upvotes' },
  { id: '100', label: '100+ upvotes' },
  { id: '200', label: '200+ upvotes' },
];

export const COMMUNITY_FILTER_RATING = [
  { id: '', label: 'Any rating' },
  { id: 'has', label: 'Has star rating' },
  { id: '4plus', label: '4★ and above' },
  { id: '5only', label: '5★ only' },
];

export const COMMUNITY_FILTER_AUTHOR = [
  { id: '', label: 'All authors' },
  { id: 'local', label: 'Local badge' },
  { id: 'verified', label: 'Verified / Contributor' },
  { id: 'new', label: 'New members' },
];

const DEFAULTS = {
  cfsort: 'recent',
  cfarea: '',
  cfcuisine: '',
  cftime: 'all',
  cfminup: '',
  cfrating: '',
  cfauthor: '',
  cfphoto: '',
  cfpinned: '',
};

export function parseCommunityFilters(params) {
  const types = (params.get('cftype') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const tags = (params.get('cftags') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    sort: params.get('cfsort') || DEFAULTS.cfsort,
    types,
    area: params.get('cfarea') || '',
    cuisine: params.get('cfcuisine') || '',
    time: params.get('cftime') || DEFAULTS.cftime,
    tags,
    minUp: params.get('cfminup') || '',
    rating: params.get('cfrating') || '',
    author: params.get('cfauthor') || '',
    photo: params.get('cfphoto') === '1',
    pinned: params.get('cfpinned') === '1',
  };
}

export function countCommunityFilters(params) {
  const f = parseCommunityFilters(params);
  let n = 0;
  if (f.sort !== DEFAULTS.cfsort) n++;
  if (f.types.length) n++;
  if (f.area) n++;
  if (f.cuisine) n++;
  if (f.time !== DEFAULTS.cftime) n++;
  if (f.tags.length) n++;
  if (f.minUp) n++;
  if (f.rating) n++;
  if (f.author) n++;
  if (f.photo) n++;
  if (f.pinned) n++;
  return n;
}

function withinTime(iso, range) {
  if (range === 'all') return true;
  const t = new Date(iso).getTime();
  const now = Date.now();
  const day = 86400000;
  if (range === 'today') return now - t < day;
  if (range === 'week') return now - t < 7 * day;
  if (range === 'month') return now - t < 30 * day;
  if (range === 'year') return now - t < 365 * day;
  return true;
}

function authorMatches(post, authorFilter) {
  if (!authorFilter) return true;
  const badge = (post.authorBadge || '').toLowerCase();
  if (authorFilter === 'local') return badge.includes('local');
  if (authorFilter === 'verified') return badge.includes('contributor') || badge.includes('taster') || badge.includes('verified');
  if (authorFilter === 'new') return badge.includes('new');
  return true;
}

export function filterCommunityPosts(posts, params, getPostScore) {
  const f = parseCommunityFilters(params);
  let list = [...posts];

  if (f.types.length) list = list.filter((p) => f.types.includes(p.type));
  if (f.area) list = list.filter((p) => p.locationId === f.area);
  if (f.cuisine) list = list.filter((p) => p.cuisineId === f.cuisine);
  if (f.time !== 'all') list = list.filter((p) => withinTime(p.createdAt, f.time));
  if (f.tags.length) list = list.filter((p) => f.tags.some((tag) => (p.tags || []).includes(tag)));
  if (f.minUp) {
    const min = parseInt(f.minUp, 10);
    list = list.filter((p) => getPostScore(p.id, p) >= min);
  }
  if (f.rating === 'has') list = list.filter((p) => p.rating != null);
  if (f.rating === '4plus') list = list.filter((p) => (p.rating || 0) >= 4);
  if (f.rating === '5only') list = list.filter((p) => p.rating === 5);
  if (f.author) list = list.filter((p) => authorMatches(p, f.author));
  if (f.photo) list = list.filter((p) => p.hasPhoto);
  if (f.pinned) list = list.filter((p) => p.pinned);

  return list;
}

export function sortCommunityPosts(posts, params, getPostScore) {
  const f = parseCommunityFilters(params);
  const list = [...posts];
  if (f.sort === 'top') list.sort((a, b) => getPostScore(b.id, b) - getPostScore(a.id, a));
  else if (f.sort === 'discussed') list.sort((a, b) => (b.answerCount || 0) - (a.answerCount || 0));
  else if (f.sort === 'controversial') {
    list.sort((a, b) => {
      const ca = (a.upvotes || 0) + (a.downvotes || 0);
      const cb = (b.upvotes || 0) + (b.downvotes || 0);
      const ratioA = ca ? Math.min(a.upvotes, a.downvotes) / ca : 0;
      const ratioB = cb ? Math.min(b.upvotes, b.downvotes) / cb : 0;
      return ratioB - ratioA;
    });
  } else {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return list;
}

export function applyCommunityFilters(posts, params, getPostScore) {
  return sortCommunityPosts(filterCommunityPosts(posts, params, getPostScore), params, getPostScore);
}

export function communityFilterParamsToSearchParams(params) {
  const out = new URLSearchParams();
  const keys = ['q', 'feed', 'topic', 'cfsort', 'cftype', 'cfarea', 'cfcuisine', 'cftime', 'cftags', 'cfminup', 'cfrating', 'cfauthor', 'cfphoto', 'cfpinned'];
  keys.forEach((k) => {
    const v = params.get(k);
    if (v) out.set(k, v);
  });
  return out;
}

export function clearCommunityFilterParams(params) {
  const out = communityFilterParamsToSearchParams(params);
  ['cfsort', 'cftype', 'cfarea', 'cfcuisine', 'cftime', 'cftags', 'cfminup', 'cfrating', 'cfauthor', 'cfphoto', 'cfpinned'].forEach((k) => out.delete(k));
  return out;
}

export { LOCATIONS };
