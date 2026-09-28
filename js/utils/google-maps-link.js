import { LOCATIONS } from '../data/catalog.js';

/** Rough centroids for matching pasted pins to app areas (demo). */
const LOCATION_GEO = {
  'masala-chowk': { lat: 26.9167, lng: 75.812, keywords: ['masala chowk', 'ram niwas'] },
  'mi-road': { lat: 26.915, lng: 75.805, keywords: ['mi road', 'mirza ismail'] },
  'raja-park': { lat: 26.892, lng: 75.828, keywords: ['raja park'] },
  'c-scheme': { lat: 26.912, lng: 75.8, keywords: ['c scheme', 'c-scheme'] },
  'vaishali-nagar': { lat: 26.912, lng: 75.742, keywords: ['vaishali'] },
  'malviya-nagar': { lat: 26.85, lng: 75.81, keywords: ['malviya'] },
  'mansarovar': { lat: 26.87, lng: 75.77, keywords: ['mansarovar'] },
  'bapu-bazaar': { lat: 26.919, lng: 75.82, keywords: ['bapu bazaar', 'bapu bazar'] },
  'johari-bazaar': { lat: 26.923, lng: 75.824, keywords: ['johari'] },
  'sindhi-camp': { lat: 26.928, lng: 75.8, keywords: ['sindhi camp', 'station'] },
  'walled-city': { lat: 26.923, lng: 75.826, keywords: ['walled city', 'pink city', 'hawa mahal'] },
  'vidyadhar-nagar': { lat: 26.96, lng: 75.78, keywords: ['vidyadhar'] },
  'jagatpura': { lat: 26.825, lng: 75.865, keywords: ['jagatpura'] },
  'tonk-road': { lat: 26.85, lng: 75.79, keywords: ['tonk road', 'tonk phatak', 'phatak'] },
};

const JAIPUR_BOUNDS = { latMin: 26.72, latMax: 27.05, lngMin: 75.65, lngMax: 76.05 };

function decodePlaceSlug(slug) {
  try {
    return decodeURIComponent(slug.replace(/\+/g, ' ')).trim();
  } catch {
    return slug.replace(/\+/g, ' ').trim();
  }
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseCoordsFromQuery(q) {
  if (!q) return null;
  const m = q.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (m) return { lat: +m[1], lng: +m[2] };
  return null;
}

/**
 * Parse Google Maps URLs, share links, or "lat, lng" text.
 * Short goo.gl / maps.app links cannot be expanded in-browser — returns needsResolve.
 */
export function parseGoogleMapsInput(raw) {
  const input = (raw || '').trim();
  if (!input) return { ok: false, code: 'empty', message: 'Paste a Google Maps link or coordinates.' };

  const coordOnly = parseCoordsFromQuery(input);
  if (coordOnly) {
    const mapsUrl = `https://www.google.com/maps?q=${coordOnly.lat},${coordOnly.lng}`;
    return {
      ok: true,
      lat: coordOnly.lat,
      lng: coordOnly.lng,
      placeName: '',
      addressHint: `${coordOnly.lat.toFixed(5)}, ${coordOnly.lng.toFixed(5)}`,
      mapsUrl,
      source: 'coordinates',
    };
  }

  if (/^(maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(input) || input.includes('maps.app.goo.gl')) {
    return {
      ok: false,
      code: 'short_link',
      message: 'Short Maps links need the full URL. In Google Maps: Share → Copy link, then paste here.',
      rawUrl: input.startsWith('http') ? input : `https://${input}`,
    };
  }

  let urlStr = input;
  if (!/^https?:\/\//i.test(urlStr)) urlStr = `https://${urlStr}`;

  let url;
  try {
    url = new URL(urlStr);
  } catch {
    return { ok: false, code: 'invalid', message: 'That doesn’t look like a valid Maps link.' };
  }

  const host = url.hostname.replace(/^www\./, '');
  if (!host.includes('google.') && !host.includes('maps')) {
    return { ok: false, code: 'invalid', message: 'Use a link from Google Maps (google.com/maps or maps.google.com).' };
  }

  let lat;
  let lng;
  let placeName = '';

  const placePath = url.pathname.match(/\/place\/([^/]+)/);
  if (placePath) placeName = decodePlaceSlug(placePath[1]);

  const at = url.href.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (at) {
    lat = +at[1];
    lng = +at[2];
  }

  const bang = url.href.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
  if (bang && (lat == null || Number.isNaN(lat))) {
    lat = +bang[1];
    lng = +bang[2];
  }

  const q = url.searchParams.get('q') || url.searchParams.get('query') || url.searchParams.get('ll');
  if (q) {
    const fromQ = parseCoordsFromQuery(q);
    if (fromQ) {
      if (lat == null) {
        lat = fromQ.lat;
        lng = fromQ.lng;
      }
    } else if (!placeName) {
      placeName = decodePlaceSlug(q);
    }
  }

  if (lat == null || lng == null) {
    return {
      ok: false,
      code: 'no_coords',
      message: 'Couldn’t read coordinates from this link. Try opening the place in Maps → Share → Copy link.',
      placeName,
      mapsUrl: url.href,
    };
  }

  const addressHint = placeName || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  const canonical = `https://www.google.com/maps?q=${lat},${lng}${placeName ? `&query=${encodeURIComponent(placeName)}` : ''}`;

  return {
    ok: true,
    lat,
    lng,
    placeName,
    addressHint,
    mapsUrl: url.href,
    canonicalMapsUrl: canonical,
    source: 'google_maps',
  };
}

export function isNearJaipur(lat, lng) {
  return lat >= JAIPUR_BOUNDS.latMin && lat <= JAIPUR_BOUNDS.latMax && lng >= JAIPUR_BOUNDS.lngMin && lng <= JAIPUR_BOUNDS.lngMax;
}

/** Pick best LOCATIONS id from coords + free text. */
export function suggestLocationId({ lat, lng, text = '' }) {
  const lower = text.toLowerCase();
  for (const loc of LOCATIONS) {
    const geo = LOCATION_GEO[loc.id];
    if (geo?.keywords?.some((k) => lower.includes(k))) return loc.id;
    if (lower.includes(loc.name.toLowerCase()) || lower.includes(loc.area.toLowerCase())) return loc.id;
  }
  if (lat == null || lng == null) return null;
  let best = null;
  let bestKm = Infinity;
  for (const loc of LOCATIONS) {
    const geo = LOCATION_GEO[loc.id];
    if (!geo) continue;
    const km = haversineKm(lat, lng, geo.lat, geo.lng);
    if (km < bestKm) {
      bestKm = km;
      best = loc.id;
    }
  }
  return bestKm <= 8 ? best : null;
}

export function buildMapsSearchUrl({ lat, lng, query = 'street food Jaipur' }) {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
