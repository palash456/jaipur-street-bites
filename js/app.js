import { initRouter, navigate, register } from './router.js';
import { IMAGE_FALLBACK, resolveFoodImage, emojiForCategory, IMG_ATTRS } from './utils/images.js';
import {
  pageHome,
  pageSearch,
  pageDiscover,
  pageCommunityPost,
  pageCommunityReels,
  pageVendor,
  pageCart,
  pageCheckout,
  pageOrderConfirm,
  pageTrack,
  pageOrders,
  pageProfile,
  pageHelp,
  pageVendorDashboard,
  pageAddStall,
  pageMenuOcr,
} from './pages/pages.js';
import { initStallWizard } from './wizards/add-stall.js';
import {
  getState,
  subscribe,
  setLocation,
  addRecentSearch,
  addRecentlyViewed,
  toggleFavoriteVendor,
  addToCart,
  updateCartQty,
  removeCartItem,
  setCartCoupon,
  setCartInstructions,
  setCallVerify,
  placeOrder,
  advanceOrderStatus,
  cancelOrder,
  vendorAcceptOrder,
  vendorRejectOrder,
  vendorSetStatus,
  setMode,
  cartTotals,
  clearCart,
  voteCommunityPost,
  toggleSaveCommunityPost,
  addCommunityComment,
  createCommunityPost,
  markStorySeen,
  toggleReelLike,
} from './state/store.js';
import { COMMUNITY_TOPICS, getStory, getReel } from './data/community.js';
import {
  parseCommunityFilters,
  clearCommunityFilterParams,
  COMMUNITY_FILTER_SORT,
  COMMUNITY_FILTER_TYPES,
  COMMUNITY_FILTER_CUISINES,
  COMMUNITY_FILTER_TAGS,
  COMMUNITY_FILTER_TIME,
  COMMUNITY_FILTER_MIN_UP,
  COMMUNITY_FILTER_RATING,
  COMMUNITY_FILTER_AUTHOR,
  LOCATIONS as FILTER_LOCATIONS,
} from './data/community-filters.js';
import { escapeHtml } from './components/community.js';
import { save } from './utils/storage.js';
import { getVendor, getFood, foodsByVendor, LOCATIONS, CATEGORIES } from './data/catalog.js';
import { openModal, closeModal, showToast, bindModalClose, loadingOverlay } from './components/ui.js';
import { formatINR } from './utils/format.js';
import { foodImageForItem } from './utils/images.js';

function vendorCoords(v) {
  const idx = Math.max(0, parseInt(String(v.id).replace('v-', ''), 10) - 1);
  const lat = 26.9124 + ((idx * 17) % 50) * 0.001 - 0.015;
  const lng = 75.7873 + ((idx * 23) % 50) * 0.001 - 0.02;
  return { lat, lng };
}

function scrollToVendorMenu(highlightSelector) {
  const main = document.getElementById('app-main');
  const menu = document.querySelector('#vendor-menu');
  if (menu && main) {
    main.scrollTo({ top: Math.max(0, menu.offsetTop - 108), behavior: 'smooth' });
  } else {
    document.querySelector('#vendor-menu')?.scrollIntoView({ behavior: 'smooth' });
  }
  if (highlightSelector) {
    setTimeout(() => {
      const row = document.querySelector(highlightSelector);
      row?.classList.add('order-pick-flash');
      row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => row?.classList.remove('order-pick-flash'), 2200);
    }, 450);
  }
}

function showDirectionsFlow(vendorId) {
  const v = getVendor(vendorId);
  if (!v) return;
  const { lat, lng } = vendorCoords(v);
  const googleDir = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
  const appleMaps = `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`;
  const walkMin = Math.max(5, Math.round(v.distanceKm * 12));
  openModal(
    `
    <div class="modal-sheet">
      <h2 class="modal-sheet-title">Directions</h2>
      <p class="modal-sheet-sub">${v.name}</p>
      <div class="modal-sheet-meta">
        <p class="modal-sheet-addr">${v.address}</p>
        <p class="mut xs">${v.distanceKm} km · ~${walkMin} min walk</p>
      </div>
      <div class="modal-sheet-actions">
        <a href="${googleDir}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-block">Open in Google Maps</a>
        <div class="modal-sheet-row">
          <a href="${appleMaps}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-block">Apple Maps</a>
          <button type="button" class="btn btn-ghost btn-block" data-copy-address="${encodeURIComponent(v.address)}">Copy address</button>
        </div>
      </div>
    </div>
  `,
    { className: 'modal-sheet-wrap' }
  );
  document.querySelector('[data-copy-address]')?.addEventListener('click', async (ev) => {
    const addr = decodeURIComponent(ev.currentTarget.getAttribute('data-copy-address') || '');
    try {
      await navigator.clipboard.writeText(addr);
      showToast('Address copied', 'success');
    } catch {
      showToast(addr, 'info');
    }
  });
}

function showOrderFlow(vendorId) {
  const v = getVendor(vendorId);
  if (!v) return;
  const st = getState();
  const cart = st.cart;

  if (cart.vendorId === vendorId && cart.items.length > 0) {
    navigate('/cart');
    showToast('Your cart is ready — review and checkout', 'success');
    return;
  }

  if (cart.vendorId && cart.vendorId !== vendorId && cart.items.length > 0) {
    openModal(
      `
      <div class="modal-sheet">
        <h2 class="modal-sheet-title">Cart has another stall</h2>
        <p class="modal-sheet-sub mut sm">Switch to <strong>${v.name}</strong> or finish your current cart first.</p>
        <div class="modal-sheet-actions">
          <button type="button" class="btn btn-primary btn-block" data-go-cart-from-modal>View cart</button>
          <button type="button" class="btn btn-ghost btn-block" data-clear-cart-order="${vendorId}">Clear cart & order here</button>
        </div>
      </div>
    `,
      { className: 'modal-sheet-wrap' }
    );
    document.querySelector('[data-clear-cart-order]')?.addEventListener('click', () => {
      clearCart();
      closeModal();
      renderShellFixed();
      showOrderFlow(vendorId);
    });
    document.querySelector('[data-go-cart-from-modal]')?.addEventListener('click', () => {
      closeModal();
      navigate('/cart');
    });
    return;
  }

  if (v.callAndVerify && st.callVerify[vendorId] !== 'confirmed') {
    openModal(
      `
      <div class="modal-sheet">
        <h2 class="modal-sheet-title">Order</h2>
        <p class="modal-sheet-sub mut sm">This stall needs a quick call to confirm items before checkout.</p>
        <div class="modal-sheet-actions">
          <button type="button" class="btn btn-primary btn-block" data-start-call-order="${vendorId}">Call & verify</button>
          <button type="button" class="btn btn-ghost btn-block" data-browse-menu-order="${vendorId}">Browse menu</button>
        </div>
      </div>
    `,
      { className: 'modal-sheet-wrap' }
    );
    document.querySelector('[data-start-call-order]')?.addEventListener('click', () => {
      closeModal();
      showCallVendorFlow(vendorId);
    });
    document.querySelector('[data-browse-menu-order]')?.addEventListener('click', () => {
      closeModal();
      scrollToVendorMenu();
      showToast('Tap + on any dish to add to cart', 'info');
    });
    return;
  }

  const menu = foodsByVendor(vendorId).filter((f) => f.available);
  const pick = menu[0];
  if (!pick) {
    showToast('Menu unavailable right now — try calling the vendor', 'warn');
    showCallVendorFlow(vendorId);
    return;
  }

  openModal(
    `
    <div class="modal-sheet">
      <h2 class="modal-sheet-title">Start order</h2>
      <p class="modal-sheet-sub mut sm">Popular: <strong>${pick.name}</strong> · ${formatINR(pick.price)}</p>
      <div class="modal-sheet-actions">
        <button type="button" class="btn btn-primary btn-block" data-quick-add-order="${pick.id}" data-vendor-id="${vendorId}">Add to cart & checkout</button>
        <button type="button" class="btn btn-ghost btn-block" data-browse-menu-order="${vendorId}">Browse menu</button>
      </div>
    </div>
  `,
    { className: 'modal-sheet-wrap' }
  );
  document.querySelector('[data-quick-add-order]')?.addEventListener('click', () => {
    const foodId = document.querySelector('[data-quick-add-order]')?.getAttribute('data-quick-add-order');
    const vid = document.querySelector('[data-quick-add-order]')?.getAttribute('data-vendor-id');
    const food = getFood(foodId);
    if (!food || !vid) return;
    const res = addToCart(food, vid, { qty: 1 });
    if (res.error) {
      showToast('Could not add to cart', 'warn');
      return;
    }
    closeModal();
    renderShellFixed();
    showToast(`${food.name} added — checkout when ready`, 'success');
    navigate('/cart');
  });
  document.querySelector('[data-browse-menu-order]')?.addEventListener('click', () => {
    closeModal();
    scrollToVendorMenu(`[data-food="${pick.id}"]`);
  });
}

function renderShellFixed() {
  const st = getState();
  const cartCount = st.cart.items.reduce((s, i) => s + i.qty, 0);
  const locSelect = LOCATIONS.map(
    (l) => `<option value="${l.id}" ${st.locationId === l.id ? 'selected' : ''}>${l.name}</option>`
  ).join('');

  const sel = document.getElementById('location-select');
  if (sel) sel.innerHTML = locSelect;
  const badge = document.getElementById('cart-badge');
  if (badge) {
    badge.textContent = cartCount || '';
    badge.classList.toggle('show', cartCount > 0);
  }
  const sticky = document.getElementById('sticky-cart');
  if (sticky) {
    const path = (location.hash.slice(1) || '/').split('?')[0];
    const hideBar =
      cartCount <= 0 ||
      path.includes('cart') ||
      path.includes('checkout') ||
      path.includes('confirm') ||
      path.includes('track') ||
      path.includes('orders') ||
      path.includes('add-stall') ||
      path.includes('vendor-add-food') ||
      path.includes('vendor-menu-ocr');
    sticky.classList.toggle('show', !hideBar);
    const t = cartTotals();
    const stickyTotal = document.getElementById('sticky-cart-total');
    if (stickyTotal) stickyTotal.textContent = formatINR(t.total);
  }
  const main = document.getElementById('app-main');
  if (main) {
    const showBar = sticky?.classList.contains('show');
    const extra = showBar ? 56 : 0;
    main.style.paddingBottom = `calc(var(--bottom-nav-h) + ${20 + extra}px + env(safe-area-inset-bottom, 0px))`;
  }
}

register('/', () => pageHome());
register('/search', ({ params }) => pageSearch(params));
register('/discover', ({ params }) => pageDiscover(params));
register('/community', ({ parts, params }) => {
  if (parts[1] === 'post' && parts[2]) return pageCommunityPost(parts);
  if (parts[1] === 'reels') return pageCommunityReels();
  return pageSearch(params);
});
register('/vendor', ({ parts }) => pageVendor(parts));
register('/cart', () => pageCart());
register('/checkout', () => pageCheckout());
register('/confirm', ({ parts }) => pageOrderConfirm(parts));
register('/track', ({ parts }) => pageTrack(parts));
register('/orders', () => pageOrders());
register('/profile', () => pageProfile());
register('/help', () => pageHelp());
register('/vendor-dashboard', () => pageVendorDashboard());
register('/add-stall', () => pageAddStall());
register('/vendor-add-food', () => pageAddStall());
register('/vendor-menu-ocr', () => pageMenuOcr());

function showCommunityComposeModal(defaultType = 'discussion') {
  const st = getState();
  const topics = COMMUNITY_TOPICS.filter((t) => t.id !== 'all');
  openModal(
    `
    <div class="modal-sheet">
      <h2 class="modal-sheet-title">Share with foodies</h2>
      <p class="modal-sheet-sub mut sm">Ask a question, post a review, or start a discussion for ${LOCATIONS.find((l) => l.id === st.locationId)?.name || 'your area'}.</p>
      <form id="community-compose-form" class="form-stack modal-sheet-form">
        <label class="field-label">Type
          <select class="field-input" name="type">
            <option value="question" ${defaultType === 'question' ? 'selected' : ''}>Question</option>
            <option value="review" ${defaultType === 'review' ? 'selected' : ''}>Review</option>
            <option value="discussion" ${defaultType === 'discussion' ? 'selected' : ''}>Discussion</option>
          </select>
        </label>
        <label class="field-label">Topic
          <select class="field-input" name="topicId">
            ${topics.map((t) => `<option value="${t.id}">${t.name}</option>`).join('')}
          </select>
        </label>
        <label class="field-label">Title<input class="field-input" name="title" required placeholder="What's on your mind?" /></label>
        <label class="field-label">Details<textarea class="field-input" name="body" rows="4" required placeholder="Tips, prices, timings, hygiene notes…"></textarea></label>
        <label class="field-label">Stall rating <span class="mut xs">(reviews only)</span>
          <select class="field-input" name="rating">
            <option value="">No rating</option>
            <option value="5">5 — Outstanding</option>
            <option value="4">4 — Good</option>
            <option value="3">3 — Okay</option>
            <option value="2">2 — Disappointing</option>
            <option value="1">1 — Avoid</option>
          </select>
        </label>
        <div class="modal-sheet-actions">
          <button type="submit" class="btn btn-primary btn-block">Post to community</button>
        </div>
      </form>
    </div>
  `,
    { className: 'modal-sheet-wrap' }
  );
  document.getElementById('community-compose-form')?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const post = createCommunityPost({
      type: fd.get('type'),
      title: fd.get('title'),
      body: fd.get('body'),
      topicId: fd.get('topicId'),
      locationId: st.locationId,
      rating: fd.get('rating'),
    });
    closeModal();
    if (post) {
      showToast('Posted to your local food circle', 'success');
      navigate(`/community/post/${post.id}`);
    } else showToast('Add a title and details', 'warn');
  });
}

function showCommunityFilterModal() {
  const params = new URLSearchParams(location.hash.split('?')[1] || '');
  const f = parseCommunityFilters(params);

  const typeChecks = COMMUNITY_FILTER_TYPES.map(
    (t) =>
      `<label class="check-row filter-check"><input type="checkbox" name="cftype" value="${t.id}" ${f.types.includes(t.id) ? 'checked' : ''} /><span>${t.label}</span></label>`
  ).join('');

  const tagChecks = COMMUNITY_FILTER_TAGS.map(
    (t) =>
      `<label class="filter-tag-chip"><input type="checkbox" name="cftags" value="${t.id}" ${f.tags.includes(t.id) ? 'checked' : ''} /><span>${t.label}</span></label>`
  ).join('');

  openModal(
    `
    <div class="modal-sheet modal-filter-sheet">
      <h2 class="modal-sheet-title">Filter threads</h2>
      <p class="modal-sheet-sub mut sm">Narrow discussions, reviews, and Q&amp;A across Jaipur.</p>
      <form id="community-filter-form" class="modal-filter-form">
        <section class="filter-section">
          <h3>Sort</h3>
          <div class="filter-radio-grid">
            ${COMMUNITY_FILTER_SORT.map(
              (o) =>
                `<label class="check-row"><input type="radio" name="cfsort" value="${o.id}" ${f.sort === o.id ? 'checked' : ''} /><span>${o.label}</span></label>`
            ).join('')}
          </div>
        </section>
        <section class="filter-section">
          <h3>Post type</h3>
          <div class="filter-check-grid">${typeChecks}</div>
        </section>
        <section class="filter-section">
          <h3>Area in Jaipur</h3>
          <select class="field-input" name="cfarea">
            <option value="">All areas</option>
            ${FILTER_LOCATIONS.map(
              (l) => `<option value="${l.id}" ${f.area === l.id ? 'selected' : ''}>${escapeHtml(l.name)} — ${escapeHtml(l.area)}</option>`
            ).join('')}
          </select>
        </section>
        <section class="filter-section">
          <h3>Food / cuisine</h3>
          <select class="field-input" name="cfcuisine">
            <option value="">Any cuisine</option>
            ${COMMUNITY_FILTER_CUISINES.map(
              (c) => `<option value="${c.id}" ${f.cuisine === c.id ? 'selected' : ''}>${c.label}</option>`
            ).join('')}
          </select>
        </section>
        <section class="filter-section">
          <h3>Posted</h3>
          <select class="field-input" name="cftime">
            ${COMMUNITY_FILTER_TIME.map(
              (t) => `<option value="${t.id}" ${f.time === t.id ? 'selected' : ''}>${t.label}</option>`
            ).join('')}
          </select>
        </section>
        <section class="filter-section">
          <h3>Tags <span class="mut xs">(match any)</span></h3>
          <div class="filter-tag-grid">${tagChecks}</div>
        </section>
        <section class="filter-section filter-section--row">
          <label class="field-label">Minimum upvotes
            <select class="field-input" name="cfminup">
              ${COMMUNITY_FILTER_MIN_UP.map(
                (o) => `<option value="${o.id}" ${f.minUp === o.id ? 'selected' : ''}>${o.label}</option>`
              ).join('')}
            </select>
          </label>
          <label class="field-label">Star rating
            <select class="field-input" name="cfrating">
              ${COMMUNITY_FILTER_RATING.map(
                (o) => `<option value="${o.id}" ${f.rating === o.id ? 'selected' : ''}>${o.label}</option>`
              ).join('')}
            </select>
          </label>
        </section>
        <section class="filter-section">
          <h3>Author</h3>
          <select class="field-input" name="cfauthor">
            ${COMMUNITY_FILTER_AUTHOR.map(
              (o) => `<option value="${o.id}" ${f.author === o.id ? 'selected' : ''}>${o.label}</option>`
            ).join('')}
          </select>
        </section>
        <section class="filter-section">
          <h3>More</h3>
          <label class="check-row"><input type="checkbox" name="cfphoto" value="1" ${f.photo ? 'checked' : ''} /><span>Threads with photos</span></label>
          <label class="check-row"><input type="checkbox" name="cfpinned" value="1" ${f.pinned ? 'checked' : ''} /><span>Pinned only</span></label>
        </section>
        <div class="modal-sheet-actions modal-filter-actions">
          <button type="button" class="btn btn-ghost" id="community-filter-clear">Clear filters</button>
          <button type="submit" class="btn btn-primary">Show results</button>
        </div>
      </form>
    </div>
  `,
    { className: 'modal-sheet-wrap modal-filter-wrap' }
  );

  document.getElementById('community-filter-clear')?.addEventListener('click', () => {
    const next = clearCommunityFilterParams(params);
    closeModal();
    navigate(`/search?${next.toString()}`);
    showToast('Filters cleared', 'info');
  });

  document.getElementById('community-filter-form')?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const next = new URLSearchParams(params.toString());
    const q = next.get('q');
    const feed = next.get('feed');
    const topic = next.get('topic');
    const clean = clearCommunityFilterParams(new URLSearchParams());
    if (q) clean.set('q', q);
    if (feed) clean.set('feed', feed);
    if (topic && topic !== 'all') clean.set('topic', topic);

    const sort = fd.get('cfsort');
    if (sort && sort !== 'recent') clean.set('cfsort', sort);
    const types = fd.getAll('cftype');
    if (types.length) clean.set('cftype', types.join(','));
    const area = fd.get('cfarea');
    if (area) clean.set('cfarea', area);
    const cuisine = fd.get('cfcuisine');
    if (cuisine) clean.set('cfcuisine', cuisine);
    const time = fd.get('cftime');
    if (time && time !== 'all') clean.set('cftime', time);
    const tags = fd.getAll('cftags');
    if (tags.length) clean.set('cftags', tags.join(','));
    const minUp = fd.get('cfminup');
    if (minUp) clean.set('cfminup', minUp);
    const rating = fd.get('cfrating');
    if (rating) clean.set('cfrating', rating);
    const author = fd.get('cfauthor');
    if (author) clean.set('cfauthor', author);
    if (fd.get('cfphoto')) clean.set('cfphoto', '1');
    if (fd.get('cfpinned')) clean.set('cfpinned', '1');

    closeModal();
    navigate(`/search?${clean.toString()}`);
    showToast('Filters applied', 'success');
  });
}

function showStoryViewer(storyId) {
  const story = getStory(storyId);
  if (!story) return;
  let slideIndex = 0;

  function renderSlide() {
    const slide = story.slides[slideIndex];
    const root = document.getElementById('story-viewer-root');
    if (!root || !slide) return;
    root.innerHTML = `
      <img src="${slide.image}" alt="" class="story-viewer-img street-food-photo" ${IMG_ATTRS} />
      <div class="story-viewer-cap">
        <b>${story.user}</b> · ${story.label}
        <p class="sm" style="margin-top:8px">${slide.caption}</p>
        <div class="story-viewer-nav">
          <button type="button" class="btn btn-ghost btn-sm" data-story-prev ${slideIndex === 0 ? 'disabled' : ''}>Back</button>
          <span class="mut xs">${slideIndex + 1} / ${story.slides.length}</span>
          <button type="button" class="btn btn-primary btn-sm" data-story-next>${slideIndex >= story.slides.length - 1 ? 'Done' : 'Next'}</button>
        </div>
      </div>`;
    root.querySelector('[data-story-prev]')?.addEventListener('click', () => {
      if (slideIndex > 0) {
        slideIndex--;
        renderSlide();
      }
    });
    root.querySelector('[data-story-next]')?.addEventListener('click', () => {
      if (slideIndex < story.slides.length - 1) {
        slideIndex++;
        renderSlide();
      } else {
        markStorySeen(storyId);
        closeModal();
        navigate(location.hash.slice(1) || '/search', true);
        showToast('Story viewed', 'info');
      }
    });
  }

  openModal(
    `<div class="story-viewer" id="story-viewer-root" role="region" aria-label="Story"></div>`,
    { className: 'modal-sheet-wrap modal-story-wrap' }
  );
  renderSlide();
}

function showReelModal(reelId) {
  const reel = getReel(reelId);
  if (!reel) return;
  navigate('/community/reels');
  setTimeout(() => {
    const slide = document.querySelector(`[data-reel-id="${reelId}"]`);
    slide?.scrollIntoView({ behavior: 'smooth' });
  }, 200);
}

function bindCommunityEvents() {
  document.querySelectorAll('[data-community-compose]').forEach((el) => {
    el.addEventListener('click', () => showCommunityComposeModal(el.getAttribute('data-community-compose')));
  });
  document.querySelectorAll('[data-open-story]').forEach((el) => {
    el.addEventListener('click', () => showStoryViewer(el.getAttribute('data-open-story')));
  });
  document.querySelectorAll('[data-open-reel]').forEach((el) => {
    el.addEventListener('click', () => showReelModal(el.getAttribute('data-open-reel')));
  });
  document.querySelectorAll('[data-vote-up]').forEach((el) => {
    el.addEventListener('click', () => {
      voteCommunityPost(el.getAttribute('data-vote-up'), 'up');
      navigate(location.hash.slice(1), true);
    });
  });
  document.querySelectorAll('[data-vote-down]').forEach((el) => {
    el.addEventListener('click', () => {
      voteCommunityPost(el.getAttribute('data-vote-down'), 'down');
      navigate(location.hash.slice(1), true);
    });
  });
  document.querySelectorAll('[data-save-post]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-save-post');
      const wasSaved = isPostSaved(id);
      toggleSaveCommunityPost(id);
      showToast(wasSaved ? 'Removed from saved' : 'Saved to your list', wasSaved ? 'info' : 'success');
      navigate(location.hash.slice(1), true);
    });
  });
  document.querySelectorAll('[data-community-feed]').forEach((el) => {
    el.addEventListener('click', () => {
      const feed = el.getAttribute('data-community-feed');
      const params = new URLSearchParams(location.hash.split('?')[1] || '');
      params.set('feed', feed);
      navigate(`/search?${params.toString()}`);
    });
  });
  document.querySelectorAll('[data-community-topic]').forEach((el) => {
    el.addEventListener('click', () => {
      const topic = el.getAttribute('data-community-topic');
      const params = new URLSearchParams(location.hash.split('?')[1] || '');
      if (topic === 'all') params.delete('topic');
      else params.set('topic', topic);
      navigate(`/search?${params.toString()}`);
    });
  });
  document.querySelectorAll('[data-reel-like]').forEach((el) => {
    el.addEventListener('click', () => {
      toggleReelLike(el.getAttribute('data-reel-like'));
      navigate('/community/reels', true);
    });
  });
  document.getElementById('comm-comment-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const parts = location.hash.slice(1).split('/').filter(Boolean);
    const postId = parts[2];
    const body = new FormData(e.target).get('body');
    if (!postId) return;
    addCommunityComment(postId, body);
    showToast('Reply posted', 'success');
    navigate(location.hash.slice(1), true);
  });
  document.querySelectorAll('[data-reply-to]').forEach((el) => {
    el.addEventListener('click', () => {
      document.getElementById('comm-comment-form')?.querySelector('textarea')?.focus();
    });
  });
  document.querySelectorAll('[data-open-community-filter]').forEach((el) => {
    el.addEventListener('click', () => showCommunityFilterModal());
  });
  document.querySelectorAll('[data-clear-community-filter]').forEach((el) => {
    el.addEventListener('click', () => {
      const params = new URLSearchParams(location.hash.split('?')[1] || '');
      const next = clearCommunityFilterParams(params);
      navigate(`/search?${next.toString()}`);
      showToast('Filters cleared', 'info');
    });
  });
  document.querySelectorAll('[data-discover-chip]').forEach((el) => {
    el.addEventListener('click', () => {
      const q = el.getAttribute('data-discover-chip');
      addRecentSearch(q);
      navigate(`/discover?q=${encodeURIComponent(q)}`);
    });
  });
}

function isPostSaved(id) {
  return getState().communitySaved.includes(id);
}

function showCallVendorFlow(vendorId) {
  const v = getVendor(vendorId);
  if (!v) return;
  const tel = v.phone.replace(/\s/g, '');
  openModal(
    `
    <div class="modal-sheet">
      <h2 class="modal-sheet-title">Call vendor</h2>
      <p class="modal-sheet-sub">${v.name}</p>
      <a href="tel:${tel}" class="modal-sheet-phone">${v.phone}</a>
      <p class="modal-sheet-hint mut sm">Confirm availability, price, and prep time.</p>
      <div class="modal-sheet-actions">
        <a href="tel:${tel}" class="btn btn-primary btn-block">Call now</a>
      </div>
      <p class="modal-sheet-label">After your call</p>
      <div class="modal-sheet-actions modal-sheet-actions--tight">
        <button type="button" class="btn btn-primary btn-block" data-verify="confirmed">Yes, available</button>
        <button type="button" class="btn btn-ghost btn-block" data-verify="unavailable">Not available</button>
      </div>
      <div class="modal-sheet-row modal-sheet-row--text">
        <button type="button" class="btn btn-link btn-sm" data-verify="price_changed">Price changed</button>
        <button type="button" class="btn btn-link btn-sm" data-verify="no_response">No response</button>
      </div>
    </div>
  `,
    { className: 'modal-sheet-wrap' }
  );
  document.querySelectorAll('[data-verify]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const status = btn.getAttribute('data-verify');
      setCallVerify(vendorId, status);
      closeModal();
      if (status === 'confirmed') {
        showToast('Great! You can order now.', 'success');
        showOrderFlow(vendorId);
      } else if (status === 'price_changed') showToast('Note prices on menu — confirm again at cart.', 'info');
      else if (status === 'unavailable') showToast('Try another vendor nearby.', 'warn');
      else showToast('Try again in a few minutes.', 'warn');
    });
  });
}

function showAddFoodModal(foodId, vendorId) {
  const food = getFood(foodId);
  if (!food) return;
  const optionsHtml = (food.options || [])
    .map(
      (o, i) =>
        `<label class="check-row"><input type="radio" name="opt" value="${o.id}" ${i === 0 ? 'checked' : ''} /><span>${o.label} (+${formatINR(o.priceDelta || 0)})</span></label>`
    )
    .join('');
  const addonsHtml = (food.addons || [])
    .map(
      (a) =>
        `<label class="check-row"><input type="checkbox" name="addon" value="${a.id}" /><span>${a.label} (+${formatINR(a.price)})</span></label>`
    )
    .join('');
  const spiceHtml = (food.spiceLevels || ['Medium'])
    .map(
      (s, i) =>
        `<label class="check-row"><input type="radio" name="spice" value="${s}" ${i === 1 ? 'checked' : ''} /><span>${s}</span></label>`
    )
    .join('');

  const img = resolveFoodImage(food.name, food.categoryId, food.image);
  const ph = emojiForCategory(food.categoryId);
  openModal(
    `
    <div class="modal-food">
      <div class="modal-food-hero">
        <span class="food-ph" aria-hidden="true">${ph}</span>
        <img src="${img}" alt="" class="modal-food-img street-food-photo" ${IMG_ATTRS} />
      </div>
      <div class="modal-food-body">
        <h2>${food.name}</h2>
        <p class="mut sm">${food.description}</p>
        <p class="modal-price">${formatINR(food.price)}</p>
        <h4 class="modal-section-title">Options</h4>
        <div class="option-group">${optionsHtml}</div>
        ${addonsHtml ? `<h4 class="modal-section-title">Add-ons</h4><div class="option-group">${addonsHtml}</div>` : ''}
        <h4 class="modal-section-title">Spice level</h4>
        <div class="option-group">${spiceHtml}</div>
        <label class="field-label">Quantity
          <input class="field-input qty-input" type="number" id="modal-qty" min="1" value="1" />
        </label>
        <button type="button" class="btn btn-primary btn-block" id="modal-add-confirm">Add to cart — ${formatINR(food.price)}</button>
      </div>
    </div>
  `,
    { className: 'modal-food-sheet' }
  );

  document.getElementById('modal-add-confirm')?.addEventListener('click', () => {
    const opt = document.querySelector('input[name="opt"]:checked')?.value;
    const spice = document.querySelector('input[name="spice"]:checked')?.value;
    const addonIds = [...document.querySelectorAll('input[name="addon"]:checked')].map((el) => el.value);
    const qty = parseInt(document.getElementById('modal-qty')?.value || '1', 10);
    const res = addToCart(food, vendorId, { optionId: opt, addonIds, spice, qty });
    if (res.error === 'CART_VENDOR_MISMATCH') {
      showToast('Cart has items from another vendor. Clear cart first.', 'warn');
      return;
    }
    closeModal();
    showToast('Added to cart', 'success');
    renderShellFixed();
  });
}

function bindPageEvents({ path }) {
  document.querySelectorAll('[data-view-vendor]').forEach((el) => {
    const openVendor = () => {
      const id = el.getAttribute('data-view-vendor');
      if (!id) return;
      addRecentlyViewed(id);
      navigate(`/vendor/${id}`);
    };
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-fav-vendor]')) return;
      openVendor();
    });
    el.addEventListener('keydown', (e) => {
      if (e.target.closest('[data-fav-vendor]')) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openVendor();
      }
    });
  });
  document.querySelectorAll('[data-call-vendor]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      showCallVendorFlow(el.getAttribute('data-call-vendor'));
    });
  });
  document.querySelectorAll('[data-directions]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      showDirectionsFlow(el.getAttribute('data-directions'));
    });
  });
  document.querySelectorAll('[data-fav-vendor]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const id = el.getAttribute('data-fav-vendor');
      const wasSaved = getState().favorites.vendors.includes(id);
      toggleFavoriteVendor(id);
      navigate(location.hash.slice(1) || '/', true);
      showToast(wasSaved ? 'Removed from saved' : 'Saved to your list', wasSaved ? 'info' : 'success');
    });
  });
  document.querySelectorAll('[data-add-food]').forEach((el) => {
    el.addEventListener('click', () => showAddFoodModal(el.getAttribute('data-add-food'), el.getAttribute('data-vendor')));
  });
  document.querySelectorAll('[data-category]').forEach((el) => {
    el.addEventListener('click', () => navigate(`/discover?cat=${el.getAttribute('data-category')}`));
  });
  document.querySelectorAll('[data-apply-coupon]').forEach((el) => {
    el.addEventListener('click', () => {
      setCartCoupon(el.getAttribute('data-apply-coupon'));
      showToast('Coupon saved — open cart to apply', 'success');
    });
  });
  document.querySelectorAll('[data-search-chip]').forEach((el) => {
    el.addEventListener('click', () => {
      const q = el.getAttribute('data-search-chip');
      addRecentSearch(q);
      navigate(`/discover?q=${encodeURIComponent(q)}`);
    });
  });
  document.querySelectorAll('[data-reorder]').forEach((el) => {
    el.addEventListener('click', () => {
      navigate(`/vendor/${el.getAttribute('data-reorder')}`);
      showToast('Add items to cart from the menu', 'info');
    });
  });
  document.querySelectorAll('[data-rate-order]').forEach((el) => {
    el.addEventListener('click', () => showToast('Thanks for rating! (demo)', 'success'));
  });
  document.querySelectorAll('.vendor-card').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      const id = el.getAttribute('data-vendor');
      if (id) navigate(`/vendor/${id}`);
    });
  });

  document.getElementById('add-address-btn')?.addEventListener('click', () => {
  openModal(
    `
    <div class="modal-sheet">
      <h2 class="modal-sheet-title">Add address</h2>
      <p class="modal-sheet-sub mut sm">Deliver street food to a saved spot in Jaipur.</p>
      <form id="new-addr-form" class="form-grid modal-sheet-form">
        <label>Label<input name="label" value="Other" /></label>
        <label>Line 1<input name="line1" required /></label>
        <label>Line 2<input name="line2" /></label>
        <label>PIN<input name="pin" value="302001" /></label>
        <div class="modal-sheet-actions">
          <button type="submit" class="btn btn-primary btn-block">Save address</button>
        </div>
      </form>
    </div>
  `);
    document.getElementById('new-addr-form')?.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      const st = getState();
      const id = `addr-${Date.now()}`;
      st.addresses.push({
        id,
        label: fd.get('label'),
        line1: fd.get('line1'),
        line2: fd.get('line2'),
        city: 'Jaipur',
        pin: fd.get('pin'),
      });
      save('addresses', st.addresses);
      closeModal();
      showToast('Address saved', 'success');
      navigate('/checkout', true);
    });
  });

  document.querySelectorAll('[data-order-now]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      showOrderFlow(el.getAttribute('data-order-now'));
    });
  });

  const searchForm = document.getElementById('search-form');
  searchForm?.querySelectorAll('select, input[type="checkbox"]').forEach((el) => {
    el.addEventListener('change', () => searchForm.requestSubmit());
  });
  searchForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(searchForm);
    const discoverQ = document.getElementById('discover-q')?.value?.trim();
    const q = discoverQ ?? fd.get('q') ?? fd.get('q_visible') ?? '';
    if (q) addRecentSearch(String(q));
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (fd.get('cat')) params.set('cat', fd.get('cat'));
    if (fd.get('sort')) params.set('sort', fd.get('sort'));
    if (fd.get('rating')) params.set('rating', fd.get('rating'));
    if (fd.get('price')) params.set('price', fd.get('price'));
    if (fd.get('open')) params.set('open', '1');
    if (fd.get('delivery')) params.set('delivery', '1');
    navigate(`/discover?${params.toString()}`);
  });

  document.querySelectorAll('[data-action="open-search"]').forEach((el) => {
    el.addEventListener('click', () => navigate('/search'));
  });
  document.querySelectorAll('[data-action="pick-location"]').forEach((el) => {
    el.addEventListener('click', () => openLocationPicker());
  });
  document.querySelectorAll('[data-nav-back]').forEach((el) => {
    el.addEventListener('click', () => {
      const href = el.getAttribute('data-nav-back') || '#/';
      navigate(href.startsWith('#') ? href.slice(1) : href);
    });
  });

  const exploreForm = document.getElementById('explore-search-form');
  exploreForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = document.getElementById('explore-q')?.value?.trim() || '';
    if (q) addRecentSearch(q);
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    if (q) params.set('q', q);
    else params.delete('q');
    navigate(`/search?${params.toString()}`);
  });

  function openLocationPicker() {
    const sel = document.getElementById('location-select');
    if (!sel) return;
    openModal(`
      <h2 class="modal-sheet-title">Choose area</h2>
      <p class="modal-sheet-sub mut sm">Street food picks update for your neighbourhood.</p>
      <div class="modal-sheet-scroll-list">
        ${LOCATIONS.map(
          (l) =>
            `<button type="button" class="btn btn-ghost btn-block modal-loc-row" data-pick-loc="${l.id}">${l.name}</button>`
        ).join('')}
      </div>
    `);
    document.querySelectorAll('[data-pick-loc]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setLocation(btn.getAttribute('data-pick-loc'));
        closeModal();
        showToast(`Showing food near ${LOCATIONS.find((l) => l.id === btn.getAttribute('data-pick-loc'))?.name}`, 'info');
        navigate(location.hash.slice(1) || '/', true);
      });
    });
  }

  document.querySelectorAll('[data-nav-stall-add]').forEach((el) => {
    el.addEventListener('click', () => navigate('/add-stall'));
  });
  document.querySelectorAll('[data-nav-vendor-add]').forEach((el) => {
    el.addEventListener('click', () => navigate('/add-stall'));
  });
  document.querySelectorAll('[data-search-quick]').forEach((el) => {
    el.addEventListener('click', () => {
      const k = el.getAttribute('data-search-quick');
      const map = {
        nearest: '/discover?sort=distance',
        rating: '/discover?rating=4.5',
        open: '/discover?open=1',
        gem: '/discover?q=hidden',
      };
      navigate(map[k] || '/discover');
    });
  });

  document.querySelectorAll('[data-qty-plus]').forEach((el) => {
    el.addEventListener('click', () => {
      updateCartQty(el.getAttribute('data-qty-plus'), 1);
      navigate('/cart', true);
    });
  });
  document.querySelectorAll('[data-qty-minus]').forEach((el) => {
    el.addEventListener('click', () => {
      updateCartQty(el.getAttribute('data-qty-minus'), -1);
      navigate('/cart', true);
    });
  });
  document.querySelectorAll('[data-remove-cart]').forEach((el) => {
    el.addEventListener('click', () => {
      removeCartItem(el.getAttribute('data-remove-cart'));
      navigate('/cart', true);
    });
  });

  document.getElementById('apply-coupon-btn')?.addEventListener('click', () => {
    const code = document.getElementById('coupon-input')?.value?.trim();
    setCartCoupon(code || null);
    showToast(code ? 'Coupon applied' : 'Coupon removed', 'success');
    navigate('/cart', true);
  });
  document.getElementById('cart-instructions')?.addEventListener('change', (e) => {
    setCartInstructions(e.target.value);
  });

  document.querySelectorAll('input[name="addr"]').forEach((el) => {
    el.addEventListener('change', () => {
      const st = getState();
      st.selectedAddressId = el.value;
      save('selectedAddressId', el.value);
      navigate('/checkout', true);
    });
  });

  document.getElementById('pay-now-btn')?.addEventListener('click', () => {
    const vendor = getVendor(getState().cart.vendorId);
    const pay = document.querySelector('input[name="pay"]:checked')?.value || 'upi';
    loadingOverlay(true, 'Processing payment...');
    setTimeout(() => {
      loadingOverlay(false);
      const order = placeOrder({ vendor, paymentMethod: pay });
      navigate(`/confirm/${order.id}`);
      showToast('Payment successful', 'success');
      renderShellFixed();
    }, 1500);
  });

  document.querySelectorAll('[data-advance-order]').forEach((el) => {
    el.addEventListener('click', () => {
      advanceOrderStatus(el.getAttribute('data-advance-order'));
      navigate(location.hash.slice(1), true);
      showToast('Order status updated', 'info');
    });
  });
  document.querySelectorAll('[data-cancel-order]').forEach((el) => {
    el.addEventListener('click', () => {
      if (cancelOrder(el.getAttribute('data-cancel-order'))) {
        showToast('Order cancelled', 'warn');
        navigate('/orders');
      }
    });
  });
  document.querySelectorAll('[data-call-phone]').forEach((el) => {
    el.addEventListener('click', () => {
      const phone = el.getAttribute('data-call-phone');
      window.location.href = `tel:${phone.replace(/\s/g, '')}`;
    });
  });

  document.querySelectorAll('[data-v-accept]').forEach((el) => {
    el.addEventListener('click', () => {
      vendorAcceptOrder(el.getAttribute('data-v-accept'), 15);
      showToast('Order accepted', 'success');
      navigate('/vendor-dashboard', true);
    });
  });
  document.querySelectorAll('[data-v-reject]').forEach((el) => {
    el.addEventListener('click', () => {
      vendorRejectOrder(el.getAttribute('data-v-reject'));
      showToast('Order rejected', 'warn');
      navigate('/vendor-dashboard', true);
    });
  });
  document.querySelectorAll('[data-v-status]').forEach((el) => {
    el.addEventListener('click', () => {
      const [id, status] = el.getAttribute('data-v-status').split(':');
      vendorSetStatus(id, status);
      showToast('Kitchen updated', 'success');
      navigate('/vendor-dashboard', true);
    });
  });

  document.querySelectorAll('[data-nav-mode]').forEach((el) => {
    el.addEventListener('click', () => {
      const mode = el.getAttribute('data-nav-mode');
      setMode(mode);
      navigate(mode === 'vendor' ? '/vendor-dashboard' : '/');
    });
  });

  document.querySelectorAll('[data-modal-close]').forEach((el) => el.addEventListener('click', closeModal));

  // Add food wizard
  bindCommunityEvents();
  if (path.includes('add-stall') || path.includes('vendor-add-food')) initStallWizard();
  if (path.includes('vendor-menu-ocr')) initOcr();
  if (/^\/vendor\/[^/]+/.test(path)) initVendorMenuNav();
}

const OCR_ITEMS = [
  { name: 'Pyaaz Kachori', price: 30, cat: 'pyaaz-kachori' },
  { name: 'Dal Kachori', price: 25, cat: 'kachori' },
  { name: 'Samosa', price: 20, cat: 'samosa' },
  { name: 'Chai', price: 15, cat: 'kulhad-chai' },
  { name: 'Lassi', price: 50, cat: 'lassi' },
];

function renderOcrTable() {
  const tbody = document.querySelector('#ocr-table tbody');
  if (!tbody) return;
  tbody.innerHTML = OCR_ITEMS.map(
    (item, i) => `
      <tr data-ocr-i="${i}">
        <td><input value="${item.name}" data-field="name" /></td>
        <td><input value="${item.price}" data-field="price" type="number" /></td>
        <td><select data-field="cat">${CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === item.cat ? 'selected' : ''}>${c.name}</option>`).join('')}</select></td>
        <td><button type="button" class="link danger" data-ocr-del="${i}">Delete</button></td>
      </tr>`
  ).join('');
  tbody.querySelectorAll('[data-ocr-del]').forEach((b) => {
    b.addEventListener('click', () => {
      OCR_ITEMS.splice(+b.getAttribute('data-ocr-del'), 1);
      renderOcrTable();
    });
  });
}

function runOcrSimulation() {
  const states = document.getElementById('ocr-states');
  const results = document.getElementById('ocr-results');
  states?.classList.remove('hidden');
  results?.classList.add('hidden');
  const steps = states?.querySelectorAll('.ocr-step') || [];
  let i = 0;
  const tick = () => {
    steps.forEach((s, idx) => s.classList.toggle('active', idx === i));
    i++;
    if (i <= steps.length) setTimeout(tick, 900);
    else {
      states?.classList.add('hidden');
      results?.classList.remove('hidden');
      renderOcrTable();
    }
  };
  tick();
}

function initOcr() {
  const zone = document.getElementById('menu-upload-zone');
  const input = document.getElementById('menu-files');
  const btn = document.getElementById('menu-upload-btn');
  btn?.addEventListener('click', () => input?.click());
  zone?.addEventListener('click', (e) => {
    if (e.target === zone || e.target.tagName === 'P') input?.click();
  });
  input?.addEventListener('change', runOcrSimulation);

  document.getElementById('ocr-add-row')?.addEventListener('click', () => {
    OCR_ITEMS.push({ name: 'New item', price: 40, cat: 'chaat' });
    renderOcrTable();
  });
  document.getElementById('ocr-publish')?.addEventListener('click', () => {
    showToast('Menu published successfully', 'success');
    navigate('/vendor-dashboard');
  });
  document.getElementById('ocr-review')?.addEventListener('click', () => showToast('Review complete — ready to publish', 'info'));
}

function repairBrokenImages() {
  document.querySelectorAll('img.street-food-photo').forEach((img) => {
    if (!img.getAttribute('src')) return;
    const broken = img.complete && img.naturalWidth === 0;
    if (broken) img.dispatchEvent(new Event('error', { bubbles: true }));
  });
}

function initVendorMenuNav() {
  const main = document.getElementById('app-main');
  const scrollTo = (sel) => {
    const el = document.querySelector(sel);
    if (!el || !main) return;
    const top = el.offsetTop - 108;
    main.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  };

  document.querySelectorAll('[data-scroll-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-scroll-target');
      if (!target) return;
      scrollTo(target);
      if (btn.classList.contains('vendor-tab')) {
        document.querySelectorAll('.vendor-tab').forEach((t) => t.classList.remove('on'));
        btn.classList.add('on');
      }
      if (btn.classList.contains('menu-cat-chip')) {
        document.querySelectorAll('.menu-cat-chip').forEach((c) => c.classList.remove('on'));
        btn.classList.add('on');
      }
    });
  });

  const menu = document.getElementById('vendor-menu');
  const reviews = document.getElementById('vendor-reviews');
  if (!main || !menu) return;

  const onScroll = () => {
    const y = main.scrollTop;
    if (reviews && y >= reviews.offsetTop - 140) {
      document.querySelectorAll('.vendor-tab').forEach((t) => {
        t.classList.toggle('on', t.getAttribute('data-scroll-target') === '#vendor-reviews');
      });
    } else {
      document.querySelectorAll('.vendor-tab').forEach((t) => {
        t.classList.toggle('on', t.getAttribute('data-scroll-target') === '#vendor-menu');
      });
    }
    document.querySelectorAll('.menu-section').forEach((sec) => {
      const id = sec.id;
      if (y >= sec.offsetTop - 130) {
        document.querySelectorAll('.menu-cat-chip').forEach((c) => {
          c.classList.toggle('on', c.getAttribute('data-scroll-target') === `#${id}`);
        });
      }
    });
  };
  if (main._vendorScrollFn) main.removeEventListener('scroll', main._vendorScrollFn);
  main._vendorScrollFn = onScroll;
  main.addEventListener('scroll', main._vendorScrollFn, { passive: true });
}

function wireListingCovers(root = document) {
  root.querySelectorAll('.cv .cover-img').forEach((img) => {
    const cv = img.closest('.cv');
    if (!cv || cv.dataset.coverWired) return;
    cv.dataset.coverWired = '1';
    const loaded = () => {
      cv.classList.add('is-loaded');
      cv.classList.remove('no-cover-img');
    };
    if (img.complete && img.naturalWidth > 0) loaded();
    else {
      img.addEventListener('load', loaded, { once: true });
      setTimeout(() => {
        if (img.complete && img.naturalWidth > 0) loaded();
        else if (img.complete && img.naturalWidth === 0) cv.classList.add('no-cover-img');
      }, 120);
      img.addEventListener(
        'error',
        () => {
          if (!cv.classList.contains('is-loaded')) cv.classList.add('no-cover-img');
        },
        { once: true }
      );
    }
  });
}

function bindImageFallbacks() {
  document.addEventListener(
    'error',
    (e) => {
      const el = e.target;
      if (el?.tagName !== 'IMG' || !el.classList?.contains('street-food-photo')) return;
      const coverCv = el.closest('.cv');
      const altSrc = el.dataset.fallbackSrc;
      if (el.classList.contains('cover-img') && altSrc && el.dataset.coverRetry !== '2') {
        const step = el.dataset.coverRetry === '1' ? '2' : '1';
        el.dataset.coverRetry = step;
        el.src = step === '1' ? altSrc : IMAGE_FALLBACK;
        return;
      }
      if (el.dataset.fallback === '1') {
        el.classList.add('img-broken');
        el.closest('.cat i')?.classList.add('has-fallback');
        coverCv?.classList.add('no-cover-img');
        el.closest('.food-thumb-wrap')?.classList.add('show-ph');
        el.closest('.vendor-cover-wrap')?.classList.add('show-ph');
        el.closest('.modal-food-hero')?.classList.add('show-ph');
        el.style.display = 'none';
        return;
      }
      el.dataset.fallback = '1';
      if (el.src !== IMAGE_FALLBACK) el.src = IMAGE_FALLBACK;
    },
    true
  );
}

document.addEventListener('DOMContentLoaded', () => {
  bindImageFallbacks();
  bindModalClose();
  subscribe(() => renderShellFixed());
  renderShellFixed();

  document.getElementById('location-select')?.addEventListener('change', (e) => {
    setLocation(e.target.value);
    showToast(`Showing food near ${LOCATIONS.find((l) => l.id === e.target.value)?.name}`, 'info');
    navigate(location.hash.slice(1) || '/', true);
  });

  document.querySelectorAll('.bottom-nav a[href^="#"]').forEach((el) => {
    el.addEventListener('click', (e) => {
      const href = el.getAttribute('href')?.slice(1);
      if (href) {
        e.preventDefault();
        navigate(href);
      }
    });
  });

  document.getElementById('sticky-cart-btn')?.addEventListener('click', () => navigate('/cart'));

  document.addEventListener('page:mounted', (e) => {
    bindPageEvents(e.detail);
    repairBrokenImages();
    wireListingCovers();
    if (e.detail.path.startsWith('/vendor/') && e.detail.parts[1]) {
      addRecentlyViewed(e.detail.parts[1]);
    }
    renderShellFixed();
    const st = getState();
    if (st.mode === 'vendor' && !e.detail.path.includes('vendor') && e.detail.path !== '/vendor-dashboard') {
      // allow browsing
    }
  });

  initRouter();

  if (getState().mode === 'vendor' && (!location.hash || location.hash === '#/')) {
    navigate('/vendor-dashboard', true);
  }
});
