---
name: Stripe Checkout image URLs
description: Requirements for product images included in Stripe Checkout Sessions.
---

Stripe Checkout Session `product_data.images` entries must be absolute HTTPS URLs. Relative paths such as `/api/product-images/item.svg` cause Stripe to reject session creation with “Not a valid URL.”

**Why:** Storefront product images can be served by relative API paths, which browsers resolve correctly but Stripe cannot validate as public image URLs.

**How to apply:** During checkout session creation, include only image URLs that parse as absolute HTTPS addresses. Omit relative or otherwise invalid image values rather than blocking payment checkout.