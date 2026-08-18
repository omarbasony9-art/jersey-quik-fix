/**
 * seed.ts — Full Jersey Quik Fix product catalog
 * ~160 products across all categories.
 * Idempotent: skips if products table already has ≥ 20 rows.
 * Prices are the single source of truth — update here to change storefront prices.
 * Images use official manufacturer CDNs where verified; admin can override via the admin panel.
 */
import { pool } from "@workspace/db";
import { randomUUID } from "crypto";

// ── CDN helpers ──────────────────────────────────────────────────────────────
const A = (k: string) =>
  `https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/${k}?wid=940&hei=1112&fmt=p-jpg&qlt=95`;
const PS = (k: string) =>
  `https://gmedia.playstation.com/is/image/SIEPDC/${k}`;
const XB = (k: string) =>
  `https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/${k}`;
const NIN = (k: string) =>
  `https://assets.nintendo.com/image/upload/ar_16:9,b_auto:border,c_lpad/b_white/f_auto/q_auto/dpr_auto/c_scale,w_820/ncom/en_US/switch/${k}`;

// ── Seed product type ────────────────────────────────────────────────────────
interface SP {
  sku: string; name: string; category: string; subcategory?: string;
  description: string; price: number; oldPrice?: number; priceNote?: string;
  condition: string; configuration?: object; stock: number; images: string[];
  badge?: string; rating: number; active: boolean; featured: boolean;
  verified: boolean; verificationNote?: string;
}

// ── Category constants ───────────────────────────────────────────────────────
const C = {
  IPHONE: "iPhone", MACBOOK: "MacBook", PS: "PlayStation", XBOX: "Xbox",
  NINTENDO: "Nintendo", SEGA: "Sega / Retro", ARCADE: "Arcade Machines",
  GAMES: "Video Games", ACCESSORIES: "Accessories", APPLE: "Apple",
  TABLETS: "Tablets", CONTROLLERS: "Controllers",
};

// ════════════════════════════════════════════════════════════════════════════
// ARCADE MACHINES
// ════════════════════════════════════════════════════════════════════════════
const ARCADE: SP[] = [
  {
    sku: "ARC-SIMP-4P", name: "Arcade1Up The Simpsons 4-Player Arcade Cabinet",
    category: C.ARCADE, subcategory: "Arcade1Up",
    description: "Full-size Arcade1Up cabinet featuring The Simpsons beat-em-up classic with 4-player simultaneous gameplay. Includes riser, light-up marquee, and custom cabinet artwork.",
    price: 649, condition: "Used-Good",
    configuration: { playerCount: 4, cabinetType: "Full-Size", pickupOnly: true, availability: "Contact us for pickup or local delivery options" },
    stock: 1, featured: true, active: true, verified: true, rating: 4.9,
    images: ["https://cdn.shopify.com/s/files/1/0452/5007/0027/files/simpsons-4-player-arcade-cabinet-main.jpg"],
    badge: "In Stock",
  },
  {
    sku: "ARC-SIMP-STOOL", name: "Arcade1Up The Simpsons Matching Arcade Stool",
    category: C.ARCADE, subcategory: "Arcade1Up",
    description: "Official Arcade1Up barstool with The Simpsons artwork. Designed to match the Simpsons 4-Player Cabinet. Height-adjustable, padded seat.",
    price: 79, condition: "Used-Good",
    configuration: { pickupOnly: true, availability: "Contact us for pickup or local delivery options" },
    stock: 1, featured: false, active: true, verified: true, rating: 4.7,
    images: [],
    priceNote: "Sold separately from the cabinet",
  },
  {
    sku: "ARC-NBAJAM-4P", name: "Arcade1Up NBA Jam 4-Player Arcade Cabinet",
    category: C.ARCADE, subcategory: "Arcade1Up",
    description: "NBA Jam — 'Boomshakalaka!' — in a full Arcade1Up 4-player cabinet. Features the original arcade game with updated rosters. Light-up marquee and riser included.",
    price: 679, condition: "Used-Good",
    configuration: { playerCount: 4, cabinetType: "Full-Size", pickupOnly: true, availability: "Contact us for pickup or local delivery options" },
    stock: 1, featured: true, active: true, verified: true, rating: 4.8,
    images: [],
    badge: "In Stock",
  },
  {
    sku: "ARC-TMNT-4P", name: "Arcade1Up Teenage Mutant Ninja Turtles 4-Player Cabinet",
    category: C.ARCADE, subcategory: "Arcade1Up",
    description: "Classic TMNT arcade action for up to 4 players. Includes Teenage Mutant Ninja Turtles and Turtles in Time. Full-size Arcade1Up cabinet with lit marquee.",
    price: 699, condition: "Used-Good",
    configuration: { playerCount: 4, cabinetType: "Full-Size", pickupOnly: true, availability: "Contact us for pickup or local delivery options" },
    stock: 1, featured: true, active: true, verified: true, rating: 4.9,
    images: [],
    badge: "In Stock",
  },
  {
    sku: "ARC-DRAGLAIR", name: "Arcade1Up Dragon's Lair Cabinet",
    category: C.ARCADE, subcategory: "Arcade1Up",
    description: "The legendary Dragon's Lair laserdisc game in an Arcade1Up cabinet. Stunningly animated Don Bluth artwork on the cabinet and marquee.",
    price: 549, condition: "Used-Good",
    configuration: { playerCount: 1, cabinetType: "Full-Size", pickupOnly: true, availability: "Contact us for pickup or local delivery options" },
    stock: 1, featured: false, active: true, verified: true, rating: 4.7,
    images: [],
  },
  {
    sku: "ARC-SF2CE", name: "Arcade1Up Street Fighter II Champion Edition Cabinet",
    category: C.ARCADE, subcategory: "Arcade1Up",
    description: "Street Fighter II Champion Edition in an authentic Arcade1Up cabinet. Includes multiple SF II titles. Joystick and buttons tuned to the original arcade feel.",
    price: 579, condition: "Used-Good",
    configuration: { playerCount: 2, cabinetType: "Full-Size", pickupOnly: true, availability: "Contact us for pickup or local delivery options" },
    stock: 1, featured: true, active: true, verified: true, rating: 4.8,
    images: [],
    badge: "In Stock",
  },
  {
    sku: "ARC-MK2", name: "Arcade1Up Mortal Kombat II Midway Cabinet",
    category: C.ARCADE, subcategory: "Arcade1Up",
    description: "Finish him! Arcade1Up Mortal Kombat II cabinet featuring the classic Midway fighting game. Authentic cabinet graphics and responsive controls.",
    price: 599, condition: "Used-Good",
    configuration: { playerCount: 2, cabinetType: "Full-Size", pickupOnly: true, availability: "Contact us for pickup or local delivery options" },
    stock: 1, featured: true, active: true, verified: true, rating: 4.8,
    images: [],
    badge: "In Stock",
  },
  {
    sku: "ARC-NFLBLITZ-4P", name: "Arcade1Up NFL Blitz Legends 4-Player Cabinet",
    category: C.ARCADE, subcategory: "Arcade1Up",
    description: "Relive the golden age of arcade football. Arcade1Up NFL Blitz Legends 4-player cabinet with multiple classic NFL Blitz titles, lit marquee, and full riser.",
    price: 619, condition: "Used-Good",
    configuration: { playerCount: 4, cabinetType: "Full-Size", pickupOnly: true, availability: "Contact us for pickup or local delivery options" },
    stock: 1, featured: false, active: true, verified: true, rating: 4.7,
    images: [],
    badge: "In Stock",
  },
];

// ════════════════════════════════════════════════════════════════════════════
// PLAYSTATION
// ════════════════════════════════════════════════════════════════════════════
const PLAYSTATION: SP[] = [
  {
    sku: "PS5-DISC", name: "PlayStation 5 Disc Edition",
    category: C.PS, subcategory: "PS5",
    description: "Sony PlayStation 5 Disc Edition. Plays PS5 and PS4 disc games. 825GB SSD, DualSense controller, HDMI cable, power cord. 4K gaming up to 120fps.",
    price: 419, condition: "Used-Good",
    configuration: { storageOptions: ["825GB SSD"], conditions: ["Good", "Excellent", "Fair"], conditionPricing: { "Good": 0, "Excellent": 60, "Fair": -80 } },
    stock: 1, featured: true, active: true, verified: true, rating: 4.9,
    images: [PS("ps5-product-thumbnail-01-en-14sep21"), PS("ps5-console-side-ps5-thumbnail-01-en-12oct22")],
    badge: "Hot",
  },
  {
    sku: "PS5-DIGITAL", name: "PlayStation 5 Digital Edition",
    category: C.PS, subcategory: "PS5",
    description: "Sony PlayStation 5 Digital Edition. No disc drive — all-digital gaming. 825GB SSD, DualSense controller. Slimmer and lighter than the Disc Edition.",
    price: 349, condition: "Used-Good",
    configuration: { storageOptions: ["825GB SSD"], conditions: ["Good", "Excellent", "Fair"], conditionPricing: { "Good": 0, "Excellent": 60, "Fair": -70 } },
    stock: 1, featured: true, active: true, verified: true, rating: 4.8,
    images: [PS("ps5-digital-edition-product-thumbnail-01-en-14sep21")],
  },
  {
    sku: "PS4-SLIM", name: "PlayStation 4 Slim",
    category: C.PS, subcategory: "PS4",
    description: "Sony PlayStation 4 Slim 500GB or 1TB. Compact PS4 with full game library access. Plays PS4 disc games. DualShock 4 controller included.",
    price: 199, condition: "Used-Good",
    configuration: { storageOptions: ["500GB", "1TB"], pricingByStorage: { "500GB": 0, "1TB": 40 }, conditions: ["Good", "Excellent", "Fair"], conditionPricing: { "Good": 0, "Excellent": 40, "Fair": -50 } },
    stock: 1, featured: false, active: true, verified: true, rating: 4.7,
    images: [],
  },
  {
    sku: "PS3-FAT", name: "PlayStation 3 Fat (Original)",
    category: C.PS, subcategory: "PS3",
    description: "Original \"Fat\" PlayStation 3. Plays PS3 and PS2 game discs (early models). Iconic design. Comes with controller and power cord.",
    price: 79, condition: "Used-Good",
    configuration: { conditions: ["Good", "Fair"], conditionPricing: { "Good": 0, "Fair": -25 } },
    stock: 1, featured: false, active: true, verified: true, rating: 4.4,
    images: [],
    priceNote: "Early 60GB model plays PS2 games; later models do not",
  },
  {
    sku: "PS2-SLIM", name: "PlayStation 2 Slim",
    category: C.PS, subcategory: "PS2",
    description: "Slim redesign of the best-selling PlayStation 2. Plays the massive PS2 game library. Includes controller and memory card.",
    price: 64, condition: "Used-Good",
    configuration: { conditions: ["Good", "Fair"], conditionPricing: { "Good": 0, "Fair": -20 } },
    stock: 1, featured: false, active: true, verified: true, rating: 4.6,
    images: [],
  },
  {
    sku: "PS1-OG", name: "Original PlayStation (PS1)",
    category: C.PS, subcategory: "PS1",
    description: "The original PlayStation that started it all. SCPH-100x series. Plays original PlayStation discs. DualShock controller compatible.",
    price: 54, condition: "Used-Good",
    configuration: { conditions: ["Good", "Fair"], conditionPricing: { "Good": 0, "Fair": -15 } },
    stock: 1, featured: false, active: true, verified: true, rating: 4.5,
    images: [],
  },
  {
    sku: "PS5-DUALSENSE", name: "DualSense Wireless Controller (PS5)",
    category: C.CONTROLLERS, subcategory: "PlayStation",
    description: "Official Sony DualSense wireless controller for PlayStation 5. Haptic feedback and adaptive triggers. White colorway.",
    price: 54, condition: "Used-Good",
    configuration: { conditions: ["Good", "Excellent", "Fair"], conditionPricing: { "Good": 0, "Excellent": 20, "Fair": -20 } },
    stock: 1, featured: false, active: true, verified: true, rating: 4.8,
    images: [PS("dualsense-product-thumbnail-01-en-19may21")],
  },
  {
    sku: "BACKBONE-PS-IOS", name: "Backbone One PlayStation Edition (iPhone)",
    category: C.CONTROLLERS, subcategory: "Mobile Gaming",
    description: "Backbone One mobile gaming controller in PlayStation Edition colorway. Connects to Lightning or USB-C iPhone. Turns your phone into a PlayStation-style portable console.",
    price: 99, condition: "Used-Good",
    configuration: { conditions: ["Good", "Excellent"], conditionPricing: { "Good": 0, "Excellent": 25 } },
    stock: 1, featured: false, active: true, verified: true, rating: 4.6,
    images: [],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// XBOX
// ════════════════════════════════════════════════════════════════════════════
const XBOX: SP[] = [
  {
    sku: "XBOX-SX", name: "Xbox Series X",
    category: C.XBOX, subcategory: "Xbox Series",
    description: "Microsoft Xbox Series X. The most powerful Xbox ever. 1TB SSD, 4K gaming at 60fps (up to 120fps), ray tracing, Xbox Velocity Architecture. Includes one controller.",
    price: 379, condition: "Used-Good",
    configuration: { storageOptions: ["1TB SSD"], conditions: ["Good", "Excellent", "Fair"], conditionPricing: { "Good": 0, "Excellent": 60, "Fair": -80 } },
    stock: 1, featured: true, active: true, verified: true, rating: 4.9,
    images: [XB("RE4mRni")],
    badge: "Hot",
  },
  {
    sku: "XBOX-SS-512", name: "Xbox Series S (512GB)",
    category: C.XBOX, subcategory: "Xbox Series",
    description: "Microsoft Xbox Series S 512GB — the compact all-digital next-gen console. 1440p gaming, SSD speed, Xbox Game Pass compatible.",
    price: 239, condition: "Used-Good",
    configuration: { storageOptions: ["512GB SSD"], conditions: ["Good", "Excellent", "Fair"], conditionPricing: { "Good": 0, "Excellent": 40, "Fair": -60 } },
    stock: 1, featured: false, active: true, verified: true, rating: 4.7,
    images: [XB("RE4mT3R")],
  },
  {
    sku: "XBOX-SS-1TB", name: "Xbox Series S (1TB)",
    category: C.XBOX, subcategory: "Xbox Series",
    description: "Microsoft Xbox Series S 1TB edition. More storage for your all-digital game library. Compact design, fast SSD, Xbox Velocity Architecture.",
    price: 279, condition: "Used-Good",
    configuration: { conditions: ["Good", "Excellent", "Fair"], conditionPricing: { "Good": 0, "Excellent": 40, "Fair": -60 } },
    stock: 0, featured: false, active: true, verified: true, rating: 4.7,
    images: [],
  },
  {
    sku: "XBOX-ONE-X", name: "Xbox One X (1TB)",
    category: C.XBOX, subcategory: "Xbox One",
    description: "Microsoft Xbox One X — the enhanced 4K Xbox. 1TB HDD, 4K UHD Blu-ray, HDR. Compatible with entire Xbox One game library.",
    price: 179, condition: "Used-Good",
    configuration: { conditions: ["Good", "Fair"], conditionPricing: { "Good": 0, "Fair": -50 } },
    stock: 1, featured: false, active: true, verified: true, rating: 4.6,
    images: [],
  },
  {
    sku: "XBOX-ONE-S", name: "Xbox One S (1TB)",
    category: C.XBOX, subcategory: "Xbox One",
    description: "Microsoft Xbox One S 1TB. 4K Blu-ray, HDR support, streamlined white design. Great entry-level Xbox with the full One game library.",
    price: 149, condition: "Used-Good",
    configuration: { conditions: ["Good", "Fair"], conditionPricing: { "Good": 0, "Fair": -40 } },
    stock: 1, featured: false, active: true, verified: true, rating: 4.5,
    images: [],
  },
  {
    sku: "XBOX-ONE-OG", name: "Xbox One (Original, 500GB)",
    category: C.XBOX, subcategory: "Xbox One",
    description: "Original Microsoft Xbox One 500GB. Full Xbox One game library compatible. Includes controller and HDMI cable.",
    price: 119, condition: "Used-Good",
    configuration: { conditions: ["Good", "Fair"], conditionPricing: { "Good": 0, "Fair": -35 } },
    stock: 0, featured: false, active: true, verified: true, rating: 4.3,
    images: [],
  },
  {
    sku: "XBOX-360", name: "Xbox 360 (Slim)",
    category: C.XBOX, subcategory: "Xbox 360",
    description: "Microsoft Xbox 360 Slim. Plays the vast Xbox 360 library. Slim redesign with smaller footprint and quieter operation.",
    price: 69, condition: "Used-Good",
    configuration: { conditions: ["Good", "Fair"], conditionPricing: { "Good": 0, "Fair": -20 } },
    stock: 0, featured: false, active: true, verified: true, rating: 4.4,
    images: [],
  },
  {
    sku: "XBOX-OG", name: "Original Microsoft Xbox",
    category: C.XBOX, subcategory: "Original Xbox",
    description: "The original Microsoft Xbox (2001). Classic black design. Plays original Xbox disc games. Includes Duke or S controller.",
    price: 59, condition: "Used-Good",
    configuration: { conditions: ["Good", "Fair"], conditionPricing: { "Good": 0, "Fair": -20 } },
    stock: 0, featured: false, active: true, verified: true, rating: 4.3,
    images: [],
  },
  {
    sku: "XBOX-CTRL-WIRELESS", name: "Xbox Wireless Controller",
    category: C.CONTROLLERS, subcategory: "Xbox",
    description: "Official Microsoft Xbox Wireless Controller. Compatible with Xbox Series X/S, Xbox One, and Windows PC. Textured grip, 3.5mm audio jack.",
    price: 44, condition: "Used-Good",
    configuration: { conditions: ["Good", "Excellent", "Fair"], conditionPricing: { "Good": 0, "Excellent": 15, "Fair": -15 } },
    stock: 1, featured: false, active: true, verified: true, rating: 4.7,
    images: [],
  },
  {
    sku: "XBOX-CTRL-OG", name: "Original Xbox Controller (Duke)",
    category: C.CONTROLLERS, subcategory: "Xbox",
    description: "The original \"Duke\" controller for the first Microsoft Xbox (2001). A collector's piece for retro gaming fans.",
    price: 34, condition: "Used-Good",
    configuration: { conditions: ["Good", "Fair"], conditionPricing: { "Good": 0, "Fair": -10 } },
    stock: 0, featured: false, active: true, verified: true, rating: 4.2,
    images: [],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// NINTENDO
// ════════════════════════════════════════════════════════════════════════════
const NINTENDO: SP[] = [
  {
    sku: "NSW2", name: "Nintendo Switch 2",
    category: C.NINTENDO, subcategory: "Switch 2",
    description: "The next-generation Nintendo Switch. Larger 7.9-inch LCD display, enhanced Joy-Con with new C button, HDR output, and backward compatibility with most Switch games.",
    price: 379, condition: "New / Open Box",
    configuration: { conditions: ["New / Open Box", "Used-Good"], conditionPricing: { "New / Open Box": 0, "Used-Good": -50 } },
    stock: 1, featured: true, active: true, verified: true, rating: 4.9,
    images: [],
    badge: "New",
  },
  {
    sku: "NSW2-MK-BUNDLE", name: "Nintendo Switch 2 — Mario Kart World Bundle",
    category: C.NINTENDO, subcategory: "Switch 2",
    description: "Nintendo Switch 2 console bundled with Mario Kart World. Includes console, Joy-Con controllers, dock, and Mario Kart World game card.",
    price: 439, condition: "New / Open Box",
    configuration: { conditions: ["New / Open Box", "Used-Good"], conditionPricing: { "New / Open Box": 0, "Used-Good": -60 } },
    stock: 1, featured: true, active: true, verified: true, rating: 5.0,
    images: [],
    badge: "Bundle",
  },
  {
    sku: "NSW-HAC", name: "Nintendo Switch (Original)",
    category: C.NINTENDO, subcategory: "Switch",
    description: "Original Nintendo Switch. 6.2-inch touchscreen, TV and handheld modes. Includes dock, Joy-Con pair, and Joy-Con grip. Access to the full Switch game library.",
    price: 219, condition: "Used-Good",
    configuration: { conditions: ["Good", "Excellent", "Fair"], conditionPricing: { "Good": 0, "Excellent": 40, "Fair": -50 } },
    stock: 1, featured: true, active: true, verified: true, rating: 4.8,
    images: [NIN("site-design-update/hardware/switch/nintendo-switch-oled-model-white-set/orange-white/nintendo-switch-neon-blue-neon-red")],
  },
  {
    sku: "NSW-OLED", name: "Nintendo Switch OLED Model",
    category: C.NINTENDO, subcategory: "Switch",
    description: "Nintendo Switch with a vibrant 7-inch OLED display. Wider adjustable stand, enhanced audio, 64GB internal storage, wired LAN port in dock.",
    price: 279, condition: "Used-Good",
    configuration: { colors: ["White", "Neon Red/Blue"], conditions: ["Good", "Excellent", "Fair"], conditionPricing: { "Good": 0, "Excellent": 40, "Fair": -60 } },
    stock: 1, featured: true, active: true, verified: true, rating: 4.9,
    images: [],
    badge: "Popular",
  },
  {
    sku: "NSW-LITE", name: "Nintendo Switch Lite",
    category: C.NINTENDO, subcategory: "Switch",
    description: "Nintendo Switch Lite — handheld-only compact design. 5.5-inch touchscreen, integrated controls, up to 7 hours battery. Plays all Switch games in handheld mode.",
    price: 159, condition: "Used-Good",
    configuration: { colors: ["Yellow", "Gray", "Turquoise", "Coral", "Blue"], conditions: ["Good", "Excellent", "Fair"], conditionPricing: { "Good": 0, "Excellent": 30, "Fair": -40 } },
    stock: 1, featured: false, active: true, verified: true, rating: 4.7,
    images: [],
  },
  {
    sku: "WII-BLACK", name: "Nintendo Wii (Black)",
    category: C.NINTENDO, subcategory: "Wii",
    description: "Black Nintendo Wii console. Includes Wii Remote and Nunchuk. Plays Wii discs and has access to Virtual Console classic games.",
    price: 54, condition: "Used-Good",
    configuration: { conditions: ["Good", "Fair"], conditionPricing: { "Good": 0, "Fair": -15 } },
    stock: 1, featured: false, active: true, verified: true, rating: 4.5,
    images: [],
  },
  {
    sku: "WIIU", name: "Nintendo Wii U",
    category: C.NINTENDO, subcategory: "Wii U",
    description: "Nintendo Wii U console with GamePad controller. 32GB internal storage. Plays Wii U disc games and backward-compatible Wii games.",
    price: 79, condition: "Used-Good",
    configuration: { conditions: ["Good", "Fair"], conditionPricing: { "Good": 0, "Fair": -25 } },
    stock: 1, featured: false, active: true, verified: true, rating: 4.4,
    images: [],
  },
  {
    sku: "NDS-LITE", name: "Nintendo DS Lite",
    category: C.NINTENDO, subcategory: "DS",
    description: "Compact Nintendo DS Lite handheld. Dual screens (upper LCD + touch), built-in microphone, backward compatible with GBA games.",
    price: 54, condition: "Used-Good",
    configuration: { conditions: ["Good", "Fair"], conditionPricing: { "Good": 0, "Fair": -20 } },
    stock: 1, featured: false, active: true, verified: true, rating: 4.6,
    images: [],
  },
  {
    sku: "N3DS-XL", name: "Nintendo 3DS XL",
    category: C.NINTENDO, subcategory: "3DS",
    description: "Nintendo 3DS XL with large upper screen. Glasses-free 3D gaming. Plays full 3DS and DS game libraries. Includes charger.",
    price: 89, condition: "Used-Good",
    configuration: { conditions: ["Good", "Fair"], conditionPricing: { "Good": 0, "Fair": -25 } },
    stock: 1, featured: false, active: true, verified: true, rating: 4.6,
    images: [],
  },
  {
    sku: "N3DS-XL-ZELDA", name: "Nintendo 3DS XL — Zelda Edition",
    category: C.NINTENDO, subcategory: "3DS",
    description: "Limited-edition Zelda-themed Nintendo 3DS XL. Gold and black design with Hyrule crest. Collector's item for Zelda fans. Plays full 3DS and DS library.",
    price: 149, condition: "Used-Good",
    configuration: { conditions: ["Good", "Excellent", "Fair"], conditionPricing: { "Good": 0, "Excellent": 50, "Fair": -30 } },
    stock: 1, featured: true, active: true, verified: true, rating: 4.9,
    images: [],
    badge: "Limited Edition",
  },
  {
    sku: "GAMEBOY-DMG", name: "Nintendo Game Boy (Original)",
    category: C.NINTENDO, subcategory: "Game Boy",
    description: "Original Nintendo Game Boy (DMG-01, 1989). Grey brick design, 4 AA batteries, plays original Game Boy cartridges. Retro gaming classic.",
    price: 74, condition: "Used-Good",
    configuration: { conditions: ["Good", "Fair"], conditionPricing: { "Good": 0, "Fair": -20 } },
    stock: 1, featured: false, active: true, verified: true, rating: 4.5,
    images: [],
  },
  {
    sku: "GAMEBOY-CLEAR", name: "Game Boy (Clear Shell Variant)",
    category: C.NINTENDO, subcategory: "Game Boy",
    description: "Nintendo Game Boy with a clear transparent shell — either factory-original clear variant or professionally modded. Shows the internal hardware. Collector's item.",
    price: 119, condition: "Used-Good",
    configuration: { conditions: ["Good", "Excellent"], conditionPricing: { "Good": 0, "Excellent": 30 } },
    stock: 1, featured: true, active: true, verified: true, rating: 4.8,
    images: [],
    badge: "Rare",
    priceNote: "Clear shell variant — verify whether factory original or professional mod before purchase",
  },
  {
    sku: "NES-CTRL", name: "Nintendo Entertainment System (NES)",
    category: C.NINTENDO, subcategory: "NES",
    description: "Original Nintendo Entertainment System. The console that saved the video game industry. Includes one controller. Plays NES cartridges.",
    price: 69, condition: "Used-Good",
    configuration: { conditions: ["Good", "Fair"], conditionPricing: { "Good": 0, "Fair": -20 } },
    stock: 1, featured: false, active: true, verified: true, rating: 4.7,
    images: [],
  },
  {
    sku: "NES-POWERSET", name: "NES Power Set Bundle",
    category: C.NINTENDO, subcategory: "NES",
    description: "Nintendo Entertainment System Power Set — original bundle including the NES console, Power Pad floor mat, and Nintendo Zapper. A complete piece of gaming history.",
    price: 119, condition: "Used-Good",
    configuration: { conditions: ["Good", "Fair"], conditionPricing: { "Good": 0, "Fair": -30 } },
    stock: 1, featured: true, active: true, verified: true, rating: 4.8,
    images: [],
    badge: "Complete Bundle",
  },
];

// ════════════════════════════════════════════════════════════════════════════
// SEGA / RETRO
// ════════════════════════════════════════════════════════════════════════════
const SEGA: SP[] = [
  {
    sku: "SEGA-DC", name: "Sega Dreamcast",
    category: C.SEGA, subcategory: "Dreamcast",
    description: "Sega Dreamcast (1999) — Sega's last console and a cult classic. Includes controller and VMU memory card. Plays GD-ROM games. Great retro gaming platform.",
    price: 84, condition: "Used-Good",
    configuration: { conditions: ["Good", "Fair"], conditionPricing: { "Good": 0, "Fair": -25 } },
    stock: 1, featured: false, active: true, verified: true, rating: 4.6,
    images: [],
  },
  {
    sku: "SEGA-DC-CTRL", name: "Sega Dreamcast Controller",
    category: C.CONTROLLERS, subcategory: "Sega",
    description: "Official Sega Dreamcast controller (VMU slot included). Standard white colorway. Compatible with all Dreamcast games.",
    price: 24, condition: "Used-Good",
    configuration: { conditions: ["Good", "Fair"], conditionPricing: { "Good": 0, "Fair": -8 } },
    stock: 1, featured: false, active: true, verified: true, rating: 4.4,
    images: [],
  },
];

// ════════════════════════════════════════════════════════════════════════════
// VIDEO GAMES
// ════════════════════════════════════════════════════════════════════════════
const GAMES: SP[] = [
  // PlayStation 2
  { sku: "PS2-SH2", name: "Silent Hill 2 (PS2)", category: C.GAMES, subcategory: "PlayStation 2", description: "Silent Hill 2 for PlayStation 2. Psychological survival horror classic from Konami/Team Silent. Disc and case included.", price: 39, condition: "Used-Good", stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.9 },
  { sku: "PS2-P4", name: "Persona 4 (PS2)", category: C.GAMES, subcategory: "PlayStation 2", description: "Persona 4 for PlayStation 2. JRPG masterpiece from Atlus. 80+ hour narrative with dungeon exploration and Social Links. Disc included.", price: 34, condition: "Used-Good", stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.9 },
  { sku: "PS2-P3FES", name: "Persona 3 FES (PS2)", category: C.GAMES, subcategory: "PlayStation 2", description: "Persona 3 FES for PlayStation 2. The expanded edition with The Answer epilogue. JRPG from Atlus.", price: 32, condition: "Used-Good", stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.8 },
  { sku: "PS2-ARTONELICO2", name: "Ar tonelico II: Melody of Metafalica (PS2)", category: C.GAMES, subcategory: "PlayStation 2", description: "Ar tonelico II: Melody of Metafalica for PlayStation 2. JRPG from NIS America. Disc and case.", price: 28, condition: "Used-Good", stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.6 },
  { sku: "PS2-GTASA", name: "Grand Theft Auto: San Andreas (PS2)", category: C.GAMES, subcategory: "PlayStation 2", description: "GTA: San Andreas for PlayStation 2. Open-world action classic from Rockstar Games. Includes disc and case.", price: 18, condition: "Used-Good", stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.8 },
  { sku: "PS2-FIGHTNITE3", name: "Fight Night Round 3 (PS2)", category: C.GAMES, subcategory: "PlayStation 2", description: "Fight Night Round 3 for PlayStation 2. EA Sports boxing simulation. Disc included.", price: 12, condition: "Used-Good", stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.4 },
  { sku: "PS2-NFSUC", name: "Need for Speed: Undercover (PS2)", category: C.GAMES, subcategory: "PlayStation 2", description: "Need for Speed: Undercover for PlayStation 2. Open-world police-chase racing from EA. Disc and case.", price: 10, condition: "Used-Good", stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.1 },
  // PlayStation 4
  { sku: "PS4-SOM", name: "Middle-earth: Shadow of Mordor (PS4)", category: C.GAMES, subcategory: "PlayStation 4", description: "Middle-earth: Shadow of Mordor for PS4. Open-world action RPG set in Tolkien's universe. Features the Nemesis System.", price: 12, condition: "Used-Good", stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.6 },
  { sku: "PS4-WOLF2", name: "Wolfenstein II: The New Colossus (PS4)", category: C.GAMES, subcategory: "PlayStation 4", description: "Wolfenstein II: The New Colossus for PS4. First-person shooter from MachineGames. Includes disc and case.", price: 15, condition: "Used-Good", stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.6 },
  { sku: "PS4-NIER-D1", name: "NieR: Automata Day One Edition (PS4)", category: C.GAMES, subcategory: "PlayStation 4", description: "NieR: Automata Day One Edition for PS4. Square Enix action RPG developed by PlatinumGames. Day One packaging includes in-game DLC.", price: 29, condition: "Used-Good", stock: 1, images: [], featured: true, active: true, verified: true, rating: 4.9 },
  { sku: "PS4-RDR2", name: "Red Dead Redemption II (PS4)", category: C.GAMES, subcategory: "PlayStation 4", description: "Red Dead Redemption 2 for PS4. Epic open-world western from Rockstar Games. Dual-disc set with case.", price: 29, condition: "Used-Good", stock: 1, images: [], featured: true, active: true, verified: true, rating: 4.9 },
  { sku: "PS4-FIFA15", name: "FIFA 15 (PS4)", category: C.GAMES, subcategory: "PlayStation 4", description: "FIFA 15 for PS4. EA Sports football simulation. Disc and case included.", price: 8, condition: "Used-Good", stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.2 },
  { sku: "PS4-UFC", name: "EA Sports UFC (PS4)", category: C.GAMES, subcategory: "PlayStation 4", description: "EA Sports UFC for PS4. First entry in the EA UFC series. Features realistic fighter likenesses and striking mechanics.", price: 10, condition: "Used-Good", stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.3 },
  // Nintendo Wii
  { sku: "WII-GH5", name: "Guitar Hero 5 (Wii)", category: C.GAMES, subcategory: "Nintendo Wii", description: "Guitar Hero 5 for Nintendo Wii (game disc only — guitar peripheral not included). Activision rhythm game with 85+ songs.", price: 12, condition: "Used-Good", stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.4 },
  { sku: "WII-REUC", name: "Resident Evil: The Umbrella Chronicles (Wii)", category: C.GAMES, subcategory: "Nintendo Wii", description: "Resident Evil: The Umbrella Chronicles for Wii. Rail shooter through key moments of the RE timeline. Uses Wii Remote as light gun.", price: 14, condition: "Used-Good", stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.5 },
  { sku: "WII-PKBR", name: "Pokémon Battle Revolution (Wii)", category: C.GAMES, subcategory: "Nintendo Wii", description: "Pokémon Battle Revolution for Wii. Stadium-style Pokémon battles with DS connectivity. Disc and case included.", price: 18, condition: "Used-Good", stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.3 },
  // Wii U
  { sku: "WIIU-WWHD", name: "The Legend of Zelda: The Wind Waker HD (Wii U)", category: C.GAMES, subcategory: "Wii U", description: "The Legend of Zelda: The Wind Waker HD for Wii U. HD remaster of the beloved GameCube classic. Disc and case.", price: 27, condition: "Used-Good", stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.9 },
  // Nintendo DS
  { sku: "NDS-PKPLT", name: "Pokémon Platinum Version (DS)", category: C.GAMES, subcategory: "Nintendo DS", description: "Pokémon Platinum Version for Nintendo DS. The expanded third edition of Diamond/Pearl. Cartridge only.", price: 22, condition: "Used-Good", stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.8 },
  // Nintendo 3DS
  { sku: "N3DS-ZALBW", name: "The Legend of Zelda: A Link Between Worlds (3DS)", category: C.GAMES, subcategory: "Nintendo 3DS", description: "The Legend of Zelda: A Link Between Worlds for 3DS. Top-down Zelda adventure set in Hyrule. Cartridge and case.", price: 29, condition: "Used-Good", stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.9 },
  { sku: "N3DS-FEA", name: "Fire Emblem Awakening (3DS)", category: C.GAMES, subcategory: "Nintendo 3DS", description: "Fire Emblem Awakening for Nintendo 3DS. Turn-based strategy RPG from Intelligent Systems. Cartridge included.", price: 34, condition: "Used-Good", stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.9 },
  { sku: "N3DS-PKMON", name: "Pokémon Moon (3DS)", category: C.GAMES, subcategory: "Nintendo 3DS", description: "Pokémon Moon for Nintendo 3DS. Alola region adventure. Cartridge included.", price: 20, condition: "Used-Good", stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.7 },
  { sku: "N3DS-OOT", name: "The Legend of Zelda: Ocarina of Time 3D (3DS)", category: C.GAMES, subcategory: "Nintendo 3DS", description: "Ocarina of Time 3D for Nintendo 3DS. Full 3D remaster of the N64 classic. Cartridge and case.", price: 29, condition: "Used-Good", stock: 1, images: [], featured: true, active: true, verified: true, rating: 5.0 },
  // Nintendo Switch
  { sku: "NSW-BOTW", name: "The Legend of Zelda: Breath of the Wild (Switch)", category: C.GAMES, subcategory: "Nintendo Switch", description: "The Legend of Zelda: Breath of the Wild for Nintendo Switch. Open-world Zelda masterpiece. Game card and case.", price: 44, condition: "Used-Good", stock: 1, images: [], featured: true, active: true, verified: true, rating: 5.0 },
  { sku: "NSW-PKSHPRL", name: "Pokémon Shining Pearl (Switch)", category: C.GAMES, subcategory: "Nintendo Switch", description: "Pokémon Shining Pearl for Nintendo Switch. Faithful remake of Pokémon Pearl. Game card and case.", price: 29, condition: "Used-Good", stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.5 },
];

// ════════════════════════════════════════════════════════════════════════════
// ACCESSORIES
// ════════════════════════════════════════════════════════════════════════════
const ACCESSORIES: SP[] = [
  {
    sku: "KBD-TWOLF-T16", name: "T-WOLF T16 Metal Luminous Wired Gaming Keyboard",
    category: C.ACCESSORIES, subcategory: "Gaming Accessories",
    description: "T-WOLF T16 wired gaming keyboard with metal body and RGB backlighting. Full-size layout, multimedia keys. USB connection.",
    price: 34, condition: "Used-Good",
    stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.4,
  },
  {
    sku: "HDMI-ONTEN-21", name: "Onten HDMI 2.1 Cable (1.5m) — OTN-HD181",
    category: C.ACCESSORIES, subcategory: "Chargers & Cables",
    description: "Onten OTN-HD181 HDMI 2.1 cable, 1.5 meters. Supports 4K@120Hz, 8K@60Hz, eARC, VRR. Compatible with PS5, Xbox Series X/S, and modern TVs.",
    price: 14, condition: "Used-Good",
    stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.5,
  },
  {
    sku: "CBL-USBA-USBC-27W", name: "USB-A to USB-C 27W Charging Cable (3ft)",
    category: C.ACCESSORIES, subcategory: "Chargers & Cables",
    description: "USB-A to USB-C fast charging cable, 3 feet. Supports up to 27W charging. Compatible with most modern Android phones and accessories.",
    price: 8, condition: "Used-Good",
    stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.3,
  },
  {
    sku: "CBL-BRAIDED-USBC", name: "Braided USB-C Charging Cable",
    category: C.ACCESSORIES, subcategory: "Chargers & Cables",
    description: "White braided USB-C charging cable. Nylon braid for durability. Compatible with most USB-C devices.",
    price: 8, condition: "Used-Good",
    stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.3,
  },
  {
    sku: "APL-USBC-61W", name: "Apple USB-C 61W Power Adapter",
    category: C.ACCESSORIES, subcategory: "Chargers & Cables",
    description: "Genuine Apple 61W USB-C Power Adapter. Compatible with MacBook Pro 13\", iPad Pro, and USB-C iPhones. Compact folding plug design.",
    price: 44, condition: "Used-Good",
    stock: 1, images: [A("apple-61w-usb-c-power-adapter")], featured: false, active: true, verified: true, rating: 4.7,
  },
  {
    sku: "APL-USBC-20W", name: "Apple 20W USB-C Power Adapter",
    category: C.ACCESSORIES, subcategory: "Chargers & Cables",
    description: "Genuine Apple 20W USB-C Power Adapter. Fast charges iPhone 8 and later. Compact design with folding plug.",
    price: 18, condition: "Used-Good",
    stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.7,
  },
  {
    sku: "PB-20W-MAG-WIRELESS", name: "20W Magnetic Wireless Power Bank with Display",
    category: C.ACCESSORIES, subcategory: "Power Banks",
    description: "Magnetic wireless power bank with LED battery percentage display. 20W wireless charging, USB-C passthrough. MagSafe-compatible form factor.",
    price: 24, condition: "Used-Good",
    stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.4,
  },
  {
    sku: "PB-SLIM-MAG", name: "Slim Magnetic Wireless Power Bank",
    category: C.ACCESSORIES, subcategory: "Power Banks",
    description: "Ultra-slim bidirectional magnetic wireless power bank. Charges wirelessly or via USB-C. Compact and lightweight for everyday carry.",
    price: 29, condition: "Used-Good",
    stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.4,
  },
  {
    sku: "OTBX-IP13PMAX-CLR", name: "OtterBox Symmetry Series Clear Case — iPhone 13 Pro Max",
    category: C.ACCESSORIES, subcategory: "Phone Cases",
    description: "OtterBox Symmetry Series clear case for iPhone 13 Pro Max. Slim profile, clear back, raised edges for screen and camera protection. Drop tested.",
    price: 24, condition: "Used-Good",
    stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.6,
  },
  {
    sku: "OTBX-IP13P-CLR", name: "OtterBox Symmetry Series Clear Case — iPhone 13 Pro",
    category: C.ACCESSORIES, subcategory: "Phone Cases",
    description: "OtterBox Symmetry Series clear case for iPhone 13 Pro. Clear back shows off the phone's color. Drop protection, raised bezels.",
    price: 24, condition: "Used-Good",
    stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.6,
  },
];

// ════════════════════════════════════════════════════════════════════════════
// APPLE WATCHES & TABLETS
// ════════════════════════════════════════════════════════════════════════════
const APPLE_ITEMS: SP[] = [
  {
    sku: "AW-S11-42-GPS-ROSE", name: "Apple Watch Series 11 GPS + Cellular 42mm (Rose)",
    category: C.APPLE, subcategory: "Apple Watch",
    description: "Apple Watch Series 11 42mm with GPS and Cellular. Rose/pink-tone aluminum case with sport band. Health tracking, ECG, crash detection.",
    price: 329, condition: "Used-Good",
    configuration: { conditions: ["Good", "Excellent"], conditionPricing: { "Good": 0, "Excellent": 60 } },
    stock: 1, images: [], featured: false, active: true,
    verified: false, verificationNote: "Series 11 model year needs confirmation — verify against Apple's actual release lineup",
    rating: 4.8,
  },
  {
    sku: "AW-SE2-44-BLK", name: "Apple Watch SE 2nd Generation 44mm GPS + Cellular (Black)",
    category: C.APPLE, subcategory: "Apple Watch",
    description: "Apple Watch SE 2nd Generation, 44mm, midnight aluminum case, GPS + Cellular. Crash detection, heart rate monitor, swim-proof.",
    price: 179, condition: "Used-Good",
    configuration: { conditions: ["Good", "Excellent", "Fair"], conditionPricing: { "Good": 0, "Excellent": 40, "Fair": -40 } },
    stock: 1, images: [A("apple-watch-se-2nd-gen-product-select-202209-44mm_midnight")], featured: false, active: true, verified: true, rating: 4.7,
  },
  {
    sku: "AW-SE3-40-WHT", name: "Apple Watch SE 3rd Generation 40mm (White/Starlight)",
    category: C.APPLE, subcategory: "Apple Watch",
    description: "Apple Watch SE 3rd Generation 40mm in starlight/white colorway. GPS, heart rate, Activity rings, crash detection.",
    price: 159, condition: "Used-Good",
    configuration: { conditions: ["Good", "Excellent"], conditionPricing: { "Good": 0, "Excellent": 30 } },
    stock: 1, images: [], featured: false, active: false,
    verified: false, verificationNote: "Apple Watch SE 3rd Gen — verify this model year exists before publishing",
    rating: 4.7,
  },
  {
    sku: "AW-SE3-44", name: "Apple Watch SE 3rd Generation 44mm",
    category: C.APPLE, subcategory: "Apple Watch",
    description: "Apple Watch SE 3rd Generation 44mm. Larger display, GPS, all-day Activity tracking, crash detection.",
    price: 179, condition: "Used-Good",
    configuration: { conditions: ["Good", "Excellent"], conditionPricing: { "Good": 0, "Excellent": 35 } },
    stock: 1, images: [], featured: false, active: false,
    verified: false, verificationNote: "Apple Watch SE 3rd Gen — verify this model year exists before publishing",
    rating: 4.7,
  },
  {
    sku: "IPAD-AIR4-SGRAY", name: "iPad Air 4th Generation (Space Gray)",
    category: C.TABLETS, subcategory: "iPad",
    description: "Apple iPad Air 4th Generation in Space Gray. 10.9-inch Liquid Retina display, USB-C, Touch ID in power button, Apple Pencil (2nd gen) compatible.",
    price: 279, condition: "Used-Good",
    configuration: { storageOptions: ["64GB", "256GB"], pricingByStorage: { "64GB": 0, "256GB": 60 }, conditions: ["Good", "Excellent", "Fair"], conditionPricing: { "Good": 0, "Excellent": 60, "Fair": -60 } },
    stock: 1, images: [A("ipad-air-4th-gen-select-202010-spacegray")], featured: false, active: true, verified: true, rating: 4.8,
  },
  {
    sku: "AIRPODS-PRO", name: "AirPods Pro (2nd Generation)",
    category: C.APPLE, subcategory: "AirPods",
    description: "Apple AirPods Pro 2nd Generation with MagSafe charging case. Active Noise Cancellation, Adaptive Transparency, Personalized Spatial Audio.",
    price: 159, condition: "Used-Good",
    configuration: { conditions: ["Good", "Excellent", "Fair"], conditionPricing: { "Good": 0, "Excellent": 40, "Fair": -40 } },
    stock: 1, images: [A("airpods-pro-2nd-gen-hero-202209")], featured: true, active: true,
    verified: false, verificationNote: "Confirm generation (1st vs 2nd) from inventory note before publishing",
    rating: 4.8,
  },
  {
    sku: "TAB-SAMSUNG-S10FE-5G", name: "Samsung Galaxy Tab S10 FE 5G (Black)",
    category: C.TABLETS, subcategory: "Android Tablet",
    description: "Samsung Galaxy Tab S10 FE 5G in black. 10.9-inch LCD, 5G connectivity, S Pen included, IP68 water resistant.",
    price: 349, condition: "Used-Good",
    configuration: { conditions: ["Good", "Excellent", "Fair"], conditionPricing: { "Good": 0, "Excellent": 50, "Fair": -60 } },
    stock: 1, images: [], featured: false, active: true, verified: true, rating: 4.5,
  },
];

// ════════════════════════════════════════════════════════════════════════════
// iPHONES
// ════════════════════════════════════════════════════════════════════════════
// One listing per model — storage/color/condition via configuration JSONB.
// base price = "Good" condition, lowest storage.
// pricingByStorage = additive delta from base.
// conditionPricing = additive delta from Good.
// ════════════════════════════════════════════════════════════════════════════
const iph = (
  sku: string, name: string, price: number, imgKey: string,
  storageOptions: string[], pricingByStorage: Record<string,number>,
  colors: string[], description: string, stock = 0,
  featured = false, badge?: string, verified = true, verificationNote?: string
): SP => ({
  sku, name, category: C.IPHONE, description, price,
  condition: "Used-Good", stock, featured, active: true, verified,
  verificationNote, badge,
  images: imgKey ? [A(imgKey)] : [],
  rating: 4.7,
  configuration: {
    storageOptions, pricingByStorage, colors,
    conditions: ["Good", "Excellent", "Fair"],
    conditionPricing: { "Good": 0, "Excellent": Math.round(price * 0.15), "Fair": -Math.round(price * 0.18) },
  },
});

const IPHONES: SP[] = [
  // ── iPhone 6 generation ─────────────────────────────────────────────────
  iph("IP6", "iPhone 6", 49, "iphone6-gray-select-2014", ["16GB","32GB","64GB","128GB"], {"16GB":0,"32GB":8,"64GB":15,"128GB":25}, ["Space Gray","Silver","Gold"], "Pre-owned Apple iPhone 6 with 4.7-inch Retina display. A8 chip. Available in 16GB–128GB storage options."),
  iph("IP6P", "iPhone 6 Plus", 64, "iphone6plus-gray-select-2015", ["16GB","64GB","128GB"], {"16GB":0,"64GB":15,"128GB":25}, ["Space Gray","Silver","Gold"], "Pre-owned Apple iPhone 6 Plus with 5.5-inch Retina HD display. A8 chip, optical image stabilization."),
  iph("IP6S", "iPhone 6s", 69, "iphone6s-gray-select-2015", ["16GB","32GB","64GB","128GB"], {"16GB":0,"32GB":8,"64GB":15,"128GB":25}, ["Space Gray","Silver","Gold","Rose Gold"], "Pre-owned Apple iPhone 6s. Touch ID, 3D Touch, 12MP camera. A9 chip."),
  iph("IP6SP", "iPhone 6s Plus", 84, "iphone6splus-gray-select-2015", ["16GB","32GB","64GB","128GB"], {"16GB":0,"32GB":8,"64GB":15,"128GB":25}, ["Space Gray","Silver","Gold","Rose Gold"], "Pre-owned Apple iPhone 6s Plus. 5.5-inch display, Touch ID, 3D Touch, OIS camera. A9 chip."),
  // ── iPhone SE ───────────────────────────────────────────────────────────
  iph("IPSE1", "iPhone SE (1st Generation)", 79, "iphone-se-finish-spacegray-2016", ["16GB","32GB","64GB"], {"16GB":0,"32GB":10,"64GB":20}, ["Space Gray","Silver","Gold","Rose Gold"], "Pre-owned Apple iPhone SE 1st Gen. 4-inch display, Touch ID, A9 chip in a compact form factor."),
  iph("IPSE2", "iPhone SE (2nd Generation)", 199, "iphone-se-finish-black-2020", ["64GB","128GB","256GB"], {"64GB":0,"128GB":30,"256GB":60}, ["Black","White","(Product)RED"], "Pre-owned Apple iPhone SE 2nd Gen (2020). 4.7-inch display, Touch ID, MagSafe-free, A13 Bionic chip."),
  iph("IPSE3", "iPhone SE (3rd Generation)", 279, "iphone-se-3rd-gen-finish-midnight-2022", ["64GB","128GB","256GB"], {"64GB":0,"128GB":30,"256GB":60}, ["Midnight","Starlight","(Product)RED"], "Pre-owned Apple iPhone SE 3rd Gen (2022). 4.7-inch display, Touch ID, 5G, A15 Bionic chip."),
  // ── iPhone 7 ────────────────────────────────────────────────────────────
  iph("IP7", "iPhone 7", 94, "iphone7-black-select-2016", ["32GB","128GB","256GB"], {"32GB":0,"128GB":20,"256GB":40}, ["Jet Black","Black","Silver","Gold","Rose Gold"], "Pre-owned Apple iPhone 7. 4.7-inch Retina, water-resistant IP67, A10 Fusion chip, stereo speakers."),
  iph("IP7P", "iPhone 7 Plus", 119, "iphone7plus-black-select-2016", ["32GB","128GB","256GB"], {"32GB":0,"128GB":20,"256GB":40}, ["Jet Black","Black","Silver","Gold","Rose Gold"], "Pre-owned Apple iPhone 7 Plus. 5.5-inch display, dual 12MP camera with optical zoom, OIS. A10 Fusion."),
  // ── iPhone 8 / X ────────────────────────────────────────────────────────
  iph("IP8", "iPhone 8", 139, "iphone8-black-select-2017", ["64GB","128GB","256GB"], {"64GB":0,"128GB":20,"256GB":40}, ["Space Gray","Silver","Gold"], "Pre-owned Apple iPhone 8. 4.7-inch Retina HD, wireless charging, A11 Bionic chip. Touch ID."),
  iph("IP8P", "iPhone 8 Plus", 169, "iphone8plus-black-select-2017", ["64GB","128GB","256GB"], {"64GB":0,"128GB":20,"256GB":40}, ["Space Gray","Silver","Gold"], "Pre-owned Apple iPhone 8 Plus. 5.5-inch display, dual 12MP cameras, wireless charging. A11 Bionic."),
  iph("IPX", "iPhone X", 219, "iphone-x-finish-silver-2017", ["64GB","256GB"], {"64GB":0,"256GB":50}, ["Space Gray","Silver"], "Pre-owned Apple iPhone X. Edge-to-edge 5.8-inch Super Retina OLED, Face ID, A11 Bionic chip."),
  // ── XS / XR ─────────────────────────────────────────────────────────────
  iph("IPXR", "iPhone XR", 199, "iphone-xr-finish-black-2018", ["64GB","128GB","256GB"], {"64GB":0,"128GB":25,"256GB":50}, ["Black","White","Blue","Yellow","Coral","(Product)RED"], "Pre-owned Apple iPhone XR. 6.1-inch Liquid Retina, Face ID, A12 Bionic, all-day battery."),
  iph("IPXS", "iPhone XS", 239, "iphone-xs-finish-silver-2018", ["64GB","256GB","512GB"], {"64GB":0,"256GB":50,"512GB":100}, ["Space Gray","Silver","Gold"], "Pre-owned Apple iPhone XS. 5.8-inch Super Retina OLED, Face ID, A12 Bionic chip, dual camera."),
  iph("IPXSMAX", "iPhone XS Max", 279, "iphone-xs-max-finish-silver-2018", ["64GB","256GB","512GB"], {"64GB":0,"256GB":50,"512GB":100}, ["Space Gray","Silver","Gold"], "Pre-owned Apple iPhone XS Max. 6.5-inch Super Retina OLED, Face ID, A12 Bionic, dual camera."),
  // ── iPhone 11 ────────────────────────────────────────────────────────────
  iph("IP11", "iPhone 11", 279, "iphone-11-finish-select-2019-black", ["64GB","128GB","256GB"], {"64GB":0,"128GB":25,"256GB":50}, ["Black","White","Green","Yellow","Purple","(Product)RED"], "Pre-owned Apple iPhone 11. 6.1-inch Liquid Retina, dual 12MP cameras, Night mode, A13 Bionic."),
  iph("IP11P", "iPhone 11 Pro", 339, "iphone-11-pro-finish-select-2019-spacegray", ["64GB","256GB","512GB"], {"64GB":0,"256GB":60,"512GB":120}, ["Space Gray","Silver","Gold","Midnight Green"], "Pre-owned Apple iPhone 11 Pro. 5.8-inch Super Retina XDR OLED, triple 12MP cameras, A13 Bionic."),
  iph("IP11PMAX", "iPhone 11 Pro Max", 379, "iphone-11-pro-max-finish-select-2019-spacegray", ["64GB","256GB","512GB"], {"64GB":0,"256GB":60,"512GB":120}, ["Space Gray","Silver","Gold","Midnight Green"], "Pre-owned Apple iPhone 11 Pro Max. 6.5-inch Super Retina XDR, triple cameras, A13 Bionic."),
  // ── iPhone 12 ────────────────────────────────────────────────────────────
  iph("IP12MINI", "iPhone 12 mini", 299, "iphone-12-mini-finish-select-2020q4-black", ["64GB","128GB","256GB"], {"64GB":0,"128GB":30,"256GB":60}, ["Black","White","Blue","Green","(Product)RED"], "Pre-owned Apple iPhone 12 mini. 5.4-inch Super Retina XDR OLED, 5G, MagSafe, A14 Bionic."),
  iph("IP12", "iPhone 12", 329, "iphone-12-finish-select-2020q4-black", ["64GB","128GB","256GB"], {"64GB":0,"128GB":30,"256GB":60}, ["Black","White","Blue","Green","Purple","(Product)RED"], "Pre-owned Apple iPhone 12. 6.1-inch Super Retina XDR OLED, 5G, dual cameras, MagSafe, A14 Bionic."),
  iph("IP12P", "iPhone 12 Pro", 379, "iphone-12-pro-finish-select-2020q4-graphite", ["128GB","256GB","512GB"], {"128GB":0,"256GB":50,"512GB":100}, ["Graphite","Silver","Gold","Pacific Blue"], "Pre-owned Apple iPhone 12 Pro. 6.1-inch Super Retina XDR, triple camera + LiDAR, 5G, A14 Bionic."),
  iph("IP12PMAX", "iPhone 12 Pro Max", 419, "iphone-12-pro-max-finish-select-2020q4-graphite", ["128GB","256GB","512GB"], {"128GB":0,"256GB":50,"512GB":100}, ["Graphite","Silver","Gold","Pacific Blue"], "Pre-owned Apple iPhone 12 Pro Max. 6.7-inch Super Retina XDR, triple camera + LiDAR, A14 Bionic."),
  // ── iPhone 13 ────────────────────────────────────────────────────────────
  iph("IP13MINI", "iPhone 13 mini", 359, "iphone-13-mini-finish-select-2021q4-midnight", ["128GB","256GB","512GB"], {"128GB":0,"256GB":50,"512GB":100}, ["Midnight","Starlight","Blue","Green","Pink","(Product)RED"], "Pre-owned Apple iPhone 13 mini. 5.4-inch OLED, A15 Bionic, Cinematic mode camera, 5G."),
  iph("IP13", "iPhone 13", 389, "iphone-13-finish-select-2021q4-midnight", ["128GB","256GB","512GB"], {"128GB":0,"256GB":50,"512GB":100}, ["Midnight","Starlight","Blue","Green","Pink","(Product)RED"], "Pre-owned Apple iPhone 13. 6.1-inch Super Retina XDR OLED, dual 12MP cameras, Cinematic mode, A15 Bionic.", 0, true),
  iph("IP13P", "iPhone 13 Pro", 449, "iphone-13-pro-finish-select-2021q4-6-1inch-sierrablue", ["128GB","256GB","512GB","1TB"], {"128GB":0,"256GB":60,"512GB":120,"1TB":200}, ["Sierra Blue","Silver","Gold","Graphite"], "Pre-owned Apple iPhone 13 Pro. 6.1-inch ProMotion OLED, triple 12MP cameras + macro, LiDAR, A15 Bionic."),
  iph("IP13PMAX", "iPhone 13 Pro Max", 489, "iphone-13-pro-max-finish-select-2021q4-6-7inch-sierrablue", ["128GB","256GB","512GB","1TB"], {"128GB":0,"256GB":60,"512GB":120,"1TB":200}, ["Sierra Blue","Silver","Gold","Graphite"], "Pre-owned Apple iPhone 13 Pro Max. 6.7-inch ProMotion OLED, largest battery in iPhone 13 line, triple cameras."),
  // ── iPhone 14 ────────────────────────────────────────────────────────────
  iph("IP14", "iPhone 14", 499, "iphone-14-finish-select-202209-6-1inch-midnight", ["128GB","256GB","512GB"], {"128GB":0,"256GB":60,"512GB":120}, ["Midnight","Starlight","Blue","Purple","(Product)RED"], "Pre-owned Apple iPhone 14. 6.1-inch Super Retina XDR, Emergency SOS via satellite, Crash Detection, A15 Bionic."),
  iph("IP14PLUS", "iPhone 14 Plus", 539, "iphone-14-plus-finish-select-202209-6-7inch-midnight", ["128GB","256GB","512GB"], {"128GB":0,"256GB":60,"512GB":120}, ["Midnight","Starlight","Blue","Purple","(Product)RED"], "Pre-owned Apple iPhone 14 Plus. 6.7-inch Super Retina XDR, larger battery, Emergency SOS, A15 Bionic."),
  iph("IP14P", "iPhone 14 Pro", 579, "iphone-14-pro-finish-select-202209-6-1inch-deeppurple", ["128GB","256GB","512GB","1TB"], {"128GB":0,"256GB":70,"512GB":140,"1TB":230}, ["Deep Purple","Silver","Gold","Space Black"], "Pre-owned Apple iPhone 14 Pro. 6.1-inch Always-On ProMotion OLED, Dynamic Island, 48MP main camera, A16 Bionic."),
  iph("IP14PMAX", "iPhone 14 Pro Max", 639, "iphone-14-pro-max-finish-select-202209-6-7inch-deeppurple", ["128GB","256GB","512GB","1TB"], {"128GB":0,"256GB":70,"512GB":140,"1TB":230}, ["Deep Purple","Silver","Gold","Space Black"], "Pre-owned Apple iPhone 14 Pro Max. 6.7-inch Always-On display, Dynamic Island, 48MP triple cameras, A16 Bionic."),
  // ── iPhone 15 ────────────────────────────────────────────────────────────
  iph("IP15", "iPhone 15", 619, "iphone-15-finish-select-202309-6-1inch-black", ["128GB","256GB","512GB"], {"128GB":0,"256GB":70,"512GB":140}, ["Black","Blue","Green","Yellow","Pink"], "Pre-owned Apple iPhone 15. 6.1-inch Super Retina XDR OLED, USB-C, Dynamic Island, 48MP camera, A16 Bionic."),
  iph("IP15PLUS", "iPhone 15 Plus", 669, "iphone-15-plus-finish-select-202309-6-7inch-black", ["128GB","256GB","512GB"], {"128GB":0,"256GB":70,"512GB":140}, ["Black","Blue","Green","Yellow","Pink"], "Pre-owned Apple iPhone 15 Plus. 6.7-inch Super Retina XDR, USB-C, Dynamic Island, 48MP camera, A16 Bionic."),
  iph("IP15P", "iPhone 15 Pro", 749, "iphone-15-pro-finish-select-202309-6-1inch-blacktitanium", ["128GB","256GB","512GB","1TB"], {"128GB":0,"256GB":80,"512GB":160,"1TB":260}, ["Black Titanium","White Titanium","Blue Titanium","Natural Titanium"], "Pre-owned Apple iPhone 15 Pro. 6.1-inch ProMotion OLED titanium frame, USB 3, Action Button, 48MP triple cameras, A17 Pro.", 0, true),
  iph("IP15PMAX", "iPhone 15 Pro Max", 819, "iphone-15-pro-max-finish-select-202309-6-7inch-blacktitanium", ["256GB","512GB","1TB"], {"256GB":0,"512GB":100,"1TB":200}, ["Black Titanium","White Titanium","Blue Titanium","Natural Titanium"], "Pre-owned Apple iPhone 15 Pro Max. 6.7-inch ProMotion, tetraprism 5x optical zoom, titanium frame, A17 Pro chip."),
  // ── iPhone 16 ────────────────────────────────────────────────────────────
  iph("IP16", "iPhone 16", 719, "iphone-16-finish-select-202409-6-1inch-black", ["128GB","256GB","512GB"], {"128GB":0,"256GB":80,"512GB":160}, ["Black","White","Pink","Teal","Ultramarine"], "Pre-owned Apple iPhone 16. 6.1-inch OLED, Camera Control button, Apple Intelligence support, A18 chip, USB-C."),
  iph("IP16PLUS", "iPhone 16 Plus", 779, "iphone-16-plus-finish-select-202409-6-7inch-black", ["128GB","256GB","512GB"], {"128GB":0,"256GB":80,"512GB":160}, ["Black","White","Pink","Teal","Ultramarine"], "Pre-owned Apple iPhone 16 Plus. 6.7-inch OLED, Camera Control, Apple Intelligence, A18 chip."),
  iph("IP16P", "iPhone 16 Pro", 879, "iphone-16-pro-finish-select-202409-6-3inch-blacktitanium", ["128GB","256GB","512GB","1TB"], {"128GB":0,"256GB":100,"512GB":200,"1TB":320}, ["Black Titanium","White Titanium","Desert Titanium","Natural Titanium"], "Pre-owned Apple iPhone 16 Pro. 6.3-inch ProMotion OLED titanium, Camera Control, 48MP triple cameras, A18 Pro.", 0, true, "Hot"),
  iph("IP16PMAX", "iPhone 16 Pro Max", 979, "iphone-16-pro-max-finish-select-202409-6-9inch-blacktitanium", ["256GB","512GB","1TB"], {"256GB":0,"512GB":120,"1TB":240}, ["Black Titanium","White Titanium","Desert Titanium","Natural Titanium"], "Pre-owned Apple iPhone 16 Pro Max. 6.9-inch ProMotion OLED, largest battery, 5x zoom, A18 Pro chip."),
  iph("IP16E", "iPhone 16e", 579, "iphone-16e-finish-select-202502-6-1inch-black", ["128GB","256GB","512GB"], {"128GB":0,"256GB":60,"512GB":120}, ["Black","White"], "Pre-owned Apple iPhone 16e. 6.1-inch OLED, A16 Bionic, USB-C, Apple Intelligence support. The most affordable iPhone 16 model."),
  // ── iPhone 17 generation (released Sep 2025) ─────────────────────────────
  iph("IP17", "iPhone 17", 819, "iphone-17-finish-select-202509-6-1inch-black", ["128GB","256GB","512GB"], {"128GB":0,"256GB":100,"512GB":200}, ["Black","White","Teal","Pink"], "Pre-owned Apple iPhone 17. 6.1-inch ProMotion OLED (new for base model), A19 chip, Camera Control, Apple Intelligence.", 0, true, "New", true, undefined),
  iph("IP17P", "iPhone 17 Pro", 979, "iphone-17-pro-finish-select-202509-6-3inch-blacktitanium", ["128GB","256GB","512GB","1TB"], {"128GB":0,"256GB":100,"512GB":200,"1TB":330}, ["Black Titanium","Natural Titanium","White Titanium","Desert Titanium"], "Pre-owned Apple iPhone 17 Pro. 6.3-inch ProMotion OLED, A19 Pro chip, 48MP triple cameras, Apple Intelligence.", 0, true, "New", true, undefined),
  iph("IP17PMAX", "iPhone 17 Pro Max", 1099, "iphone-17-pro-max-finish-select-202509-6-9inch-blacktitanium", ["256GB","512GB","1TB"], {"256GB":0,"512GB":130,"1TB":260}, ["Black Titanium","Natural Titanium","White Titanium","Desert Titanium"], "Pre-owned Apple iPhone 17 Pro Max. 6.9-inch ProMotion OLED, A19 Pro, periscope camera, largest battery.", 0, true, "New", true, undefined),
  iph("IAIR", "iPhone Air", 899, "iphone-air-finish-select-202509-6-6inch-starlight", ["128GB","256GB","512GB"], {"128GB":0,"256GB":100,"512GB":200}, ["Starlight","Midnight","Blue"], "Apple iPhone Air — ultra-thin 6.6-inch OLED, A19 chip, Apple Intelligence. Apple's thinnest iPhone ever.", 0, true, "New", false, "Verify iPhone Air model name and specs before publishing"),
  iph("IP17E", "iPhone 17e", 679, "iphone-17e-finish-select-202602-6-1inch-black", ["128GB","256GB","512GB"], {"128GB":0,"256GB":70,"512GB":140}, ["Black","White"], "Apple iPhone 17e — affordable flagship-chip iPhone. 6.1-inch OLED, A18 chip, USB-C, Apple Intelligence.", 0, false, undefined, false, "Verify iPhone 17e model name and availability before publishing"),
];

// ════════════════════════════════════════════════════════════════════════════
// MacBOOKS
// ════════════════════════════════════════════════════════════════════════════
const mb = (
  sku: string, name: string, price: number, imgKey: string,
  storageOptions: string[], pricingByStorage: Record<string,number>,
  ramOptions: string[], pricingByRam: Record<string,number>,
  colors: string[], description: string, stock = 0, featured = false, badge?: string
): SP => ({
  sku, name, category: C.MACBOOK, description, price,
  condition: "Used-Good", stock, featured, active: true, verified: true, badge,
  images: imgKey ? [A(imgKey)] : [],
  rating: 4.7,
  configuration: {
    storageOptions, pricingByStorage, ramOptions, pricingByRam, colors,
    conditions: ["Good", "Excellent", "Fair"],
    conditionPricing: { "Good": 0, "Excellent": Math.round(price * 0.12), "Fair": -Math.round(price * 0.20) },
  },
});

const MACBOOKS: SP[] = [
  // ── 2015 ─────────────────────────────────────────────────────────────────
  mb("MBA11-2015","MacBook Air 11-inch (2015)",249,"","128GB,256GB".split(","),{"128GB":0,"256GB":60},"4GB,8GB".split(","),{"4GB":0,"8GB":40},["Silver"],"Pre-owned Apple MacBook Air 11-inch (Early 2015). Intel Core i5/i7, up to 8GB RAM, 1.6GHz, Intel HD 6000."),
  mb("MBA13-2015","MacBook Air 13-inch (2015)",279,"","128GB,256GB,512GB".split(","),{"128GB":0,"256GB":60,"512GB":120},"4GB,8GB".split(","),{"4GB":0,"8GB":40},["Silver"],"Pre-owned Apple MacBook Air 13-inch (Early 2015). Intel Core i5, up to 12 hours battery, Intel HD 6000."),
  mb("MBP13-2015","MacBook Pro 13-inch (2015)",349,"","128GB,256GB,512GB".split(","),{"128GB":0,"256GB":70,"512GB":140},"8GB".split(","),{"8GB":0},["Silver"],"Pre-owned Apple MacBook Pro 13-inch (Early 2015). Retina display, Intel Core i5, Force Touch trackpad."),
  mb("MBP15-2015","MacBook Pro 15-inch (2015)",419,"","256GB,512GB".split(","),{"256GB":0,"512GB":100},"16GB".split(","),{"16GB":0},["Silver"],"Pre-owned Apple MacBook Pro 15-inch (Mid 2015). Retina display, Intel Core i7/i9, AMD Radeon R9 M370X option."),
  mb("MB12-2015","MacBook 12-inch (2015)",319,"","256GB,512GB".split(","),{"256GB":0,"512GB":80},"8GB".split(","),{"8GB":0},["Silver","Space Gray","Gold"],"Pre-owned Apple 12-inch MacBook (2015). Fanless design, Retina display, single USB-C port, Intel Core M."),
  // ── 2016 ─────────────────────────────────────────────────────────────────
  mb("MB12-2016","MacBook 12-inch (2016)",339,"","256GB,512GB".split(","),{"256GB":0,"512GB":80},"8GB".split(","),{"8GB":0},["Silver","Space Gray","Gold","Rose Gold"],"Pre-owned Apple 12-inch MacBook (2016). Retina display, Intel Core m3/m5/m7, single USB-C, Rose Gold option added."),
  mb("MBP13-2016","MacBook Pro 13-inch (2016)",399,"","256GB,512GB".split(","),{"256GB":0,"512GB":100},"8GB,16GB".split(","),{"8GB":0,"16GB":100},["Silver","Space Gray"],"Pre-owned Apple MacBook Pro 13-inch (2016). Touch Bar option, USB-C Thunderbolt 3, Intel Core i5/i7."),
  mb("MBP15-2016","MacBook Pro 15-inch (2016)",499,"","256GB,512GB,1TB".split(","),{"256GB":0,"512GB":100,"1TB":200},"16GB".split(","),{"16GB":0},["Silver","Space Gray"],"Pre-owned Apple MacBook Pro 15-inch (2016). Touch Bar, Thunderbolt 3, Intel Core i7/i9, AMD Radeon Pro."),
  // ── 2017 ─────────────────────────────────────────────────────────────────
  mb("MB12-2017","MacBook 12-inch (2017)",359,"","256GB,512GB".split(","),{"256GB":0,"512GB":80},"8GB".split(","),{"8GB":0},["Silver","Space Gray","Gold","Rose Gold"],"Pre-owned Apple 12-inch MacBook (2017). Intel Core i5/i7 (Kaby Lake), improved keyboard gen 2."),
  mb("MBA13-2017","MacBook Air 13-inch (2017)",309,"","128GB,256GB".split(","),{"128GB":0,"256GB":60},"8GB".split(","),{"8GB":0},["Silver"],"Pre-owned Apple MacBook Air 13-inch (2017). Intel Core i5, 13.3-inch display, full-size keyboard."),
  mb("MBP13-2017","MacBook Pro 13-inch (2017)",429,"","128GB,256GB,512GB".split(","),{"128GB":0,"256GB":70,"512GB":140},"8GB,16GB".split(","),{"8GB":0,"16GB":100},["Silver","Space Gray"],"Pre-owned Apple MacBook Pro 13-inch (2017). Touch Bar option, Intel Core i5/i7, Thunderbolt 3."),
  mb("MBP15-2017","MacBook Pro 15-inch (2017)",529,"","256GB,512GB,1TB".split(","),{"256GB":0,"512GB":100,"1TB":200},"16GB".split(","),{"16GB":0},["Silver","Space Gray"],"Pre-owned Apple MacBook Pro 15-inch (2017). Touch Bar, Intel Core i7/i9, AMD Radeon Pro 560."),
  // ── 2018 ─────────────────────────────────────────────────────────────────
  mb("MBAR13-2018","MacBook Air Retina 13-inch (2018)",449,"","128GB,256GB,512GB".split(","),{"128GB":0,"256GB":80,"512GB":160},"8GB,16GB".split(","),{"8GB":0,"16GB":100},["Silver","Space Gray","Gold"],"Pre-owned Apple MacBook Air with Retina display (2018). Touch ID, True Tone, Intel Core i5, USB-C."),
  mb("MBP13-2018","MacBook Pro 13-inch (2018)",549,"","256GB,512GB".split(","),{"256GB":0,"512GB":120},"8GB,16GB".split(","),{"8GB":0,"16GB":120},["Silver","Space Gray"],"Pre-owned Apple MacBook Pro 13-inch (2018). Touch Bar, True Tone, Intel Core i5/i7, T2 chip."),
  mb("MBP15-2018","MacBook Pro 15-inch (2018)",679,"","256GB,512GB".split(","),{"256GB":0,"512GB":120},"16GB,32GB".split(","),{"16GB":0,"32GB":200},["Silver","Space Gray"],"Pre-owned Apple MacBook Pro 15-inch (2018). Touch Bar, True Tone, Intel Core i7/i9, Radeon Pro 555X/560X."),
  // ── 2019 ─────────────────────────────────────────────────────────────────
  mb("MBA13-2019","MacBook Air 13-inch (2019)",479,"","128GB,256GB,512GB".split(","),{"128GB":0,"256GB":80,"512GB":160},"8GB,16GB".split(","),{"8GB":0,"16GB":120},["Silver","Space Gray","Gold"],"Pre-owned Apple MacBook Air (2019). Touch ID, True Tone, Intel Core i5, Retina display."),
  mb("MBP13-2019","MacBook Pro 13-inch (2019)",579,"","256GB,512GB,1TB".split(","),{"256GB":0,"512GB":120,"1TB":240},"8GB,16GB".split(","),{"8GB":0,"16GB":120},["Silver","Space Gray"],"Pre-owned Apple MacBook Pro 13-inch (2019). Touch Bar, Intel Core i5/i7, improved keyboard gen 5."),
  mb("MBP16-2019","MacBook Pro 16-inch (2019)",799,"","512GB,1TB,2TB".split(","),{"512GB":0,"1TB":200,"2TB":400},"16GB,32GB,64GB".split(","),{"16GB":0,"32GB":200,"64GB":500},["Silver","Space Gray"],"Pre-owned Apple MacBook Pro 16-inch (2019). Intel Core i7/i9, AMD Radeon Pro 5500M, Magic Keyboard."),
  // ── 2020 ─────────────────────────────────────────────────────────────────
  mb("MBA13-2020-INTEL","MacBook Air Intel 13-inch (Early 2020)",499,"","256GB,512GB".split(","),{"256GB":0,"512GB":120},"8GB,16GB".split(","),{"8GB":0,"16GB":120},["Silver","Space Gray","Gold"],"Pre-owned Apple MacBook Air (Early 2020, Intel). Scissor keyboard, Touch ID, Magic Keyboard layout."),
  mb("MBA13-M1","MacBook Air M1 13-inch (2020)",719,"mba-m1-og-spacegray-select-202011","256GB,512GB,1TB".split(","),{"256GB":0,"512GB":120,"1TB":240},"8GB,16GB".split(","),{"8GB":0,"16GB":200},["Silver","Space Gray","Gold"],"Pre-owned Apple MacBook Air M1 (2020). Apple Silicon M1 chip, 18-hour battery, fanless design, Retina display.", 0, true, "Popular"),
  mb("MBP13-2020-INTEL","MacBook Pro 13-inch Intel (Early 2020)",619,"","512GB,1TB".split(","),{"512GB":0,"1TB":200},"16GB,32GB".split(","),{"16GB":0,"32GB":200},["Silver","Space Gray"],"Pre-owned Apple MacBook Pro 13-inch (Early 2020, Intel). Touch Bar, four Thunderbolt 3 ports, Intel Core i5/i7."),
  mb("MBP13-M1","MacBook Pro 13-inch M1 (Late 2020)",799,"mbp13-m1-spacegray-select-202011","256GB,512GB,1TB".split(","),{"256GB":0,"512GB":120,"1TB":240},"8GB,16GB".split(","),{"8GB":0,"16GB":200},["Silver","Space Gray"],"Pre-owned Apple MacBook Pro 13-inch M1 (2020). Apple M1 chip, Touch Bar, Touch ID, 20-hour battery."),
  // ── 2021 ─────────────────────────────────────────────────────────────────
  mb("MBP14-M1PRO","MacBook Pro 14-inch M1 Pro (2021)",1099,"mbp14-m1-spacegray-select-202110","512GB,1TB,2TB".split(","),{"512GB":0,"1TB":200,"2TB":400},"16GB,32GB".split(","),{"16GB":0,"32GB":300},["Silver","Space Gray"],"Pre-owned Apple MacBook Pro 14-inch M1 Pro/Max (2021). Liquid Retina XDR, MagSafe, HDMI, SD card, notch.", 0, true),
  mb("MBP16-M1PRO","MacBook Pro 16-inch M1 Pro (2021)",1299,"mbp16-m1-spacegray-select-202110","512GB,1TB,2TB".split(","),{"512GB":0,"1TB":200,"2TB":400},"16GB,32GB,64GB".split(","),{"16GB":0,"32GB":300,"64GB":700},["Silver","Space Gray"],"Pre-owned Apple MacBook Pro 16-inch M1 Pro/Max (2021). Liquid Retina XDR, 21-hour battery, MagSafe, HDMI."),
  // ── 2022 ─────────────────────────────────────────────────────────────────
  mb("MBA13-M2","MacBook Air M2 13-inch (2022)",949,"mba-m2-202210-midnight","256GB,512GB,1TB,2TB".split(","),{"256GB":0,"512GB":200,"1TB":400,"2TB":600},"8GB,16GB,24GB".split(","),{"8GB":0,"16GB":200,"24GB":400},["Midnight","Starlight","Silver","Space Gray"],"Pre-owned Apple MacBook Air M2 13-inch (2022). MagSafe, notch, 18-hour battery, fanless M2 chip.", 0, true),
  mb("MBP13-M2","MacBook Pro 13-inch M2 (2022)",1049,"mbp13-m2-silver-select-202206","256GB,512GB,1TB,2TB".split(","),{"256GB":0,"512GB":200,"1TB":400,"2TB":600},"8GB,16GB,24GB".split(","),{"8GB":0,"16GB":200,"24GB":400},["Silver","Space Gray"],"Pre-owned Apple MacBook Pro 13-inch M2 (2022). Touch Bar, M2 chip, 20-hour battery, Active Cooling."),
  // ── 2023 ─────────────────────────────────────────────────────────────────
  mb("MBA13-M2-2023","MacBook Air 13-inch M2 (2023)",999,"mba-m2-202210-midnight","256GB,512GB,1TB,2TB".split(","),{"256GB":0,"512GB":200,"1TB":400,"2TB":600},"8GB,16GB,24GB".split(","),{"8GB":0,"16GB":200,"24GB":400},["Midnight","Starlight","Silver","Space Gray"],"Pre-owned Apple MacBook Air 13-inch M2 (2023, updated color). Midnight colorway, same M2 architecture as 2022."),
  mb("MBA15-M2","MacBook Air 15-inch M2 (2023)",1099,"mba15-m2-midnight-config-20230606","256GB,512GB,1TB,2TB".split(","),{"256GB":0,"512GB":200,"1TB":400,"2TB":600},"8GB,16GB,24GB".split(","),{"8GB":0,"16GB":200,"24GB":400},["Midnight","Starlight","Silver","Space Gray"],"Pre-owned Apple MacBook Air 15-inch M2 (2023). Larger display in a fanless thin design. Six-speaker system.", 0, true),
  mb("MBP14-M3PRO","MacBook Pro 14-inch M3 Pro (2023)",1499,"mbp14-m3-spacblack-select-202310","512GB,1TB,2TB".split(","),{"512GB":0,"1TB":200,"2TB":400},"18GB,36GB".split(","),{"18GB":0,"36GB":400},["Space Black","Silver"],"Pre-owned Apple MacBook Pro 14-inch M3 Pro (2023). Space Black finish, ProMotion XDR, MagSafe, HDMI 2.1.", 0, true),
  mb("MBP16-M3PRO","MacBook Pro 16-inch M3 Pro (2023)",1799,"mbp16-m3pro-spacblack-select-202310","512GB,1TB,2TB".split(","),{"512GB":0,"1TB":200,"2TB":400},"18GB,36GB,48GB".split(","),{"18GB":0,"36GB":400,"48GB":700},["Space Black","Silver"],"Pre-owned Apple MacBook Pro 16-inch M3 Pro/Max (2023). Liquid Retina XDR, 22-hour battery, Space Black."),
  // ── 2024 ─────────────────────────────────────────────────────────────────
  mb("MBA13-M3","MacBook Air 13-inch M3 (2024)",1099,"macbook-air-midnight-config-20240308","256GB,512GB,1TB,2TB".split(","),{"256GB":0,"512GB":200,"1TB":400,"2TB":600},"8GB,16GB,24GB".split(","),{"8GB":0,"16GB":200,"24GB":400},["Midnight","Starlight","Silver","Sky Blue"],"Pre-owned Apple MacBook Air 13-inch M3 (2024). M3 chip, dual external display support, Wi-Fi 6E.", 0, true),
  mb("MBA15-M3","MacBook Air 15-inch M3 (2024)",1199,"macbook-air-15-midnight-config-20240308","256GB,512GB,1TB,2TB".split(","),{"256GB":0,"512GB":200,"1TB":400,"2TB":600},"8GB,16GB,24GB".split(","),{"8GB":0,"16GB":200,"24GB":400},["Midnight","Starlight","Silver","Sky Blue"],"Pre-owned Apple MacBook Air 15-inch M3 (2024). 15.3-inch Liquid Retina, M3 chip, 18-hour battery."),
  mb("MBP14-M4","MacBook Pro 14-inch M4 (2024)",1399,"mbp14-m4-spacblack-select-202411","512GB,1TB,2TB".split(","),{"512GB":0,"1TB":200,"2TB":400},"16GB,24GB,32GB".split(","),{"16GB":0,"24GB":200,"32GB":400},["Space Black","Silver"],"Pre-owned Apple MacBook Pro 14-inch M4 (Nov 2024). Nano-texture display option, M4 chip, Thunderbolt 5 (Pro model)."),
  mb("MBP16-M4PRO","MacBook Pro 16-inch M4 Pro (2024)",1899,"mbp16-m4pro-spacblack-select-202411","512GB,1TB,2TB".split(","),{"512GB":0,"1TB":200,"2TB":400},"24GB,48GB".split(","),{"24GB":0,"48GB":400},["Space Black","Silver"],"Pre-owned Apple MacBook Pro 16-inch M4 Pro (Nov 2024). ProMotion XDR, Thunderbolt 5, M4 Pro chip."),
  // ── 2025 ─────────────────────────────────────────────────────────────────
  mb("MBA13-M4","MacBook Air 13-inch M4 (2025)",1199,"macbook-air-13-m4-sky-blue-config-20250309","256GB,512GB,1TB,2TB".split(","),{"256GB":0,"512GB":200,"1TB":400,"2TB":600},"16GB,32GB".split(","),{"16GB":0,"32GB":300},["Sky Blue","Starlight","Midnight","Space Gray"],"Pre-owned Apple MacBook Air 13-inch M4 (2025). First MacBook Air with M4 chip. Sky Blue new color option.", 0, true, "New"),
  mb("MBA15-M4","MacBook Air 15-inch M4 (2025)",1299,"macbook-air-15-m4-sky-blue-config-20250309","256GB,512GB,1TB,2TB".split(","),{"256GB":0,"512GB":200,"1TB":400,"2TB":600},"16GB,32GB".split(","),{"16GB":0,"32GB":300},["Sky Blue","Starlight","Midnight","Space Gray"],"Pre-owned Apple MacBook Air 15-inch M4 (2025). 15.3-inch, M4 chip, 18-hour battery, Sky Blue option.", 0, false, "New"),
];

// ════════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ════════════════════════════════════════════════════════════════════════════
const ALL_PRODUCTS: SP[] = [
  ...ARCADE, ...PLAYSTATION, ...XBOX, ...NINTENDO, ...SEGA,
  ...GAMES, ...ACCESSORIES, ...APPLE_ITEMS, ...IPHONES, ...MACBOOKS,
];

export async function seedCatalog(): Promise<void> {
  // Idempotency — skip if already have a real catalog
  const countRes = await pool.query<{ count: string }>("SELECT COUNT(*) AS count FROM products");
  const existing = parseInt(countRes.rows[0].count, 10);
  if (existing >= 20) {
    console.log(`[seed] Catalog already seeded (${existing} products) — skipping`);
    return;
  }

  console.log(`[seed] Seeding ${ALL_PRODUCTS.length} products…`);
  let inserted = 0;
  let skipped  = 0;

  for (const p of ALL_PRODUCTS) {
    try {
      const id = randomUUID();
      await pool.query(
        `INSERT INTO products
           (id, name, category, subcategory, description, price, old_price, price_note,
            condition, configuration, stock, sku, images, badge, rating, active,
            featured, verified, verification_note)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         ON CONFLICT (sku) DO NOTHING`,
        [
          id, p.name, p.category, p.subcategory ?? null,
          p.description, p.price, p.oldPrice ?? null, p.priceNote ?? null,
          p.condition,
          p.configuration ? JSON.stringify(p.configuration) : null,
          p.stock, p.sku, p.images,
          p.badge ?? null, p.rating, p.active, p.featured, p.verified,
          p.verificationNote ?? null,
        ]
      );

      await pool.query(
        `INSERT INTO inventory (product_id, quantity, threshold)
         SELECT id, $1, 2 FROM products WHERE sku = $2
         ON CONFLICT (product_id) DO NOTHING`,
        [p.stock, p.sku]
      );

      inserted++;
    } catch (err: any) {
      console.error(`[seed] Failed to insert SKU ${p.sku}:`, err.message);
      skipped++;
    }
  }

  console.log(`[seed] Done — ${inserted} inserted, ${skipped} skipped`);
}
