import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const SITE_DATA_KEY = 'jqf_site_content_v12';

const API_BASE = '/api';
export type RepairDevice = { id: string; title: string; desc: string; image: string };
export type Product = { id: string; name: string; category: string; price: number; oldPrice?: number; rating: number; badge?: string; image: string; stock: number; sku: string; active: boolean };
export type Announcement = { id: string; badge: string; date: string; title: string; desc: string; featured: boolean; image: string };
export type CommunityEvent = { id: string; date: string; badge: string; time: string; endTime: string; title: string; location: string; desc: string };
export type CommunityAction = { id: string; icon: string; badge: string; title: string; desc: string; progress: number; volunteers: number; image: string };
export type InventoryItem = { id: string; item: string; quantity: number; reserved: number; threshold: number; reason: string };
export type Order = { id: string; order: string; customer: string; total: string; status: string };
export type Customer = { id: string; name: string; phone: string; email: string; lifetimeSpend: string };
export type TradeIn = { id: string; customer: string; device: string; condition: string; offer: string; status: string };
export type Employee = { id: string; name: string; email: string; role: string; status: string };
export type Photo = { id: string; album: string; featured: string; url: string; count: number };
export type PromoCard = { id: string; eyebrow: string; headline: string; buttonText: string; image: string };

export type RepairService = { id: string; title: string; desc: string };
export type Membership = { headline: string; subtitle: string; price: number; perks: string[] };

export type SiteContent = {
  site: { name: string; tagline: string };
  repair: {
    promoBanner: string;
    heroEyebrow: string; heroHeadline: string; heroAccent: string; heroSubtitle: string;
    primaryBtn: string; secondaryBtn: string;
    heroBgImage: string; heroSideImage: string;
    heroCardTitle: string; heroCardDesc: string;
    checklistItems: string[];
    whyUsHeadline: string; whyUsSubtitle: string;
    whyUsAccent: string; whyUsBgImage: string;
    whyUsPoints: { id: string; title: string; desc: string }[];
    formHeadline: string; formSubtitle: string;
    servicesHeadline: string; servicesAccent: string;
    services: RepairService[];
    devices: RepairDevice[];
    reviews: { id: string; name: string; device: string; text: string; avatar: string }[];
    faqs: { id: string; q: string; a: string }[];
    locations: { id: string; city: string; address: string; distance: string; open: string }[];
    locationsBgImage: string;
  };
  shop: {
    promoBanner: string;
    heroHeadline: string; heroAccent: string; heroSubtitle: string; heroImage: string;
    products: Product[];
    promoCards: PromoCard[];
    membership: Membership;
  };
  community: {
    promoBanner: string;
    heroBgImage: string;
    countdownTarget: string;
    heroHeadline: string; heroSubtitle: string;
    announcements: Announcement[];
    events: CommunityEvent[];
    actions: CommunityAction[];
  };
  inventory: InventoryItem[];
  orders: Order[];
  customers: Customer[];
  tradeins: TradeIn[];
  employees: Employee[];
  photos: Photo[];
  settings: {
    storeName: string; contactEmail: string; phone: string; footer: string; visibility: string;
    hours: string; address: string; footerTagline: string;
    warrantyTitle: string; warrantyBody: string; warrantyBullets: string[];
  };
};

const DEFAULT: SiteContent = {
  site: { name: 'Jersey Quik Fix', tagline: 'Phone Repairs • Sales and Accessories' },
  repair: {
    promoBanner: 'SAME-DAY APPOINTMENTS AVAILABLE AT SELECT LOCATIONS.',
    heroEyebrow: 'LOCAL TECH REPAIR, MADE SIMPLE',
    heroHeadline: 'Broken tech?', heroAccent: 'We can fix that.',
    heroSubtitle: 'Fast, professional repairs for the devices you rely on every day—from cracked phone screens to game console HDMI ports.',
    primaryBtn: 'Start a Repair', secondaryBtn: 'Find a Store',
    heroBgImage: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?auto=format&fit=crop&w=1600&q=80',
    heroSideImage: '',
    heroCardTitle: 'Ready Today', heroCardDesc: 'Bring it in by 2 PM, get it back by dinner.',
    checklistItems: ['Free diagnostics', 'Same-day options', '1-year warranty'],
    whyUsHeadline: 'Why choose', whyUsAccent: 'Jersey Quik Fix?',
    whyUsSubtitle: 'We treat your devices like our own. Transparent pricing, expert technicians, and a guarantee you can trust.',
    whyUsBgImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1600&q=80',
    whyUsPoints: [
      { id: '1', title: 'Free Diagnostics', desc: 'Know what is wrong before paying a dime.' },
      { id: '2', title: 'Same-Day Service', desc: 'Most common repairs finished in under 2 hours.' },
      { id: '3', title: '1-Year Warranty', desc: 'Parts and labor guaranteed for a full year.' },
      { id: '4', title: 'Upfront Pricing', desc: 'No hidden fees or surprise charges. Ever.' },
    ],
    formHeadline: 'Tell us what happened.', formSubtitle: "Fill out the form and we'll generate a repair ticket instantly.",
    servicesHeadline: 'We fix what', servicesAccent: 'matters most.',
    services: [
      { id: '1', title: 'Phone Screen Repair', desc: 'OLED & LCD replacements for all brands' },
      { id: '2', title: 'Battery Replacement', desc: 'Bring your device back to peak capacity' },
      { id: '3', title: 'Computer Repair', desc: 'Hardware upgrades and OS fixes' },
      { id: '4', title: 'Console Repair', desc: 'HDMI ports, cleaning, and thermal paste' },
      { id: '5', title: 'Tablet Repair', desc: 'Screens, batteries, and charging ports' },
      { id: '6', title: 'Data & Setup Help', desc: 'Data recovery, transfers, and new setups' },
    ],
    devices: [
      { id: 'phone', title: 'Phone', desc: 'Apple, Samsung, Google and more.', image: '' },
      { id: 'computer', title: 'Computer', desc: 'Mac, Windows, laptops and desktops.', image: '' },
      { id: 'tablet', title: 'Tablet', desc: 'iPad, Galaxy Tab and more.', image: '' },
      { id: 'console', title: 'Console', desc: 'PlayStation, Xbox and Nintendo.', image: '' },
    ],
    reviews: [
      { id: '1', name: 'Alex M.', device: 'Phone screen repair', text: 'Booked in the morning and had my phone back before lunch. Fast, clear, and easy.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' },
      { id: '2', name: 'Jordan R.', device: 'Laptop repair', text: 'They explained the issue before doing any work and the final price matched the quote.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80' },
      { id: '3', name: 'Taylor K.', device: 'Game console repair', text: 'My console stopped displaying through HDMI. They fixed the port and tested everything with me.', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80' },
    ],
    faqs: [
      { id: '1', q: 'How long does a repair take?', a: 'Most common repairs like screen and battery replacements take under 2 hours.' },
      { id: '2', q: 'Do you charge to diagnose?', a: 'No, diagnostics are completely free.' },
      { id: '3', q: 'What devices do you repair?', a: 'We repair all major brands of phones, tablets, laptops, desktops, and game consoles.' },
      { id: '4', q: 'Do repairs come with a warranty?', a: 'Yes, all repairs are backed by our 1-year warranty.' },
    ],
    locations: [
      { id: '1', city: 'Downtown', address: '125 Market Street', distance: '1.2 mi', open: 'Open until 7 PM' },
      { id: '2', city: 'Northside', address: '4800 North Avenue', distance: '4.8 mi', open: 'Open until 8 PM' },
      { id: '3', city: 'West End', address: '892 West Plaza Drive', distance: '7.1 mi', open: 'Open until 7 PM' },
    ],
    locationsBgImage: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1600&q=80',
  },
  shop: {
    promoBanner: 'FREE SHIPPING ON ORDERS $49+ • SAME-DAY PICKUP AVAILABLE',
    heroHeadline: 'Gear Up', heroAccent: 'Your Device',
    heroSubtitle: 'Premium screen protectors, cases, chargers, and cables for every device we fix.',
    heroImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=80',
    products: [
      { id: '1', name: 'Screen Protector — iPhone 15 Pro', category: 'Protection', price: 14.99, rating: 4.8, badge: 'Best Seller', image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=900&q=80', stock: 40, sku: 'PR-SP-001', active: true },
      { id: '2', name: 'Tempered Glass Pack (3-Pack)', category: 'Protection', price: 9.99, oldPrice: 14.99, rating: 4.7, badge: 'Sale', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80', stock: 60, sku: 'PR-TG-001', active: true },
      { id: '3', name: 'MagSafe Phone Case', category: 'Cases', price: 24.99, rating: 4.6, badge: 'New', image: 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&w=900&q=80', stock: 25, sku: 'CS-MS-001', active: true },
      { id: '4', name: 'Rugged Drop-Proof Case', category: 'Cases', price: 29.99, rating: 4.9, image: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?auto=format&fit=crop&w=900&q=80', stock: 18, sku: 'CS-RG-001', active: true },
      { id: '5', name: 'USB-C Fast Charger 65W', category: 'Chargers', price: 29.99, oldPrice: 39.99, rating: 4.8, badge: 'Sale', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=80', stock: 30, sku: 'CH-UC-001', active: true },
      { id: '6', name: 'Wireless Charging Pad', category: 'Chargers', price: 34.99, rating: 4.5, image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=900&q=80', stock: 22, sku: 'CH-WL-001', active: true },
      { id: '7', name: 'Bluetooth Earbuds Pro', category: 'Audio', price: 49.99, rating: 4.7, badge: 'Hot', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80', stock: 14, sku: 'AU-EP-001', active: true },
      { id: '8', name: 'Lightning Cable 3-Pack', category: 'Cables', price: 19.99, rating: 4.6, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80', stock: 50, sku: 'CB-LT-001', active: true },
    ],
    promoCards: [
      { id: '1', eyebrow: 'Parts & Accessories', headline: 'Screen Protectors & Cases', buttonText: 'Shop Now', image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=1000&q=80' },
      { id: '2', eyebrow: 'New Arrivals', headline: 'Premium Chargers & Cables', buttonText: 'Shop Now', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1000&q=80' },
    ],
    membership: {
      headline: 'JQF+',
      subtitle: 'The ultimate cheat code for gamers.',
      price: 14.99,
      perks: [
        'Double reward points on all purchases',
        '10% extra trade-in credit',
        'Exclusive early access to restocks',
        'Free expedited shipping',
      ],
    },
  },
  community: {
    promoBanner: 'PRIVATE COMMUNITY • FAMILY & FRIENDS HUB',
    heroBgImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80',
    countdownTarget: '2026-09-19T14:00:00',
    heroHeadline: 'Stay connected to the moments that matter.',
    heroSubtitle: 'One place for family events, announcements, plans, and community updates.',
    announcements: [
      { id: '1', badge: 'Major Update', date: 'August 9', title: 'Family Weekend details are officially confirmed', desc: 'The date, location, food plan, and main activities are locked in. RSVP before September 5.', featured: true, image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80' },
      { id: '2', badge: 'Community', date: 'August 6', title: 'New shared photo archive is live', desc: 'We now have one central place for family photos, videos, old memories, and event albums.', featured: false, image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=900&q=80' },
      { id: '3', badge: 'Planning', date: 'August 3', title: 'Holiday planning group is now open', desc: 'Anyone who wants to help coordinate travel, food, gifts, or activities can join.', featured: false, image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80' },
    ],
    events: [
      { id: '1', date: '2026-09-19', badge: 'Featured', time: '14:00', endTime: '20:00', title: 'Annual Family Weekend', location: 'Riverside Park Pavilion', desc: 'Food, games, photos, family updates, and a full afternoon together.' },
      { id: '2', date: '2026-10-10', badge: 'Dinner', time: '18:30', endTime: '', title: 'Family Dinner Night', location: 'Downtown', desc: 'Monthly dinner night for everyone who can make it.' },
      { id: '3', date: '2026-11-26', badge: 'Holiday', time: '15:00', endTime: '', title: 'Thanksgiving Gathering', location: 'Family Home', desc: 'Dinner, dessert, family photos, and holiday planning.' },
    ],
    actions: [
      { id: '1', icon: '🏡', badge: 'In Progress', title: 'Help with the family move', desc: 'Coordinating vehicles, boxes, pickup times, and volunteers for moving day.', progress: 68, volunteers: 17, image: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=900&q=80' },
      { id: '2', icon: '🎁', badge: 'Organizing', title: 'Group birthday surprise', desc: 'Collecting contributions, planning the surprise, and coordinating arrival times.', progress: 42, volunteers: 11, image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=900&q=80' },
    ],
  },
  inventory: [],
  orders: [],
  customers: [],
  tradeins: [],
  employees: [],
  photos: [],
  settings: {
    storeName: 'Jersey Quik Fix', contactEmail: 'info@jerseyquikfix.com', phone: '1 (985) 228-2888',
    footer: '© 2026 Jersey Quik Fix. Phone Repairs • Sales and Accessories.', visibility: 'Public',
    hours: 'Mon – Sat: 9am – 7pm\nSun: 11am – 5pm',
    address: '',
    footerTagline: 'Fast, professional repairs for phones, tablets, laptops, and gaming consoles.',
    warrantyTitle: '1-Year Parts & Labor Warranty',
    warrantyBody: 'Every repair at Jersey Quik Fix is covered by our 1-year warranty on both parts and labor. If the same issue returns within 12 months of your repair, we fix it free of charge. Warranty covers manufacturing defects and workmanship — it does not cover new physical damage, liquid damage, or issues unrelated to the original repair.',
    warrantyBullets: ['Parts & labor covered', 'Free re-repair if issue returns', '12 months from repair date'],
  },
};

function mergeWithDefaults(parsed: any): SiteContent {
  const parsedRepair = parsed.repair ?? {};
  const parsedShop = parsed.shop ?? {};
  const parsedSettings = parsed.settings ?? {};
  return {
    ...DEFAULT,
    ...parsed,
    repair: {
      ...DEFAULT.repair,
      ...parsedRepair,
      services: parsedRepair.services ?? DEFAULT.repair.services,
      whyUsPoints: parsedRepair.whyUsPoints ?? DEFAULT.repair.whyUsPoints,
      checklistItems: parsedRepair.checklistItems ?? DEFAULT.repair.checklistItems,
      devices: parsedRepair.devices ?? DEFAULT.repair.devices,
      reviews: parsedRepair.reviews ?? DEFAULT.repair.reviews,
      faqs: parsedRepair.faqs ?? DEFAULT.repair.faqs,
      locations: parsedRepair.locations ?? DEFAULT.repair.locations,
    },
    shop: {
      ...DEFAULT.shop,
      ...parsedShop,
      products: parsedShop.products ?? DEFAULT.shop.products,
      promoCards: parsedShop.promoCards ?? DEFAULT.shop.promoCards,
      membership: { ...DEFAULT.shop.membership, ...(parsedShop.membership ?? {}) },
    },
    community: {
      ...DEFAULT.community,
      ...(parsed.community ?? {}),
      announcements: (parsed.community ?? {}).announcements ?? DEFAULT.community.announcements,
      events: (parsed.community ?? {}).events ?? DEFAULT.community.events,
      actions: (parsed.community ?? {}).actions ?? DEFAULT.community.actions,
    },
    settings: {
      ...DEFAULT.settings,
      ...parsedSettings,
      warrantyBullets: parsedSettings.warrantyBullets ?? DEFAULT.settings.warrantyBullets,
    },
  };
}
type SiteDataContextType = {
  content: SiteContent;
  updateContent: (updater: (prev: SiteContent) => SiteContent, adminToken?: string) => void;
  saveContent: (data: SiteContent, adminToken?: string) => void;
};

const SiteDataContext = createContext<SiteDataContextType | null>(null);

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(() => {
    // Start with localStorage as fast initial state while API loads
    try {
      const stored = localStorage.getItem(SITE_DATA_KEY);
      if (stored) return mergeWithDefaults(JSON.parse(stored));
    } catch {}
    return DEFAULT;
  });

  // On mount, try to load from the API (authoritative source)
  useEffect(() => {
    fetch(`${API_BASE}/site-content`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && typeof data === 'object') {
          const merged = mergeWithDefaults(data);
          setContent(merged);
          // Keep localStorage in sync as a fast-load cache
          localStorage.setItem(SITE_DATA_KEY, JSON.stringify(merged));
        }
      })
      .catch(() => {
        // API unavailable — fall back to localStorage (already loaded in useState)
      });
  }, []);

  const saveContent = (data: SiteContent, adminToken?: string) => {
    setContent(data);
    // Write to both localStorage (fast cache) and API (persistent)
    localStorage.setItem(SITE_DATA_KEY, JSON.stringify(data));
    if (adminToken) {
      fetch(`${API_BASE}/site-content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify(data),
      }).catch(() => {
        console.error('Failed to persist site content to API');
      });
    }
  };

  const updateContent = (updater: (prev: SiteContent) => SiteContent, adminToken?: string) => {
    setContent(prev => {
      const next = updater(prev);
      localStorage.setItem(SITE_DATA_KEY, JSON.stringify(next));
      if (adminToken) {
        fetch(`${API_BASE}/site-content`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
          body: JSON.stringify(next),
        }).catch(() => {
          console.error('Failed to persist site content to API');
        });
      }
      return next;
    });
  };

  return (
    <SiteDataContext.Provider value={{ content, updateContent, saveContent }}>
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  const ctx = useContext(SiteDataContext);
  if (!ctx) throw new Error('useSiteData must be used inside SiteDataProvider');
  return ctx;
}

export { DEFAULT as DEFAULT_CONTENT };
