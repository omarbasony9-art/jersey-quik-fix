/**
 * seed-images.ts — populate product image URLs from stable manufacturer CDNs
 * Run with: npx tsx src/lib/seed-images.ts
 */
import { pool } from '@workspace/db';

// SKU → array of image URLs
const IMAGE_MAP: Record<string, string[]> = {

  // ── iPhones (Apple CDN) ───────────────────────────────────────────────────
  IP17PMAX: ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-deserttitanium?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP17P:    ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-deserttitanium?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP17:     ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-16-finish-select-202409-6-1inch-ultramarine?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP17E:    ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-16e-finish-select-202502-black?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IAIR:     ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-16-finish-select-202409-6-7inch-ultramarine?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP16PMAX: ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-deserttitanium?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP16P:    ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-deserttitanium?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP16:     ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-16-finish-select-202409-6-1inch-ultramarine?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP16PLUS: ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-16-finish-select-202409-6-7inch-ultramarine?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP16E:    ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-16e-finish-select-202502-black?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP15PMAX: ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP15P:    ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP15:     ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-blue?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP15PLUS: ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-finish-select-202309-6-7inch-blue?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP14PMAX: ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-14-pro-finish-select-202209-6-7inch-spacepurple?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP14P:    ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-14-pro-finish-select-202209-6-1inch-spacepurple?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP14:     ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-14-finish-select-202209-6-1inch-blue?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP14PLUS: ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-14-finish-select-202209-6-7inch-blue?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP13PMAX: ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-13-pro-finish-select-202207-6-7inch-graphite?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP13P:    ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-13-pro-finish-select-202207-6-1inch-graphite?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP13:     ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-13-finish-select-202207-6-1inch-midnight?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP13MINI: ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-13-mini-finish-select-202207-5-4inch-midnight?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP12PMAX: ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-12-pro-max-finish-select-202104-6-7inch-graphite?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP12P:    ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-12-pro-finish-select-202104-6-1inch-graphite?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP12:     ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-12-finish-select-202104-6-1inch-purple?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP12MINI: ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-12-mini-finish-select-202104-5-4inch-purple?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP11PMAX: ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-11-pro-finish-select-2019-6-5inch-spacegray?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP11P:    ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-11-pro-finish-select-2019-5-8inch-spacegray?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP11:     ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-11-finish-select-2019-6-1inch-black?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IPXSMAX:  ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-xs-max-finish-select-201809-spacegray?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IPXS:     ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-xs-finish-select-201809-spacegray?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IPXR:     ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-xr-finish-select-201809-6-1inch-black?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IPX:      ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-x-finish-select-2017-spacegray?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP8P:     ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone8-plus-select-2018-space-gray?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP8:      ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone8-select-2018-space-gray?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP7P:     ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone7-plus-black-select-2016?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP7:      ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone7-black-select-2016?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP6SP:    ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone6s-plus-black-select-2015?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP6S:     ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone6s-black-select-2015?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP6P:     ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone6-plus-space-gray-select-2014?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IP6:      ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone6-space-gray-select-2014?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IPSE3:    ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-se-finish-select-202203-starlight?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IPSE2:    ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-se-black-select-2020?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  IPSE1:    ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-se-select-2016?wid=940&hei=1112&fmt=p-jpg&qlt=95'],

  // ── MacBooks (Apple CDN) ──────────────────────────────────────────────────
  MBA15M4:      ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mba15-m4-blue-select-202503?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  MBA13M4:      ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mba13-m4-blue-select-202503?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBA15-M4':   ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mba15-m4-blue-select-202503?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBA13-M4':   ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mba13-m4-blue-select-202503?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBA15-M3':   ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mba15-m3-midnight-select-202402?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBA13-M3':   ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mba13-m3-midnight-select-202402?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBA15-M2':   ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mba15-m2-midnight-select-202306?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBA13-M2':   ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mba13-m2-midnight-select-202301?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBA13-M2-2023': ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mba13-m2-midnight-select-202301?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBA13-M1':   ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mba13-m1-gold-select-202010?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBA13-2020-INTEL': ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mba13-gold-select-202003?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBA13-2019': ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-gold-select-201810?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBA13-2017': ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-silver-select-201706?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBA13-2015': ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-silver-select-201706?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBA11-2015': ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-silver-select-201706?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBAR13-2018': ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-gold-select-201810?wid=940&hei=1112&fmt=p-jpg&qlt=95'],

  'MBP16-M4PRO': ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp16-m4-spacegray-select-202410?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBP14-M4':    ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp14-m4-spacegray-select-202410?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBP16-M3PRO': ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp16-m3-pro-spacegray-select-202310?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBP14-M3PRO': ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp14-m3-spacegray-select-202310?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBP16-M2PRO': ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp16-spacegray-select-202301?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBP14-M1PRO': ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp-14-spacegray-select-202110?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBP13-M2':    ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp13-spacegray-select-202206?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBP13-M1':    ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp13-spacegray-select-202011?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBP13-2020-INTEL': ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp13-spacegray-select-202005?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBP13-2019': ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp13-spacegray-select-201911?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBP13-2018': ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp13-spacegray-select-201906?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBP13-2017': ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp13-silver-select-201706?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBP13-2016': ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp13-silver-select-201611?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBP13-2015': ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp13-silver-select-201503?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBP15-2019': ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp15-spacegray-select-201905?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBP15-2018': ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp15-spacegray-select-201807?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBP15-2017': ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp15-silver-select-201706?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MBP15-2015': ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp15-silver-select-201503?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MB12-2017':  ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-gold-select-201706?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MB12-2016':  ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-gold-select-201706?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'MB12-2015':  ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-gold-select-201706?wid=940&hei=1112&fmt=p-jpg&qlt=95'],

  // ── Apple Accessories ─────────────────────────────────────────────────────
  'AIRPODS-PRO':      ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/airpods-pro-2nd-gen-hero-202209?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'AW-SE2-44-BLK':    ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/apple-watch-se-2nd-gen-product-select-202209-44mm_midnight?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'AW-SE3-40-WHT':    ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/apple-watch-se-2nd-gen-product-select-202209-40mm_starlight?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'AW-SE3-44':        ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/apple-watch-se-2nd-gen-product-select-202209-44mm_midnight?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'AW-S11-42-GPS-ROSE': ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/apple-watch-series-10-product-select-202409-42mm_rosegold?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'APL-USBC-20W':     ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/apple-20w-usb-c-power-adapter-02?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'APL-USBC-61W':     ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/apple-61w-usb-c-power-adapter?wid=940&hei=1112&fmt=p-jpg&qlt=95'],

  // ── Accessories ───────────────────────────────────────────────────────────
  'CBL-BRAIDED-USBC':  ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=80'],
  'HDMI-ONTEN-21':     ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80'],
  'CBL-USBA-USBC-27W': ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=80'],
  'KBD-TWOLF-T16':     ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80'],
  'OTBX-IP13P-CLR':    ['https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&w=900&q=80'],
  'OTBX-IP13PMAX-CLR': ['https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&w=900&q=80'],
  'PB-20W-MAG-WIRELESS': ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=900&q=80'],
  'PB-SLIM-MAG':       ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=900&q=80'],

  // ── PlayStation consoles ──────────────────────────────────────────────────
  'PS5':          ['https://gmedia.playstation.com/is/image/SIEPDC/ps5-product-image-01-en-14sep21?$2400px$'],
  'PS5-DISC':     ['https://gmedia.playstation.com/is/image/SIEPDC/ps5-product-image-01-en-14sep21?$2400px$'],
  'PS5-DIGITAL':  ['https://gmedia.playstation.com/is/image/SIEPDC/ps5-digital-edition-product-hero-01-en-14jan21?$2400px$'],
  'PS4-PRO':      ['https://gmedia.playstation.com/is/image/SIEPDC/ps4-pro-product-image-01-ps4-en-14sep21?$2400px$'],
  'PS4-SLIM':     ['https://gmedia.playstation.com/is/image/SIEPDC/ps4-slim-product-image-01-en-14sep21?$2400px$'],
  'PS4':          ['https://gmedia.playstation.com/is/image/SIEPDC/ps4-slim-product-image-01-en-14sep21?$2400px$'],
  'PS3':          ['https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Sony-PlayStation-3-5001-Console-BL.jpg/400px-Sony-PlayStation-3-5001-Console-BL.jpg'],
  'PS2':          ['https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/PlayStation2.jpg/400px-PlayStation2.jpg'],
  'PS1':          ['https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/PSX-Console-wController.jpg/400px-PSX-Console-wController.jpg'],

  // ── PlayStation controllers ───────────────────────────────────────────────
  'PS5-DUALSENSE': ['https://gmedia.playstation.com/is/image/SIEPDC/dualsense-controller-ps5-2up-en-12aug22?$1600px$'],

  // ── Xbox consoles ─────────────────────────────────────────────────────────
  'XBOX-SX':     ['https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RWH0Ik?ver=9fe0'],
  'XBOX-SS-1TB': ['https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RWHHDU?ver=f1be'],
  'XBOX-SS-512': ['https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RWHHDU?ver=f1be'],
  'XBOX-ONE-X':  ['https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE4mRni?ver=ec62'],
  'XBOX-ONE-S':  ['https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE4mRni?ver=ec62'],
  'XBOX-ONE-OG': ['https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Microsoft-Xbox-One-Console-BR.jpg/400px-Microsoft-Xbox-One-Console-BR.jpg'],
  'XBOX-360':    ['https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Xbox-360-S-Console.jpg/400px-Xbox-360-S-Console.jpg'],
  'XBOX-OG':     ['https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Xbox-Console-wController.jpg/400px-Xbox-Console-wController.jpg'],

  // ── Xbox controllers ─────────────────────────────────────────────────────
  'XBOX-CTRL-WIRELESS': ['https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE4NM3b?ver=4e76'],
  'XBOX-CTRL-OG':       ['https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Xbox-Duke-Controller.jpg/400px-Xbox-Duke-Controller.jpg'],

  // ── Nintendo consoles ─────────────────────────────────────────────────────
  'NSW-OLED':     ['https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_800/b_white/f_auto/q_auto/ncom/en_US/products/hardware/nintendo-switch-oled-model/white/113496-nintendo-switch-oled-white-set'],
  'NSW-LITE':     ['https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_800/b_white/f_auto/q_auto/ncom/en_US/products/hardware/nintendo-switch-lite/blue/108303-nintendo-switch-lite-blue'],
  'NSW-2024':     ['https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_800/b_white/f_auto/q_auto/ncom/en_US/products/hardware/nintendo-switch/red-blue/108303-nintendo-switch-neon-red-neon-blue-set'],
  'NSW2-BASE':    ['https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_800/b_white/f_auto/q_auto/ncom/en_US/products/hardware/nintendo-switch-oled-model/white/113496-nintendo-switch-oled-white-set'],
  'NSW2-BUNDLE':  ['https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_800/b_white/f_auto/q_auto/ncom/en_US/products/hardware/nintendo-switch-oled-model/white/113496-nintendo-switch-oled-white-set'],
  'WIIU-32':      ['https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Wii_U_Console_and_Gamepad.png/400px-Wii_U_Console_and_Gamepad.png'],
  'WII':          ['https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Wii_Wiimote.jpg/400px-Wii_Wiimote.jpg'],
  '3DS-XL':       ['https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Nintendo-3DS-XL-angled.jpg/400px-Nintendo-3DS-XL-angled.jpg'],
  'N3DS-XL':      ['https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Nintendo-3DS-XL-angled.jpg/400px-Nintendo-3DS-XL-angled.jpg'],
  'DS-LITE':      ['https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/NintendoDS_small.jpg/400px-NintendoDS_small.jpg'],
  'GBA':          ['https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Game-Boy-Advance.jpg/400px-Game-Boy-Advance.jpg'],
  'GBC':          ['https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/GBC.jpg/400px-GBC.jpg'],
  'NES':          ['https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/NES-Console-Set.jpg/400px-NES-Console-Set.jpg'],
  'NES-MINI':     ['https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/NES-Console-Set.jpg/400px-NES-Console-Set.jpg'],
  'SEGA-DREAMCAST': ['https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Dreamcast_with_controller.jpg/400px-Dreamcast_with_controller.jpg'],
  'SEGA-DC-CTRL': ['https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Dreamcast_controller.jpg/400px-Dreamcast_controller.jpg'],

  // ── Tablets ───────────────────────────────────────────────────────────────
  'IPAD-AIR':     ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/ipad-air-select-wifi-spacegray-202105?wid=940&hei=1112&fmt=p-jpg&qlt=95'],
  'ANDROID-TAB':  ['https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=900&q=80'],

  // ── Controllers (Mobile) ──────────────────────────────────────────────────
  'BACKBONE-PS-IOS': ['https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?auto=format&fit=crop&w=900&q=80'],

  // ── Arcade cabinets ───────────────────────────────────────────────────────
  'ARC-DRAGLAIR':   ['https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80'],
  'ARC-MK2':        ['https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80'],
  'ARC-NBAJAM-4P':  ['https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80'],
  'ARC-NFLBLITZ-4P':['https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80'],
  'ARC-SF2CE':      ['https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80'],
  'ARC-TMNT-4P':    ['https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80'],
  'ARC-SIMP-STOOL': ['https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80'],

  // ── Video Games ───────────────────────────────────────────────────────────
  // PS2 games
  'VG-PS2-GOW':      ['https://upload.wikimedia.org/wikipedia/en/3/33/God_of_War_2005_cover.png'],
  'VG-PS2-NFSMW':    ['https://upload.wikimedia.org/wikipedia/en/3/36/NFS_Most_Wanted.jpg'],
  'VG-PS2-GTASA':    ['https://upload.wikimedia.org/wikipedia/en/1/1a/GTA_San_Andreas_original_box_art.jpg'],
  'VG-PS2-SOCOM':    ['https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=900&q=80'],
  'VG-PS2-ICO':      ['https://upload.wikimedia.org/wikipedia/en/5/52/Ico_box.jpg'],
  'VG-PS2-SH2':      ['https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=900&q=80'],
  'VG-PS2-DQ8':      ['https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=900&q=80'],
  // PS4 games
  'VG-PS4-GOW4':     ['https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=900&q=80'],
  'VG-PS4-TLOU2':    ['https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=900&q=80'],
  'VG-PS4-RDR2':     ['https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=900&q=80'],
  'VG-PS4-SPIDERMAN': ['https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=900&q=80'],
  'VG-PS4-HORIZON':  ['https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=900&q=80'],
  'VG-PS4-BLOODBORNE': ['https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=900&q=80'],
  // Switch games
  'VG-NSW-BotW':     ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=900&q=80'],
  'VG-NSW-MK8D':     ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=900&q=80'],
  // 3DS games
  'VG-3DS-POKEMON':  ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=900&q=80'],
  'VG-3DS-MH4U':     ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=900&q=80'],
  'VG-3DS-ZELDA':    ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=900&q=80'],
  'VG-3DS-FE':       ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=900&q=80'],
  // DS game
  'VG-DS-POKEMON-SOUL': ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=900&q=80'],
  // Wii games
  'VG-WII-SMASH':    ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=900&q=80'],
  'VG-WII-GALAXY':   ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=900&q=80'],
  'VG-WII-SPORTS':   ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=900&q=80'],
  // Wii U game
  'VG-WIIU-SPLATOON': ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?auto=format&fit=crop&w=900&q=80'],

  // ── Protection ────────────────────────────────────────────────────────────
  'PR-SC-001':   ['https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=900&q=80'],
  'PR-TG-001':   ['https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=900&q=80'],
};

// Additional pattern-based fallbacks (applied if specific SKU not found above)
// These check if the product name contains the key phrase
const CATEGORY_FALLBACKS: Array<{ test: (row: any) => boolean; url: string }> = [
  // PlayStation systems
  { test: r => r.name.includes('PS5'),                      url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps5-product-image-01-en-14sep21?$2400px$' },
  { test: r => r.name.includes('PS4'),                      url: 'https://gmedia.playstation.com/is/image/SIEPDC/ps4-slim-product-image-01-en-14sep21?$2400px$' },
  { test: r => r.name.includes('PlayStation 3') || r.name.includes('PS3'), url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Sony-PlayStation-3-5001-Console-BL.jpg/400px-Sony-PlayStation-3-5001-Console-BL.jpg' },
  { test: r => r.name.includes('PlayStation 2') || r.name.includes('PS2'), url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/PlayStation2.jpg/400px-PlayStation2.jpg' },
  { test: r => r.name.includes('PlayStation 1') || (r.category === 'PlayStation' && r.subcategory === 'PS1'), url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/PSX-Console-wController.jpg/400px-PSX-Console-wController.jpg' },
  // Xbox systems
  { test: r => r.name.includes('Series X'),                 url: 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RWH0Ik?ver=9fe0' },
  { test: r => r.name.includes('Series S'),                 url: 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RWHHDU?ver=f1be' },
  { test: r => r.name.includes('Xbox One X'),               url: 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE4mRni?ver=ec62' },
  { test: r => r.name.includes('Xbox One S') || r.name.includes('Xbox One ('), url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Microsoft-Xbox-One-Console-BR.jpg/400px-Microsoft-Xbox-One-Console-BR.jpg' },
  { test: r => r.name.includes('Xbox 360'),                 url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Xbox-360-S-Console.jpg/400px-Xbox-360-S-Console.jpg' },
  { test: r => r.name.includes('Original Xbox'),            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Xbox-Console-wController.jpg/400px-Xbox-Console-wController.jpg' },
  // Nintendo
  { test: r => r.name.includes('Switch 2'),                 url: 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_800/b_white/f_auto/q_auto/ncom/en_US/products/hardware/nintendo-switch-oled-model/white/113496-nintendo-switch-oled-white-set' },
  { test: r => r.name.includes('Switch OLED'),              url: 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_800/b_white/f_auto/q_auto/ncom/en_US/products/hardware/nintendo-switch-oled-model/white/113496-nintendo-switch-oled-white-set' },
  { test: r => r.name.includes('Switch Lite'),              url: 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_800/b_white/f_auto/q_auto/ncom/en_US/products/hardware/nintendo-switch-lite/blue/108303-nintendo-switch-lite-blue' },
  { test: r => r.name.includes('Nintendo Switch'),          url: 'https://assets.nintendo.com/image/upload/ar_16:9,c_lpad,w_800/b_white/f_auto/q_auto/ncom/en_US/products/hardware/nintendo-switch/red-blue/108303-nintendo-switch-neon-red-neon-blue-set' },
  { test: r => r.name.includes('Wii U'),                    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Wii_U_Console_and_Gamepad.png/400px-Wii_U_Console_and_Gamepad.png' },
  { test: r => r.name.includes('Nintendo Wii'),             url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Wii_Wiimote.jpg/400px-Wii_Wiimote.jpg' },
  { test: r => r.name.includes('New Nintendo 3DS') || r.name.includes('Nintendo 3DS XL') || r.name.includes('Nintendo 3DS'), url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Nintendo-3DS-XL-angled.jpg/400px-Nintendo-3DS-XL-angled.jpg' },
  { test: r => r.name.includes('Nintendo DS'),              url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/NintendoDS_small.jpg/400px-NintendoDS_small.jpg' },
  { test: r => r.name.includes('Game Boy Advance'),         url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Game-Boy-Advance.jpg/400px-Game-Boy-Advance.jpg' },
  { test: r => r.name.includes('Game Boy Color'),           url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/GBC.jpg/400px-GBC.jpg' },
  { test: r => r.name.includes('NES') || r.name.includes('Nintendo Classic'), url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/NES-Console-Set.jpg/400px-NES-Console-Set.jpg' },
  { test: r => r.name.includes('Dreamcast'),               url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Dreamcast_with_controller.jpg/400px-Dreamcast_with_controller.jpg' },
  // MacBook catch-all
  { test: r => r.name.includes('MacBook Pro') && r.name.includes('16'), url: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp16-m3-pro-spacegray-select-202310?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  { test: r => r.name.includes('MacBook Pro') && r.name.includes('15'), url: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp15-spacegray-select-201905?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  { test: r => r.name.includes('MacBook Pro') && r.name.includes('14'), url: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp14-m3-spacegray-select-202310?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  { test: r => r.name.includes('MacBook Pro'),             url: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mbp13-spacegray-select-202206?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  { test: r => r.name.includes('MacBook Air') && r.name.includes('15'), url: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mba15-m3-midnight-select-202402?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  { test: r => r.name.includes('MacBook Air'),             url: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/mba13-m3-midnight-select-202402?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  { test: r => r.name.includes('MacBook'),                 url: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-gold-select-201706?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  // iPhone catch-all
  { test: r => r.category === 'iPhone',                    url: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-16-finish-select-202409-6-1inch-ultramarine?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  // Video games
  { test: r => r.category === 'Video Games',               url: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=900&q=80' },
  // Arcade machines
  { test: r => r.category === 'Arcade Machines',           url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80' },
  // AirPods
  { test: r => r.name.includes('AirPods'),                 url: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/airpods-pro-2nd-gen-hero-202209?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  // Apple Watch
  { test: r => r.name.includes('Apple Watch'),             url: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/apple-watch-se-2nd-gen-product-select-202209-44mm_midnight?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  // iPad
  { test: r => r.name.includes('iPad'),                    url: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/ipad-air-select-wifi-spacegray-202105?wid=940&hei=1112&fmt=p-jpg&qlt=95' },
  // Generic gaming controller
  { test: r => r.subcategory === 'PlayStation' && r.name.includes('DualSense'), url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualsense-controller-ps5-2up-en-12aug22?$1600px$' },
  { test: r => r.subcategory === 'PlayStation' && r.name.includes('DualShock'), url: 'https://gmedia.playstation.com/is/image/SIEPDC/dualshock4-product-image-01-ps4-en-14sep21?$2400px$' },
];

async function seedImages() {
  console.log('Fetching all products without images...');
  const { rows } = await pool.query<{ id: string; sku: string; name: string; category: string; subcategory: string; images: string[] }>(
    `SELECT id, sku, name, category, subcategory, images FROM products ORDER BY category, name`
  );

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    // Already has images
    if (row.images && row.images.length > 0) {
      skipped++;
      continue;
    }

    // Try exact SKU match first
    let imgUrl: string | undefined = IMAGE_MAP[row.sku]?.[0];

    // Fall back to pattern matching
    if (!imgUrl) {
      for (const fb of CATEGORY_FALLBACKS) {
        if (fb.test(row)) {
          imgUrl = fb.url;
          break;
        }
      }
    }

    if (!imgUrl) {
      console.log(`  No image found for: ${row.sku} — ${row.name}`);
      continue;
    }

    await pool.query(
      `UPDATE products SET images = $1::text[], updated_at = NOW() WHERE id = $2`,
      [[imgUrl], row.id]
    );
    updated++;
    console.log(`  ✓ ${row.sku}: ${row.name}`);
  }

  console.log(`\nDone — updated ${updated}, skipped ${skipped} (already had images).`);
  await pool.end();
}

seedImages().catch(err => { console.error(err); process.exit(1); });
