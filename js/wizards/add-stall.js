import { VENDORS, CATEGORIES, LOCATIONS } from '../data/catalog.js';
import {
  getState,
  submitStallForReview,
  addQuickTasteStall,
} from '../state/store.js';
import { findStallDuplicates, STALL_DEDUP_SETTINGS } from '../utils/stall-dedup.js';
import {
  parseGoogleMapsInput,
  suggestLocationId,
  isNearJaipur,
  buildMapsSearchUrl,
} from '../utils/google-maps-link.js';
import { openModal, closeModal, showToast } from '../components/ui.js';
import { formatINR } from '../utils/format.js';

const HYGIENE_LEVELS = [
  { id: 'street-standard', label: 'Typical street stall', hint: 'Open counter, busy lane' },
  { id: 'clean-covered', label: 'Clean & covered', hint: 'Shelter, tidy workspace' },
  { id: 'gloves-cap', label: 'Gloves / cap visible', hint: 'Basic food-handling gear' },
  { id: 'premium', label: 'Premium hygiene', hint: 'Rare — spotless setup' },
];

const OCR_SEED = [
  { name: 'Pyaaz Kachori', price: 30, cat: 'pyaaz-kachori' },
  { name: 'Dal Kachori', price: 25, cat: 'kachori' },
  { name: 'Samosa', price: 20, cat: 'samosa' },
  { name: 'Kulhad Chai', price: 15, cat: 'kulhad-chai' },
  { name: 'Lassi', price: 50, cat: 'lassi' },
];

const TOTAL_STEPS = 5;
let stallDraft = createEmptyDraft();
let ocrMenuItems = [];

function createEmptyDraft() {
  return {
    name: '',
    categoryId: CATEGORIES[0]?.id || 'chaat',
    hygieneLevel: 'street-standard',
    description: '',
    tasteVendorIds: [],
    tasteQuickNames: [],
    locationId: getState().locationId || 'raja-park',
    address: '',
    landmark: '',
    lat: null,
    lng: null,
    googleMapsUrl: '',
    mapsPlaceName: '',
    coverPhoto: null,
    photos: [],
    menuItems: [],
    menuSource: 'manual',
    notDuplicateConfirmed: false,
  };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function showStep(n) {
  const stepNum = document.getElementById('add-stall-step-num');
  if (stepNum) stepNum.textContent = n;
  document.querySelectorAll('#add-stall-wizard .wizard-panel').forEach((p) => {
    p.classList.toggle('hidden', parseInt(p.getAttribute('data-panel'), 10) !== n);
  });
  document.querySelectorAll('[data-stall-progress]').forEach((el) => {
    const s = parseInt(el.getAttribute('data-stall-progress'), 10);
    el.classList.toggle('done', s < n);
    el.classList.toggle('on', s === n);
  });
}

function renderTasteSelected() {
  const box = document.getElementById('stall-taste-selected');
  if (!box) return;
  const chips = [];
  stallDraft.tasteVendorIds.forEach((id) => {
    const v = VENDORS.find((x) => x.id === id);
    if (v) chips.push(`<span class="stall-chip" data-taste-vendor="${id}">${escapeHtml(v.name)} ×</span>`);
  });
  stallDraft.tasteQuickNames.forEach((name) => {
    chips.push(`<span class="stall-chip" data-taste-quick="${escapeHtml(name)}">${escapeHtml(name)} ×</span>`);
  });
  box.innerHTML = chips.length
    ? chips.join('')
    : '<span class="mut sm">Pick listed stalls or add a quick reference (shows in search).</span>';

  box.querySelectorAll('[data-taste-vendor]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.getAttribute('data-taste-vendor');
      stallDraft.tasteVendorIds = stallDraft.tasteVendorIds.filter((x) => x !== id);
      renderTasteSelected();
    });
  });
  box.querySelectorAll('[data-taste-quick]').forEach((el) => {
    el.addEventListener('click', () => {
      const name = el.getAttribute('data-taste-quick');
      stallDraft.tasteQuickNames = stallDraft.tasteQuickNames.filter((x) => x !== name);
      renderTasteSelected();
    });
  });
}

function openTastePickerModal() {
  const q = stallDraft.name.trim().toLowerCase();
  const quickList = getState().quickTasteStalls || [];
  const filtered = VENDORS.filter((v) => !q || v.name.toLowerCase().includes(q) || v.locationName.toLowerCase().includes(q)).slice(
    0,
    24
  );
  openModal(`
    <h2 class="modal-sheet-title">Taste similar to…</h2>
    <p class="modal-sheet-sub mut sm">Pick listed stalls or add a name locals would recognise.</p>
    ${
      quickList.length
        ? `<p class="modal-sheet-kicker">Quick references</p><div class="fchips modal-sheet-chips">${quickList
            .slice(0, 8)
            .map(
              (name) =>
                `<button type="button" class="chip" data-taste-quick-pick="${escapeHtml(name)}">${escapeHtml(name)}</button>`
            )
            .join('')}</div>`
        : ''
    }
    <input type="search" class="field-input" id="taste-search" placeholder="Search stalls" />
    <div class="stall-picker-list" id="taste-vendor-list">
      ${filtered
        .map(
          (v) => `
        <label class="stall-picker-row">
          <input type="checkbox" value="${v.id}" ${stallDraft.tasteVendorIds.includes(v.id) ? 'checked' : ''} />
          <span><b>${escapeHtml(v.name)}</b><span class="mut xs"> · ${escapeHtml(v.locationName)}</span></span>
        </label>`
        )
        .join('')}
    </div>
    <label class="field-label">Quick reference (not listed yet)
      <input class="field-input" id="taste-quick-input" placeholder="e.g. Old MI Road samosa cart" />
    </label>
    <button type="button" class="btn btn-secondary btn-sm" id="taste-quick-add">Add quick reference</button>
    <div class="modal-sheet-actions">
      <button type="button" class="btn btn-primary btn-block" id="taste-picker-done">Done</button>
    </div>
  `);

  const list = document.getElementById('taste-vendor-list');
  const search = document.getElementById('taste-search');
  search?.addEventListener('input', () => {
    const term = search.value.trim().toLowerCase();
    list?.querySelectorAll('.stall-picker-row').forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = !term || text.includes(term) ? '' : 'none';
    });
  });

  document.getElementById('taste-quick-add')?.addEventListener('click', () => {
    const val = document.getElementById('taste-quick-input')?.value?.trim();
    if (!val) return;
    if (!stallDraft.tasteQuickNames.includes(val)) {
      stallDraft.tasteQuickNames.push(val);
      addQuickTasteStall(val);
    }
    document.getElementById('taste-quick-input').value = '';
    showToast('Added quick taste reference', 'success');
    renderTasteSelected();
  });

  document.querySelectorAll('[data-taste-quick-pick]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-taste-quick-pick');
      if (name && !stallDraft.tasteQuickNames.includes(name)) {
        stallDraft.tasteQuickNames.push(name);
        renderTasteSelected();
        showToast('Added to taste similar', 'success');
      }
    });
  });

  document.getElementById('taste-picker-done')?.addEventListener('click', () => {
    const ids = [...(list?.querySelectorAll('input[type=checkbox]:checked') || [])].map((c) => c.value);
    stallDraft.tasteVendorIds = ids;
    closeModal();
    renderTasteSelected();
  });
}

function showDuplicateModal(result, { onContinue } = {}) {
  const rows = result.matches
    .map(
      (m) => `
    <li class="dup-match">
      <div>
        <b>${escapeHtml(m.name)}</b>
        <span class="mut xs">${m.source === 'listed' ? 'Live listing' : 'Pending review'} · ${Math.round(m.similarity * 100)}% match</span>
      </div>
      ${m.href ? `<a href="${m.href}" class="btn btn-ghost btn-sm" data-modal-close>View stall</a>` : ''}
    </li>`
    )
    .join('');

  openModal(`
    <h2 class="modal-sheet-title">${result.level === 'block' ? 'Already listed?' : 'Looks familiar'}</h2>
    <p class="modal-sheet-sub">${escapeHtml(result.message || '')}</p>
    <ul class="dup-list">${rows}</ul>
    <p class="mut sm stall-dedup-tip">Duplicate listings split reviews — use one stall name when you can.</p>
    <div class="modal-sheet-actions">
      ${
        result.level === 'block'
          ? `<button type="button" class="btn btn-primary btn-block" data-modal-close>Got it — I'll check</button>`
          : `<button type="button" class="btn btn-ghost btn-block" data-modal-close>Go back</button>
             <button type="button" class="btn btn-primary btn-block" id="dedup-continue">Different stall — continue</button>`
      }
    </div>
  `);

  document.getElementById('dedup-continue')?.addEventListener('click', () => {
    closeModal();
    onContinue?.();
  });
}

function collectStep1() {
  const form = document.getElementById('stall-basic-form');
  if (!form?.reportValidity()) return false;
  const fd = new FormData(form);
  stallDraft.name = String(fd.get('name') || '').trim();
  stallDraft.categoryId = fd.get('category');
  stallDraft.hygieneLevel = fd.get('hygiene');
  stallDraft.description = String(fd.get('desc') || '').trim();
  return true;
}

function collectStep2() {
  const form = document.getElementById('stall-location-form');
  if (!form?.reportValidity()) return false;
  const fd = new FormData(form);
  stallDraft.locationId = fd.get('locationId');
  stallDraft.address = String(fd.get('address') || '').trim();
  stallDraft.landmark = String(fd.get('landmark') || '').trim();
  const lat = fd.get('lat');
  const lng = fd.get('lng');
  stallDraft.lat = lat ? parseFloat(lat) : null;
  stallDraft.lng = lng ? parseFloat(lng) : null;
  stallDraft.googleMapsUrl = String(fd.get('googleMapsUrl') || '').trim();
  stallDraft.mapsPlaceName = String(fd.get('mapsPlaceName') || '').trim();
  return true;
}

function applyParsedMaps(parsed) {
  const latEl = document.getElementById('stall-lat');
  const lngEl = document.getElementById('stall-lng');
  const urlEl = document.getElementById('stall-maps-url');
  const placeEl = document.getElementById('stall-maps-place-name');
  const addrEl = document.getElementById('stall-address');
  const locSelect = document.getElementById('stall-location-id');
  const preview = document.getElementById('stall-maps-preview');
  const nameWrap = document.getElementById('stall-maps-name-wrap');
  const useName = document.getElementById('stall-maps-use-name');
  const openLink = document.getElementById('stall-maps-open');

  stallDraft.lat = parsed.lat;
  stallDraft.lng = parsed.lng;
  stallDraft.googleMapsUrl = parsed.canonicalMapsUrl || parsed.mapsUrl;
  stallDraft.mapsPlaceName = parsed.placeName || '';

  if (latEl) latEl.value = parsed.lat;
  if (lngEl) lngEl.value = parsed.lng;
  if (urlEl) urlEl.value = stallDraft.googleMapsUrl;
  if (placeEl) placeEl.value = stallDraft.mapsPlaceName;

  const textBlob = [parsed.placeName, parsed.addressHint, stallDraft.googleMapsUrl].filter(Boolean).join(' ');
  const suggested = suggestLocationId({ lat: parsed.lat, lng: parsed.lng, text: textBlob });
  if (suggested && locSelect) {
    locSelect.value = suggested;
    stallDraft.locationId = suggested;
  }

  if (addrEl && !addrEl.value.trim()) {
    addrEl.value = parsed.placeName || parsed.addressHint || '';
  }

  if (openLink) openLink.href = stallDraft.googleMapsUrl;

  if (preview) {
    preview.classList.remove('hidden');
    const jaipurOk = isNearJaipur(parsed.lat, parsed.lng);
    preview.innerHTML = `
      <span class="pill ${jaipurOk ? 'g' : 'a'}">${jaipurOk ? 'Pin in Jaipur' : 'Pin outside Jaipur — double-check'}</span>
      ${parsed.placeName ? `<p class="sm"><b>${escapeHtml(parsed.placeName)}</b></p>` : ''}
      <p class="mut xs">${parsed.lat.toFixed(5)}, ${parsed.lng.toFixed(5)}</p>
      <a href="${escapeHtml(stallDraft.googleMapsUrl)}" target="_blank" rel="noopener" class="btn btn-link btn-sm">View on Google Maps</a>
    `;
  }

  if (nameWrap && useName) {
    if (parsed.placeName) {
      nameWrap.classList.remove('hidden');
      useName.checked = !stallDraft.name.trim();
      useName.onchange = () => {
        if (useName.checked) syncStallNameFromMaps(parsed.placeName);
      };
      if (useName.checked) syncStallNameFromMaps(parsed.placeName);
    } else {
      nameWrap.classList.add('hidden');
    }
  }

  showToast('Location filled from Google Maps — tweak if needed', 'success');
}

function syncStallNameFromMaps(placeName) {
  stallDraft.name = placeName;
  const nameInput = document.querySelector('#stall-basic-form input[name="name"]');
  if (nameInput) nameInput.value = placeName;
}

function applyMapsFromPasteInput() {
  const raw = document.getElementById('stall-maps-paste')?.value?.trim();
  if (!raw) {
    showToast('Paste a Google Maps link or coordinates', 'warn');
    return;
  }
  const parsed = parseGoogleMapsInput(raw);
  if (!parsed.ok) {
    showToast(parsed.message || 'Could not read that link', 'warn');
    return;
  }
  applyParsedMaps(parsed);
}

function bindMapsQuickAdd() {
  document.getElementById('stall-maps-apply')?.addEventListener('click', applyMapsFromPasteInput);

  document.getElementById('stall-maps-paste')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyMapsFromPasteInput();
    }
  });

  document.getElementById('stall-maps-paste')?.addEventListener('paste', () => {
    setTimeout(applyMapsFromPasteInput, 50);
  });

  document.getElementById('stall-maps-geolocate')?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showToast('Location not supported in this browser', 'warn');
      return;
    }
    showToast('Getting your location…', 'info');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        applyParsedMaps({
          ok: true,
          lat,
          lng,
          placeName: '',
          addressHint: `Near you (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
          mapsUrl: buildMapsSearchUrl({ lat, lng }),
          canonicalMapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
          source: 'geolocation',
        });
        const paste = document.getElementById('stall-maps-paste');
        if (paste) paste.value = `https://www.google.com/maps?q=${lat},${lng}`;
      },
      () => showToast('Allow location access, or paste a Maps link instead', 'warn'),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  });
}

function runDuplicateCheck(levels = ['block', 'warn']) {
  const pending = getState().stallSubmissions || [];
  return findStallDuplicates(
    { name: stallDraft.name, locationId: stallDraft.locationId },
    { vendors: VENDORS, pendingSubmissions: pending },
    STALL_DEDUP_SETTINGS
  );
}

function renderManualMenuRows() {
  const wrap = document.getElementById('stall-manual-menu');
  if (!wrap) return;
  if (!stallDraft.menuItems.length) {
    stallDraft.menuItems = [{ name: '', price: '', categoryId: stallDraft.categoryId, veg: true }];
  }
  wrap.innerHTML = stallDraft.menuItems
    .map(
      (item, i) => `
    <div class="stall-menu-row" data-menu-i="${i}">
      <input class="field-input" data-field="name" placeholder="Item name" value="${escapeHtml(item.name)}" />
      <input class="field-input" data-field="price" type="number" inputmode="decimal" placeholder="₹" value="${item.price === '' ? '' : item.price}" />
      <select class="field-input" data-field="categoryId">
        ${CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === item.categoryId ? 'selected' : ''}>${c.name}</option>`).join('')}
      </select>
      <button type="button" class="btn btn-ghost btn-sm" data-menu-del="${i}" aria-label="Remove">×</button>
    </div>`
    )
    .join('');

  wrap.querySelectorAll('.stall-menu-row').forEach((row) => {
    const i = +row.getAttribute('data-menu-i');
    row.querySelectorAll('[data-field]').forEach((input) => {
      input.addEventListener('change', () => {
        const field = input.getAttribute('data-field');
        stallDraft.menuItems[i][field] = field === 'price' ? input.value : input.value;
      });
    });
  });
  wrap.querySelectorAll('[data-menu-del]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = +btn.getAttribute('data-menu-del');
      stallDraft.menuItems.splice(idx, 1);
      renderManualMenuRows();
    });
  });
}

function syncManualMenuFromDom() {
  const wrap = document.getElementById('stall-manual-menu');
  if (!wrap) return;
  stallDraft.menuItems = [...wrap.querySelectorAll('.stall-menu-row')].map((row) => ({
    name: row.querySelector('[data-field=name]')?.value?.trim() || '',
    price: row.querySelector('[data-field=price]')?.value || '',
    categoryId: row.querySelector('[data-field=categoryId]')?.value || stallDraft.categoryId,
    veg: true,
  }));
}

function renderOcrTable() {
  const tbody = document.querySelector('#stall-ocr-table tbody');
  if (!tbody) return;
  tbody.innerHTML = ocrMenuItems
    .map(
      (item, i) => `
      <tr data-ocr-i="${i}">
        <td><input value="${escapeHtml(item.name)}" data-field="name" /></td>
        <td><input value="${item.price}" data-field="price" type="number" /></td>
        <td><select data-field="cat">${CATEGORIES.map((c) => `<option value="${c.id}" ${c.id === item.cat ? 'selected' : ''}>${c.name}</option>`).join('')}</select></td>
        <td><button type="button" class="link danger" data-ocr-del="${i}">Delete</button></td>
      </tr>`
    )
    .join('');
  tbody.querySelectorAll('[data-ocr-del]').forEach((b) => {
    b.addEventListener('click', () => {
      ocrMenuItems.splice(+b.getAttribute('data-ocr-del'), 1);
      renderOcrTable();
    });
  });
}

function runOcrSimulation() {
  ocrMenuItems = OCR_SEED.map((x) => ({ ...x }));
  const states = document.getElementById('stall-ocr-states');
  const results = document.getElementById('stall-ocr-results');
  states?.classList.remove('hidden');
  results?.classList.add('hidden');
  const steps = states?.querySelectorAll('.ocr-step') || [];
  let i = 0;
  const tick = () => {
    steps.forEach((s, idx) => s.classList.toggle('active', idx === i));
    i++;
    if (i <= steps.length) setTimeout(tick, 800);
    else {
      states?.classList.add('hidden');
      results?.classList.remove('hidden');
      renderOcrTable();
      showToast('Review items — uncheck wrong lines before continuing', 'info');
    }
  };
  tick();
}

function applyOcrToDraft() {
  const tbody = document.querySelector('#stall-ocr-table tbody');
  if (!tbody) return;
  stallDraft.menuItems = [...tbody.querySelectorAll('tr')].map((row) => ({
    name: row.querySelector('[data-field=name]')?.value?.trim() || '',
    price: row.querySelector('[data-field=price]')?.value || '',
    categoryId: row.querySelector('[data-field=cat]')?.value || stallDraft.categoryId,
    veg: true,
  }));
  stallDraft.menuSource = 'ocr';
}

function renderReviewSummary() {
  const el = document.getElementById('stall-review-summary');
  if (!el) return;
  const loc = LOCATIONS.find((l) => l.id === stallDraft.locationId);
  const cat = CATEGORIES.find((c) => c.id === stallDraft.categoryId);
  const hygiene = HYGIENE_LEVELS.find((h) => h.id === stallDraft.hygieneLevel);
  const tasteNames = [
    ...stallDraft.tasteVendorIds.map((id) => VENDORS.find((v) => v.id === id)?.name).filter(Boolean),
    ...stallDraft.tasteQuickNames,
  ];
  const menu = stallDraft.menuItems.filter((m) => m.name && m.price);
  el.innerHTML = `
    <div class="review-block">
      <h3>${escapeHtml(stallDraft.name)}</h3>
      <p class="mut sm">${cat?.name || ''} · ${hygiene?.label || ''}</p>
      ${stallDraft.description ? `<p class="sm">${escapeHtml(stallDraft.description)}</p>` : ''}
      ${tasteNames.length ? `<p class="sm"><b>Tastes like:</b> ${escapeHtml(tasteNames.join(', '))}</p>` : ''}
    </div>
    <div class="review-block">
      <b>Location</b>
      <p class="mut sm">${escapeHtml(loc?.name || '')} — ${escapeHtml(stallDraft.address)}</p>
      ${stallDraft.landmark ? `<p class="mut xs">Landmark: ${escapeHtml(stallDraft.landmark)}</p>` : ''}
      ${
        stallDraft.googleMapsUrl
          ? `<p class="sm"><a href="${escapeHtml(stallDraft.googleMapsUrl)}" target="_blank" rel="noopener">Google Maps pin</a>${
              stallDraft.lat != null ? ` · ${stallDraft.lat.toFixed(4)}, ${stallDraft.lng.toFixed(4)}` : ''
            }</p>`
          : ''
      }
    </div>
    <div class="review-block">
      <b>Photos</b>
      <p class="mut sm">${stallDraft.coverPhoto ? 'Cover + ' : ''}${stallDraft.photos.length} extra photo(s)</p>
    </div>
    <div class="review-block">
      <b>Menu (${menu.length} items)</b>
      <ul class="review-menu-list">
        ${menu.slice(0, 8).map((m) => `<li>${escapeHtml(m.name)} — ${formatINR(+m.price || 0)}</li>`).join('')}
        ${menu.length > 8 ? `<li class="mut sm">+${menu.length - 8} more</li>` : ''}
      </ul>
    </div>
  `;
}

function bindPhotoInputs() {
  const coverInput = document.getElementById('stall-cover-input');
  const galleryInput = document.getElementById('stall-gallery-input');
  const coverPrev = document.getElementById('stall-cover-preview');
  const galleryPrev = document.getElementById('stall-gallery-preview');

  coverInput?.addEventListener('change', async () => {
    const file = coverInput.files?.[0];
    if (!file) return;
    stallDraft.coverPhoto = await readFileAsDataUrl(file);
    if (coverPrev) {
      coverPrev.innerHTML = `<img src="${stallDraft.coverPhoto}" alt="" class="stall-photo-preview" />`;
    }
  });

  galleryInput?.addEventListener('change', async () => {
    const files = [...(galleryInput.files || [])];
    for (const f of files.slice(0, 6)) {
      stallDraft.photos.push(await readFileAsDataUrl(f));
    }
    if (galleryPrev) {
      galleryPrev.innerHTML = stallDraft.photos
        .map((src) => `<img src="${src}" alt="" class="stall-photo-thumb" />`)
        .join('');
    }
  });
}

function bindMenuTabs() {
  document.querySelectorAll('[data-menu-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      const mode = tab.getAttribute('data-menu-tab');
      document.querySelectorAll('[data-menu-tab]').forEach((t) => t.classList.toggle('on', t === tab));
      document.getElementById('stall-menu-manual')?.classList.toggle('hidden', mode !== 'manual');
      document.getElementById('stall-menu-ocr')?.classList.toggle('hidden', mode !== 'ocr');
    });
  });
}

export function initStallWizard() {
  stallDraft = createEmptyDraft();
  ocrMenuItems = [];
  let step = 1;
  showStep(1);
  renderTasteSelected();
  renderManualMenuRows();
  bindPhotoInputs();
  bindMenuTabs();
  bindMapsQuickAdd();

  document.getElementById('stall-taste-open')?.addEventListener('click', openTastePickerModal);

  document.getElementById('stall-menu-add-row')?.addEventListener('click', () => {
    stallDraft.menuItems.push({ name: '', price: '', categoryId: stallDraft.categoryId, veg: true });
    renderManualMenuRows();
  });

  document.getElementById('stall-ocr-upload-btn')?.addEventListener('click', () => {
    document.getElementById('stall-ocr-files')?.click();
  });
  document.getElementById('stall-ocr-files')?.addEventListener('change', runOcrSimulation);
  document.getElementById('stall-ocr-add-row')?.addEventListener('click', () => {
    ocrMenuItems.push({ name: 'New item', price: 40, cat: stallDraft.categoryId });
    renderOcrTable();
  });

  document.querySelectorAll('[data-wizard-next]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const go = (next) => {
        step = next;
        showStep(step);
      };

      if (step === 1) {
        if (!collectStep1()) return;
        const dup = runDuplicateCheck();
        if (dup.level === 'block') {
          showDuplicateModal(dup);
          return;
        }
        if (dup.level === 'warn') {
          showDuplicateModal(dup, { onContinue: () => go(2) });
          return;
        }
        go(2);
        return;
      }

      if (step === 2) {
        if (!collectStep2()) return;
        go(3);
        return;
      }

      if (step === 3) {
        if (!stallDraft.coverPhoto) {
          showToast('Add a cover photo of the stall', 'warn');
          return;
        }
        go(4);
        return;
      }

      if (step === 4) {
        const ocrVisible = !document.getElementById('stall-menu-ocr')?.classList.contains('hidden');
        if (ocrVisible) applyOcrToDraft();
        else {
          syncManualMenuFromDom();
          stallDraft.menuSource = 'manual';
        }
        const valid = stallDraft.menuItems.filter((m) => m.name && m.price);
        if (!valid.length) {
          showToast('Add at least one menu item with price', 'warn');
          return;
        }
        stallDraft.menuItems = valid;
        renderReviewSummary();
        go(5);
        return;
      }

      if (step === 5) {
        const confirm = document.getElementById('stall-not-dup');
        if (!confirm?.checked) {
          showToast('Please confirm this isn’t a duplicate listing', 'warn');
          return;
        }
        stallDraft.notDuplicateConfirmed = true;
        const finalDup = runDuplicateCheck();
        if (finalDup.level === 'block') {
          showDuplicateModal(finalDup);
          return;
        }
        const submission = submitStallForReview({ ...stallDraft });
        const reviewEl = document.getElementById('stall-review-deadline');
        if (reviewEl) reviewEl.textContent = submission.reviewByLabel;
        showToast('Stall submitted — we’ll review within 72 hours', 'success');
        go(6);
      }
    });
  });

  document.querySelectorAll('[data-wizard-prev]').forEach((btn) => {
    btn.addEventListener('click', () => {
      step = Math.max(1, step - 1);
      showStep(step);
    });
  });
}

export { HYGIENE_LEVELS };
