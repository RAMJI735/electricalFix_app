export const ELECTRICAL_CATEGORIES = [
  { id: 'all', name: 'All Products', icon: '⚡' },
  { id: 'wires', name: 'Wires & Cables', icon: '🔌' },
  { id: 'switches', name: 'Switches & Sockets', icon: '🔘' },
  { id: 'mcb', name: 'MCB & Distribution', icon: '🛡️' },
  { id: 'lighting', name: 'LED & Fixtures', icon: '💡' },
  { id: 'smart', name: 'Smart Home & IOT', icon: '📡' },
  { id: 'tools', name: 'Electrician Tools', icon: '🧰' },
];

export const MOCK_PRODUCTS = [
  {
    _id: '6ad18b4e4368eccf079d420d',
    id: '6ad18b4e4368eccf079d420d',
    sku: 'p1',
    name: 'Havells Life Line Plus S3 FR-LSH 1.5 sq mm Wire',
    category: 'wires',
    spec: '90m Coil • Flame Retardant • Pure Copper',
    price: 1849,
    originalPrice: 2350,
    rating: 4.8,
    reviews: 142,
    badge: 'BESTSELLER',
    inStock: true,
    brand: 'Havells',
    type: 'product',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
  },
  {
    _id: '6ad18b4e4368eccf079d420e',
    id: '6ad18b4e4368eccf079d420e',
    sku: 'p2',
    name: 'Schneider Electric Opale 10A 1-Way Modular Switch',
    category: 'switches',
    spec: 'Polycarbonate • Silver Inlay Contacts • White',
    price: 68,
    originalPrice: 95,
    rating: 4.7,
    reviews: 98,
    badge: 'POPULAR',
    inStock: true,
    brand: 'Schneider',
    type: 'product',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80',
  },
  {
    _id: '6ad18b4e4368eccf079d420f',
    id: '6ad18b4e4368eccf079d420f',
    sku: 'p3',
    name: 'Legrand RX3 32A Double Pole C-Curve MCB',
    category: 'mcb',
    spec: '10kA Breaking Capacity • ISI Certified',
    price: 649,
    originalPrice: 820,
    rating: 4.9,
    reviews: 210,
    badge: 'HIGH DEMAND',
    inStock: true,
    brand: 'Legrand',
    type: 'product',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
  },
  {
    _id: '6ad18b4e4368eccf079d4210',
    id: '6ad18b4e4368eccf079d4210',
    sku: 'p4',
    name: 'Philips Astral 18W Round Slim LED Recessed Panel',
    category: 'lighting',
    spec: 'Cool Day White (6500K) • 1800 Lumens • Surge 2.5kV',
    price: 499,
    originalPrice: 750,
    rating: 4.6,
    reviews: 320,
    badge: '33% OFF',
    inStock: true,
    brand: 'Philips',
    type: 'product',
    image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=400&q=80',
  },
  {
    _id: '6ad18b4e4368eccf079d4211',
    id: '6ad18b4e4368eccf079d4211',
    sku: 'p5',
    name: 'Anchor by Panasonic Roma 4-Module Concealed Metal Box',
    category: 'switches',
    spec: '18 Gauge Galvanized Steel • Anti-Rust Zinc Plated',
    price: 110,
    originalPrice: 150,
    rating: 4.5,
    reviews: 75,
    badge: 'HEAVY DUTY',
    inStock: true,
    brand: 'Anchor',
    type: 'product',
    image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=400&q=80',
  },
  {
    _id: '6ad18b4e4368eccf079d4212',
    id: '6ad18b4e4368eccf079d4212',
    sku: 'p6',
    name: 'Sonoff Smart WiFi 4-Gang Touch Wall Switch',
    category: 'smart',
    spec: 'Alexa & Google Home Compatible • Timer & Schedule',
    price: 2199,
    originalPrice: 2899,
    rating: 4.7,
    reviews: 64,
    badge: 'IOT READY',
    inStock: true,
    brand: 'Sonoff',
    type: 'product',
    image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80',
  },
  {
    _id: '6ad18b4e4368eccf079d4213',
    id: '6ad18b4e4368eccf079d4213',
    sku: 'p7',
    name: 'Stanley Electrical Multi-Meter & Voltage Detector Kit',
    category: 'tools',
    spec: 'True RMS • CAT III 600V • Auto-Ranging Digital Display',
    price: 1450,
    originalPrice: 1999,
    rating: 4.9,
    reviews: 180,
    badge: 'PRO TOOL',
    inStock: true,
    brand: 'Stanley',
    type: 'product',
    image: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?auto=format&fit=crop&w=400&q=80',
  },
  {
    _id: '6ad18b4e4368eccf079d4214',
    id: '6ad18b4e4368eccf079d4214',
    sku: 'p8',
    name: 'Polycab Maxima Green 2.5 sq mm Submersible Flat Cable',
    category: 'wires',
    spec: '100m Drum • High Water Resistance • Grade A Electrolytic Copper',
    price: 3499,
    originalPrice: 4200,
    rating: 4.8,
    reviews: 89,
    badge: 'GRADE A',
    inStock: true,
    brand: 'Polycab',
    type: 'product',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
  },
];

// Map category slugs to backend MongoDB ObjectIds
export const CATEGORY_MAP = {
  wires: '6ae77029f711504e9b464587',
  switches: '6ae77029f711504e9b464588',
  mcb: '6ae77029f711504e9b464589',
  lighting: '6ae77029f711504e9b46458a',
  smart: '6ae77029f711504e9b46458b',
  tools: '6ae77029f711504e9b46458c',
  solar: '6ae77029f711504e9b46458d',
  motors: '6ae77029f711504e9b46458e',
};

// Check if two category identifiers match (handles slugs and Mongo ObjectIds)
export const isCategoryMatch = (catA, catB) => {
  if (!catA || !catB) return false;
  if (catA === catB) return true;
  if (catA === 'all' || catB === 'all') return false;

  for (const [slug, id] of Object.entries(CATEGORY_MAP)) {
    if ((catA === slug || catA === id) && (catB === slug || catB === id)) {
      return true;
    }
  }
  return false;
};

// Format a product/mock product to standard shop card structure
export const formatCatalogProduct = (item) => {
  const price = Number(item.price) || 0;
  const origPrice =
    Number(item.originalPrice) && Number(item.originalPrice) > price
      ? Number(item.originalPrice)
      : Number(item.effectiveOriginalPrice) || Math.round(price * 1.25);
  const discount =
    origPrice > price
      ? Math.round(((origPrice - price) / origPrice) * 100)
      : 0;

  return {
    ...item,
    id: item._id || item.id,
    name:
      item.serviceName ||
      item.productName ||
      item.name ||
      'Electrical Product',
    brand: item.brand || 'VOLTLINE',
    model: item.model || '',
    spec: item.estimated_time
      ? `⏱ ${item.estimated_time} • Warranty: ${item.warranty || '90 Days'}`
      : item.description ||
        item.spec ||
        'Certified Electrical Equipment',
    price,
    originalPrice: origPrice,
    discountPercentage: discount,
    rating: typeof item.rating === 'number' ? item.rating : 4.8,
    reviews:
      typeof item.reviewsCount === 'number'
        ? item.reviewsCount
        : item.reviews || 48,
    badge:
      item.badge ||
      (item.type === 'service' ? 'SERVICE' : 'VERIFIED'),
    inStock:
      item.inStock !== false &&
      (item.stock === undefined || item.stock > 0),
    image:
      item.image ||
      (Array.isArray(item.images) ? item.images[0] : '') ||
      '',
    category:
      item.category?._id ||
      item.category ||
      'general',
    isBackend: Boolean(item.isBackend),
  };
};

// Get fallback mock products for a given category and optional search query
export const getFallbackProductsForCategory = (categoryId = 'all', searchQuery = '') => {
  let list = MOCK_PRODUCTS.map(formatCatalogProduct);

  if (categoryId && categoryId !== 'all') {
    list = list.filter((item) => isCategoryMatch(item.category, categoryId));
  }

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    list = list.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.brand && item.brand.toLowerCase().includes(q)) ||
        (item.spec && item.spec.toLowerCase().includes(q))
    );
  }

  return list;
};

