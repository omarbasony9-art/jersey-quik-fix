---
name: Apple CDN Image URL Formats
description: Which Apple CDN URL formats return HTTP 200 from Replit's servers for product images
---

# Apple CDN Image URL Formats

**Base:** `https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/{slug}?wid=940&hei=1112&fmt=p-jpg&qlt=95`

**Why:** Two URL formats exist — "select" format works, "finish" format 404s.
- ✅ WORKS: `iphone11-black-select-2019`
- ❌ 404: `iphone-11-finish-select-2019-black`

**How to apply:** When seeding iPhone/MacBook images, always use "select" format. Test via curl (Node.js fetch cannot reach Apple CDN at all).

## Confirmed 200 — iPhones
- `iphone6-gray-select-2014`
- `iphone6s-gray-select-2015`
- `iphone7-black-select-2016`
- `iphone8-gold-select-2017` (gold works; black 404s)
- `iphone-x-silver-select-2017`
- `iphone-xs-silver-select-2018`
- `iphone-xs-max-silver-select-2018`
- `iphone11-black-select-2019` (also yellow/purple variants)
- `iphone-13-finish-select-202207-6-1inch-midnight` (13+ era uses "finish-select")
- `iphone-13-pro-finish-select-202207-6-1inch-sierrablue`
- `iphone-14-finish-select-202209-6-1inch-blue`
- `iphone-14-finish-select-202209-6-7inch-blue` (Plus)
- `iphone-14-pro-finish-select-202209-6-1inch-deeppurple`
- `iphone-15-finish-select-202309-6-1inch-blue`
- `iphone-15-finish-select-202309-6-7inch-blue` (Plus)
- `iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium`
- `iphone-16-finish-select-202409-6-1inch-black`
- `iphone-16-finish-select-202409-6-7inch-black` (Plus)
- `iphone-16-pro-finish-select-202409-6-3inch-blacktitanium`
- `iphone-16e-finish-select-202502-black`

## Confirmed 404 — iPhones (no working URL found)
- All Plus (6P, 6SP, 7P, 8P), XR, SE (1/2/3)
- All iPhone 11 Pro/Pro Max, iPhone 12 series
- 13 mini, 13 Pro Max, 14 Pro Max, 15 Pro Max, 16 Pro Max
- iPhone 17 series and iPhone Air (released 2025)

## Confirmed 200 — MacBooks
- `mba13-midnight-select-202402` (M3)
- `mba13-starlight-select-202402` (unique color for M4)
- `mba13-silver-select-202402` (unique color for M2-2023)
- `macbook-air-gold-select-201810` (2018 Retina)
- `macbook-air-silver-select-201810` (2019)
- `mba15-midnight-select-202306` (M2)
- `mba15-starlight-select-202306` (M3)
- `mba15-silver-select-202306` (M4 — only silver works; gold/blue 404)
- `mbp14-spacegray-select-202110` (M1 Pro spacegray)
- `mbp14-silver-select-202110` (M1 Pro silver)
- `mbp14-spacegray-select-202301` (M2 Pro)
- `mbp14-silver-select-202301` (M2 Pro silver)
- `mbp14-spacegray-select-202310` (M3 Pro)
- `mbp14-silver-select-202310` (M3 Pro silver — use for M4)
- `mbp15-silver-select-201610` (MBP 15" 2016)
- `mbp16-spacegray-select-202110` (M1 Pro)
- `mbp16-silver-select-202110` (M1 Pro silver)
- `mbp16-spacegray-select-202301` (M2 Pro)
- `mbp16-silver-select-202301` (M2 Pro silver — use for M4)
- `mbp16-silver-select-202310` (M3 Pro)

## Confirmed 404 — MacBooks
- MBA 13" M1, M2, 2020 Intel, 2017, 2015
- MBA 11", MacBook 12" (all years)
- MBP 13" (all years — entire lineup 404)
- MBP 16" 2019, MBP 15" 2015/2017/2018

## Other CDN sources (all confirmed 200)
- **Backbone One PS**: `https://backbone.com/cdn/shop/files/backbone-one-ps-edition.png`
- **Best Buy arcade CDN**: `https://pisces.bbystatic.com/image2/BestBuy_US/images/products/{first4}/{sku}_sd.jpg`
  - Dragon's Lair: 6515486, NFL Blitz: 6511265, Simpsons 4P: 6471758
  - NBA Jam: 6497327, TMNT: 6516318, SF2CE: 6510720, MK2: 6471682
- **Steam game headers**: `https://cdn.cloudflare.steamstatic.com/steam/apps/{appid}/header.jpg`
  - GTA SA: 12120, RDR2: 1174180, NieR: 524220, Wolfenstein 2: 612880
  - Shadow of Mordor: 241930, FIFA 15: 290080, EA UFC: 70900
- **PlayStation blog**: `https://blog.playstation.com/tachyon/2023/10/cd56722db7b991b3d7a33f1bafd55f80d0ac553d.png` (PS5 redesign)
- **Nintendo CDN**: `https://assets.nintendo.com/image/upload/f_auto/q_auto/ncom/en_US/switch/lite/dedicated-to-handheld` (Switch Lite only)

## Verification method
- Apple CDN: MUST use `curl` — Node.js `fetch()` cannot reach Apple CDN at all (ERR, not 404)
- All others: both curl and Node.js fetch work
