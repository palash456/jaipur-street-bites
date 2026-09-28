import { load, save } from '../utils/storage.js';
import { resolveFoodImage } from '../utils/images.js';
import { orderId } from '../utils/format.js';
import { HISTORICAL_ORDERS } from '../data/catalog.js';
import { SEED_POSTS } from '../data/community.js';
import { SEED_COMMENTS, enrichCommunityPost } from '../data/community-enrichment.js';

const ORDER_STEPS = [
  { key: 'placed', label: 'Order Placed', desc: 'Order received' },
  { key: 'vendor_confirmed', label: 'Vendor Confirmation', desc: 'Vendor received your order' },
  { key: 'preparing', label: 'Preparing', desc: 'Food is being prepared' },
  { key: 'ready', label: 'Ready for Pickup', desc: 'Food packed and ready' },
  { key: 'partner_assigned', label: 'Delivery Partner Assigned', desc: 'A delivery partner has been assigned' },
  { key: 'picked_up', label: 'Picked Up', desc: 'Delivery partner has collected your order' },
  { key: 'on_way', label: 'On the Way', desc: 'Your food is on its way' },
  { key: 'delivered', label: 'Delivered', desc: 'Order delivered successfully' },
];

const defaultUser = {
  name: 'Rahul Sharma',
  phone: '+91 98765 43210',
  email: 'rahul.sharma@email.com',
};

const defaultAddresses = [
  {
    id: 'addr-home',
    label: 'Home',
    line1: 'Flat 402, Sunrise Apartments',
    line2: 'Near Raja Park Main Road',
    city: 'Jaipur',
    pin: '302004',
  },
  {
    id: 'addr-work',
    label: 'Work',
    line1: '3rd Floor, C-Scheme Corporate Park',
    line2: 'MI Road Junction',
    city: 'Jaipur',
    pin: '302001',
  },
];

function initialState() {
  return {
    locationId: load('locationId', 'raja-park'),
    cart: load('cart', { vendorId: null, items: [], coupon: null, instructions: '' }),
    favorites: load('favorites', { vendors: [], foods: [] }),
    recentSearches: load('recentSearches', []),
    recentlyViewed: load('recentlyViewed', []),
    user: load('user', defaultUser),
    addresses: load('addresses', defaultAddresses),
    selectedAddressId: load('selectedAddressId', 'addr-home'),
    orders: load('orders', []),
    orderHistory: load('orderHistory', HISTORICAL_ORDERS),
    activeOrderId: load('activeOrderId', null),
    vendorOrders: load('vendorOrders', []),
    vendorMenuDrafts: load('vendorMenuDrafts', []),
    stallSubmissions: load('stallSubmissions', []),
    quickTasteStalls: load('quickTasteStalls', []),
    userInbox: load('userInbox', []),
    callVerify: load('callVerify', {}),
    mode: load('mode', 'customer'), // customer | vendor
    vendorAccountId: load('vendorAccountId', 'va-1'),
    paymentMethods: load('paymentMethods', [
      { id: 'upi', label: 'UPI', detail: 'rahul@paytm' },
      { id: 'card', label: 'Card', detail: '•••• 4242' },
    ]),
    notifications: load('notifications', { orderUpdates: true, offers: true }),
    communityPosts: load('communityPosts', []),
    communityVotes: load('communityVotes', {}),
    communityComments: load('communityComments', {}),
    communitySaved: load('communitySaved', []),
    communityStoriesSeen: load('communityStoriesSeen', []),
    communityReelLikes: load('communityReelLikes', {}),
  };
}

/** @typedef {{ id: string, type: string, topicId: string, locationId: string, title: string, body: string, author: string, authorBadge?: string, createdAt: string, upvotes: number, downvotes: number, answerCount?: number, vendorId?: string|null, rating?: number|null, pinned?: boolean, cuisineId?: string, tags?: string[], hasPhoto?: boolean, views?: number, photos?: string[], reviewMeta?: object|null }} CommunityPostSeed */
/** @typedef {{ id: string, author: string, body: string, createdAt: string, upvotes?: number, authorBadge?: string, photo?: string|null, rating?: number|null }} CommunityCommentSeed */

let state = initialState();
const listeners = new Set();

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function persist(keys) {
  keys.forEach((k) => save(k, state[k]));
}

function notify() {
  listeners.forEach((fn) => fn(state));
}

export function setLocation(locationId) {
  state.locationId = locationId;
  save('locationId', locationId);
  notify();
}

export function addRecentSearch(q) {
  const trimmed = q.trim();
  if (!trimmed) return;
  state.recentSearches = [trimmed, ...state.recentSearches.filter((s) => s !== trimmed)].slice(0, 8);
  save('recentSearches', state.recentSearches);
  notify();
}

export function addRecentlyViewed(vendorId) {
  state.recentlyViewed = [vendorId, ...state.recentlyViewed.filter((id) => id !== vendorId)].slice(0, 10);
  save('recentlyViewed', state.recentlyViewed);
  notify();
}

export function toggleFavoriteVendor(vendorId) {
  const set = new Set(state.favorites.vendors);
  if (set.has(vendorId)) set.delete(vendorId);
  else set.add(vendorId);
  state.favorites = { ...state.favorites, vendors: [...set] };
  save('favorites', state.favorites);
  notify();
}

export function toggleFavoriteFood(foodId) {
  const set = new Set(state.favorites.foods);
  if (set.has(foodId)) set.delete(foodId);
  else set.add(foodId);
  state.favorites = { ...state.favorites, foods: [...set] };
  save('favorites', state.favorites);
  notify();
}

export function clearCart() {
  state.cart = { vendorId: null, items: [], coupon: null, instructions: '' };
  save('cart', state.cart);
  notify();
}

export function addToCart(food, vendorId, custom = {}) {
  if (state.cart.vendorId && state.cart.vendorId !== vendorId && state.cart.items.length) {
    return { error: 'CART_VENDOR_MISMATCH' };
  }
  state.cart.vendorId = vendorId;
  const key = `${food.id}-${custom.optionId || 'std'}-${(custom.addonIds || []).join(',')}`;
  const existing = state.cart.items.find((i) => i.key === key);
  const option = food.options?.find((o) => o.id === custom.optionId) || food.options?.[0];
  const addons = (food.addons || []).filter((a) => (custom.addonIds || []).includes(a.id));
  const unitPrice = food.price + (option?.priceDelta || 0) + addons.reduce((s, a) => s + a.price, 0);
  if (existing) {
    existing.qty += custom.qty || 1;
  } else {
    state.cart.items.push({
      key,
      foodId: food.id,
      name: food.name,
      categoryId: food.categoryId,
      image: resolveFoodImage(food.name, food.categoryId, food.image),
      veg: food.veg,
      qty: custom.qty || 1,
      unitPrice,
      optionLabel: option?.label || 'Standard',
      addonLabels: addons.map((a) => a.label),
      spice: custom.spice || food.spiceLevels?.[1] || 'Medium',
    });
  }
  save('cart', state.cart);
  notify();
  return { ok: true };
}

export function updateCartQty(key, delta) {
  const item = state.cart.items.find((i) => i.key === key);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    state.cart.items = state.cart.items.filter((i) => i.key !== key);
    if (!state.cart.items.length) state.cart.vendorId = null;
  }
  save('cart', state.cart);
  notify();
}

export function removeCartItem(key) {
  state.cart.items = state.cart.items.filter((i) => i.key !== key);
  if (!state.cart.items.length) state.cart.vendorId = null;
  save('cart', state.cart);
  notify();
}

export function setCartCoupon(code) {
  state.cart.coupon = code;
  save('cart', state.cart);
  notify();
}

export function setCartInstructions(text) {
  state.cart.instructions = text;
  save('cart', state.cart);
  notify();
}

export function cartTotals() {
  const subtotal = state.cart.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const packaging = subtotal > 0 ? 20 : 0;
  const delivery = subtotal > 0 ? 45 : 0;
  const platform = subtotal > 0 ? 10 : 0;
  let discount = 0;
  const code = state.cart.coupon;
  if (code === 'JAIPUR30' && subtotal >= 199) discount = 30;
  if (code === 'THALI15' && subtotal >= 250) discount = Math.round(subtotal * 0.15);
  if (code === 'CHAIFREE') discount = Math.min(20, discount + 0);
  const tax = subtotal > 0 ? Math.round(subtotal * 0.05) : 0;
  const total = Math.max(0, subtotal + packaging + delivery + platform + tax - discount);
  return { subtotal, packaging, delivery, platform, discount, tax, total };
}

export function setCallVerify(vendorId, status) {
  state.callVerify = { ...state.callVerify, [vendorId]: status };
  save('callVerify', state.callVerify);
  notify();
}

export function getCallVerify(vendorId) {
  return state.callVerify[vendorId];
}

export function placeOrder({ vendor, paymentMethod, deliveryPartner }) {
  const totals = cartTotals();
  const addr = state.addresses.find((a) => a.id === state.selectedAddressId);
  const order = {
    id: `ord-${Date.now()}`,
    orderNumber: orderId(),
    vendorId: vendor.id,
    vendorName: vendor.name,
    vendorPhone: vendor.phone,
    items: state.cart.items.map((i) => ({ ...i })),
    totals,
    paymentMethod,
    deliveryPartner: deliveryPartner || { name: 'Local Parcel Partner', phone: '+91 99887 76655' },
    address: addr,
    instructions: state.cart.instructions,
    status: 'placed',
    statusIndex: 0,
    createdAt: new Date().toISOString(),
    etaMinutes: 35 + Math.floor(Math.random() * 15),
    timeline: ORDER_STEPS.map((s, i) => ({
      ...s,
      done: i === 0,
      at: i === 0 ? new Date().toISOString() : null,
    })),
  };
  state.orders.unshift(order);
  state.activeOrderId = order.id;
  state.orderHistory.unshift({
    id: order.id,
    orderNumber: order.orderNumber,
    vendorId: vendor.id,
    vendorName: vendor.name,
    items: order.items.map((i) => ({
      foodId: i.foodId,
      name: i.name,
      price: i.unitPrice,
      qty: i.qty,
      customizations: { option: i.optionLabel, addons: i.addonLabels },
    })),
    subtotal: totals.subtotal,
    total: totals.total,
    status: 'placed',
    createdAt: order.createdAt,
    addressLabel: addr?.label || 'Home',
    rated: false,
  });
  const vo = {
    id: order.id,
    orderNumber: order.orderNumber,
    vendorId: vendor.id,
    customerName: state.user.name.split(' ')[0],
    items: order.items,
    total: totals.total,
    status: 'pending',
    prepMinutes: 15,
    createdAt: order.createdAt,
  };
  state.vendorOrders.unshift(vo);
  clearCart();
  save('orders', state.orders);
  save('activeOrderId', state.activeOrderId);
  save('orderHistory', state.orderHistory);
  save('vendorOrders', state.vendorOrders);
  notify();
  return order;
}

export function advanceOrderStatus(orderId) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order || order.status === 'delivered' || order.status === 'cancelled') return;
  const next = order.statusIndex + 1;
  if (next >= ORDER_STEPS.length) return;
  order.statusIndex = next;
  order.status = ORDER_STEPS[next].key;
  order.timeline = order.timeline.map((t, i) => ({
    ...t,
    done: i <= next,
    at: i === next ? new Date().toISOString() : t.at,
  }));
  const vo = state.vendorOrders.find((v) => v.id === orderId);
  if (vo) {
    if (order.status === 'vendor_confirmed') vo.status = 'accepted';
    if (order.status === 'preparing') vo.status = 'preparing';
    if (order.status === 'ready') vo.status = 'ready';
    if (order.status === 'delivered') vo.status = 'completed';
  }
  const hist = state.orderHistory.find((h) => h.id === orderId);
  if (hist && order.status === 'delivered') hist.status = 'delivered';
  save('orders', state.orders);
  save('vendorOrders', state.vendorOrders);
  save('orderHistory', state.orderHistory);
  notify();
}

export function cancelOrder(orderId) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order || order.statusIndex > 2) return false;
  order.status = 'cancelled';
  const vo = state.vendorOrders.find((v) => v.id === orderId);
  if (vo) vo.status = 'rejected';
  const hist = state.orderHistory.find((h) => h.id === orderId);
  if (hist) hist.status = 'cancelled';
  if (state.activeOrderId === orderId) state.activeOrderId = null;
  save('orders', state.orders);
  save('vendorOrders', state.vendorOrders);
  save('orderHistory', state.orderHistory);
  save('activeOrderId', state.activeOrderId);
  notify();
  return true;
}

export function vendorAcceptOrder(orderId, prepMinutes) {
  const vo = state.vendorOrders.find((v) => v.id === orderId);
  if (!vo) return;
  vo.status = 'accepted';
  vo.prepMinutes = prepMinutes || 15;
  const order = state.orders.find((o) => o.id === orderId);
  if (order) {
    order.statusIndex = 1;
    order.status = 'vendor_confirmed';
    order.timeline[1].done = true;
    order.timeline[1].at = new Date().toISOString();
  }
  save('vendorOrders', state.vendorOrders);
  save('orders', state.orders);
  notify();
}

export function vendorRejectOrder(orderId) {
  const vo = state.vendorOrders.find((v) => v.id === orderId);
  if (vo) vo.status = 'rejected';
  const order = state.orders.find((o) => o.id === orderId);
  if (order) order.status = 'cancelled';
  save('vendorOrders', state.vendorOrders);
  save('orders', state.orders);
  notify();
}

export function vendorSetStatus(orderId, status) {
  const vo = state.vendorOrders.find((v) => v.id === orderId);
  if (!vo) return;
  vo.status = status;
  const order = state.orders.find((o) => o.id === orderId);
  const map = {
    preparing: 2,
    ready: 3,
    handed: 4,
    completed: 7,
  };
  if (order && map[status] != null) {
    order.statusIndex = map[status];
    order.status = ['preparing', 'ready', 'partner_assigned', 'delivered'][status === 'handed' ? 3 : status === 'completed' ? 3 : map[status] - 2] || order.status;
    if (status === 'preparing') order.status = 'preparing';
    if (status === 'ready') order.status = 'ready';
    if (status === 'handed') {
      order.statusIndex = 4;
      order.status = 'partner_assigned';
    }
    if (status === 'completed') {
      order.statusIndex = 7;
      order.status = 'delivered';
    }
    order.timeline = order.timeline.map((t, i) => ({
      ...t,
      done: i <= order.statusIndex,
      at: i === order.statusIndex ? new Date().toISOString() : t.at,
    }));
  }
  save('vendorOrders', state.vendorOrders);
  save('orders', state.orders);
  notify();
}

export function publishFoodDraft(draft) {
  state.vendorMenuDrafts.push({ ...draft, id: `draft-${Date.now()}`, publishedAt: new Date().toISOString() });
  save('vendorMenuDrafts', state.vendorMenuDrafts);
  notify();
}

function formatReviewDeadline(iso) {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'within 72 hours';
  }
}

export function addQuickTasteStall(name) {
  const trimmed = name.trim();
  if (!trimmed) return;
  if (state.quickTasteStalls.includes(trimmed)) return;
  state.quickTasteStalls = [trimmed, ...state.quickTasteStalls].slice(0, 40);
  save('quickTasteStalls', state.quickTasteStalls);
  notify();
}

export function submitStallForReview(draft) {
  const now = Date.now();
  const reviewBy = new Date(now + 72 * 60 * 60 * 1000).toISOString();
  const submission = {
    id: `stall-sub-${now}`,
    ...draft,
    status: 'pending',
    submittedAt: new Date(now).toISOString(),
    reviewBy,
    reviewByLabel: formatReviewDeadline(reviewBy),
  };
  state.stallSubmissions.unshift(submission);
  const note = {
    id: `inbox-${now}`,
    type: 'stall_submitted',
    title: 'Stall submitted for review',
    body: `“${draft.name}” is with our team. We’ll notify you within 72 hours (by ${submission.reviewByLabel}).`,
    at: submission.submittedAt,
    read: false,
    submissionId: submission.id,
  };
  state.userInbox.unshift(note);
  save('stallSubmissions', state.stallSubmissions);
  save('userInbox', state.userInbox);
  notify();
  return submission;
}

export function setMode(mode) {
  state.mode = mode;
  save('mode', mode);
  notify();
}

export function setVendorAccount(id) {
  state.vendorAccountId = id;
  save('vendorAccountId', id);
  notify();
}

export function getAllCommunityPosts() {
  return [...state.communityPosts.map((p) => enrichCommunityPost({ ...p, views: p.views ?? 0, photos: p.photos || [] })), ...SEED_POSTS.map(enrichCommunityPost)].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getCommunityPost(id) {
  return getAllCommunityPosts().find((p) => p.id === id) || null;
}

function voteAdjustments(postId) {
  const vote = state.communityVotes[postId];
  if (vote === 'up') return { up: 1, down: 0 };
  if (vote === 'down') return { up: 0, down: 1 };
  return { up: 0, down: 0 };
}

export function getPostScore(postId, post) {
  const adj = voteAdjustments(postId);
  return (post.upvotes || 0) + adj.up - (post.downvotes || 0) - adj.down;
}

export function getCommentsForPost(postId) {
  const seed = SEED_COMMENTS[postId] || [];
  const user = state.communityComments[postId] || [];
  return [...user, ...seed].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function isPostSaved(postId) {
  return state.communitySaved.includes(postId);
}

export function getReelLikeCount(reelId, baseLikes) {
  const liked = state.communityReelLikes[reelId];
  return baseLikes + (liked ? 1 : 0);
}

export function isReelLiked(reelId) {
  return !!state.communityReelLikes[reelId];
}

export function voteCommunityPost(postId, direction) {
  const prev = state.communityVotes[postId];
  if (direction === 'up') {
    if (prev === 'up') delete state.communityVotes[postId];
    else state.communityVotes[postId] = 'up';
  } else if (direction === 'down') {
    if (prev === 'down') delete state.communityVotes[postId];
    else state.communityVotes[postId] = 'down';
  }
  save('communityVotes', state.communityVotes);
  notify();
}

export function toggleSaveCommunityPost(postId) {
  const set = new Set(state.communitySaved);
  if (set.has(postId)) set.delete(postId);
  else set.add(postId);
  state.communitySaved = [...set];
  save('communitySaved', state.communitySaved);
  notify();
}

export function addCommunityComment(postId, body) {
  const trimmed = body.trim();
  if (!trimmed) return null;
  const comment = {
    id: `uc-${Date.now()}`,
    author: state.user.name.split(' ')[0] || 'You',
    body: trimmed,
    createdAt: new Date().toISOString(),
    upvotes: 0,
  };
  const list = state.communityComments[postId] || [];
  state.communityComments = { ...state.communityComments, [postId]: [comment, ...list] };
  save('communityComments', state.communityComments);
  notify();
  return comment;
}

export function createCommunityPost({ type, title, body, topicId, locationId, vendorId, rating }) {
  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();
  if (!trimmedTitle || !trimmedBody) return null;
  const post = {
    id: `post-user-${Date.now()}`,
    type: type || 'discussion',
    topicId: topicId || 'all',
    locationId: locationId || state.locationId,
    title: trimmedTitle,
    body: trimmedBody,
    author: state.user.name,
    authorBadge: 'You',
    createdAt: new Date().toISOString(),
    upvotes: 1,
    downvotes: 0,
    answerCount: 0,
    vendorId: vendorId || null,
    rating: rating ? parseFloat(rating) : null,
    hasPhoto: false,
    views: 1,
    photos: [],
    tags: [],
  };
  state.communityPosts.unshift(post);
  state.communityVotes[post.id] = 'up';
  save('communityPosts', state.communityPosts);
  save('communityVotes', state.communityVotes);
  notify();
  return post;
}

export function markStorySeen(storyId) {
  if (state.communityStoriesSeen.includes(storyId)) return;
  state.communityStoriesSeen = [...state.communityStoriesSeen, storyId];
  save('communityStoriesSeen', state.communityStoriesSeen);
  notify();
}

export function toggleReelLike(reelId) {
  const next = { ...state.communityReelLikes };
  if (next[reelId]) delete next[reelId];
  else next[reelId] = true;
  state.communityReelLikes = next;
  save('communityReelLikes', state.communityReelLikes);
  notify();
}

export { ORDER_STEPS };
