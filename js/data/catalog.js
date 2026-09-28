import { foodImageForItem, vendorCoverImage, vendorAvatarImage } from '../utils/images.js';
import { randomPhone } from '../utils/format.js';

export const LOCATIONS = [
  { id: 'masala-chowk', name: 'Masala Chowk', area: 'Ram Niwas Garden' },
  { id: 'mi-road', name: 'MI Road', area: 'Central Jaipur' },
  { id: 'raja-park', name: 'Raja Park', area: 'East Jaipur' },
  { id: 'c-scheme', name: 'C-Scheme', area: 'Central Jaipur' },
  { id: 'vaishali-nagar', name: 'Vaishali Nagar', area: 'West Jaipur' },
  { id: 'malviya-nagar', name: 'Malviya Nagar', area: 'South Jaipur' },
  { id: 'mansarovar', name: 'Mansarovar', area: 'South-West' },
  { id: 'bapu-bazaar', name: 'Bapu Bazaar', area: 'Walled City' },
  { id: 'johari-bazaar', name: 'Johari Bazaar', area: 'Walled City' },
  { id: 'sindhi-camp', name: 'Sindhi Camp', area: 'Station Area' },
  { id: 'walled-city', name: 'Walled City', area: 'Pink City' },
  { id: 'vidyadhar-nagar', name: 'Vidyadhar Nagar', area: 'North Jaipur' },
  { id: 'jagatpura', name: 'Jagatpura', area: 'South-East' },
  { id: 'tonk-road', name: 'Tonk Road', area: 'South Jaipur' },
];

export const CATEGORIES = [
  { id: 'pyaaz-kachori', name: 'Pyaaz Kachori', shortName: 'Pyaaz', icon: '🧆' },
  { id: 'kachori', name: 'Kachori', shortName: 'Kachori', icon: '🧆' },
  { id: 'samosa', name: 'Samosa', shortName: 'Samosa', icon: '🥔' },
  { id: 'mirchi-bada', name: 'Mirchi Bada', shortName: 'Mirchi', icon: '🌶️' },
  { id: 'chaat', name: 'Chaat', shortName: 'Chaat', icon: '🥣' },
  { id: 'gol-gappe', name: 'Gol Gappe', shortName: 'Gol', icon: '🫧' },
  { id: 'pav-bhaji', name: 'Pav Bhaji', shortName: 'Pav', icon: '🍞' },
  { id: 'kulhad-chai', name: 'Kulhad Chai', shortName: 'Kulhad', icon: '☕' },
  { id: 'lassi', name: 'Lassi', shortName: 'Lassi', icon: '🥛' },
  { id: 'ghewar', name: 'Ghewar', shortName: 'Ghewar', icon: '🥞' },
  { id: 'jalebi', name: 'Jalebi', shortName: 'Jalebi', icon: '🍯' },
  { id: 'rabri', name: 'Rabri', icon: '🍮' },
  { id: 'dahi-vada', name: 'Dahi Vada', icon: '🥣' },
  { id: 'dal-baati', name: 'Dal Baati Churma', icon: '🍲' },
  { id: 'rajasthani-thali', name: 'Rajasthani Thali', icon: '🍛' },
  { id: 'sandwiches', name: 'Sandwiches', icon: '🥪' },
  { id: 'momos', name: 'Momos', icon: '🥟' },
  { id: 'burgers', name: 'Burgers', icon: '🍔' },
  { id: 'pizza', name: 'Pizza', icon: '🍕' },
  { id: 'desserts', name: 'Local Desserts', icon: '🧁' },
];

const VENDOR_NAMES = [
  'Rawat Mishthan Bhandar', 'LMB (Laxmi Misthan Bhandar)', 'Kanji Samosa Wala', 'Sodhani Sweets',
  'Masala Chowk Stall #7', 'Chai Garam Corner', 'Raja Park Kachori House', 'MI Road Chaat King',
  'Bapu Bazaar Samosa Centre', 'Johari Ghewar Specialists', 'Vaishali Lassi Bar', 'Mansarovar Momo Hub',
  'C-Scheme Pav Bhaji Junction', 'Tonk Road Thali Dhaba', 'Jagatpura Gol Gappe', 'Sindhi Camp Mirchi Bada',
  'Walled City Rabri Wala', 'Vidyadhar Nagar Sandwich Club', 'Malviya Nagar Burger Bros', 'Pink City Pizza Co.',
  'Heritage Kachori Gali', 'Ram Niwas Evening Chaat', 'Station Road Kulhad Chai', 'Tonk Phatak Samosa',
  'Gopal Ji Pyaaz Kachori', 'Sharma Ji Ki Kachori', 'Bikaner Bhujia House', 'Sethi Sweets & Snacks',
  'Nathu\'s Sweets', 'Anokhi Cafe Street', 'Late Night Mansarovar', 'Raja Park Dahi Vada', 'C-Scheme Dal Baati',
  'MI Road Jalebi Junction', 'Hidden Gem Chaat — C-Scheme', 'Local Favourite — Raja Park', 'Street Food Worth Detour',
  'Vaishali Nagar Dessert Lab', 'Bapu Bazaar Evening Snacks', 'Johari Bazaar Rabri Corner', 'Masala Chowk Thali Point',
];

const FIRST_NAMES = ['Rahul', 'Priya', 'Amit', 'Neha', 'Vikram', 'Anjali', 'Rohit', 'Kavita', 'Suresh', 'Pooja', 'Arjun', 'Meera', 'Karan', 'Divya', 'Sanjay'];
const REVIEW_SNIPPETS = [
  'Bilkul waise hi jaise pehle khaya tha — authentic taste!',
  'Queue thodi lambi hai par worth it. Best in Jaipur.',
  'Chai ke saath kachori — perfect combo after office.',
  'Price reasonable, hygiene better than expected for street stall.',
  'Delivery packaging was neat. Food still hot.',
  'Call karke confirm kiya — vendor bahut helpful.',
  'Hidden gem! Locals recommended on Instagram.',
  'Spice level perfect. Will reorder.',
  'Ghewar fresh tha, festival season quality.',
  'Late night open — lifesaver in Mansarovar.',
];

const FOOD_TEMPLATES = {
  'pyaaz-kachori': [
    { name: 'Pyaaz Kachori', desc: 'Crispy Rajasthani kachori stuffed with spicy onion filling.', base: 35, veg: true },
    { name: 'Mawa Kachori', desc: 'Sweet mawa-filled kachori, lightly fried.', base: 45, veg: true },
    { name: 'Dal Kachori', desc: 'Lentil-stuffed kachori with tangy chutney.', base: 30, veg: true },
  ],
  kachori: [
    { name: 'Plain Kachori', desc: 'Classic flaky kachori with potato filling.', base: 25, veg: true },
    { name: 'Heeng Kachori', desc: 'Asafoetida-flavoured special kachori.', base: 32, veg: true },
  ],
  samosa: [
    { name: 'Aloo Samosa', desc: 'Golden samosa with spiced potato.', base: 20, veg: true },
    { name: 'Paneer Samosa', desc: 'Crispy samosa with cottage cheese.', base: 35, veg: true },
  ],
  'mirchi-bada': [
    { name: 'Mirchi Bada', desc: 'Large green chilli fritter, Rajasthani style.', base: 25, veg: true },
    { name: 'Mirchi Bada Plate', desc: '2 pcs with chutney and onion.', base: 45, veg: true },
  ],
  chaat: [
    { name: 'Raj Kachori', desc: 'Giant kachori loaded with chaat toppings.', base: 80, veg: true },
    { name: 'Aloo Tikki Chaat', desc: 'Crispy tikki with yogurt and chutneys.', base: 60, veg: true },
    { name: 'Dahi Puri', desc: 'Crisp puris with sweet dahi and sev.', base: 55, veg: true },
  ],
  'gol-gappe': [
    { name: 'Gol Gappe (6 pcs)', desc: 'Tangy pani puri with spiced water.', base: 40, veg: true },
    { name: 'Gol Gappe (12 pcs)', desc: 'Party plate — share with friends.', base: 70, veg: true },
  ],
  'pav-bhaji': [
    { name: 'Pav Bhaji', desc: 'Buttery pav with mashed veggie bhaji.', base: 90, veg: true },
    { name: 'Cheese Pav Bhaji', desc: 'Extra cheese on classic bhaji.', base: 120, veg: true },
  ],
  'kulhad-chai': [
    { name: 'Kulhad Chai', desc: 'Masala chai served in earthen kulhad.', base: 20, veg: true },
    { name: 'Ginger Kulhad Chai', desc: 'Adrak wali chai, strong brew.', base: 25, veg: true },
  ],
  lassi: [
    { name: 'Sweet Lassi', desc: 'Thick creamy lassi, Jaipur style.', base: 50, veg: true },
    { name: 'Mango Lassi', desc: 'Seasonal mango blended lassi.', base: 70, veg: true },
  ],
  ghewar: [
    { name: 'Plain Ghewar', desc: 'Traditional honeycomb sweet.', base: 120, veg: true },
    { name: 'Malai Ghewar', desc: 'Topped with rabri and nuts.', base: 180, veg: true },
  ],
  jalebi: [
    { name: 'Hot Jalebi (250g)', desc: 'Fresh from kadhai, crispy coils.', base: 80, veg: true },
    { name: 'Jalebi with Rabri', desc: 'Classic pairing.', base: 110, veg: true },
  ],
  rabri: [
    { name: 'Rabri Bowl', desc: 'Slow-reduced sweet milk.', base: 60, veg: true },
  ],
  'dahi-vada': [
    { name: 'Dahi Vada (2 pcs)', desc: 'Soft lentil dumplings in yogurt.', base: 50, veg: true },
  ],
  'dal-baati': [
    { name: 'Dal Baati Churma', desc: 'Complete Rajasthani platter.', base: 220, veg: true },
    { name: 'Extra Baati', desc: 'Additional wheat baati.', base: 40, veg: true },
  ],
  'rajasthani-thali': [
    { name: 'Rajasthani Thali', desc: 'Dal, baati, churma, gatta, papad.', base: 250, veg: true },
    { name: 'Special Thali', desc: 'Includes ghewar piece.', base: 320, veg: true },
  ],
  sandwiches: [
    { name: 'Veg Grill Sandwich', desc: 'Street-style grilled sandwich.', base: 70, veg: true },
    { name: 'Paneer Tikka Sandwich', desc: 'Spiced paneer filling.', base: 95, veg: true },
  ],
  momos: [
    { name: 'Veg Steamed Momos (6)', desc: 'Classic cabbage-carrot filling.', base: 60, veg: true },
    { name: 'Chicken Fried Momos (6)', desc: 'Crispy fried momos.', base: 90, veg: false },
  ],
  burgers: [
    { name: 'Aloo Tikki Burger', desc: 'Desi tikki in soft bun.', base: 99, veg: true },
    { name: 'Chicken Burger', desc: 'Crispy chicken patty.', base: 149, veg: false },
  ],
  pizza: [
    { name: 'Margherita', desc: 'Cheese and basil on thin crust.', base: 199, veg: true },
    { name: 'Paneer Tikka Pizza', desc: 'Indian fusion favourite.', base: 249, veg: true },
  ],
  desserts: [
    { name: 'Kulfi Falooda', desc: 'Rose milk with vermicelli.', base: 90, veg: true },
    { name: 'Rasmalai (2 pcs)', desc: 'Soft cottage cheese in milk.', base: 80, veg: true },
  ],
};

function pick(arr, i) {
  return arr[i % arr.length];
}

function buildVendors() {
  const vendors = [];
  for (let i = 0; i < VENDOR_NAMES.length; i++) {
    const loc = pick(LOCATIONS, i);
    const primaryCats = [pick(CATEGORIES, i), pick(CATEGORIES, i + 3), pick(CATEGORIES, i + 7)];
    const rating = 3.8 + (i % 12) * 0.1;
    const reviews = 45 + (i * 37) % 890;
    const distance = 0.4 + (i % 15) * 0.35;
    const priceLevel = i % 3 === 0 ? '₹' : i % 3 === 1 ? '₹₹' : '₹₹₹';
    const openHour = i % 5 === 0 ? 10 : 8;
    const closeHour = i % 4 === 0 ? 23 : 22;
    const now = new Date();
    const hour = now.getHours();
    const isOpen = hour >= openHour && hour < closeHour;
    vendors.push({
      id: `v-${i + 1}`,
      name: VENDOR_NAMES[i],
      slug: VENDOR_NAMES[i].toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      locationId: loc.id,
      locationName: loc.name,
      area: loc.area,
      address: `${Math.floor(10 + (i % 90))}, ${loc.name}, Near ${loc.area}, Jaipur, Rajasthan 3020${(i % 9) + 1}`,
      cuisine: primaryCats.map((c) => c.name).join(' · '),
      categoryIds: [...new Set(primaryCats.map((c) => c.id))],
      rating: Math.min(4.9, rating),
      reviewCount: reviews,
      distanceKm: Math.round(distance * 10) / 10,
      priceLevel,
      phone: randomPhone(),
      coverImage: vendorCoverImage(i),
      avatarImage: vendorAvatarImage(i),
      popularDishes: primaryCats.map((c) => FOOD_TEMPLATES[c.id]?.[0]?.name || c.name),
      deliveryAvailable: i % 7 !== 0,
      callAndVerify: true,
      isOpen,
      hours: `${openHour}:00 AM – ${closeHour > 12 ? closeHour - 12 : closeHour}:00 PM`,
      hiddenGem: i % 6 === 2,
      trending: i % 5 === 1,
      topRated: rating >= 4.5,
      about: `${VENDOR_NAMES[i]} has been serving Jaipur locals near ${loc.name} for years. Known for ${primaryCats[0].name} and evening crowds. Call ahead during festivals.`,
      hygieneScore: 4 + (i % 10) / 10,
      vendorAccountId: `va-${i + 1}`,
    });
  }
  return vendors;
}

function buildFoods(vendors) {
  const foods = [];
  let fid = 1;
  vendors.forEach((v, vi) => {
    v.categoryIds.forEach((catId, ci) => {
      const templates = FOOD_TEMPLATES[catId] || FOOD_TEMPLATES.chaat;
      templates.forEach((t, ti) => {
        const price = t.base + (vi % 5) * 2 + ti * 3;
        const id = `f-${fid++}`;
        foods.push({
          id,
          vendorId: v.id,
          name: t.name,
          description: t.desc,
          categoryId: catId,
          price,
          portion: ti === 0 ? '1 serving' : 'Plate',
          veg: t.veg,
          popular: ti === 0 && vi % 3 === 0,
          available: vi % 11 !== 0,
          prepMinutes: 8 + (ti * 3) + (vi % 7),
          image: foodImageForItem(t.name, catId),
          options: [
            { id: 'qty-1', label: '1 piece', priceDelta: 0 },
            { id: 'qty-2', label: '2 pieces', priceDelta: Math.round(price * 0.85) },
            { id: 'qty-4', label: '4 pieces', priceDelta: Math.round(price * 2.8) },
          ],
          addons: [
            { id: 'ch-green', label: 'Green chutney', price: 5 },
            { id: 'ch-sweet', label: 'Sweet chutney', price: 5 },
            { id: 'ch-spicy', label: 'Extra spicy chutney', price: 8 },
          ],
          spiceLevels: ['Mild', 'Medium', 'Jaipur Spicy'],
        });
      });
    });
    // extra items for volume
    const extraCat = pick(CATEGORIES, vi + 2);
    const extra = (FOOD_TEMPLATES[extraCat.id] || [])[0];
    if (extra) {
      foods.push({
        id: `f-${fid++}`,
        vendorId: v.id,
        name: `${extra.name} Special`,
        description: extra.desc + ' — house special.',
        categoryId: extraCat.id,
        price: extra.base + 15,
        portion: '1 serving',
        veg: extra.veg,
        popular: true,
        available: true,
        prepMinutes: 12,
        image: foodImageForItem(extra.name, extraCat.id),
        options: [{ id: 'std', label: 'Standard', priceDelta: 0 }],
        addons: [],
        spiceLevels: ['Medium'],
      });
    }
  });
  return foods;
}

function buildReviews(vendors) {
  const reviews = [];
  let rid = 1;
  vendors.forEach((v, i) => {
    const count = 2 + (i % 4);
    for (let j = 0; j < count; j++) {
      reviews.push({
        id: `r-${rid++}`,
        vendorId: v.id,
        userName: pick(FIRST_NAMES, i + j),
        rating: 3 + ((i + j) % 3),
        text: pick(REVIEW_SNIPPETS, i + j),
        date: new Date(Date.now() - (i * 3 + j) * 86400000).toISOString(),
      });
    }
  });
  return reviews;
}

function buildHistoricalOrders(vendors, foods) {
  const orders = [];
  const statuses = ['delivered', 'delivered', 'delivered', 'cancelled', 'delivered'];
  for (let i = 0; i < 22; i++) {
    const v = pick(vendors, i);
    const vFoods = foods.filter((f) => f.vendorId === v.id).slice(0, 3);
    const items = vFoods.map((f, j) => ({
      foodId: f.id,
      name: f.name,
      price: f.price,
      qty: 1 + (j % 3),
      customizations: { option: f.options[0]?.label, addons: [] },
    }));
    const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
    orders.push({
      id: `hist-${i + 1}`,
      orderNumber: `JPR${10000 + i}`,
      vendorId: v.id,
      vendorName: v.name,
      items,
      subtotal,
      total: subtotal + 45 + 20 + 10 - (i % 2 ? 30 : 0),
      status: pick(statuses, i),
      createdAt: new Date(Date.now() - (i + 1) * 2 * 86400000).toISOString(),
      addressLabel: i % 2 ? 'Home' : 'Work',
      rated: i % 3 === 0,
    });
  }
  return orders;
}

export const VENDORS = buildVendors();
export const FOODS = buildFoods(VENDORS);
export const REVIEWS = buildReviews(VENDORS);
export const HISTORICAL_ORDERS = buildHistoricalOrders(VENDORS, FOODS);

export const POPULAR_SEARCHES = [
  'Best pyaaz kachori',
  'Kachori near Raja Park',
  'Chaat in C-Scheme',
  'Late night food',
  'Best lassi',
  'Ghewar near Johari Bazaar',
  'MI Road chaat',
  'Mansarovar momos',
];

export const DEALS = [
  { id: 'd1', title: '₹30 off on first order', code: 'JAIPUR30', min: 199 },
  { id: 'd2', title: 'Free chai with kachori platter', code: 'CHAIFREE', min: 149 },
  { id: 'd3', title: 'Weekend thali — 15% off', code: 'THALI15', min: 250 },
];

export function getVendor(id) {
  return VENDORS.find((v) => v.id === id);
}

export function getFood(id) {
  return FOODS.find((f) => f.id === id);
}

export function foodsByVendor(vendorId) {
  return FOODS.filter((f) => f.vendorId === vendorId);
}

export function reviewsByVendor(vendorId) {
  return REVIEWS.filter((r) => r.vendorId === vendorId);
}
