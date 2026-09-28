/** Duplicate stall detection — tuned for demo; backend would use geo + fuzzy DB match. */
export const STALL_DEDUP_SETTINGS = {
  /** Block submit when normalized names are identical */
  blockExactName: true,
  /** Block when similarity ≥ this and same location area */
  blockSimilaritySameArea: 0.86,
  /** Warn (allow continue with confirm) when similarity ≥ this */
  warnSimilarity: 0.72,
  /** Treat pending user submissions as existing listings */
  includePendingSubmissions: true,
};

const STOP_WORDS = new Set([
  'stall',
  'shop',
  'wala',
  'wale',
  'ji',
  'bhandar',
  'house',
  'centre',
  'center',
  'corner',
  'jaipur',
  'street',
  'food',
  'the',
  'and',
  'near',
]);

export function normalizeStallName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w && !STOP_WORDS.has(w))
    .join(' ');
}

function bigrams(s) {
  const t = s.replace(/\s/g, '');
  if (t.length < 2) return new Set(t ? [t] : []);
  const set = new Set();
  for (let i = 0; i < t.length - 1; i++) set.add(t.slice(i, i + 2));
  return set;
}

/** Sørensen–Dice on character bigrams */
export function nameSimilarity(a, b) {
  const na = normalizeStallName(a);
  const nb = normalizeStallName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const A = bigrams(na);
  const B = bigrams(nb);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach((x) => {
    if (B.has(x)) inter++;
  });
  return (2 * inter) / (A.size + B.size);
}

function candidateFromVendor(v) {
  return {
    id: v.id,
    name: v.name,
    locationId: v.locationId,
    locationName: v.locationName,
    source: 'listed',
    href: `#/vendor/${v.id}`,
  };
}

function candidateFromSubmission(s) {
  return {
    id: s.id,
    name: s.name,
    locationId: s.locationId,
    locationName: s.locationName,
    source: s.status === 'pending' ? 'pending_review' : 'submission',
    href: null,
  };
}

/**
 * @returns {{ level: 'none'|'warn'|'block', matches: Array, message?: string }}
 */
export function findStallDuplicates(
  { name, locationId },
  { vendors = [], pendingSubmissions = [] },
  settings = STALL_DEDUP_SETTINGS
) {
  const trimmed = (name || '').trim();
  if (trimmed.length < 2) return { level: 'none', matches: [] };

  const norm = normalizeStallName(trimmed);
  const candidates = [
    ...vendors.map(candidateFromVendor),
    ...(settings.includePendingSubmissions ? pendingSubmissions.filter((p) => p.status === 'pending').map(candidateFromSubmission) : []),
  ];

  const matches = [];
  for (const c of candidates) {
    const sim = nameSimilarity(trimmed, c.name);
    const normOther = normalizeStallName(c.name);
    const exact = norm && norm === normOther;
    const sameArea = locationId && c.locationId && locationId === c.locationId;

    if (exact && settings.blockExactName) {
      matches.push({ ...c, similarity: 1, reason: 'exact_name' });
      continue;
    }
    if (sim >= settings.warnSimilarity) {
      matches.push({
        ...c,
        similarity: sim,
        reason: sameArea && sim >= settings.blockSimilaritySameArea ? 'similar_same_area' : 'similar_name',
      });
    }
  }

  matches.sort((a, b) => b.similarity - a.similarity);

  const blockers = matches.filter(
    (m) =>
      m.reason === 'exact_name' ||
      (m.reason === 'similar_same_area' && m.similarity >= settings.blockSimilaritySameArea)
  );
  if (blockers.length) {
    const top = blockers[0];
    return {
      level: 'block',
      matches: blockers.slice(0, 5),
      message:
        top.source === 'listed'
          ? `This looks like the same stall as “${top.name}” already on Jaipur Street Bites.`
          : `Someone already submitted “${top.name}” for review in this area.`,
    };
  }

  const warns = matches.filter((m) => m.similarity >= settings.warnSimilarity);
  if (warns.length) {
    return {
      level: 'warn',
      matches: warns.slice(0, 5),
      message: `Similar to “${warns[0].name}”. If it's the same place, open that listing instead of adding again.`,
    };
  }

  return { level: 'none', matches: [] };
}
