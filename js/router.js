const routes = {};
let current = '';

export function register(path, handler) {
  routes[path] = handler;
}

export function navigate(path, replace = false) {
  const hash = path.startsWith('#') ? path : `#${path}`;
  if (replace) history.replaceState(null, '', hash);
  else if (`#${current}` !== hash) history.pushState(null, '', hash);
  renderRoute();
}

function parseHash() {
  const h = location.hash.slice(1) || '/';
  const [path, query] = h.split('?');
  const params = new URLSearchParams(query || '');
  return { path: path || '/', params };
}

export function getParams() {
  return parseHash().params;
}

/** Keep `.app-top` in the fixed header slot so main scroll does not move it. */
function mountPageHeader(main) {
  const headerSlot = document.getElementById('app-header');
  if (!headerSlot) return;
  const headerEl = main.querySelector(':scope > .app-top');
  if (headerEl) {
    headerSlot.replaceChildren(headerEl);
  } else {
    headerSlot.replaceChildren();
  }
}

export function renderRoute() {
  const { path, params } = parseHash();
  current = path;
  const main = document.getElementById('app-main');
  if (!main) return;

  const parts = path.split('/').filter(Boolean);
  let handler = routes[path];
  if (!handler && parts[0]) {
    handler = routes[`/${parts[0]}`];
  }
  if (!handler) handler = routes['/'];

  document.querySelectorAll('[data-nav]').forEach((el) => {
    const nav = el.getAttribute('data-nav');
    const active =
      (nav === 'home' && (!parts[0] || parts[0] === '')) ||
      (nav === 'search' &&
        (parts[0] === 'search' || parts[0] === 'community' || parts[0] === 'discover')) ||
      (nav === 'orders' && parts[0] === 'orders') ||
      (nav === 'profile' && parts[0] === 'profile') ||
      (nav === 'add' && (parts[0] === 'add-stall' || parts[0] === 'vendor-add-food'));
    el.classList.toggle('active', active);
  });

  if (handler) {
    try {
      main.innerHTML = handler({ path, parts, params });
      mountPageHeader(main);
      main.scrollTop = 0;
      document.dispatchEvent(new CustomEvent('page:mounted', { detail: { path, parts, params } }));
    } catch (err) {
      console.error(err);
      main.innerHTML = `<div class="empty-state"><h3>Something went wrong</h3><p>${err.message}</p></div>`;
    }
  }
}

export function initRouter() {
  window.addEventListener('hashchange', renderRoute);
  window.addEventListener('popstate', renderRoute);
  renderRoute();
}

export function currentPath() {
  return current || '/';
}
