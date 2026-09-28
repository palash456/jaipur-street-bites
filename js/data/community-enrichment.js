import { SEED_POSTS } from './community.js';
import { foodImageForCategory } from '../utils/images.js';

const ts = (daysAgo, hours = 12) =>
  new Date(Date.now() - daysAgo * 86400000 - hours * 3600000).toISOString();

/** Long-form thread bodies (multi-paragraph) */
const THREAD_BODIES = {
  'post-1': `Office starts at 9 and Rawat's queue on Mondays is basically a morning workout. I'm not asking for "best in Jaipur" — just a pyaaz kachori that's hot, flaky, and ready before 7:45 AM within walking distance of Raja Park main road.

I've tried the cart near Sunrise Apartments (opens ~6:30) but they're inconsistent on weekends. Budget ₹30–40 per piece. Prefer pure veg stall. Drop pin if you can — saves us all a wasted trip.`,
  'post-2': `Visited five ghewar carts in Johari over two weeks during peak season. Here's what actually mattered: ghee smell (not vanaspati), queue turnover (faster = fresher), and whether rabri is made in-house.

Malai ghewar at the pink-sign cart wins on texture — ₹480/kg. Plain ghewar near the temple gate is ₹320 and better for gifting. The "Instagram famous" one had the longest queue but tasted day-old on Thursday. Photos attached from each visit — compare the soak level yourself.

Would love to know if anyone has a hidden home chef doing pre-orders for Rakhi.`,
  'post-3': `Gloves are rare and I get it — high turnover, low margins. My checklist before ordering chaat anywhere in Jaipur:

1. Separate hand towel or nap stack (not one dirty rag)
2. Water drum covered, lassi/chai water not same bucket as rinse
3. Oil colour on bhatura/pyaaz — dark brown with grey foam is a no
4. Cash box away from plating surface

What do locals actually look for? Especially at Masala Chowk where tourists and residents mix.`,
  'post-4': `Settled a debate with friends last night and need the Walled City consensus. Gol gappe sequence: teekha pani first or meetha first?

Some aunties say sweet opens the palate; college group says teekha first or the sweet ruins spice tolerance. Poll your stall uncle — what's the traditional order?`,
  'post-5': `MI Road Chaat King — 4.6 stars, 35 min wait on Friday, ₹180 for two plates. Taste: 8/10, portion: 6/10 vs Raja Park equivalents.

Delivery order note: packaging leaked imli water; kulhad chai add-on was excellent. Attached plate photo vs what we got on Swiggy last month. Worth the hype for sit-down, not for delivery.`,
  'post-6': `Hot take: lassi after pyaaz kachori is overrated in Raja Park. Kulhad chai cuts the oil better and doesn't fill you before lunch.

Fight me politely — science, tradition, or personal preference?`,
  'post-7': `Stall #7 at Masala Chowk — two evening visits. Menu: aloo tikki chaat (₹60), dahi bhalla (₹70), paneer tikka (₹120 — skip).

Best item: aloo tikki with extra imli, less dahi. Queue ~12 min at 7 PM. Cash only. Seating on plastic stools. Full plate photos attached.`,
  'post-8': `Post-movie hunger hits after 11 PM in C-Scheme. Need kulhad chai + something solid (kachori/samosa) that isn't day-old fry.

Rickshaw guys pointed me wrong twice. Who's actually boiling fresh milk after 11 near MI Road / C-Scheme circle?`,
  'post-9': `Wedding season incoming — gifting ghewar in Johari. Malai spoils in 36 hours in this heat; plain lasts longer but feels "cheap" to elders.

What do Jaipur families actually gift? Box recommendations with price per kg welcome.`,
  'post-10': `Rawat pyaaz kachori — still ₹30? Size feels 15% smaller vs my 2024 photos (attached). Taste still top tier for Raja Park: flaky, peppery onion filling, less grease than Tonk Road copycats.

Queue strategy: weekday before 7:15 AM, avoid post-festival weekends. 5★ for taste, 4★ for value this year.`,
  'post-11': `Mirchi bada on Tonk Road — love it but worried about reheated oil. Visual signs before ordering?

Dark foam, floating crumbs, smell like burnt cumin = walk away? What else?`,
  'post-12': `Vaishali lassi bar — mango vs malai. Malai: spoon-standing thick, ₹90. Mango: sweeter, watered on Sunday crowds, ₹70.

Family portion sharing works for malai. Tourist tip: ask for less sugar. Photos of both pours attached.`,
  'post-13': `MI Road pav bhaji crawl — rank your tawa from Panch Batti to GT. Include price, wait, butter level (1–5).

I'll start: corner cart near stat circle — ₹120, 20 min, butter 4/5, best bhaji char on the edges.`,
  'post-14': `Bapu Bazaar samosa lane — dal kachori vs pyaaz kachori. Which stall name do rickshaw uncles actually use?

First time visitor — don't want tourist trap pricing.`,
  'post-15': `Johari cross jalebi — crisp, hot, syrup soak 8/10. Rabri stall next door balances the sugar bomb. ₹40 per portion approx.

Morning 7–9 AM best. Evening batch too oily last Tuesday. Photos attached.`,
  'post-16': `Malviya Nagar evening — momos vs chaat after tuition. Team momo says Tibetan corner; team chaat says gol gappe cart near main chowk.

Where do you go and why?`,
  'post-17': `Tonk Road thali dhaba unlimited dal baati — ₹180. Weekday lunch churma dry; Sunday family crowd fixes the kitchen (weird but true).

Unlimited ghee on baati if you ask nicely. 4★ overall, photos of thali attached.`,
  'post-18': `Doctor said avoid ice in street pani. Any Mansarovar gol gappe stall doing chilled pani without ice cubes? Or room-temp pani that's still safe?

Need family-friendly option for kids.`,
  'post-19': `Sindhi Camp before Shatabdi — what's packaged vs exposed? Samosa in newspaper vs open chaat — what do train passengers trust?

Quick list for 15 min platform change.`,
  'post-20': `Johari thali with Hawa Mahal view — ₹350. Food authentic Rajasthani, view tax ~₹100. Same kitchen cheaper seat inside alley.

3.5★ value, 4★ taste. Tourist photos vs alley seat portion in gallery.`,
};

const VIEWS = {
  'post-1': 8420,
  'post-2': 24100,
  'post-3': 31500,
  'post-4': 45200,
  'post-5': 12800,
  'post-6': 9800,
  'post-7': 15600,
  'post-8': 6200,
  'post-9': 11400,
  'post-10': 28900,
  'post-11': 7300,
  'post-12': 9100,
  'post-13': 13700,
  'post-14': 5400,
  'post-15': 10200,
  'post-16': 18600,
  'post-17': 8800,
  'post-18': 4900,
  'post-19': 6700,
  'post-20': 12100,
};

function photosFor(post) {
  if (!post.hasPhoto) return [];
  const c = post.cuisineId || 'chaat';
  const a = foodImageForCategory(c);
  const alt = foodImageForCategory(c === 'chaat' ? 'gol-gappe' : 'chaat');
  return post.type === 'review' ? [a, alt] : [a];
}

function reviewMetaFor(post) {
  if (post.type !== 'review' || post.rating == null) return null;
  return {
    pricePaid: post.id === 'post-20' ? '₹350' : post.id === 'post-10' ? '₹30' : post.id === 'post-17' ? '₹180' : '₹60–120',
    waitMin: post.id === 'post-5' ? 35 : post.id === 'post-10' ? 20 : 12,
    taste: Math.min(5, Math.round(post.rating)),
    hygiene: post.rating >= 4 ? 4 : 3,
    service: 3 + (post.upvotes > 100 ? 1 : 0),
    value: post.rating >= 4.5 ? 4 : 3,
    pros: ['Fresh off the tawa', 'Authentic local flavour', 'Worth the queue'].slice(0, 2 + (post.id.length % 2)),
    cons: post.rating < 4 ? ['Portion size', 'Wait time'] : ['Crowded peak hours'],
  };
}

export function enrichCommunityPost(post) {
  const body = THREAD_BODIES[post.id] || post.body;
  const views = VIEWS[post.id] ?? 1500 + (post.upvotes || 0) * 52;
  const photos = photosFor(post);
  return {
    ...post,
    body,
    views,
    photos,
    reviewMeta: reviewMetaFor(post),
    answerCount: Math.max(post.answerCount || 0, (SEED_COMMENTS[post.id] || []).length),
  };
}

function c(id, author, body, daysAgo, upvotes, extra = {}) {
  return {
    id,
    author,
    body,
    createdAt: ts(daysAgo, extra.h ?? 10),
    upvotes,
    authorBadge: extra.badge || 'Foodie',
    photo: extra.photo || null,
    rating: extra.rating ?? null,
  };
}

/** @type {Record<string, import('../state/store.js').CommunityCommentSeed[]>} */
export const SEED_COMMENTS = {
  'post-1': [
    c('c-1-1', 'Neha', 'Cart opposite Sunrise Apartments — open 6:30 AM. No Google pin. ₹35 kachori.', 0, 28, { badge: 'Local' }),
    c('c-1-2', 'Vikram', 'Rawat kitchen runs early but queue by 7:30. Before 7:15 Mon–Wed is OK.', 0, 15, { badge: 'Local' }),
    c('c-1-3', 'Arjun', 'Try lane behind Raja Park petrol pump — pyaaz kachori + free chai if you buy 4.', 1, 9, { photo: foodImageForCategory('pyaaz-kachori') }),
    c('c-1-4', 'Sneha', 'Seconding Sunrise cart — ask for "kam oil" batch if you reach after 8.', 1, 6),
  ],
  'post-2': [
    c('c-2-1', 'FoodieJaipur', 'Blue tarp or pink sign? Need to know which you ranked #1.', 1, 8),
    c('c-2-2', 'Meera P.', 'Pink sign = malai winner. Blue tarp = plain for gifting. Updated photos in main post.', 1, 22, { badge: 'Taster', photo: foodImageForCategory('ghewar') }),
    c('c-2-3', 'Ravi', 'Pre-order home chef: Laxmi ji near Johari gate — DM on Insta "JaipurGhewarHome".', 2, 31),
    c('c-2-4', 'TouristTom', 'We waited 40 min at Instagram one — skip. Pink sign was worth it.', 2, 14, { rating: 4.5 }),
  ],
  'post-3': [
    c('c-3-1', 'Priya', 'I watch if they wipe the chaat plate with a clean tissue between orders.', 0, 45, { badge: 'Local' }),
    c('c-3-2', 'Dr. Ankit', 'Thanks all — adding "gloves on money hand" to the checklist.', 0, 12, { badge: 'Contributor' }),
    c('c-3-3', 'Kabir', 'Masala Chowk stall #3 uses bottled water for pani — ask before eating.', 1, 38),
    c('c-3-4', 'Anita', 'Photo of their water station — covered drum, looks OK.', 1, 19, { photo: foodImageForCategory('gol-gappe') }),
    c('c-3-5', 'Dev', 'Unpopular: most stalls are fine if turnover is high. Low crowd = higher risk.', 2, 27),
  ],
  'post-4': [
    c('c-4-1', 'ChaatCam', 'Teekha first. Always. Meetha is dessert.', 0, 52, { photo: foodImageForCategory('gol-gappe') }),
    c('c-4-2', 'Priya', 'Alternate pani — Walled City traditional.', 0, 48),
    c('c-4-3', 'UncleJi', '30 years on this cart — teekha then meetha then dahi. Fixed order.', 0, 89, { badge: 'Local' }),
    c('c-4-4', 'Kavya', 'Poll closed in our group: 60% teekha first. Thanks!', 0, 11, { badge: 'New' }),
  ],
  'post-5': [
    c('c-5-1', 'Sameer', 'Added delivery vs dine-in photos to post.', 1, 7, { photo: foodImageForCategory('chaat') }),
    c('c-5-2', 'MIlocal', 'Sit-down only agree. Bhaji masala is stronger after 8 PM.', 1, 24, { rating: 4 }),
    c('c-5-3', 'Nisha', 'Swiggy order was sad — go in person.', 2, 33),
  ],
  'post-6': [
    c('c-6-1', 'ChaiWalaFan', 'Kulhad chai > lassi after kachori. Oil cut + warmth.', 2, 41),
    c('c-6-2', 'Dev', 'Lassi helps if kachori was extra spicy — case by case.', 2, 18, { badge: 'Hot take' }),
    c('c-6-3', 'Meera', 'Sweet lassi is dessert — different meal slot IMO.', 3, 55),
  ],
  'post-7': [
    c('c-7-1', 'Tanvi', 'Updated menu prices in main post. Paneer tikka skip confirmed.', 0, 16, { badge: 'Verified', photo: foodImageForCategory('chaat') }),
    c('c-7-2', 'Rahul', 'Stall #7 aloo tikki — ask extra imli, less dahi. Game changer.', 0, 29),
    c('c-7-3', 'Visitor', 'Cash only still? UPI?', 1, 4),
    c('c-7-4', 'Tanvi', 'Cash + Paytm on good days. Not guaranteed.', 1, 8, { badge: 'Verified' }),
  ],
  'post-8': [
    c('c-8-1', 'NightOwl', 'C-Scheme back lane kulhad — open till 12:30 some nights.', 0, 18),
    c('c-8-2', 'Rohan', 'Found one — will update pin tomorrow.', 0, 5, { badge: 'New' }),
    c('c-8-3', 'AutoRick', 'MI Road footpath samosa + chai combo after 11.', 1, 22),
  ],
  'post-9': [
    c('c-9-1', 'Pallavi', 'Plain for elders, malai for close friends only.', 1, 34, { badge: 'Local' }),
    c('c-9-2', 'SweetShop', 'LMB box packing travels better — ₹650 malai box.', 1, 28, { rating: 5 }),
    c('c-9-3', 'Neighbour', 'Add cardamom rabri separate — don\'t pre-soak ghewar.', 2, 15),
  ],
  'post-10': [
    c('c-10-1', 'Imran', 'Size comparison photos uploaded — still 5★ taste.', 2, 67, { badge: 'Taster', photo: foodImageForCategory('pyaaz-kachori'), rating: 5 }),
    c('c-10-2', 'RawatRegular', 'Price board still ₹30 at counter. Size varies by batch.', 2, 44),
    c('c-10-3', 'Student', 'Share plate with friend — two kachoris + chai under ₹100.', 3, 21),
  ],
  'post-11': [
    c('c-11-1', 'Sunita', 'Dark foam = walk away. Also smell the mirchi before batter dip.', 1, 38, { badge: 'Contributor' }),
    c('c-11-2', 'TonkLocal', 'Morning batch 8–10 AM usually fresh oil at flyover cart.', 1, 26),
    c('c-11-3', 'ChefR', 'If cart also does samosa AND mirchi same oil — OK if queue is long.', 2, 11),
  ],
  'post-12': [
    c('c-12-1', 'Chris', 'Malai photo vs mango in gallery — mango Sunday batch weaker.', 2, 19, { badge: 'Tourist', photo: foodImageForCategory('lassi'), rating: 4 }),
    c('c-12-2', 'VaishaliGirl', 'Ask "kam cheeni" — default is sweet.', 2, 33),
    c('c-12-3', 'Family4', 'One malai glass splits for two kids easily.', 3, 12),
  ],
  'post-13': [
    c('c-13-1', 'Nikhil', 'Updating list — Panch Batti corner leads so far.', 3, 41, { badge: 'Local' }),
    c('c-13-2', 'ButterFan', 'GT stall extra butter ₹20 — worth it.', 3, 29),
    c('c-13-3', 'PavKing', 'Edge char photo attached.', 4, 18, { photo: foodImageForCategory('pav-bhaji') }),
  ],
  'post-14': [
    c('c-14-1', 'RickshawRam', 'Say "Bapu wale dal kachori" — pink cart near gate 2.', 4, 25),
    c('c-14-2', 'Aisha', 'Found it — ₹15 samosa, ₹25 kachori. Thanks!', 4, 8, { badge: 'New' }),
    c('c-14-3', 'Local', 'Avoid first cart facing main road — tourist prices.', 4, 31),
  ],
  'post-15': [
    c('c-15-1', 'Govind', 'Morning batch photo in post — evening too oily agreed.', 3, 22, { photo: foodImageForCategory('jalebi'), rating: 4.5 }),
    c('c-15-2', 'RabriFan', 'Next stall rabri ₹30 — perfect dip ratio.', 3, 17),
  ],
  'post-16': [
    c('c-16-1', 'StudentJP', 'Momos win Tue/Thu — chaat wins Fri when gol gappe uncle comes.', 4, 52, { badge: 'New' }),
    c('c-16-2', 'TuitionBatch', 'Whole class goes chaat — spice wake-up before homework.', 4, 48),
    c('c-16-3', 'MomoMan', 'Tibetan corner schezwan ₹80 — share plate.', 5, 33),
  ],
  'post-17': [
    c('c-17-1', 'Mahesh', 'Sunday thali photo added — churma fixed on weekend.', 4, 44, { badge: 'Contributor', photo: foodImageForCategory('dal-baati'), rating: 4 }),
    c('c-17-2', 'DhabaHopper', 'Ask for ghee on baati — they hide it otherwise.', 5, 27),
  ],
  'post-18': [
    c('c-18-1', 'Deepa', 'Mansarovar sector 3 cart — fridge pani, no ice in water.', 5, 19, { badge: 'Local' }),
    c('c-18-2', 'MomOf2', 'We bring own water bottle for pani refill — they allowed once.', 5, 14),
  ],
  'post-19': [
    c('c-19-1', 'Traveler99', 'Packaged samosa + banana — skip open chaat on platform.', 5, 36, { badge: 'New' }),
    c('c-19-2', 'Porter', 'Stall 4 near exit — pre-wrapped kachori OK for train.', 5, 28),
  ],
  'post-20': [
    c('c-20-1', 'Elena', 'Alley seat same food ₹250 — photo compare in post.', 6, 31, { badge: 'Tourist', rating: 3.5 }),
    c('c-20-2', 'GuideJP', 'View seat for photos only — eat inside.', 6, 45),
    c('c-20-3', 'ThaliLover', 'Dal baati churma authentic — 4★ taste.', 6, 22, { rating: 4 }),
  ],
};

// Ensure every seed post has at least 2 comments
SEED_POSTS.forEach((p) => {
  if (!SEED_COMMENTS[p.id]?.length) {
    SEED_COMMENTS[p.id] = [
      c(`c-${p.id}-a`, 'LocalFoodie', 'Following — share updates if you find more.', 2, 5),
      c(`c-${p.id}-b`, 'JaipurEats', 'Great thread. More photos would help.', 3, 3),
    ];
  }
});
