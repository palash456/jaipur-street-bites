let toastTimer;

export function showToast(message, type = 'info') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.className = `toast visible ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('visible');
    el.textContent = '';
  }, 3200);
}

function isFoodModal(html, className) {
  const cls = className || '';
  return cls.includes('modal-food-sheet') || /class=["']modal-food["']/.test(html);
}

function hasSheetRoot(html) {
  const start = html.trim().slice(0, 160);
  return /class=["']modal-sheet["']/.test(start);
}

/** Normalize every modal to sheet or food layout (padding, scroll, safe area). */
export function openModal(html, { className = '', onClose } = {}) {
  const backdrop = document.getElementById('modal-backdrop');
  const modal = document.getElementById('modal-root');
  if (!backdrop || !modal) return;

  let body = html.trim();
  let cls = (className || '').trim();

  if (isFoodModal(body, cls)) {
    if (!cls.includes('modal-food-sheet')) cls = `modal-food-sheet ${cls}`.trim();
  } else {
    if (!hasSheetRoot(body)) {
      body = `<div class="modal-sheet">${body}</div>`;
    }
    if (!cls.includes('modal-sheet-wrap')) cls = `modal-sheet-wrap ${cls}`.trim();
  }

  modal.innerHTML = body;
  modal.className = `modal ${cls}`.trim();
  backdrop.classList.add('open');
  backdrop.dataset.onClose = onClose ? '1' : '';
  backdrop._onClose = onClose;
}

export function closeModal() {
  const backdrop = document.getElementById('modal-backdrop');
  const modal = document.getElementById('modal-root');
  if (backdrop?._onClose) backdrop._onClose();
  backdrop?.classList.remove('open');
  if (modal) modal.innerHTML = '';
}

export function bindModalClose() {
  document.getElementById('modal-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-backdrop') closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

export function skeletonCards(n = 4) {
  return Array.from({ length: n })
    .map(
      () => `
    <div class="skeleton-card">
      <div class="sk-img"></div>
      <div class="sk-line w80"></div>
      <div class="sk-line w60"></div>
    </div>`
    )
    .join('');
}

export function loadingOverlay(show, text = 'Loading...') {
  const el = document.getElementById('loading-overlay');
  if (!el) return;
  el.classList.toggle('open', show);
  const t = el.querySelector('.loading-text');
  if (t) t.textContent = text;
}
