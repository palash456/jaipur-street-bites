import { getState } from '../state/store.js';
import { getPostScore, getCommentsForPost, isPostSaved, getReelLikeCount } from '../state/store.js';
import { COMMUNITY_TOPICS } from '../data/community.js';
import { LOCATIONS } from '../data/catalog.js';
import { starsHtml } from '../utils/format.js';
import { IMG_ATTRS } from '../utils/images.js';

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function timeAgo(iso) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins || 1}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 48) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch {
    return 'recently';
  }
}

function locLabel(locationId) {
  return LOCATIONS.find((l) => l.id === locationId)?.name || 'Jaipur';
}

export function storyRing(story, { seen = false } = {}) {
  return `
  <button type="button" class="story-ring ${seen ? 'seen' : ''}" data-open-story="${story.id}" aria-label="Story by ${escapeHtml(story.user)}">
    <span class="story-ring-inner">
      <img src="${story.slides[0].image}" alt="" class="story-ring-img street-food-photo" ${IMG_ATTRS} />
    </span>
    <span class="story-ring-name">${escapeHtml(story.user.split(' ')[0])}</span>
  </button>`;
}

export function reelTile(reel, { compact = true } = {}) {
  const likes = getReelLikeCount(reel.id, reel.likes);
  return `
  <button type="button" class="reel-tile ${compact ? 'reel-tile--compact' : ''}" data-open-reel="${reel.id}">
    <img src="${reel.image}" alt="" class="reel-tile-img street-food-photo" ${IMG_ATTRS} />
    <span class="reel-tile-play" aria-hidden="true">▶</span>
    ${compact ? `<span class="reel-tile-likes mut xs">${likes.toLocaleString('en-IN')}</span>` : `<span class="reel-tile-meta">
      <b>${escapeHtml(reel.title)}</b>
      <span class="mut xs">${escapeHtml(reel.user)} · ${likes.toLocaleString('en-IN')} likes</span>
    </span>`}
  </button>`;
}

export function communityPostCard(post) {
  const st = getState();
  const score = getPostScore(post.id, post);
  const vote = st.communityVotes[post.id];
  const saved = isPostSaved(post.id);
  const comments = getCommentsForPost(post.id);
  const count = comments.length || post.answerCount || 0;
  const typeShort = post.type === 'question' ? 'Q' : post.type === 'review' ? 'Review' : 'Talk';
  const meta = `${typeShort} · ${locLabel(post.locationId)} · ${timeAgo(post.createdAt)}`;

  return `
  <article class="comm-post" data-post-id="${post.id}">
    <a href="#/community/post/${post.id}" class="comm-post-main">
      <p class="comm-post-meta mut xs">${escapeHtml(meta)}${post.pinned ? ' · <span class="comm-pin">Pinned</span>' : ''}</p>
      <h3>${escapeHtml(post.title)}</h3>
      ${post.rating ? `<div class="comm-post-rating">${starsHtml(post.rating)}</div>` : ''}
    </a>
    <div class="comm-post-foot">
      <div class="comm-vote" role="group" aria-label="Vote">
        <button type="button" class="comm-vote-btn ${vote === 'up' ? 'on' : ''}" data-vote-up="${post.id}" aria-label="Upvote">▲</button>
        <span class="comm-score" data-score-for="${post.id}">${score}</span>
        <button type="button" class="comm-vote-btn ${vote === 'down' ? 'on' : ''}" data-vote-down="${post.id}" aria-label="Downvote">▼</button>
      </div>
      <a href="#/community/post/${post.id}" class="comm-foot-link">${count} replies</a>
      <button type="button" class="comm-save ${saved ? 'on' : ''}" data-save-post="${post.id}" aria-label="Save">${saved ? '★' : '☆'}</button>
    </div>
  </article>`;
}

export function commentRow(c, postId) {
  return `
  <div class="comm-comment">
    <div class="comm-comment-head">
      <b>${escapeHtml(c.author)}</b>
      <span class="mut xs">${timeAgo(c.createdAt)}</span>
    </div>
    <p>${escapeHtml(c.body)}</p>
    <div class="comm-comment-actions">
      <span class="mut xs">▲ ${c.upvotes || 0}</span>
      <button type="button" class="btn-link btn-sm" data-reply-to="${postId}">Reply</button>
    </div>
  </div>`;
}

export function communityTopicChip(topic, { active = false } = {}) {
  const label = topic.id === 'all' ? 'All' : topic.name.replace(/ talk$/i, '');
  return `
  <button type="button" class="comm-topic ${active ? 'on' : ''}" data-community-topic="${topic.id}">${escapeHtml(label)}</button>`;
}
