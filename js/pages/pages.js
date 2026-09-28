import {
  VENDORS,
  FOODS,
  CATEGORIES,
  LOCATIONS,
  DEALS,
  POPULAR_SEARCHES,
  getVendor,
  foodsByVendor,
  reviewsByVendor,
} from '../data/catalog.js';
import {
  menuItemRow,
  reviewCard,
  categoryChip,
  chatoreyBCard,
  chatoreyLCard,
  chatoreyCategory,
} from '../components/cards.js';
import { formatINR, formatDate, formatRelativeDate, formatTime, starsHtml } from '../utils/format.js';
import {
  EMPTY_CART_IMAGE,
  foodImageForCategory,
  resolveFoodImage,
  resolveVendorCover,
  emojiForVendor,
  IMG_ATTRS,
} from '../utils/images.js';
import { getState, cartTotals } from '../state/store.js';
import { headerHome, headerCommunity, headerSub } from '../components/app-header.js';
import {
  COMMUNITY_STORIES,
  COMMUNITY_REELS,
  COMMUNITY_TOPICS,
} from '../data/community.js';
import {
  countCommunityFilters,
  filterCommunityPosts,
  sortCommunityPosts,
} from '../data/community-filters.js';
import {
  storyRing,
  reelTile,
  communityPostCard,
  communityTopicChip,
  commentRow,
  escapeHtml,
  bodyParagraphs,
  postPhotoGallery,
  postStatsBar,
  reviewBreakdown,
} from '../components/community.js';
import {
  getAllCommunityPosts,
  getCommunityPost,
  getCommentsForPost,
  getPostScore,
  isPostSaved,
  getReelLikeCount,
  isReelLiked,
} from '../state/store.js';
import { icon } from '../utils/icons.js';
import { HYGIENE_LEVELS } from '../wizards/add-stall.js';

function locName() {
  const id = getState().locationId;
  return LOCATIONS.find((l) => l.id === id)?.name || 'Jaipur';
}

function filterVendors({ q, category, openNow, delivery, sort, minRating, maxPrice }) {
  let list = [...VENDORS];
  const locationId = getState().locationId;
  list = list.sort((a, b) => {
    const aNear = a.locationId === locationId ? -1 : 0;
    const bNear = b.locationId === locationId ? -1 : 0;
    return aNear - bNear || a.distanceKm - b.distanceKm;
  });
  if (q) {
    const lower = q.toLowerCase();
    list = list.filter(
      (v) =>
        v.name.toLowerCase().includes(lower) ||
        v.cuisine.toLowerCase().includes(lower) ||
        v.locationName.toLowerCase().includes(lower) ||
        FOODS.some((f) => f.vendorId === v.id && f.name.toLowerCase().includes(lower))
    );
  }
  if (category) list = list.filter((v) => v.categoryIds.includes(category));
  if (openNow) list = list.filter((v) => v.isOpen);
  if (delivery) list = list.filter((v) => v.deliveryAvailable);
  if (minRating) list = list.filter((v) => v.rating >= parseFloat(minRating));
  if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
  if (sort === 'distance') list.sort((a, b) => a.distanceKm - b.distanceKm);
  if (maxPrice === 'low') list = list.filter((v) => v.priceLevel === '₹');
  if (maxPrice === 'mid') list = list.filter((v) => v.priceLevel !== '₹₹₹');
  return list;
}

export function pageHome() {
  const top = [...VENDORS].sort((a, b) => b.rating * b.reviewCount - a.rating * a.reviewCount).slice(0, 8);
  const near = filterVendors({}).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 5);
  const gems = VENDORS.filter((v) => v.hiddenGem).slice(0, 6);
  const craveCats = CATEGORIES.filter((c) =>
    ['pyaaz-kachori', 'chaat', 'gol-gappe', 'kulhad-chai', 'lassi', 'ghewar', 'samosa', 'jalebi'].includes(c.id)
  );

  return `
  ${headerHome()}
  <div class="page-home">
  <div class="secH"><h2>What are you craving?</h2></div>
  <div class="hs" style="gap:6px">${craveCats.map(chatoreyCategory).join('')}</div>

  <div class="hs" style="margin-top:14px">
    <div class="promo" style="background:linear-gradient(120deg,#C2185B,#E8590C)">
      <b>Find what's actually worth eating</b>
      <span>Picks from locals who live here, not paid rankings.</span>
      <img class="promo-img street-food-photo" src="${foodImageForCategory('pyaaz-kachori')}" alt="" ${IMG_ATTRS} />
    </div>
    <button type="button" class="promo" data-nav-stall-add style="background:linear-gradient(120deg,#1B5E20,#00897B)">
      <b>Know a hidden stall?</b>
      <span>List it in a few steps — we review within 72 hours.</span>
      <img class="promo-img street-food-photo" src="${foodImageForCategory('chaat')}" alt="" ${IMG_ATTRS} />
    </button>
    <button type="button" class="promo" data-search-chip="Best ghewar near Johari Bazaar" style="background:linear-gradient(120deg,#6A1B9A,#AD1457)">
      <b>Jaipur's famous ghewar</b>
      <span>Compare stalls in Johari Bazaar.</span>
      <img class="promo-img street-food-photo" src="${foodImageForCategory('ghewar')}" alt="" ${IMG_ATTRS} />
    </button>
  </div>

  <div class="secH">
    <h2>Top picks by locals</h2>
    <a href="#/discover">See all</a>
  </div>
  <div class="hs">${top.map(chatoreyBCard).join('')}</div>

  <div class="fchips" style="margin-top:8px">
    <button type="button" class="chip" data-search-quick="nearest">Nearest</button>
    <button type="button" class="chip" data-search-quick="rating">Rating 4.5+</button>
    <button type="button" class="chip" data-search-quick="open">Open now</button>
    <button type="button" class="chip" data-search-quick="gem">Hidden gems</button>
  </div>

  <div class="secH" style="padding-top:8px">
    <h2>Street food near you</h2>
    <a href="#/discover">See all</a>
  </div>
  ${near.map(chatoreyLCard).join('')}

  <div class="secH" style="padding-top:8px"><h2>Hidden gems</h2></div>
  <p class="mut sm pad" style="margin:-6px 0 8px">Few reviews, all of them raving. Mostly added by neighbours.</p>
  <div class="hs">${gems.map(chatoreyBCard).join('')}</div>

  <div class="card pad" style="margin:22px 16px 0;padding:18px;background:var(--card);border-radius:16px;box-shadow:var(--sh)">
    <b style="font-size:17px">Spot something we've missed?</b>
    <p class="mut sm" style="margin:4px 0 12px">Every hidden stall was added by someone who ate there.</p>
    <button type="button" class="btn btn-primary btn-block" data-nav-stall-add>Add a stall</button>
  </div>
  </div>
  `;
}

export function pageSearch(params) {
  const q = (params.get('q') || '').trim().toLowerCase();
  const feed = params.get('feed') || 'foryou';
  const topic = params.get('topic') || 'all';
  const st = getState();
  const areaName = locName();

  let posts = getAllCommunityPosts();
  if (topic !== 'all') {
    posts = posts.filter((p) => p.topicId === topic || p.locationId === topic);
  }
  if (feed === 'qa') posts = posts.filter((p) => p.type === 'question');
  if (feed === 'reviews') posts = posts.filter((p) => p.type === 'review');
  if (feed === 'hot') posts = [...posts].sort((a, b) => getPostScore(b.id, b) - getPostScore(a.id, a));
  if (q) {
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q)
    );
  }

  const filterCount = countCommunityFilters(params);
  posts = filterCommunityPosts(posts, params, getPostScore);
  if (filterCount > 0) posts = sortCommunityPosts(posts, params, getPostScore);

  const storiesHtml = COMMUNITY_STORIES.slice(0, 5).map((s) =>
    storyRing(s, { seen: st.communityStoriesSeen.includes(s.id) })
  ).join('');
  const reelsHtml = COMMUNITY_REELS.slice(0, 3).map((r) => reelTile(r)).join('');

  const feedTabs = [
    { id: 'foryou', label: 'For you' },
    { id: 'qa', label: 'Q&A' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'hot', label: 'Hot' },
  ];

  const topicChips = COMMUNITY_TOPICS.filter((t) =>
    ['all', st.locationId, 'kachori', 'chaat', 'hygiene'].includes(t.id)
  );

  return `
  ${headerCommunity(params.get('q') || '', filterCount)}
  <div class="page-community">
    <section class="comm-media">
      <div class="comm-media-head">
        <span class="comm-media-label">Stories & reels</span>
        <a href="#/community/reels" class="comm-link-sm">All reels</a>
      </div>
      <div class="story-row hs">${storiesHtml}
        <button type="button" class="story-ring story-ring--add" data-community-compose="discussion" aria-label="Share">
          <span class="story-ring-inner story-ring-inner--add">+</span>
          <span class="story-ring-name">Share</span>
        </button>
      </div>
      <div class="reel-row hs">${reelsHtml}</div>
    </section>

    <div class="comm-toolbar">
      <div class="comm-feed-tabs" role="tablist" aria-label="Feed">
        ${feedTabs
          .map(
            (t) =>
              `<button type="button" class="comm-feed-tab ${feed === t.id ? 'on' : ''}" data-community-feed="${t.id}">${t.label}</button>`
          )
          .join('')}
      </div>
      <div class="comm-topics hs">${topicChips.map((t) => communityTopicChip(t, { active: topic === t.id })).join('')}</div>
      <div class="comm-action-row">
        <button type="button" class="comm-action-pill comm-action-pill--accent" data-community-compose="question">Ask a question</button>
        <button type="button" class="comm-action-pill" data-community-compose="review">Write review</button>
        <button type="button" class="comm-action-pill" data-community-compose="discussion">Start discussion</button>
        <a href="#/discover" class="comm-action-pill">Find stalls to order</a>
      </div>
    </div>

    ${
      filterCount
        ? `<div class="comm-filter-summary pad">
        <span><strong>${posts.length}</strong> threads · <strong>${filterCount}</strong> filters on</span>
        <button type="button" class="btn btn-link btn-sm" data-open-community-filter>Edit</button>
        <button type="button" class="btn btn-link btn-sm" data-clear-community-filter>Clear all</button>
      </div>`
        : ''
    }

    <div class="comm-feed">
      ${
        posts.length
          ? posts.map((p) => communityPostCard(p)).join('')
          : `<div class="empty-state comm-empty"><h3>No threads yet</h3><p class="mut sm">Ask about food in ${escapeHtml(areaName)}.</p><button type="button" class="btn btn-primary btn-sm" data-community-compose="question">Ask</button></div>`
      }
    </div>
  </div>`;
}

export function pageDiscover(params) {
  const q = params.get('q') || '';
  const category = params.get('cat') || '';
  const openNow = params.get('open') === '1';
  const delivery = params.get('delivery') === '1';
  const sort = params.get('sort') || 'relevance';
  const minRating = params.get('rating') || '';
  const maxPrice = params.get('price') || '';
  const st = getState();
  const results = filterVendors({ q, category, openNow, delivery, sort, minRating, maxPrice });

  const quickCats = CATEGORIES.filter((c) =>
    ['pyaaz-kachori', 'samosa', 'chaat', 'gol-gappe', 'kulhad-chai', 'lassi', 'ghewar', 'jalebi'].includes(c.id)
  );

  return `
  ${headerSub('Find stalls', { subtitle: 'Search dishes & vendors', back: '#/search' })}
  <div class="hs" style="gap:6px;padding-top:4px">${quickCats.map((c) => chatoreyCategory(c, { active: category === c.id })).join('')}</div>

  <form class="search-filters pad" id="search-form">
    <input type="hidden" name="q" id="search-q-hidden" value="${q.replace(/"/g, '&quot;')}" />
    <label class="field-label" style="margin-bottom:8px">Search stalls
      <input class="field-input" type="search" name="q_visible" id="discover-q" value="${q.replace(/"/g, '&quot;')}" placeholder="Dishes, stalls, areas" />
    </label>
    <div class="filter-row filter-row--scroll">
      <select name="cat" aria-label="Category">
        <option value="">All categories</option>
        ${CATEGORIES.map((c) => `<option value="${c.id}" ${category === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
      </select>
      <select name="sort" aria-label="Sort">
        <option value="relevance" ${sort === 'relevance' ? 'selected' : ''}>Relevance</option>
        <option value="rating" ${sort === 'rating' ? 'selected' : ''}>Top rated</option>
        <option value="distance" ${sort === 'distance' ? 'selected' : ''}>Nearest</option>
      </select>
      <select name="rating" aria-label="Minimum rating">
        <option value="">Any rating</option>
        <option value="4" ${minRating === '4' ? 'selected' : ''}>4.0+</option>
        <option value="4.5" ${minRating === '4.5' ? 'selected' : ''}>4.5+</option>
      </select>
      <label class="filter-chip"><input type="checkbox" name="open" ${openNow ? 'checked' : ''} /> Open</label>
      <label class="filter-chip"><input type="checkbox" name="delivery" ${delivery ? 'checked' : ''} /> Delivery</label>
    </div>
  </form>

  <div class="secH" style="padding-top:4px">
    <h2>${results.length} spots</h2>
    <span class="mut sm">${q ? `"${q}"` : category ? CATEGORIES.find((c) => c.id === category)?.name : 'Near you'}</span>
  </div>

  ${
    results.length
      ? results.map((v) => chatoreyLCard(v)).join('')
      : `<div class="empty-state pad"><h3>No results</h3><p class="mut">Try another category or search below.</p></div>`
  }

  <div class="secH"><h2>Popular in Jaipur</h2></div>
  <div class="fchips pad" style="padding-bottom:8px">
    ${POPULAR_SEARCHES.map((s) => `<button type="button" class="chip" data-discover-chip="${s}">${s}</button>`).join('')}
  </div>
  ${
    st.recentSearches.length
      ? `<div class="secH" style="padding-top:0"><h2>Recent</h2></div>
  <div class="fchips pad">${st.recentSearches.map((s) => `<button type="button" class="chip" data-discover-chip="${s}">${s}</button>`).join('')}</div>`
      : ''
  }`;
}

export function pageCommunityPost(parts) {
  const id = parts[2];
  const post = getCommunityPost(id);
  if (!post) {
    return `${headerSub('Thread', { back: '#/search' })}<div class="empty-state pad"><h3>Thread not found</h3><a href="#/search" class="btn btn-primary">Back to community</a></div>`;
  }
  const score = getPostScore(post.id, post);
  const st = getState();
  const vote = st.communityVotes[post.id];
  const saved = isPostSaved(post.id);
  const comments = getCommentsForPost(post.id);
  const vendorLink = post.vendorId
    ? `<a href="#/vendor/${post.vendorId}" class="btn btn-secondary btn-sm">View stall</a>`
    : '';

  return `
  ${headerSub('Thread', { subtitle: `${comments.length} replies · ${(post.views || 0).toLocaleString('en-IN')} views`, back: '#/search' })}
  <div class="page-community page-community--thread">
  <article class="comm-post comm-post--detail">
    <div class="comm-author-row pad">
      <span class="comm-author-av" aria-hidden="true">${escapeHtml((post.author || 'U')[0])}</span>
      <div>
        <b>${escapeHtml(post.author)}</b>
        <span class="mut xs">${escapeHtml(post.authorBadge || 'Foodie')} · ${escapeHtml(locName())} · ${escapeHtml(
    post.type === 'question' ? 'Question' : post.type === 'review' ? 'Review' : 'Discussion'
  )}</span>
      </div>
    </div>
    <div class="pad" style="padding-top:0">
    <h1 class="comm-detail-title">${escapeHtml(post.title)}</h1>
    ${postStatsBar(post, { score, replyCount: comments.length })}
    <div class="comm-detail-body">${bodyParagraphs(post.body)}</div>
    ${postPhotoGallery(post.photos || [])}
    ${post.rating ? `<div class="comm-post-rating">${starsHtml(post.rating)} <span class="mut sm">Overall ${post.rating} / 5</span></div>` : ''}
    ${reviewBreakdown(post.reviewMeta)}
    <div class="comm-post-foot" style="border-top:none;padding-top:0">
      <div class="comm-vote">
        <button type="button" class="comm-vote-btn ${vote === 'up' ? 'on' : ''}" data-vote-up="${post.id}">▲</button>
        <span class="comm-score">${score}</span>
        <button type="button" class="comm-vote-btn ${vote === 'down' ? 'on' : ''}" data-vote-down="${post.id}">▼</button>
      </div>
      <button type="button" class="comm-save ${saved ? 'on' : ''}" data-save-post="${post.id}">${saved ? 'Saved' : '☆'}</button>
      ${vendorLink}
    </div>
    </div>
  </article>

  <section class="comm-comments pad">
    <h2 class="comm-comments-title">Discussion (${comments.length})</h2>
    <form id="comm-comment-form" class="comm-comment-form">
      <textarea class="field-input" name="body" rows="3" placeholder="Share what you know about this area…" required></textarea>
      <button type="submit" class="btn btn-primary btn-block">Post reply</button>
    </form>
    <div class="comm-comment-list" data-comment-post="${post.id}">
      ${comments.length ? comments.map((c) => commentRow(c, post.id)).join('') : '<p class="mut sm">Be the first to reply.</p>'}
    </div>
  </section>
  </div>
  <button type="button" class="comm-reply-fab" data-focus-reply aria-label="Post a reply">
    ${icon('plus', 26)}
  </button>`;
}

export function pageCommunityReels() {
  const reels = COMMUNITY_REELS;
  return `
  ${headerSub('Food reels', { subtitle: 'Swipe through local clips', back: '#/search' })}
  <div class="reels-viewer" id="reels-viewer">
    ${reels
      .map((reel) => {
        const likes = getReelLikeCount(reel.id, reel.likes);
        const liked = isReelLiked(reel.id);
        return `
      <section class="reel-slide" data-reel-id="${reel.id}">
        <img src="${reel.image}" alt="" class="reel-slide-bg street-food-photo" ${IMG_ATTRS} />
        <div class="reel-slide-overlay">
          <p class="reel-slide-user">@${escapeHtml(reel.user)} · ${escapeHtml(locName())}</p>
          <h2>${escapeHtml(reel.title)}</h2>
          <div class="reel-slide-actions">
            <button type="button" class="reel-like-btn ${liked ? 'on' : ''}" data-reel-like="${reel.id}">♥ ${likes.toLocaleString('en-IN')}</button>
            <a href="#/community/post/post-4" class="btn btn-ghost btn-sm">Comments</a>
            ${reel.vendorId ? `<a href="#/vendor/${reel.vendorId}" class="btn btn-primary btn-sm">Order stall</a>` : ''}
          </div>
        </div>
      </section>`;
      })
      .join('')}
  </div>`;
}

export function pageVendor(parts) {
  const id = parts[1];
  const v = getVendor(id);
  if (!v) return `<div class="empty-state"><h3>Vendor not found</h3></div>`;
  const menu = foodsByVendor(id);
  const reviews = reviewsByVendor(id);
  const fav = getState().favorites.vendors.includes(id);
  const verify = getState().callVerify[id];

  const byCat = {};
  menu.forEach((f) => {
    if (!byCat[f.categoryId]) byCat[f.categoryId] = [];
    byCat[f.categoryId].push(f);
  });
  const catIds = Object.keys(byCat);
  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => {
    const n = reviews.filter((r) => Math.round(r.rating) === star).length;
    const pct = reviews.length ? Math.round((n / reviews.length) * 100) : 0;
    return { star, pct };
  });

  const dishes = (v.popularDishes || []).slice(0, 4).join(' · ');

  return `
  <div class="vendor-page">
    <div class="vendor-cover-wrap">
      <span class="cover-ph cover-ph--hero" aria-hidden="true">${emojiForVendor(v)}</span>
      <img class="vendor-cover street-food-photo" src="${resolveVendorCover(v)}" alt="" ${IMG_ATTRS} />
      <div class="vendor-hero-nav">
        <button type="button" class="icon-btn icon-btn--glass" data-nav-back="#/" aria-label="Back">${icon('back', 20)}</button>
        <button type="button" class="icon-btn icon-btn--glass ${fav ? 'saved' : ''}" data-fav-vendor="${v.id}" aria-label="Save">${icon('heart', 18)}</button>
      </div>
    </div>
    <div class="vendor-sheet">
      <div class="vendor-sheet-head">
        <h1>${v.name}</h1>
        <span class="rb">${v.rating.toFixed(1)} ★</span>
      </div>
      <p class="mut sm vendor-sheet-sub">${dishes}</p>
      <div class="vendor-pills">
        ${v.hiddenGem ? '<span class="pill b">Hidden gem</span>' : ''}
        ${v.trending ? '<span class="pill b">Trending</span>' : ''}
        <span class="pill ${v.isOpen ? 'g' : 'a'}">${v.isOpen ? 'Open now' : 'Closed'}</span>
        <span class="pill">${v.hours}</span>
      </div>
      <p class="mut sm" style="margin-top:10px">${v.locationName} · ${v.distanceKm} km · ${v.reviewCount} reviews</p>
      <p class="mut xs vendor-addr">${v.address}</p>
      <div class="vendor-actions-grid">
        <button type="button" class="btn btn-ghost btn-sm vendor-action-btn ${fav ? 'is-saved' : ''}" data-fav-vendor="${v.id}" data-fav-source="action">
          <span class="btn-ico" aria-hidden="true">${icon('heart', 16)}</span>${fav ? 'Saved' : 'Save'}
        </button>
        <button type="button" class="btn btn-ghost btn-sm vendor-action-btn" data-directions="${v.id}">
          <span class="btn-ico" aria-hidden="true">${icon('nav', 16)}</span>Directions
        </button>
        <button type="button" class="btn btn-secondary btn-sm vendor-action-btn" data-call-vendor="${v.id}">
          <span class="btn-ico" aria-hidden="true">${icon('phone', 16)}</span>Call
        </button>
        <button type="button" class="btn btn-primary btn-sm vendor-action-btn" data-order-now="${v.id}">
          <span class="btn-ico" aria-hidden="true">${icon('order', 16)}</span>Order
        </button>
      </div>
    </div>
  </div>
  ${verify === 'confirmed' ? '<div class="page-banner success">✓ You verified availability with the vendor.</div>' : ''}
  ${!v.isOpen ? '<div class="page-banner warn">Closed right now — you can still browse the menu.</div>' : ''}

  <nav class="vendor-tabs" aria-label="Stall sections">
    <button type="button" class="vendor-tab on" data-scroll-target="#vendor-menu">Menu</button>
    <button type="button" class="vendor-tab" data-scroll-target="#vendor-reviews">Reviews (${reviews.length})</button>
  </nav>

  <div class="vendor-tip card-soft">
    <span class="vendor-tip-ico">💬</span>
    <div>
      <b>Local tip</b>
      <p class="mut sm">${v.deliveryAvailable ? 'Delivery via local parcel partner after the stall packs your order.' : 'Pickup recommended — call ahead during peak hours.'}</p>
    </div>
  </div>

  <section id="vendor-menu" class="vendor-menu-block">
    <div class="vendor-menu-sticky">
      <div class="menu-cat-chips" role="tablist">
        ${catIds
          .map((catId, i) => {
            const cat = CATEGORIES.find((c) => c.id === catId);
            return `<button type="button" class="menu-cat-chip ${i === 0 ? 'on' : ''}" data-scroll-target="#menu-cat-${catId}" role="tab">${cat?.icon || ''} ${cat?.name || catId}</button>`;
          })
          .join('')}
      </div>
    </div>
    <div class="menu-list">
      ${catIds
        .map((catId) => {
          const cat = CATEGORIES.find((c) => c.id === catId);
          return `
        <div id="menu-cat-${catId}" class="menu-section">
          <h3 class="menu-section-title">${cat?.name || catId}</h3>
          <p class="mut xs menu-section-sub">${byCat[catId].length} items</p>
          ${byCat[catId].map((f) => menuItemRow(f, v.id)).join('')}
        </div>`;
        })
        .join('')}
    </div>
  </section>

  <section id="vendor-reviews" class="vendor-reviews-block">
    <h2 class="block-title">Ratings & reviews</h2>
    <div class="rating-summary card-soft">
      <div class="rating-summary-score">
        <span class="rating-big">${v.rating.toFixed(1)}</span>
        <span class="mut sm">${starsHtml(v.rating)}</span>
        <span class="mut xs">${v.reviewCount} ratings</span>
      </div>
      <div class="rating-bars">
        ${ratingBreakdown
          .map(
            (b) => `
          <div class="rating-bar-row">
            <span>${b.star}</span>
            <div class="rating-bar"><i style="width:${b.pct}%"></i></div>
            <span class="mut xs">${b.pct}%</span>
          </div>`
          )
          .join('')}
      </div>
    </div>
    <div class="reviews-feed">
      ${reviews.map((r) => reviewCard(r)).join('')}
    </div>
    <p class="mut xs center" style="padding:12px 0 4px">Hygiene ${v.hygieneScore}/5 · ${v.cuisine}</p>
  </section>

  <details class="vendor-about-details">
    <summary>About this stall</summary>
    <p class="mut sm">${v.about}</p>
  </details>`;
}

export function pageCart() {
  const st = getState();
  const v = st.cart.vendorId ? getVendor(st.cart.vendorId) : null;
  const t = cartTotals();

  if (!st.cart.items.length) {
    return `<div class="empty-state cart-empty">
      <img class="street-food-photo" src="${EMPTY_CART_IMAGE}" alt="Raj kachori street snack" />
      <h2>Your cart is empty</h2>
      <p>Discover kachori, chaat & more near ${locName()}.</p>
      <a href="#/discover" class="btn btn-primary">Find food</a>
    </div>`;
  }

  return `
  ${headerSub('Your cart', { subtitle: v?.name || '', back: '#/' })}
  <div class="cart-layout page-stack">
    <div class="cart-items">
      ${st.cart.items
        .map(
          (i) => `
        <div class="cart-item" data-cart-key="${i.key}">
          <img class="street-food-photo cart-thumb" src="${resolveFoodImage(i.name, i.categoryId, i.image)}" alt="" ${IMG_ATTRS} />
          <div class="cart-item-main">
            <h4>${i.name}</h4>
            <p class="muted small">${i.optionLabel}${i.addonLabels.length ? ' · ' + i.addonLabels.join(', ') : ''} · ${i.spice}</p>
            <p>${formatINR(i.unitPrice)} each</p>
          </div>
          <div class="qty-control">
            <button type="button" data-qty-minus="${i.key}">−</button>
            <span>${i.qty}</span>
            <button type="button" data-qty-plus="${i.key}">+</button>
          </div>
          <button type="button" class="link danger" data-remove-cart="${i.key}">Remove</button>
        </div>`
        )
        .join('')}
      <label class="field-label">Instructions for vendor
        <textarea class="field-input" id="cart-instructions" rows="2">${st.cart.instructions || ''}</textarea>
      </label>
      <div class="coupon-row">
        <input class="field-input" type="text" id="coupon-input" placeholder="Coupon code" value="${st.cart.coupon || ''}" />
        <button type="button" class="btn btn-ghost" id="apply-coupon-btn">Apply</button>
      </div>
      <a href="#/vendor/${v.id}" class="link">+ Add more food</a>
    </div>
    <aside class="bill-card">
      <h3>Bill details</h3>
      <div class="bill-line"><span>Food subtotal</span><span>${formatINR(t.subtotal)}</span></div>
      <div class="bill-line"><span>Packaging</span><span>${formatINR(t.packaging)}</span></div>
      <div class="bill-line"><span>Delivery</span><span>${formatINR(t.delivery)}</span></div>
      <div class="bill-line"><span>Platform fee</span><span>${formatINR(t.platform)}</span></div>
      <div class="bill-line"><span>Taxes (GST)</span><span>${formatINR(t.tax)}</span></div>
      ${t.discount ? `<div class="bill-line discount"><span>Discount</span><span>−${formatINR(t.discount)}</span></div>` : ''}
      <div class="bill-total"><span>Total</span><span>${formatINR(t.total)}</span></div>
      <a href="#/checkout" class="btn btn-primary btn-block">Continue to checkout</a>
    </aside>
  </div>`;
}

export function pageCheckout() {
  const st = getState();
  const t = cartTotals();
  const v = getVendor(st.cart.vendorId);
  if (!st.cart.items.length) return pageCart();

  return `
  ${headerSub('Checkout', { back: '#/cart' })}
  <div class="checkout-steps page-stack-tight">
    <div class="step done">Cart</div><div class="step active">Address & pay</div><div class="step">Confirm</div>
  </div>
  <div class="checkout-layout page-stack">
    <div class="checkout-main">
      <h2 class="block-title">Delivery address</h2>
      <div class="address-list">
        ${st.addresses
          .map(
            (a) => `
          <label class="address-card ${st.selectedAddressId === a.id ? 'selected' : ''}">
            <input type="radio" name="addr" value="${a.id}" ${st.selectedAddressId === a.id ? 'checked' : ''} />
            <strong>${a.label}</strong>
            <p>${a.line1}, ${a.line2}, ${a.city} ${a.pin}</p>
          </label>`
          )
          .join('')}
      </div>
      <button type="button" class="btn btn-ghost" id="add-address-btn">+ Add new address</button>

      <h2 class="block-title">Delivery partner</h2>
      <p class="mut sm">Fulfilled by a local third-party parcel partner (assign at dispatch).</p>
      <div class="partner-card">
        <strong>Jaipur Quick Parcel</strong>
        <p>Est. ${35 + Math.floor(Math.random() * 10)} min · Fee included in bill</p>
      </div>

      <h2 class="block-title">Payment</h2>
      <div class="pay-options">
        <label class="check-row"><input type="radio" name="pay" value="upi" checked /><span>UPI</span></label>
        <label class="check-row"><input type="radio" name="pay" value="card" /><span>Card</span></label>
        <label class="check-row"><input type="radio" name="pay" value="cod" /><span>Cash on delivery</span></label>
        <label class="check-row"><input type="radio" name="pay" value="wallet" /><span>Wallet</span></label>
      </div>
    </div>
    <aside class="bill-card">
      <h3>${v?.name}</h3>
      <p class="mut sm">${st.cart.items.length} items</p>
      <ul class="checkout-items">
        ${st.cart.items
          .map(
            (i) => `
          <li class="checkout-item">
            <img class="street-food-photo" src="${resolveFoodImage(i.name, i.categoryId, i.image)}" alt="" ${IMG_ATTRS} />
            <span>${i.qty} × ${i.name}</span>
          </li>`
          )
          .join('')}
      </ul>
      <div class="bill-total"><span>Pay</span><span>${formatINR(t.total)}</span></div>
      <button type="button" class="btn btn-primary btn-block" id="pay-now-btn">Pay ${formatINR(t.total)}</button>
      <p class="muted small center">Simulated payment for prototype</p>
    </aside>
  </div>`;
}

function findLiveOrder(orderId) {
  return getState().orders.find((o) => o.id === orderId);
}

export function pageOrderConfirm(parts) {
  const orderId = parts[1];
  const order = findLiveOrder(orderId);
  if (!order) return `<div class="empty-state"><h3>Order not found</h3><a href="#/orders">Order history</a></div>`;

  return `
  ${headerSub('Order confirmed', { subtitle: `#${order.orderNumber}`, back: '#/' })}
  <div class="confirm-hero">
    <div class="check-icon">✓</div>
    <p class="mut">Your street food is on the way</p>
  </div>
  <div class="confirm-card">
    <p><strong>${order.vendorName}</strong></p>
    <ul>${order.items.map((i) => `<li>${i.qty} × ${i.name}</li>`).join('')}</ul>
    <p>Total: ${formatINR(order.totals.total)}</p>
    <p>Delivering to: ${order.address?.label} — ${order.address?.line1}</p>
    <p>ETA: ~${order.etaMinutes} minutes</p>
    <p>Payment: ${order.paymentMethod}</p>
    <div class="row-btns">
      <button type="button" class="btn btn-ghost" data-call-phone="${order.vendorPhone}">Call vendor</button>
      <a href="#/track/${order.id}" class="btn btn-primary">Track order</a>
    </div>
  </div>`;
}

export function pageTrack(parts) {
  const orderId = parts[1];
  const order = findLiveOrder(orderId);
  if (!order) {
    const hist = getState().orderHistory.find((h) => h.id === orderId);
    if (hist) {
      return `
      ${headerSub('Order details', { subtitle: `#${hist.orderNumber}`, back: '#/orders' })}
      <div class="track-page page-stack">
        <div class="confirm-card track-detail-card">
          <p><strong>${hist.vendorName}</strong> · ${formatDate(hist.createdAt)}</p>
          <ul class="track-detail-items">${hist.items.map((i) => `<li>${i.name} × ${i.qty}</li>`).join('')}</ul>
          <p>${formatINR(hist.total)} · <span class="status-pill ${hist.status}">${hist.status}</span></p>
          <button type="button" class="btn btn-primary btn-block" data-reorder="${hist.vendorId}">Reorder</button>
        </div>
      </div>`;
    }
    return `<div class="empty-state"><h3>No active tracking</h3><p>Place a new order to track live status.</p><a href="#/" class="btn btn-primary">Discover food</a></div>`;
  }

  const currentStep = order.timeline[order.statusIndex];

  return `
  ${headerSub('Track order', { subtitle: `#${order.orderNumber} · ${order.vendorName}`, back: '#/orders' })}
  <div class="track-page page-stack">
    <section class="track-eta-card" aria-label="Delivery estimate">
      <div class="track-eta-main">
        <span class="track-eta-label">Arriving in</span>
        <span class="track-eta-time">~${order.etaMinutes} min</span>
      </div>
      <p class="track-eta-status mut sm">${currentStep?.label || 'On the way'} · ${currentStep?.desc || ''}</p>
      <p class="track-eta-partner mut xs">Delivery partner: <strong>${order.deliveryPartner.name}</strong></p>
    </section>

    <section class="track-layout" aria-label="Order progress">
      <div class="timeline">
        ${order.timeline
          .map(
            (step, i) => `
          <div class="tl-item ${step.done ? 'done' : ''} ${i === order.statusIndex ? 'current' : ''}">
            <div class="tl-dot" aria-hidden="true"></div>
            <div class="tl-body">
              <strong>${step.label}</strong>
              <p class="tl-desc">${step.desc}</p>
              ${step.at ? `<span class="mut xs">${formatDate(step.at)}</span>` : ''}
            </div>
          </div>`
          )
          .join('')}
      </div>

      <aside class="track-aside">
        <h2 class="track-aside-title">Need help?</h2>
        <div class="track-actions">
          <button type="button" class="btn btn-ghost btn-block" data-call-phone="${order.deliveryPartner.phone}">Call delivery partner</button>
          <button type="button" class="btn btn-ghost btn-block" data-call-phone="${order.vendorPhone}">Call vendor</button>
          ${
            order.statusIndex <= 2
              ? `<button type="button" class="btn btn-danger btn-block" data-cancel-order="${order.id}">Cancel order</button>`
              : ''
          }
        </div>
        <a href="#/help" class="link track-help-link">Help &amp; support</a>
        <button type="button" class="btn btn-ghost btn-sm btn-block track-demo-btn" data-advance-order="${order.id}">Simulate next status</button>
      </aside>
    </section>
  </div>`;
}

function orderItemsSummary(items) {
  if (!items?.length) return 'No items';
  const first = items[0];
  const extra = items.length - 1;
  const lead = `${first.name}${first.qty > 1 ? ` × ${first.qty}` : ''}`;
  return extra > 0 ? `${lead} + ${extra} more` : lead;
}

function orderStatusLabel(status) {
  if (!status) return 'Unknown';
  if (status === 'vendor_confirmed') return 'Confirmed';
  if (status === 'placed') return 'In progress';
  return status.replace(/_/g, ' ');
}

function orderVendorThumb(vendorId) {
  const vendor = getVendor(vendorId);
  const cover = vendor ? resolveVendorCover(vendor) : '';
  if (cover) {
    return `<span class="order-vendor-thumb"><img src="${cover}" alt="" ${IMG_ATTRS} /></span>`;
  }
  return `<span class="order-vendor-thumb" aria-hidden="true">${emojiForVendor(vendor)}</span>`;
}

function renderActiveOrderCard(order) {
  const step = order.timeline?.[order.statusIndex];
  return `
    <article class="order-card order-card--live">
      <a href="#/track/${order.id}" class="order-card-tap">
        <div class="order-live-strip">
          <span class="order-live-eta">Arriving in ~${order.etaMinutes} min</span>
          <span class="status-pill ${order.status}">${orderStatusLabel(order.status)}</span>
        </div>
        <div class="order-card-top">
          <div class="order-vendor-row">
            ${orderVendorThumb(order.vendorId)}
            <div class="order-vendor-text">
              <strong>${order.vendorName}</strong>
              <p class="mut xs">${order.address?.label || 'Delivery'} · #${order.orderNumber}</p>
            </div>
          </div>
        </div>
        <p class="order-items-line">${orderItemsSummary(order.items)}</p>
        <p class="order-step mut sm">${step?.label || 'Tracking your order'}</p>
      </a>
      <div class="order-card-actions">
        <a href="#/track/${order.id}" class="btn btn-primary btn-sm">Track live</a>
        <button type="button" class="btn btn-ghost btn-sm" data-call-phone="${order.vendorPhone}">Call stall</button>
      </div>
    </article>`;
}

function renderPastOrderCard(o) {
  const when = `${formatRelativeDate(o.createdAt)}, ${formatTime(o.createdAt)}`;
  const rated = o.rated ? 'Rated' : 'Rate';
  return `
    <article class="order-card">
      <a href="#/track/${o.id}" class="order-card-tap">
        <div class="order-card-top">
          <div class="order-vendor-row">
            ${orderVendorThumb(o.vendorId)}
            <div class="order-vendor-text">
              <strong>${o.vendorName}</strong>
              <p class="mut xs">${when}${o.addressLabel ? ` · ${o.addressLabel}` : ''}</p>
            </div>
          </div>
          <span class="status-pill ${o.status}">${orderStatusLabel(o.status)}</span>
        </div>
        <p class="order-items-line">${orderItemsSummary(o.items)}</p>
        <div class="order-card-meta">
          <span class="order-total">${formatINR(o.total)}</span>
          <span class="mut xs">#${o.orderNumber}</span>
        </div>
      </a>
      <div class="order-card-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-reorder="${o.vendorId}">Reorder</button>
        <button type="button" class="btn btn-ghost btn-sm" data-rate-order="${o.id}">${rated}</button>
        <a href="#/track/${o.id}" class="btn btn-ghost btn-sm">Details</a>
      </div>
    </article>`;
}

export function pageOrders() {
  const st = getState();
  const live = st.orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');
  const liveIds = new Set(live.map((o) => o.id));
  const past = st.orderHistory.filter((o) => !liveIds.has(o.id));

  const liveSection =
    live.length > 0
      ? `
    <section class="orders-section" aria-label="Ongoing orders">
      <div class="secH orders-sec-head">
        <h2>Ongoing</h2>
        <span class="mut sm">${live.length} active</span>
      </div>
      <div class="orders-list">
        ${live.map(renderActiveOrderCard).join('')}
      </div>
    </section>`
      : '';

  const pastBody =
    past.length > 0
      ? past.map(renderPastOrderCard).join('')
      : `<div class="orders-empty">
          <p class="orders-empty-icon" aria-hidden="true">🥡</p>
          <h3>No past orders yet</h3>
          <p class="mut sm">Your delivered and cancelled orders will show up here.</p>
          <a href="#/" class="btn btn-primary">Order street food</a>
        </div>`;

  return `
  ${headerSub('Orders', { back: '#/' })}
  <div class="orders-page page-stack">
    ${liveSection}
    <section class="orders-section" aria-label="Order history">
      <div class="secH orders-sec-head">
        <h2>${live.length ? 'Past orders' : 'Your orders'}</h2>
        ${past.length ? `<span class="mut sm">${past.length} total</span>` : ''}
      </div>
      <div class="orders-list">
        ${pastBody}
      </div>
    </section>
  </div>`;
}

export function pageProfile() {
  const st = getState();
  const favVendors = st.favorites.vendors.map(getVendor).filter(Boolean);
  return `
  ${headerSub('Profile', { back: '#/' })}
  <div class="profile-page">
    <div class="profile-card">
      <div class="profile-av">${st.user.name.charAt(0)}</div>
      <div>
        <h2>${st.user.name}</h2>
        <p class="mut sm">${st.user.phone}</p>
        <p class="mut sm">${st.user.email}</p>
      </div>
    </div>

    <nav class="profile-menu" aria-label="Account">
      <a href="#/search" class="profile-menu-item">Food community</a>
      <a href="#/orders" class="profile-menu-item">Previous orders</a>
      <a href="#/cart" class="profile-menu-item">Cart</a>
      <button type="button" class="profile-menu-item" data-nav-mode="vendor">Vendor dashboard</button>
      <a href="#/help" class="profile-menu-item">Help & support</a>
    </nav>

    <div class="profile-block">
      <h3>Saved addresses</h3>
      ${st.addresses
        .map(
          (a) => `<div class="profile-line"><strong>${a.label}</strong><span class="mut sm">${a.line1}</span></div>`
        )
        .join('')}
    </div>

    <div class="profile-block" id="saved-vendors">
      <h3>Favorite vendors</h3>
      ${
        favVendors.length
          ? favVendors.map((v) => `<a class="profile-line linkish" href="#/vendor/${v.id}">${v.name}</a>`).join('')
          : '<p class="mut sm">None yet — tap ♥ on a stall.</p>'
      }
    </div>

    <div class="profile-block">
      <h3>Saved discussions</h3>
      ${
        st.communitySaved?.length
          ? st.communitySaved
              .map((id) => getCommunityPost(id))
              .filter(Boolean)
              .map((p) => `<a class="profile-line linkish" href="#/community/post/${p.id}">${escapeHtml(p.title)}</a>`)
              .join('')
          : '<p class="mut sm">Save threads from the Community tab with ☆.</p>'
      }
    </div>

    <div class="profile-block">
      <h3>Your posts</h3>
      ${
        st.communityPosts?.length
          ? st.communityPosts
              .slice(0, 5)
              .map((p) => `<a class="profile-line linkish" href="#/community/post/${p.id}">${escapeHtml(p.title)}</a>`)
              .join('')
          : '<p class="mut sm">Ask or review from <a href="#/search">Community</a>.</p>'
      }
    </div>

    <div class="profile-block">
      <h3>Your stall listings</h3>
      ${
        st.stallSubmissions?.length
          ? st.stallSubmissions
              .slice(0, 5)
              .map(
                (s) => `<div class="profile-line stall-sub-line">
            <strong>${s.name}</strong>
            <span class="mut xs">${s.status === 'pending' ? `In review · by ${s.reviewByLabel || '72h'}` : s.status}</span>
          </div>`
              )
              .join('')
          : '<p class="mut sm">None yet — tap <b>Add stall</b> in the tab bar.</p>'
      }
    </div>

    <div class="profile-block">
      <h3>Notifications</h3>
      ${
        st.userInbox?.length
          ? st.userInbox
              .slice(0, 4)
              .map((n) => `<div class="profile-line"><strong>${n.title}</strong><span class="mut xs">${n.body}</span></div>`)
              .join('')
          : ''
      }
      <label class="check-row"><input type="checkbox" checked disabled /><span>Order updates</span></label>
      <label class="check-row"><input type="checkbox" checked disabled /><span>Stall review updates</span></label>
      <label class="check-row"><input type="checkbox" checked disabled /><span>Offers in Jaipur</span></label>
    </div>
  </div>`;
}

export function pageHelp() {
  return `${headerSub('Help & support', { back: '#/profile' })}
  <div class="faq">
    <h3>Listing a stall</h3>
    <p>Use <strong>Add stall</strong> to submit a new spot. We block duplicate names and similar stalls in the same area — check existing listings first.</p>
    <h3>Call & verify</h3>
    <p>We encourage calling vendors to confirm availability before ordering — especially for festival specials.</p>
    <h3>Delivery partners</h3>
    <p>Delivery is handled by independent local partners. Partner name appears when your order is dispatched.</p>
    <h3>Contact</h3>
    <p>support@jaipurstreetbites.in · +91 141 555 0101</p>
  </div>`;
}

export function pageVendorDashboard() {
  const st = getState();
  const vendor = VENDORS.find((v) => v.vendorAccountId === st.vendorAccountId) || VENDORS[0];
  const orders = st.vendorOrders.filter((o) => o.vendorId === vendor.id);
  const pending = orders.filter((o) => o.status === 'pending');
  const todayRev = orders.filter((o) => o.status === 'completed').reduce((s, o) => s + o.total, 0);

  return `
  ${headerSub('Vendor dashboard', { subtitle: `${vendor.name} · ${vendor.locationName}`, back: '#/' })}
  <div class="pad" style="margin-bottom:8px">
    <button type="button" class="btn btn-ghost btn-sm" data-nav-mode="customer">← Customer app</button>
  </div>
  <div class="dash-stats">
    <div class="stat"><span>Today's revenue</span><strong>${formatINR(todayRev || 12450)}</strong></div>
    <div class="stat"><span>Pending orders</span><strong>${pending.length}</strong></div>
    <div class="stat"><span>Completed</span><strong>${orders.filter((o) => o.status === 'completed').length}</strong></div>
    <div class="stat"><span>Rating</span><strong>${vendor.rating}</strong></div>
  </div>
  <div class="dash-charts">
    <div class="chart-placeholder"><h3>Orders this week</h3><div class="bars">${[40, 65, 55, 80, 70, 90, 75].map((h) => `<div style="height:${h}%"></div>`).join('')}</div></div>
    <div class="chart-placeholder"><h3>Popular items</h3><p>${vendor.popularDishes.join(', ')}</p></div>
  </div>
  <section class="section">
    <h2>Incoming orders</h2>
    ${
      pending.length
        ? pending
            .map(
              (o) => `
      <div class="vendor-order-card">
        <h3>Order #${o.orderNumber}</h3>
        <ul>${o.items.map((i) => `<li>${i.qty} × ${i.name}</li>`).join('')}</ul>
        <p>${formatINR(o.total)} · Customer: ${o.customerName}</p>
        <div class="card-actions">
          <button type="button" class="btn btn-primary btn-sm" data-v-accept="${o.id}">Accept</button>
          <button type="button" class="btn btn-danger btn-sm" data-v-reject="${o.id}">Reject</button>
        </div>
      </div>`
            )
            .join('')
        : '<p class="muted">No pending orders — demo: place an order from customer app.</p>'
    }
  </section>
  <section class="section">
    <h2>Quick links</h2>
    <div class="dash-links">
      <a href="#/add-stall" class="btn btn-secondary">Add a stall (contributor)</a>
      <a href="#/vendor/${vendor.id}" class="btn btn-ghost">View public menu</a>
    </div>
  </section>
  <section class="section">
    <h2>Active order management</h2>
    ${orders
      .filter((o) => !['pending', 'rejected', 'completed'].includes(o.status))
      .map(
        (o) => `
      <div class="vendor-order-card">
        <strong>#${o.orderNumber}</strong> — ${o.status}
        <div class="card-actions">
          <button type="button" class="btn btn-sm" data-v-status="${o.id}:preparing">Preparing</button>
          <button type="button" class="btn btn-sm" data-v-status="${o.id}:ready">Ready</button>
          <button type="button" class="btn btn-sm" data-v-status="${o.id}:handed">Hand to partner</button>
          <button type="button" class="btn btn-sm btn-primary" data-v-status="${o.id}:completed">Complete</button>
        </div>
      </div>`
      )
      .join('') || '<p class="muted">No active kitchen orders</p>'}
  </section>`;
}

export function pageAddStall() {
  const locDefault = getState().locationId || 'raja-park';
  const progress = ['Basics', 'Location', 'Photos', 'Menu', 'Submit']
    .map(
      (label, i) =>
        `<span class="stall-progress-dot ${i === 0 ? 'on' : ''}" data-stall-progress="${i + 1}" title="${label}"><i></i><span>${label}</span></span>`
    )
    .join('');

  return `
  ${headerSub('Add a stall', { subtitle: 'Step <span id="add-stall-step-num">1</span> of 5 · Review in 72h', back: '#/' })}
  <div class="stall-wizard-intro page-pad">
    <p class="mut sm">Help locals find real street food. We check duplicates so one stall isn’t listed twice under different names.</p>
    <div class="stall-progress">${progress}</div>
  </div>
  <div id="add-stall-wizard" class="wizard page-pad" data-step="1">
    <div class="wizard-panel" data-panel="1">
      <h2 class="wizard-title">About the stall</h2>
      <form id="stall-basic-form" class="form-stack">
        <label class="field-label">Stall name<input class="field-input" name="name" required placeholder="Tonk Phatak evening samosa" autocomplete="organization" /></label>
        <label class="field-label">Primary category
          <select class="field-input" name="category">${CATEGORIES.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}</select>
        </label>
        <label class="field-label">Hygiene level
          <select class="field-input" name="hygiene">${HYGIENE_LEVELS.map((h) => `<option value="${h.id}">${h.label} — ${h.hint}</option>`).join('')}</select>
        </label>
        <label class="field-label">Description <span class="mut xs">(optional)</span>
          <textarea class="field-input" name="desc" rows="3" placeholder="What makes this stall special?"></textarea>
        </label>
        <div class="field-label">
          <span>Taste similar to…</span>
          <p class="mut xs">Pick listed stalls or add a quick name locals use.</p>
          <div id="stall-taste-selected" class="stall-taste-selected"></div>
          <button type="button" class="btn btn-secondary btn-sm" id="stall-taste-open">Choose stalls / quick add</button>
        </div>
      </form>
      <button type="button" class="btn btn-primary btn-block" data-wizard-next>Continue — Location</button>
      <p class="mut xs" style="margin-top:10px">On the next step you can paste a <strong>Google Maps</strong> link to fill address and pin.</p>
    </div>

    <div class="wizard-panel hidden" data-panel="2">
      <h2 class="wizard-title">Where is it?</h2>
      <div class="stall-maps-quick card-soft">
        <b>Quick add from Google Maps</b>
        <p class="mut sm">Paste a place link from Google Maps (Share → Copy link), or coordinates like <code>26.9124, 75.7873</code>.</p>
        <label class="field-label">
          Google Maps link or coordinates
          <input class="field-input" type="text" id="stall-maps-paste" name="mapsPaste" placeholder="https://www.google.com/maps/place/…" autocomplete="off" />
        </label>
        <div class="stall-maps-actions">
          <button type="button" class="btn btn-secondary btn-sm" id="stall-maps-apply">Fill from link</button>
          <button type="button" class="btn btn-ghost btn-sm" id="stall-maps-geolocate">Use my location</button>
          <a class="btn btn-link btn-sm" id="stall-maps-open" href="https://www.google.com/maps/search/?api=1&query=street+food+Jaipur" target="_blank" rel="noopener">Open Maps</a>
        </div>
        <div id="stall-maps-preview" class="stall-maps-preview hidden" aria-live="polite"></div>
        <label class="check-row stall-maps-name-opt hidden" id="stall-maps-name-wrap">
          <input type="checkbox" id="stall-maps-use-name" />
          <span>Use Google place name as stall name</span>
        </label>
      </div>
      <form id="stall-location-form" class="form-stack">
        <input type="hidden" name="lat" id="stall-lat" />
        <input type="hidden" name="lng" id="stall-lng" />
        <input type="hidden" name="googleMapsUrl" id="stall-maps-url" />
        <input type="hidden" name="mapsPlaceName" id="stall-maps-place-name" />
        <label class="field-label">Area in Jaipur
          <select class="field-input" name="locationId" id="stall-location-id">${LOCATIONS.map((l) => `<option value="${l.id}" ${l.id === locDefault ? 'selected' : ''}>${l.name} — ${l.area}</option>`).join('')}</select>
        </label>
        <label class="field-label">Street address / lane<input class="field-input" name="address" id="stall-address" required placeholder="Near Tonk Phatak flyover, pink cart" /></label>
        <label class="field-label">Landmark <span class="mut xs">(optional)</span><input class="field-input" name="landmark" id="stall-landmark" placeholder="Opposite HDFC ATM" /></label>
      </form>
      <button type="button" class="btn btn-ghost" data-wizard-prev>Back</button>
      <button type="button" class="btn btn-primary btn-block" data-wizard-next>Continue — Photos</button>
    </div>

    <div class="wizard-panel hidden" data-panel="3">
      <h2 class="wizard-title">Photos</h2>
      <p class="mut sm">Cover photo is shown on the stall card. Add extra shots of the cart and menu board.</p>
      <label class="field-label stall-upload">
        <span>Stall cover photo <span class="mut xs">(required)</span></span>
        <input type="file" id="stall-cover-input" accept="image/*" />
      </label>
      <div id="stall-cover-preview" class="stall-photo-grid"></div>
      <label class="field-label stall-upload">
        <span>More photos</span>
        <input type="file" id="stall-gallery-input" accept="image/*" multiple />
      </label>
      <div id="stall-gallery-preview" class="stall-photo-grid stall-photo-grid--thumbs"></div>
      <button type="button" class="btn btn-ghost" data-wizard-prev>Back</button>
      <button type="button" class="btn btn-primary btn-block" data-wizard-next>Continue — Menu</button>
    </div>

    <div class="wizard-panel hidden" data-panel="4">
      <h2 class="wizard-title">Menu</h2>
      <div class="stall-menu-tabs">
        <button type="button" class="stall-menu-tab on" data-menu-tab="manual">Add manually</button>
        <button type="button" class="stall-menu-tab" data-menu-tab="ocr">Scan menu (OCR)</button>
      </div>
      <div id="stall-menu-manual">
        <p class="mut sm">Add items and prices — you can edit anytime after approval.</p>
        <div id="stall-manual-menu" class="stall-manual-menu"></div>
        <button type="button" class="btn btn-ghost btn-sm" id="stall-menu-add-row">+ Add item</button>
      </div>
      <div id="stall-menu-ocr" class="hidden">
        <p class="mut sm">Upload a menu photo. Check every line before continuing — OCR can misread ₹ prices.</p>
        <input type="file" id="stall-ocr-files" accept="image/*" multiple hidden />
        <button type="button" class="btn btn-secondary" id="stall-ocr-upload-btn">Upload menu photo</button>
        <div id="stall-ocr-states" class="hidden">
          <div class="ocr-step" data-ocr-step="0">Reading menu…</div>
          <div class="ocr-step" data-ocr-step="1">Detecting items…</div>
          <div class="ocr-step" data-ocr-step="2">Extracting prices…</div>
          <div class="ocr-step" data-ocr-step="3">Grouping categories…</div>
        </div>
        <div id="stall-ocr-results" class="hidden">
          <table class="ocr-table" id="stall-ocr-table">
            <thead><tr><th>Item</th><th>Price</th><th>Category</th><th></th></tr></thead>
            <tbody></tbody>
          </table>
          <button type="button" class="btn btn-ghost btn-sm" id="stall-ocr-add-row">+ Add row</button>
        </div>
      </div>
      <button type="button" class="btn btn-ghost" data-wizard-prev>Back</button>
      <button type="button" class="btn btn-primary btn-block" data-wizard-next>Review submission</button>
    </div>

    <div class="wizard-panel hidden" data-panel="5">
      <h2 class="wizard-title">Submit for review</h2>
      <div id="stall-review-summary" class="stall-review-summary"></div>
      <div class="stall-review-policy card-soft">
        <b>What happens next?</b>
        <p class="mut sm">Our team verifies location, duplicates, and menu prices within <strong>72 hours</strong>. You’ll get a notification when the stall goes live or if we need edits.</p>
      </div>
      <label class="check-row stall-dedup-confirm">
        <input type="checkbox" id="stall-not-dup" />
        <span>This is not the same stall already listed under another name — I checked similar matches.</span>
      </label>
      <button type="button" class="btn btn-ghost" data-wizard-prev>Back</button>
      <button type="button" class="btn btn-primary btn-block" data-wizard-next>Submit for review</button>
    </div>

    <div class="wizard-panel hidden" data-panel="6">
      <div class="stall-success">
        <span class="stall-success-ico" aria-hidden="true">✓</span>
        <h2>Submitted!</h2>
        <p>We’ll review <strong id="stall-review-deadline">within 72 hours</strong> and notify you in Profile → Notifications.</p>
        <a href="#/" class="btn btn-primary btn-block">Back to home</a>
        <a href="#/profile" class="btn btn-ghost btn-block">View profile</a>
      </div>
    </div>
  </div>`;
}

/** @deprecated — use pageAddStall */
export function pageAddFood() {
  return pageAddStall();
}

export function pageMenuOcr() {
  return `
  ${headerSub('Upload menu', { subtitle: 'OCR menu extraction (demo)', back: '#/vendor-dashboard' })}
  <div class="ocr-flow">
    <div class="upload-zone" id="menu-upload-zone">
      <input type="file" id="menu-files" accept="image/*" multiple hidden />
      <p>Drop menu photos or click to upload</p>
      <button type="button" class="btn btn-secondary" id="menu-upload-btn">Choose files</button>
    </div>
    <div id="ocr-states" class="hidden">
      <div class="ocr-step" data-ocr-step="0">Reading menu...</div>
      <div class="ocr-step" data-ocr-step="1">Detecting food items...</div>
      <div class="ocr-step" data-ocr-step="2">Extracting prices...</div>
      <div class="ocr-step" data-ocr-step="3">Organizing categories...</div>
    </div>
    <div id="ocr-results" class="hidden">
      <h2>Detected items</h2>
      <table class="ocr-table" id="ocr-table">
        <thead><tr><th>Item</th><th>Price</th><th>Category</th><th></th></tr></thead>
        <tbody></tbody>
      </table>
      <button type="button" class="btn btn-ghost" id="ocr-add-row">+ Add item</button>
      <div class="row-btns">
        <button type="button" class="btn btn-secondary" id="ocr-review">Review menu</button>
        <button type="button" class="btn btn-primary" id="ocr-publish">Publish menu</button>
      </div>
    </div>
  </div>`;
}
