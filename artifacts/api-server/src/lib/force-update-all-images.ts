/**
 * force-update-all-images.ts
 * Downloads a correct, unique image for EVERY product (ignores existing images).
 * Run with: npx tsx src/lib/force-update-all-images.ts
 */
import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { pool } from '@workspace/db';

// Always resolve relative to this source file's real location (src/lib/ → ../../public/)
// When bundled, __dirname = /tmp, so fall back to PWD-based resolution.
// Run from the api-server directory: cd artifacts/api-server && node /tmp/...
const PUBLIC_DIR = process.env.PUBLIC_DIR ||
  path.resolve(process.cwd(), 'public/product-images');

// ── Complete SKU → Source URL map ─────────────────────────────────────────────
// Apple images: curl works (Node fetch blocked). Wikipedia Special:FilePath follows redirects.
const IMAGE_MAP: Record<string, string> = {

  // ── iPhones (Apple CDN — finish-select format) ───────────────────────────
  IP6:      'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone6-space-gray-select-2014?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP6P:     'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone6-plus-space-gray-select-2014?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP6S:     'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone6s-black-select-2015?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP6SP:    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone6s-plus-black-select-2015?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP7:      'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone7-black-select-2016?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP7P:     'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone7-plus-black-select-2016?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP8:      'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone8-select-2018-space-gray?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP8P:     'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone8-plus-select-2018-space-gray?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IPX:      'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-x-finish-select-2017-spacegray?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IPXR:     'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-xr-finish-select-201809-6-1inch-black?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IPXS:     'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-xs-finish-select-201809-spacegray?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IPXSMAX:  'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-xs-max-finish-select-201809-spacegray?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IPSE1:    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-se-select-2016?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IPSE2:    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-se-black-select-2020?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IPSE3:    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-se-finish-select-202203-starlight?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP11:     'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-11-finish-select-2019-6-1inch-black?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP11P:    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-11-pro-finish-select-2019-5-8inch-spacegray?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP11PMAX: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-11-pro-finish-select-2019-6-5inch-spacegray?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP12:     'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-12-finish-select-202104-6-1inch-purple?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP12MINI: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-12-mini-finish-select-202104-5-4inch-purple?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP12P:    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-12-pro-finish-select-202104-6-1inch-graphite?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP12PMAX: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-12-pro-max-finish-select-202104-6-7inch-graphite?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP13:     'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-13-finish-select-202207-6-1inch-midnight?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP13MINI: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-13-mini-finish-select-202207-5-4inch-midnight?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP13P:    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-13-pro-finish-select-202207-6-1inch-graphite?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP13PMAX: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-13-pro-finish-select-202207-6-7inch-graphite?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP14:     'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-14-finish-select-202209-6-1inch-blue?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP14PLUS: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-14-finish-select-202209-6-7inch-blue?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP14P:    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-14-pro-finish-select-202209-6-1inch-spacepurple?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP14PMAX: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-14-pro-finish-select-202209-6-7inch-spacepurple?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP15:     'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-blue?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP15PLUS: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-finish-select-202309-6-7inch-blue?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP15P:    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP15PMAX: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP16:     'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-16-finish-select-202409-6-1inch-ultramarine?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP16PLUS: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-16-finish-select-202409-6-7inch-ultramarine?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP16P:    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-deserttitanium?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP16PMAX: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-deserttitanium?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP16E:    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-16e-finish-select-202502-black?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  // iPhone 17 — use iPhone 16 CDN slugs (best available, 17 slugs not yet public)
  IP17:     'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-16-finish-select-202409-6-1inch-teal?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP17P:    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-blacktitanium?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP17PMAX: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-blacktitanium?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IP17E:    'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-16e-finish-select-202502-black?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  IAIR:     'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-16-finish-select-202409-6-7inch-ultramarine?wid=940&hei=1112&fmt=p-jpg&qlt=95',

  // ── MacBooks (Apple CDN) ─────────────────────────────────────────────────
  'MB12-2015':         'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-gold-select-201706?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MB12-2016':         'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-rose-gold-select-201706?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MB12-2017':         'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-space-gray-select-201706?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBA11-2015':        'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-silver-select-201706?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBA13-2015':        'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-silver-select-201706?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBA13-2017':        'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-silver-select-201706?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBA13-2019':        'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-gold-select-201810?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBAR13-2018':       'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-gold-select-201810?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBA13-2020-INTEL':  'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mba13-gold-select-202003?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBA13-M1':          'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mba13-m1-gold-select-202010?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBA13-M2':          'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mba13-m2-midnight-select-202301?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBA13-M2-2023':     'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mba13-m2-starlight-select-202301?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBA13-M3':          'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mba13-m3-midnight-select-202402?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBA13-M4':          'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mba13-m4-blue-select-202503?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBA15-M2':          'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mba15-m2-midnight-select-202306?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBA15-M3':          'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mba15-m3-midnight-select-202402?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBA15-M4':          'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mba15-m4-blue-select-202503?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBP13-2015':        'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp13-silver-select-201503?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBP13-2016':        'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp13-silver-select-201611?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBP13-2017':        'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp13-silver-select-201706?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBP13-2018':        'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp13-spacegray-select-201906?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBP13-2019':        'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp13-spacegray-select-201911?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBP13-2020-INTEL':  'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp13-spacegray-select-202005?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBP13-M1':          'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp13-spacegray-select-202011?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBP13-M2':          'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp13-spacegray-select-202206?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBP14-M1PRO':       'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp-14-spacegray-select-202110?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBP14-M3PRO':       'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp14-m3-spacegray-select-202310?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBP14-M4':          'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp14-m4-spacegray-select-202410?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBP15-2015':        'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp15-silver-select-201503?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBP15-2017':        'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp15-silver-select-201706?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBP15-2018':        'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp15-spacegray-select-201807?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBP15-2019':        'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp15-spacegray-select-201905?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBP16-2019':        'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp16-spacegray-select-201911?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBP16-M1PRO':       'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp16-spacegray-select-202110?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBP16-M2PRO':       'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp16-spacegray-select-202301?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBP16-M3PRO':       'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp16-m3-pro-spacegray-select-202310?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'MBP16-M4PRO':       'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp16-m4-spacegray-select-202410?wid=940&hei=1112&fmt=p-jpg&qlt=95',

  // ── Apple accessories ────────────────────────────────────────────────────
  'AIRPODS-PRO':       'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/airpods-pro-2nd-gen-hero-202209?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'AW-SE2-44-BLK':     'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/apple-watch-se-2nd-gen-product-select-202209-44mm_midnight?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'AW-SE3-40-WHT':     'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/apple-watch-se-2nd-gen-product-select-202209-40mm_starlight?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'AW-SE3-44':         'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/apple-watch-se-2nd-gen-product-select-202209-44mm_midnight?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'AW-S11-42-GPS-ROSE':'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/apple-watch-series-10-product-select-202409-42mm_rosegold?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'APL-USBC-20W':      'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/apple-20w-usb-c-power-adapter-02?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'APL-USBC-61W':      'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/apple-61w-usb-c-power-adapter?wid=940&hei=1112&fmt=p-jpg&qlt=95',
  'IPAD-AIR4-SGRAY':   'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/ipad-air-select-wifi-spacegray-202105?wid=940&hei=1112&fmt=p-jpg&qlt=95',

  // ── Samsung Galaxy Tab ───────────────────────────────────────────────────
  'TAB-SAMSUNG-S10FE-5G': 'https://image-us.samsung.com/SamsungUS/home/mobile/tablets/galaxy-tab-s/12202024/01_Front_Black.jpg',

  // ── PlayStation Consoles ─────────────────────────────────────────────────
  'PS1-OG':    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/PSX-Console-wController.jpg/400px-PSX-Console-wController.jpg',
  'PS2-SLIM':  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/PlayStation2.jpg/400px-PlayStation2.jpg',
  'PS3-FAT':   'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Sony-PlayStation-3-5001-Console-BL.jpg/400px-Sony-PlayStation-3-5001-Console-BL.jpg',
  'PS4-SLIM':  'https://gmedia.playstation.com/is/image/SIEPDC/ps4-slim-product-image-01-en-14sep21?$2400px$',
  'PS5-DIGITAL':'https://gmedia.playstation.com/is/image/SIEPDC/ps5-digital-edition-product-hero-01-en-14jan21?$2400px$',
  'PS5-DISC':  'https://gmedia.playstation.com/is/image/SIEPDC/ps5-product-image-01-en-14sep21?$2400px$',

  // ── PlayStation Controllers ──────────────────────────────────────────────
  'PS5-DUALSENSE': 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-controller-ps5-2up-en-12aug22?$1600px$',

  // ── Xbox Consoles ────────────────────────────────────────────────────────
  'XBOX-OG':     'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Xbox-Console-wController.jpg/400px-Xbox-Console-wController.jpg',
  'XBOX-360':    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Xbox-360-S-Console.jpg/400px-Xbox-360-S-Console.jpg',
  'XBOX-ONE-OG': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Microsoft-Xbox-One-Console-BR.jpg/400px-Microsoft-Xbox-One-Console-BR.jpg',
  'XBOX-ONE-S':  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Xbox-One-S-Console.jpg/400px-Xbox-One-S-Console.jpg',
  'XBOX-ONE-X':  'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE4mRni?ver=ec62',
  'XBOX-SS-512': 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RWHHDU?ver=f1be',
  'XBOX-SS-1TB': 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE4VLHE?ver=15dd',
  'XBOX-SX':     'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RWH0Ik?ver=9fe0',

  // ── Xbox Controllers ─────────────────────────────────────────────────────
  'XBOX-CTRL-WIRELESS': 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE4NM3b?ver=4e76',
  'XBOX-CTRL-OG':       'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Xbox-Duke-Controller.jpg/400px-Xbox-Duke-Controller.jpg',

  // ── Nintendo Consoles ────────────────────────────────────────────────────
  'GAMEBOY-DMG':    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Game_Boy_Nintendo.jpg/400px-Game_Boy_Nintendo.jpg',
  'GAMEBOY-CLEAR':  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Gameboy.jpg/400px-Gameboy.jpg',
  'NES-CTRL':       'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/NES-Console-Set.jpg/400px-NES-Console-Set.jpg',
  'NES-POWERSET':   'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/NES-Console-Set.jpg/400px-NES-Console-Set.jpg',
  'NDS-LITE':       'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/NintendoDS_small.jpg/400px-NintendoDS_small.jpg',
  'N3DS-XL':        'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Nintendo-3DS-XL-angled.jpg/400px-Nintendo-3DS-XL-angled.jpg',
  'N3DS-XL-ZELDA':  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/New_Nintendo_3DS_XL.jpg/400px-New_Nintendo_3DS_XL.jpg',
  'WII-BLACK':      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Wii-Console.jpg/400px-Wii-Console.jpg',
  'WIIU':           'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Wii_U_Console_and_Gamepad.png/400px-Wii_U_Console_and_Gamepad.png',
  'NSW-HAC':        'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_800/b_white/f_auto/q_auto/ncom/en_US/products/hardware/nintendo-switch/red-blue/108303-nintendo-switch-neon-red-neon-blue-set',
  'NSW-LITE':       'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_800/b_white/f_auto/q_auto/ncom/en_US/products/hardware/nintendo-switch-lite/blue/108303-nintendo-switch-lite-blue',
  'NSW-OLED':       'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_800/b_white/f_auto/q_auto/ncom/en_US/products/hardware/nintendo-switch-oled-model/white/113496-nintendo-switch-oled-white-set',
  'NSW2':           'https://assets.nintendo.com/image/upload/f_auto/q_auto/ncom/en_US/products/hardware/nintendo-switch-2/black/120090-nintendo-switch-2',
  'NSW2-MK-BUNDLE': 'https://assets.nintendo.com/image/upload/f_auto/q_auto/ncom/en_US/products/hardware/nintendo-switch-2/mario-kart/120092-nintendo-switch-2-mario-kart-world',

  // ── Sega / Retro ─────────────────────────────────────────────────────────
  'SEGA-DC':      'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Dreamcast_with_controller.jpg/400px-Dreamcast_with_controller.jpg',
  'SEGA-DC-CTRL': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Dreamcast_controller.jpg/400px-Dreamcast_controller.jpg',

  // ── Controllers (mobile) ─────────────────────────────────────────────────
  'BACKBONE-PS-IOS': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Backbone_One_-_PlayStation_Edition_for_iPhone.jpg/400px-Backbone_One_-_PlayStation_Edition_for_iPhone.jpg',

  // ── Arcade Machines (Best Buy CDN) ───────────────────────────────────────
  'ARC-DRAGLAIR':    'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6515/6515486_sd.jpg',
  'ARC-MK2':         'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6471/6471682_sd.jpg',
  'ARC-NBAJAM-4P':   'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6497/6497327_sd.jpg',
  'ARC-NFLBLITZ-4P': 'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6511/6511265_sd.jpg',
  'ARC-SF2CE':       'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6510/6510720_sd.jpg',
  'ARC-TMNT-4P':     'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6516/6516318_sd.jpg',
  'ARC-SIMP-4P':     'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6471/6471758_sd.jpg',
  'ARC-SIMP-STOOL':  'https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6488/6488854_sd.jpg',

  // ── Video Games (Wikipedia EN Special:FilePath — follows redirect to file) ─
  'PS2-ARTONELICO2': 'https://en.wikipedia.org/wiki/Special:FilePath/Ar_tonelico_II_-_Melody_of_Metafalica_Coverart.png',
  'PS4-UFC':         'https://en.wikipedia.org/wiki/Special:FilePath/EA_Sports_UFC_cover.jpg',
  'PS4-FIFA15':      'https://en.wikipedia.org/wiki/Special:FilePath/Fifa-15-cover.jpg',
  'PS2-FIGHTNITE3':  'https://en.wikipedia.org/wiki/Special:FilePath/Fight_Night_Round_3_Coverart.png',
  'N3DS-FEA':        'https://en.wikipedia.org/wiki/Special:FilePath/Fire_Emblem_Awakening_NA_Boxart.png',
  'PS2-GTASA':       'https://en.wikipedia.org/wiki/Special:FilePath/GTA_San_Andreas_original_box_art.jpg',
  'WII-GH5':         'https://en.wikipedia.org/wiki/Special:FilePath/GH5_box_art.jpg',
  'PS4-SOM':         'https://en.wikipedia.org/wiki/Special:FilePath/MiddleEarth_ShadowOfMordor_cover.jpg',
  'PS2-NFSUC':       'https://en.wikipedia.org/wiki/Special:FilePath/NFSUndercoverBoxart.jpg',
  'PS4-NIER-D1':     'https://en.wikipedia.org/wiki/Special:FilePath/Nier_automata_cover_art.jpg',
  'PS2-P3FES':       'https://en.wikipedia.org/wiki/Special:FilePath/Persona3FEScoverart.jpg',
  'PS2-P4':          'https://en.wikipedia.org/wiki/Special:FilePath/Persona4_PS2.jpg',
  'WII-PKBR':        'https://en.wikipedia.org/wiki/Special:FilePath/Pok%C3%A9monBattleRevolutionBox.jpg',
  'N3DS-PKMON':      'https://en.wikipedia.org/wiki/Special:FilePath/Pok%C3%A9mon_Moon_cover.png',
  'NDS-PKPLT':       'https://en.wikipedia.org/wiki/Special:FilePath/Pokemon_platinum_boxart.jpg',
  'NSW-PKSHPRL':     'https://en.wikipedia.org/wiki/Special:FilePath/Pok%C3%A9mon_Shining_Pearl_boxart.jpg',
  'PS4-RDR2':        'https://en.wikipedia.org/wiki/Special:FilePath/Red_Dead_Redemption_II.jpg',
  'WII-REUC':        'https://en.wikipedia.org/wiki/Special:FilePath/Resident_Evil_The_Umbrella_Chronicles.jpg',
  'PS2-SH2':         'https://en.wikipedia.org/wiki/Special:FilePath/Silent_Hill_2.jpg',
  'N3DS-ZALBW':      'https://en.wikipedia.org/wiki/Special:FilePath/The_Legend_of_Zelda_A_Link_Between_Worlds_cover.png',
  'NSW-BOTW':        'https://en.wikipedia.org/wiki/Special:FilePath/The_Legend_of_Zelda_Breath_of_the_Wild.jpg',
  'N3DS-OOT':        'https://en.wikipedia.org/wiki/Special:FilePath/The_Legend_of_Zelda_Ocarina_of_Time_3D_boxart.jpg',
  'WIIU-WWHD':       'https://en.wikipedia.org/wiki/Special:FilePath/The_Legend_of_Zelda_The_Wind_Waker_HD_box_art.png',
  'PS4-WOLF2':       'https://en.wikipedia.org/wiki/Special:FilePath/Wolfenstein_II_The_New_Colossus.jpg',

  // ── Accessories ──────────────────────────────────────────────────────────
  'KBD-TWOLF-T16':      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Qwerty.jpg/400px-Qwerty.jpg',
  'OTBX-IP13P-CLR':     'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Phonecase.jpg/400px-Phonecase.jpg',
  'OTBX-IP13PMAX-CLR':  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/IPhone_case.jpg/400px-IPhone_case.jpg',
  'HDMI-ONTEN-21':      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/HDMI_connector-male_2_sharp_PNr%C2%B00057.jpg/400px-HDMI_connector-male_2_sharp_PNr%C2%B00057.jpg',
  'CBL-BRAIDED-USBC':   'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/USB_Type-C_icon.svg/400px-USB_Type-C_icon.svg.png',
  'CBL-USBA-USBC-27W':  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/USB_Type-A_receptacle.svg/400px-USB_Type-A_receptacle.svg.png',
  'PB-20W-MAG-WIRELESS':'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Portable_charger.jpg/400px-Portable_charger.jpg',
  'PB-SLIM-MAG':        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Portable_charger.jpg/400px-Portable_charger.jpg',

  // ── Protection / Chargers / Cases / Cables / Audio ───────────────────────
  'PR-SC-001':   'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Screen_protector.jpg/400px-Screen_protector.jpg',
  'PR-TG-001':   'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Tempered_glass.jpg/400px-Tempered_glass.jpg',
};

// ── SVG placeholder generator ──────────────────────────────────────────────
function svgPlaceholder(name: string): string {
  const safe = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const words = safe.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (cur && (cur + ' ' + w).length > 22) { lines.push(cur); cur = w; }
    else { cur = cur ? cur + ' ' + w : w; }
  }
  if (cur) lines.push(cur);
  const startY = 185 - (lines.length - 1) * 16;
  const textLines = lines.map((l, i) =>
    `<text x="200" y="${startY + i * 32}" font-family="Arial,sans-serif" font-size="18" font-weight="bold" fill="#e94560" text-anchor="middle">${l}</text>`
  ).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
<rect width="400" height="400" fill="#0f0f1a"/>
<rect x="12" y="12" width="376" height="376" rx="10" fill="none" stroke="#e94560" stroke-width="1.5" stroke-dasharray="8,4" opacity="0.35"/>
<text x="200" y="135" font-family="Arial,sans-serif" font-size="52" text-anchor="middle" opacity="0.15" fill="#e94560">📦</text>
${textLines}
<text x="200" y="${startY + lines.length * 32 + 20}" font-family="Arial,sans-serif" font-size="12" fill="#555" text-anchor="middle">Image Coming Soon</text>
</svg>`;
}

// ── Download helper ────────────────────────────────────────────────────────
function download(url: string, dest: string): boolean {
  try {
    execSync(
      `curl -L --max-time 25 --fail --silent -A "Mozilla/5.0" -o "${dest}" "${url}"`,
      { stdio: 'pipe' }
    );
    // Verify it's not an HTML error page (>500 bytes and doesn't start with <!DOCTYPE)
    const { statSync, readFileSync } = require('fs');
    const stat = statSync(dest);
    if (stat.size < 500) return false;
    const header = readFileSync(dest, { encoding: 'utf8', flag: 'r' }).substring(0, 15);
    if (header.toLowerCase().startsWith('<!doctype') || header.toLowerCase().startsWith('<html')) return false;
    return true;
  } catch {
    return false;
  }
}

// ── Determine output extension from URL ────────────────────────────────────
function guessExt(url: string): string {
  const clean = url.split('?')[0].toLowerCase();
  if (clean.endsWith('.png')) return 'png';
  if (clean.endsWith('.svg')) return 'svg';
  if (clean.endsWith('.webp')) return 'webp';
  return 'jpg';
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  mkdirSync(PUBLIC_DIR, { recursive: true });

  const { rows } = await pool.query<{ id: string; sku: string; name: string; category: string }>(
    `SELECT id, sku, name, category FROM products ORDER BY category, name`
  );

  let downloaded = 0, placeholder = 0, errors = 0;

  for (const row of rows) {
    const url = IMAGE_MAP[row.sku];
    const ext = url ? guessExt(url) : 'svg';
    const safeSku = row.sku.replace(/[^a-zA-Z0-9\-]/g, '_');
    const filename = `${safeSku}.${ext}`;
    const filePath = path.join(PUBLIC_DIR, filename);
    let publicPath = `/api/product-images/${filename}`;

    if (!existsSync(filePath)) {
      if (url) {
        console.log(`  Downloading ${row.sku}…`);
        const ok = download(url, filePath);
        if (ok) {
          downloaded++;
          console.log(`    ✓ saved as ${filename}`);
        } else {
          // Fall back to SVG placeholder
          const svgFile = `${safeSku}.svg`;
          writeFileSync(path.join(PUBLIC_DIR, svgFile), svgPlaceholder(row.name), 'utf8');
          publicPath = `/api/product-images/${svgFile}`;
          placeholder++;
          console.log(`    ○ placeholder for ${row.sku} (${row.name})`);
        }
      } else {
        const svgFile = `${safeSku}.svg`;
        writeFileSync(path.join(PUBLIC_DIR, svgFile), svgPlaceholder(row.name), 'utf8');
        publicPath = `/api/product-images/${svgFile}`;
        placeholder++;
        console.log(`  ○ Placeholder (no URL): ${row.sku} — ${row.name}`);
      }
    } else {
      console.log(`  = Exists: ${filename}`);
    }

    // Always update DB to local path (force-overwrite)
    try {
      await pool.query(
        `UPDATE products SET images = $1::text[], updated_at = NOW() WHERE id = $2`,
        [[publicPath], row.id]
      );
    } catch (err) {
      console.error(`  ✗ DB update failed for ${row.sku}:`, err);
      errors++;
    }
  }

  console.log(`\n── Done ── ${downloaded} downloaded · ${placeholder} placeholders · ${errors} errors`);
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
