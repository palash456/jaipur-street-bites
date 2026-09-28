import { formatINR, formatRelativeDate, starsHtml } from '../utils/format.js';
import { getState } from '../state/store.js';
import { icon } from '../utils/icons.js';
import {
  categoryAccent,
  emojiForCategory,
  emojiForVendor,
  foodImageForCategory,
  resolveFoodImage,
  listingCoverForVendor,
  listingCoverFallback,
  LISTING_IMG_ATTRS,
  IMG_ATTRS,
} from '../utils/images.js';

const VENDOR_GRADIENTS = [
  ['#E8A317', '#C2560B'],
  ['#F06292', '#AD1457'],
  ['#43A047', '#F9A825'],
  ['#26A69A', '#00695C'],
  ['#8D6E63', '#4E342E'],
  ['#7CB342', '#33691E'],
  ['#EF5350', '#B71C1C'],
  ['#FB8C00', '#E65100'],
];

function vendorTag(v) {
  if (v.hiddenGem) return "Hidden gem";
  if (v.topRated) return "Locals' pick";
  if (v.trending) return 'Trending';
  return '';
}

function gradientFor(v) {
  const i = parseInt(String(v.id).replace(/\D/g, ''), 10) || 0;
  const g = VENDOR_GRADIENTS[i % VENDOR_GRADIENTS.length];
  return `linear-gradient(135deg,${g[0]},${g[1]})`;
}

function coverBlock(v, height, { tag, foot } = {}) {
  const fav = getState().favorites.vendors.includes(v.id);
  const t = tag || vendorTag(v);
  const ph = emojiForVendor(v);
  const coverSrc = listingCoverForVendor(v);
  const coverFb = listingCoverFallback(v);
  const bg = gradientFor(v);
  return `
    <div class="cv" data-vendor-cover="${v.id}" style="height:${height}px;background:${bg};--cover-url:url('${coverSrc.replace(/'/g, '%27')}')">
      <span class="cover-ph" aria-hidden="true">${ph}</span>
      <img class="cover-img street-food-photo" src="${coverSrc}" data-fallback-src="${coverFb}" alt="" ${LISTING_IMG_ATTRS} />
      <div class="shade"></div>
      <button type="button" class="hbtn ${fav ? 'saved' : ''}" data-fav-vendor="${v.id}" aria-label="Save">${icon('heart', 18)}</button>
      ${t ? `<span class="ctag">${t}</span>` : ''}
      ${foot ? `<span class="cfoot">${foot}</span>` : ''}
    </div>`;
}

export function chatoreyBCard(v) {
  return `
  <article class="bcard" data-view-vendor="${v.id}" role="button" tabindex="0" aria-label="View ${v.name}">
    ${coverBlock(v, 140, { foot: `From ${formatINR(25 + (v.id.length % 5) * 8)}` })}
    <div class="lb" style="padding:10px 12px 12px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <b style="font-size:15px;line-height:1.2">${v.name}</b>
        <span class="rb">${v.rating.toFixed(1)}</span>
      </div>
      <div class="mut xs" style="margin-top:3px">${v.locationName} · ${v.distanceKm} km</div>
    </div>
  </article>`;
}

export function chatoreyLCard(v) {
  const dishes = (v.popularDishes || []).slice(0, 3).join(' · ');
  return `
  <article class="lcard" data-view-vendor="${v.id}" role="button" tabindex="0" aria-label="View ${v.name}">
    ${coverBlock(v, 164, { foot: `Items from ${formatINR(20 + (v.reviewCount % 30))}` })}
    <div class="lb">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <b class="nm">${v.name}</b>
        <span class="rb">${v.rating.toFixed(1)} ★</span>
      </div>
      <div class="mut sm" style="margin-top:2px">${dishes}</div>
      <div class="meta">
        <span>${v.distanceKm} km</span>
        <span>·</span>
        <span>${v.locationName}</span>
        <span>·</span>
        <span>${v.isOpen ? 'Open' : 'Closed'}</span>
      </div>
      <div class="meta" style="margin-top:4px">
        <span class="pill g">${Math.min(99, 88 + Math.floor(v.rating * 2))}% would reorder</span>
        <span>${v.reviewCount} reviews</span>
      </div>
    </div>
  </article>`;
}

export function chatoreyCategory(cat, { active } = {}) {
  const img = foodImageForCategory(cat.id);
  const bg = categoryAccent(cat.id);
  const emoji = cat.icon || '🍽️';
  const label = cat.shortName || cat.name.split(' ')[0];
  return `<button type="button" class="cat ${active ? 'on' : ''}" data-category="${cat.id}">
    <i style="background:${bg}">
      <img class="cat-photo street-food-photo" src="${img}" alt="" loading="lazy" decoding="async" />
      <span class="cat-emoji" aria-hidden="true">${emoji}</span>
    </i>
    <span>${label}</span>
  </button>`;
}

export function vendorCard(v, { compact } = {}) {
  const fav = getState().favorites.vendors.includes(v.id);
  const dishes = (v.popularDishes || []).slice(0, 2).join(', ');
  return `
  <article class="vendor-card ${compact ? 'compact' : ''}" data-vendor="${v.id}">
    <div class="vendor-card-media">
      <img class="street-food-photo" src="${v.coverImage}" alt="${v.name}" loading="lazy" />
      ${v.hiddenGem ? '<span class="badge badge-gem">Hidden gem</span>' : ''}
      ${v.trending ? '<span class="badge badge-trend">Trending</span>' : ''}
      <button type="button" class="fav-btn ${fav ? 'active' : ''}" data-fav-vendor="${v.id}" aria-label="Favorite">♥</button>
    </div>
    <div class="vendor-card-body">
      <div class="vendor-card-top">
        <h3>${v.name}</h3>
        <span class="status ${v.isOpen ? 'open' : 'closed'}">${v.isOpen ? 'Open now' : 'Closed'}</span>
      </div>
      <p class="cuisine">${v.cuisine}</p>
      <div class="meta-row">
        <span class="rating">${starsHtml(v.rating)} <strong>${v.rating.toFixed(1)}</strong> (${v.reviewCount})</span>
        <span class="dot">·</span>
        <span>${v.distanceKm} km</span>
        <span class="dot">·</span>
        <span>${v.priceLevel}</span>
      </div>
      <p class="popular-dishes">Popular: ${dishes}</p>
      <div class="tag-row">
        ${v.deliveryAvailable ? '<span class="tag">Delivery</span>' : '<span class="tag muted">Pickup only</span>'}
        ${v.callAndVerify ? '<span class="tag tag-call">Call & verify</span>' : ''}
        <span class="tag">${v.locationName}</span>
      </div>
      <div class="card-actions">
        <button type="button" class="btn btn-ghost btn-sm" data-call-vendor="${v.id}">Call vendor</button>
        <button type="button" class="btn btn-primary btn-sm" data-view-vendor="${v.id}">View menu</button>
      </div>
    </div>
  </article>`;
}

/** Swiggy / Zomato–style menu row for vendor public menu */
export function menuItemRow(food, vendorId) {
  const img = resolveFoodImage(food.name, food.categoryId, food.image);
  const ph = emojiForCategory(food.categoryId);
  const disabled = !food.available;
  return `
  <article class="menu-item" data-food="${food.id}">
    <div class="menu-item-info">
      <div class="menu-item-title-row">
        <span class="veg-indicator ${food.veg ? 'veg' : 'nonveg'}" title="${food.veg ? 'Veg' : 'Non-veg'}"></span>
        ${food.popular ? '<span class="badge-sm badge-popular">Bestseller</span>' : ''}
        ${!food.available ? '<span class="badge-sm unavailable">Sold out</span>' : ''}
      </div>
      <h4 class="menu-item-name">${food.name}</h4>
      <p class="mut sm menu-item-desc">${food.description}</p>
      <div class="menu-item-price">${formatINR(food.price)} <span class="mut xs">· ${food.portion}</span></div>
    </div>
    <div class="menu-item-media">
      <div class="menu-item-thumb">
        <span class="food-ph" aria-hidden="true">${ph}</span>
        <img class="street-food-photo" src="${img}" alt="" ${IMG_ATTRS} />
      </div>
      <button type="button" class="menu-add-btn" data-add-food="${food.id}" data-vendor="${vendorId}" ${disabled ? 'disabled' : ''}>
        ${disabled ? '—' : 'ADD'}
      </button>
    </div>
  </article>`;
}

export function reviewCard(review) {
  const initial = (review.userName || 'U').charAt(0).toUpperCase();
  return `
  <article class="review-card">
    <div class="review-card-head">
      <span class="review-av" aria-hidden="true">${initial}</span>
      <div class="review-card-meta">
        <b>${review.userName}</b>
        <span class="mut xs">${formatRelativeDate(review.date)}</span>
      </div>
      <span class="review-stars">${starsHtml(review.rating)}</span>
    </div>
    <p class="review-card-text">${review.text}</p>
  </article>`;
}

export function foodCard(food, vendorId) {
  const img = resolveFoodImage(food.name, food.categoryId, food.image);
  const ph = emojiForCategory(food.categoryId);
  return `
  <article class="food-card" data-food="${food.id}">
    <div class="food-thumb-wrap">
      <span class="food-ph" aria-hidden="true">${ph}</span>
      <img class="food-thumb street-food-photo" src="${img}" alt="${food.name}" ${IMG_ATTRS} />
    </div>
    <div class="food-card-body">
      <div class="food-title-row">
        <h4>${food.name}</h4>
        <span class="veg-indicator ${food.veg ? 'veg' : 'nonveg'}" title="${food.veg ? 'Veg' : 'Non-veg'}"></span>
      </div>
      <p class="food-desc">${food.description}</p>
      <div class="food-meta">
        <span class="price">${formatINR(food.price)}</span>
        <span class="portion">${food.portion}</span>
        ${food.popular ? '<span class="badge-sm badge-popular">Popular</span>' : ''}
        ${!food.available ? '<span class="badge-sm unavailable">Unavailable</span>' : ''}
      </div>
      <button type="button" class="btn btn-primary btn-block btn-sm" data-add-food="${food.id}" data-vendor="${vendorId}" ${!food.available ? 'disabled' : ''}>
        ${food.available ? 'Add' : 'Notify me'}
      </button>
    </div>
  </article>`;
}

export function categoryChip(cat) {
  return `<button type="button" class="category-chip" data-category="${cat.id}">
    <span class="cat-icon">${cat.icon}</span>
    <span>${cat.name}</span>
  </button>`;
}
