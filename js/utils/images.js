/**
 * Indian street-food imagery via Wikimedia Commons Special:FilePath (stable resizing).
 */
const COMMONS = 'https://commons.wikimedia.org/wiki/Special:FilePath/';

/** @param {string} file Commons filename */
function commons(file, width = 640) {
  if (!file) return '';
  return `${COMMONS}${encodeURIComponent(file)}?width=${width}`;
}

const FILES = {
  pyaazKachori: 'Jodhpuri_Kanda(Pyaaz)_Kachori_with_tamarind_chutney.jpg',
  mawaKachori: 'Ghewar.jpg',
  dalKachori: 'Moong_Dal_Kachori_Recipe_From_Indian_Cuisine_By_Sonia_Goyal.jpg',
  plainKachori: 'Onion_kachori.jpg',
  samosa: 'North_Indian_style_samosa.jpg',
  samosaChutney: 'Samosa_with_tamarind_chutney_and_tomato_sauce.jpg',
  paneerSamosa: 'Green_peas_samosa.JPG',
  mirchiBada: 'Mirchi_bada.jpg',
  rajKachori: 'Raj_Kachori.jpg',
  alooTikkiChaat: 'Aloo_Tikki_Chaat.JPG',
  dahiPuri: 'Bhalla_Papri_Chaat_with_saunth_chutney.jpg',
  golGappe: 'Panipuri_with_green_chutney.jpg',
  pavBhaji: 'Pavbhajichaat.jpg',
  kulhadChai: 'ChaiwallaKolkata_(cropped).JPG',
  lassi: 'Lassi.jpg',
  ghewar: 'Ghewar.jpg',
  jalebi: 'Jalebi_(sweet).jpg',
  jalebiRabri: 'Nasta.jpg',
  rabri: 'Basundi.jpg',
  dahiVada: 'Plateful_Dahi_Vadas.JPG',
  dalBaati: 'Dal_Baati_Churma.jpg',
  sandwich: 'Bread_pakora.jpg',
  vegMomos: 'Chicken_momo.jpg',
  kulfi: 'Kulfi.jpg',
  rasmalai: 'Ras_malai.jpg',
  streetDefault: "Chaat_items_at_Haldiram's,_Delhi.JPG",
  burger: 'Vada_pav_01.jpg',
  tikki: 'Aloo_Tikki.jpg',
};

const IMG = Object.fromEntries(
  Object.entries(FILES).map(([k, f]) => [k, commons(f, 640)])
);

/** Longer names first */
const NAME_MATCHERS = [
  ['pyaaz kachori', IMG.pyaazKachori],
  ['mawa kachori', IMG.mawaKachori],
  ['dal kachori', IMG.dalKachori],
  ['heeng kachori', IMG.plainKachori],
  ['plain kachori', IMG.plainKachori],
  ['paneer samosa', IMG.paneerSamosa],
  ['aloo samosa', IMG.samosa],
  ['mirchi bada', IMG.mirchiBada],
  ['raj kachori', IMG.rajKachori],
  ['aloo tikki chaat', IMG.alooTikkiChaat],
  ['aloo tikki burger', commons(FILES.tikki, 640)],
  ['dahi puri', IMG.dahiPuri],
  ['gol gappe', IMG.golGappe],
  ['cheese pav bhaji', IMG.pavBhaji],
  ['pav bhaji', IMG.pavBhaji],
  ['ginger kulhad', IMG.kulhadChai],
  ['kulhad chai', IMG.kulhadChai],
  ['mango lassi', IMG.lassi],
  ['sweet lassi', IMG.lassi],
  ['malai ghewar', IMG.ghewar],
  ['plain ghewar', IMG.ghewar],
  ['jalebi with rabri', IMG.jalebiRabri],
  ['hot jalebi', IMG.jalebi],
  ['jalebi', IMG.jalebi],
  ['rabri bowl', IMG.rabri],
  ['rabri', IMG.rabri],
  ['dahi vada', IMG.dahiVada],
  ['dal baati', IMG.dalBaati],
  ['extra baati', IMG.dalBaati],
  ['rajasthani thali', IMG.dalBaati],
  ['special thali', IMG.dalBaati],
  ['paneer tikka sandwich', IMG.sandwich],
  ['veg grill sandwich', IMG.sandwich],
  ['chicken fried momos', IMG.vegMomos],
  ['veg steamed momos', IMG.vegMomos],
  ['chicken burger', commons(FILES.tikki, 640)],
  ['aloo tikki burger', IMG.burger],
  ['paneer tikka pizza', IMG.pavBhaji],
  ['margherita', IMG.pavBhaji],
  ['kulfi falooda', IMG.kulfi],
  ['rasmalai', IMG.rasmalai],
  ['samosa', IMG.samosa],
  ['kachori', IMG.plainKachori],
  ['chaat', IMG.alooTikkiChaat],
  ['lassi', IMG.lassi],
  ['momos', IMG.vegMomos],
  ['momo', IMG.vegMomos],
  ['burger', IMG.burger],
  ['pizza', IMG.pavBhaji],
  ['sandwich', IMG.sandwich],
];

const CATEGORY_IMAGES = {
  'pyaaz-kachori': IMG.pyaazKachori,
  kachori: IMG.plainKachori,
  samosa: IMG.samosa,
  'mirchi-bada': IMG.mirchiBada,
  chaat: IMG.alooTikkiChaat,
  'gol-gappe': IMG.golGappe,
  'pav-bhaji': IMG.pavBhaji,
  'kulhad-chai': IMG.kulhadChai,
  lassi: IMG.lassi,
  ghewar: IMG.ghewar,
  jalebi: IMG.jalebi,
  rabri: IMG.rabri,
  'dahi-vada': IMG.dahiVada,
  'dal-baati': IMG.dalBaati,
  'rajasthani-thali': IMG.dalBaati,
  sandwiches: IMG.sandwich,
  momos: IMG.vegMomos,
  burgers: IMG.burger,
  pizza: IMG.pavBhaji,
  desserts: IMG.kulfi,
};

/** Pastel circle backgrounds (Chatorey-style) */
export const CATEGORY_ACCENTS = {
  'pyaaz-kachori': '#FFE9C7',
  kachori: '#FFE9C7',
  samosa: '#F6E7C8',
  'mirchi-bada': '#E3F2DA',
  chaat: '#E2F4E6',
  'gol-gappe': '#DDF1F7',
  'pav-bhaji': '#FFE7D0',
  'kulhad-chai': '#F3E5DA',
  lassi: '#FBE3EC',
  ghewar: '#FFF0BF',
  jalebi: '#FFE2C2',
  rabri: '#FFF0BF',
  'dahi-vada': '#E2F4E6',
  'dal-baati': '#FFE7D0',
  'rajasthani-thali': '#FFE7D0',
  sandwiches: '#F6E7C8',
  momos: '#E9E5FA',
  burgers: '#F6E7C8',
  pizza: '#FFE7D0',
  desserts: '#E6ECFB',
};

const COVER_FILES = [
  FILES.streetDefault,
  FILES.golGappe,
  FILES.pyaazKachori,
  FILES.samosa,
  FILES.pavBhaji,
  FILES.rajKachori,
  FILES.alooTikkiChaat,
  FILES.dahiVada,
  FILES.kulhadChai,
  FILES.jalebiRabri,
];

const VENDOR_COVERS = COVER_FILES.map((f) => commons(f, 960));
const VENDOR_AVATARS = [
  commons(FILES.pyaazKachori, 320),
  commons(FILES.golGappe, 320),
  commons(FILES.samosa, 320),
  commons(FILES.jalebi, 320),
  commons(FILES.pavBhaji, 320),
  commons(FILES.mirchiBada, 320),
];

export const HERO_STREET_FOOD_IMAGE = commons(FILES.pyaazKachori, 960);
export const EMPTY_CART_IMAGE = commons(FILES.rajKachori, 480);
export const IMAGE_FALLBACK = IMG.streetDefault;

/**
 * @param {string} name Food item display name
 * @param {string} [categoryId]
 */
export function foodImageForItem(name, categoryId) {
  const normalized = String(name || '')
    .toLowerCase()
    .replace(/\s+special$/, '')
    .trim();
  for (const [needle, url] of NAME_MATCHERS) {
    if (normalized.includes(needle)) return url;
  }
  return foodImageForCategory(categoryId);
}

export function foodImageForCategory(catId) {
  return CATEGORY_IMAGES[catId] || IMG.streetDefault;
}

export function categoryAccent(catId) {
  return CATEGORY_ACCENTS[catId] || '#242430';
}

export function vendorCoverImage(index) {
  return VENDOR_COVERS[index % VENDOR_COVERS.length];
}

export function vendorAvatarImage(index) {
  return VENDOR_AVATARS[index % VENDOR_AVATARS.length];
}

const CATEGORY_EMOJI = {
  'pyaaz-kachori': '🧆',
  kachori: '🧆',
  samosa: '🥔',
  'mirchi-bada': '🌶️',
  chaat: '🥣',
  'gol-gappe': '🫧',
  'pav-bhaji': '🍞',
  'kulhad-chai': '☕',
  lassi: '🥛',
  ghewar: '🥞',
  jalebi: '🍯',
  rabri: '🍮',
  'dahi-vada': '🥣',
  'dal-baati': '🍲',
  'rajasthani-thali': '🍛',
  sandwiches: '🥪',
  momos: '🥟',
  burgers: '🍔',
  pizza: '🍕',
  desserts: '🧁',
};

/** Prefer Commons URLs; re-resolve stale/broken stored URLs from name/category. */
export function resolveFoodImage(name, categoryId, existingUrl) {
  const url = String(existingUrl || '');
  if (url.includes('Special:FilePath/')) return url;
  if (url.includes('upload.wikimedia.org/wikipedia/commons/thumb/')) {
    return foodImageForItem(name, categoryId);
  }
  if (!url) return foodImageForItem(name, categoryId);
  return url;
}

/** Vendor hero / card covers (not dish-name matching). */
export function resolveVendorCover(v) {
  return listingCoverForVendor(v);
}

export const IMG_ATTRS = 'loading="lazy" decoding="async" referrerpolicy="no-referrer"';

/** Listing cards: load immediately (horizontal scroll + above fold). */
export const LISTING_IMG_ATTRS = 'loading="eager" decoding="async" referrerpolicy="no-referrer" fetchpriority="low"';

/** Best cover for vendor cards — dish photo first, then category, then rotated stock. */
export function listingCoverForVendor(v) {
  if (!v) return IMAGE_FALLBACK;
  const idx = parseInt(String(v.id || '').replace(/\D/g, ''), 10) || 0;
  const cat = v.categoryIds?.[0];
  const dish = v.popularDishes?.[0] || v.cuisine?.split(' · ')[0] || '';
  const primary = foodImageForItem(dish, cat);
  const secondary = foodImageForCategory(cat);
  const rotated = vendorCoverImage(idx);
  return primary || secondary || rotated || IMAGE_FALLBACK;
}

export function listingCoverFallback(v) {
  const cat = v?.categoryIds?.[0];
  const idx = parseInt(String(v?.id || '').replace(/\D/g, ''), 10) || 0;
  return foodImageForCategory(cat) || vendorCoverImage((idx + 3) % 10) || IMAGE_FALLBACK;
}

export function emojiForCategory(catId) {
  return CATEGORY_EMOJI[catId] || '🍽️';
}

export function emojiForVendor(v) {
  const id = v?.categoryIds?.[0];
  return emojiForCategory(id);
}
