# Suvarna — Backend API Documentation

Backend API for the Suvarna dry fruits e-commerce app. This document covers every API currently implemented — Auth, Product, Wishlist, Cart, Order and Admin — for frontend integration.

## Base URL

```
http://localhost:5020/api/v1
```

Replace the host with the deployed API domain in production.

## Database setup

```bash
npm run db:migrate   # applies database/migrations/*.sql not yet applied (tracked in schema_migrations)
npm run seed         # upserts the catalog, home and product page content from seeds/data/store-data.js
```

Both are safe to re-run. The seed only creates inventory rows and never overwrites existing stock.

**Fresh database:** create it, import `database/schema.sql` (the full current schema, with `schema_migrations` pre-filled), then run `npm run seed`. After adding a migration, regenerate `schema.sql` so it stays current.

## Payment configuration

Online payment uses Razorpay. Set both keys in `.env` (never in the frontend, never in git):

```
RAZORPAY_KEY_ID=rzp_test_xxx       # rzp_live_xxx in production
RAZORPAY_KEY_SECRET=xxx
```

The key id is sent to the checkout page by `POST /payment/razorpay/order`; the secret never leaves the server. Use **test** keys while developing — live keys charge real money.

## Required Headers

**Every single request** (including public/guest endpoints) must include the API key header, or the server returns `401 Unauthorized`:

```
api-key: <the shared API key>
```

For any request with a JSON body (`POST` / `PUT` / `PATCH`), also send:

```
Content-Type: application/json
```

**Protected endpoints** (anything under Wishlist, Cart and Order) additionally require the login token obtained from Signup/Login:

```
Authorization: Bearer <token>
```

(The header name `token: <token>` — without `Bearer` — also works, but `Authorization: Bearer <token>` is the recommended standard.)

If the token is missing, invalid, expired, or the session was logged out, you get a `401` with `code: -1` (see error table below) — treat this as "redirect to login."

## Response Envelope

Every response is JSON with this shape:

```json
{
  "code": 1,
  "message": "Human readable message",
  "data": {}
}
```

- **Always check `code`, not just the HTTP status** — most validation/business errors return **HTTP 200** with a non-1 `code`. Only auth failures (missing/bad api-key or token) return HTTP 401.
- `message` is safe to show directly in a toast/snackbar.
- `data` is present only when there's data to return (may be `null` for a message-only success like "Cart item removed").
- `pagination` is present only on paginated list APIs, as a sibling of `data`:

```json
{
  "code": 1,
  "message": "Products fetched successfully",
  "data": [ ],
  "pagination": {
    "current_page": 1,
    "per_page": 12,
    "total": 25,
    "total_pages": 3
  }
}
```

### `code` values

| code | HTTP status | Meaning |
|------|-------------|---------|
| `1`  | 200 | Success |
| `0`  | 200 | Business/validation error (e.g. "Only 3 unit(s) available in stock", "Access denied") — show `message` to the user |
| `2`  | 200 | Missing/invalid required field — show `message` next to the relevant field |
| `3`  | 200 | No data found (unknown id/slug/order number, or a resource that isn't yours) |
| `-1` | 401 | Missing/wrong `api-key`, or missing/invalid/expired auth token — redirect to login for token errors |
| `500`| 500 | Unexpected server error |

A resource that doesn't exist and one that exists but belongs to another user are **intentionally indistinguishable** (both return `code: 3`) — the API never confirms whether another user's order/cart item exists.

---

# Auth

No token required for these two — they're how you get one.

## `POST /user/signup`

**Request:**
```json
{
    "name": "Sahil Mansuri",
    "email": "sahil@gmail.com",
    "phone": "9876543210",
    "password": "Password@123"
}
```

| field | required | notes |
|---|---|---|
| `name` | yes | |
| `phone` | yes | 10-digit Indian mobile starting with 6–9; `+91`, a leading `0`, spaces and dashes are accepted and stripped |
| `email` | no | validated as an email format only if provided |
| `password` | yes | min 8 chars, at least one uppercase, one lowercase, one digit, one special character |

**Success response (`code: 1`):**
```json
{
    "code": 1,
    "message": "Signup successful",
    "data": {
        "token": "<jwt>",
        "user": {
            "id": 3,
            "name": "Sahil Mansuri",
            "email": "sahil@gmail.com",
            "role": "user",
            "phone": "9876543210",
            "is_verified": false
        }
    }
}
```

**Errors:** `code: 2` missing/invalid field (bad phone/password/email format, etc.), `code: 0` `"Phone number is already registered"` / `"Email is already registered"`.

## `POST /user/login`

Works for both customers and admins — same endpoint, response `role` tells you which.

**Request:**
```json
{
    "login": "sahil@gmail.com",
    "password": "Password@123"
}
```

`login` accepts **either email or phone**. Emails are case-insensitive; phones may be typed as `+91 98765 43210`, `098765-43210`, etc.

**Success response — customer (`role: "user"`):**
```json
{
    "code": 1,
    "message": "Login successful",
    "data": {
        "token": "<jwt>",
        "user": {
            "id": 3,
            "name": "Sahil Mansuri",
            "email": "sahil@gmail.com",
            "role": "user",
            "phone": "9876543210",
            "is_verified": false
        }
    }
}
```

**Success response — admin (`role: "admin"` — note: no `phone`/`is_verified` fields):**
```json
{
    "code": 1,
    "message": "Login successful",
    "data": {
        "token": "<jwt>",
        "user": {
            "id": 2,
            "name": "Test Admin",
            "email": "testadmin@example.com",
            "role": "admin"
        }
    }
}
```

**Errors:** `code: 2` missing `login`/`password`, `code: 3` `"Invalid credentials"` (wrong password, unknown login, or account inactive/deleted — deliberately the same message for all three so the API doesn't leak which case it was).

Store `token` (e.g. in secure storage) and send it as `Authorization: Bearer <token>` on every protected request below. Save `role` too — the UI should hide customer-only screens (cart/wishlist/orders) for an admin session.

The token only carries the account `id` and `role`; read profile details from the `user` object instead.

## `POST /user/logout`

Requires `Authorization: Bearer <token>` (customer or admin). Revokes **that** token only — other devices stay logged in.

```json
{ "code": 1, "message": "Logged out", "data": null }
```

Any later request with the same token gets `401` / `code: -1` — treat that as "logged out" and send the user to login.

---

# Product (public — no token required)

## `GET /product/home`

No query params. Returns everything the home page renders in one call.

```json
{
    "code": 1,
    "message": "Home data fetched successfully",
    "data": {
        "hero": {
            "id": 1,
            "eyebrow": "Premium By Nature",
            "title": "Saffron, Almonds, Ghee and Honey, Sourced Directly From Farmers",
            "subtitle": "Suvarna7 sources Mamra almonds, ...",
            "image_url": "https://...",
            "image_alt": "Bowls of almonds, walnuts, saffron and ghee on a wooden table",
            "cta": { "label": "Shop Now", "href": "/#products" },
            "secondary_cta": { "label": "Our Story", "href": "/our-story" }
        },
        "promo": { "...": "same shape as hero (mobile banner)" },
        "highlights": {
            "hero":         [ { "id": 1, "icon": "sprout", "title": "100% Grade-A", "description": "Kashmiri & Afghani Harvest" } ],
            "trust_badges": [ { "id": 4, "icon": "leaf", "title": "100% Natural", "description": null } ],
            "trust_points": [ { "id": 8, "icon": "leaf", "title": "Direct Farmer Sourcing", "description": "We buy directly ..." } ]
        },
        "categories": [
            { "id": 9, "name": "Almonds", "slug": "almonds", "image_url": null }
        ],
        "products": [
            {
                "id": 13,
                "name": "Kashmir Mamra Almonds",
                "slug": "kashmir-mamra-almonds",
                "short_description": "Wild-harvested, cold-pressed oil-rich almonds",
                "description": "Hand-picked from the Mamra orchards of Kashmir, ...",
                "category": { "id": 9, "name": "Almonds", "slug": "almonds" },
                "origin": "Kashmir",
                "processing": "Raw",
                "health_benefits": ["Heart Health", "Keto Friendly", "High Protein"],
                "certifications": [ { "label": "100% Chemical-Free", "description": "No fumigation, ..." } ],
                "rating": 4.8,
                "review_count": 312,
                "is_featured": true,
                "is_bestseller": true,
                "discount_percent": 17,
                "delivery_estimate_days": [2, 4],
                "image_url": "/images/products/kashmir-mamra-almonds.webp",
                "images": ["/images/products/kashmir-mamra-almonds.webp"],
                "min_price": 579,
                "max_price": 2099,
                "variants": [
                    {
                        "id": 16,
                        "variant_name": "250g",
                        "weight_value": 250,
                        "weight_unit": "g",
                        "sku": "ALM-MAM-250",
                        "mrp": 699,
                        "selling_price": 579,
                        "is_default": true,
                        "available_quantity": 27,
                        "in_stock": true
                    }
                ]
            }
        ],
        "featured_products": [ "...same card shape, products with is_featured" ],
        "best_sellers": [ "...same card shape, products with is_bestseller" ],
        "hampers": [
            {
                "id": 1,
                "name": "Festive Nut Box",
                "slug": "festive-nut-box",
                "subtitle": "Almonds & walnuts",
                "image_url": "/images/hampers/festive-nut-box.webp",
                "product_slugs": ["afghani-gurbandi-almonds", "kashmir-mamra-almonds", "kashmiri-walnut-kernels"]
            }
        ],
        "testimonials": [
            { "id": 1, "name": "Ritika Sharma", "location": "Pune, Maharashtra", "rating": 5, "quote": "The Mamra almonds taste ..." }
        ],
        "faqs": [
            { "id": 1, "question": "Is Cash on Delivery (COD) available?", "answer": "Yes, COD is available ..." }
        ]
    }
}
```

- `products` is the full catalog for the home grid (up to 24, ordered by `sort_order`). Each card carries everything the product card design shows, so no second call is needed. Only products with at least one active variant appear.
- `variants` are ordered default-first, then smallest pack first. `available_quantity` is stock minus quantity reserved by pending orders; `variants[].id` is the `product_variant_id` for the Cart API.
- `discount_percent` is computed from the default variant's `mrp` vs `selling_price`.
- `best_sellers` is driven by the admin-set `is_bestseller` flag (it used to be derived from order volume).
- `highlights[].icon` is an icon key (`leaf`, `sprout`, `shield-check`, `truck`, `heart-pulse`, `badge-check`, `package-check`, `users`) that the frontend maps to an icon.
- `rating` / `review_count` are computed from the product's approved reviews (`0` / `0` until it has any).
- Any array can be empty and `hero` / `promo` can be `null`. Hide that section instead of showing an empty state.

## `GET /product`

Search / listing with filters, sort and pagination. Returns the **same full product card** as `GET /product/home`. All query params are optional.

| param | default | notes |
|---|---|---|
| `page` | `1` | |
| `limit` | `12` | capped at `24` |
| `search` | — | matches product name / short description / brand / category name |
| `slugs` | — | comma-separated product slugs (max 24), e.g. to render a wishlist in one call; unknown slugs are skipped |
| `category` | — | category slug, e.g. `almonds` |
| `subcategory` | — | sub-category slug |
| `min_price` / `max_price` | — | matches products with at least one variant priced in this range |
| `sort` | `featured` | one of `featured` (storefront order, same as home), `latest`, `price_asc`, `price_desc`, `name_asc`, `name_desc` |

Invalid/garbage values for any param **silently fall back to the default** rather than erroring — safe to pass through directly from the URL bar.

Example: `GET /product?search=almond&sort=price_asc`

```json
{
    "code": 1,
    "message": "Products fetched successfully",
    "data": [ "...product cards, same shape as GET /product/home's products" ],
    "pagination": { "current_page": 1, "per_page": 12, "total": 3, "total_pages": 1 }
}
```

A product only appears here if it, its category and at least one of its variants are active.

## `GET /product/:slug`

Example: `GET /product/kashmir-mamra-almonds`. Returns everything the product page renders: the same card as `GET /product/home` plus the fields that only the product page uses.

```json
{
    "code": 1,
    "message": "Product details fetched successfully",
    "data": {
        "id": 13,
        "name": "Kashmir Mamra Almonds",
        "slug": "kashmir-mamra-almonds",
        "...": "every product card field (see GET /product/home): category, origin, certifications, rating, variants, images...",
        "brand_name": "Suvarna7",
        "sub_category": { "id": 9, "name": "Almonds", "slug": "almonds" },
        "nutrients": [
            { "label": "Protein", "value_per_100g": "21.2 g", "daily_value_percent": 42 }
        ],
        "lipid_profile": [
            { "label": "Monounsaturated", "percent": 62, "color": "#23412e" }
        ],
        "rating_breakdown": [
            { "stars": 5, "count": 12, "percent": 67 }, { "stars": 4, "count": 4, "percent": 22 },
            { "stars": 3, "count": 1, "percent": 6 }, { "stars": 2, "count": 1, "percent": 6 }, { "stars": 1, "count": 0, "percent": 0 }
        ],
        "storage_tips": {
            "shelf_life": "Best consumed within 6 months from opening when stored airtight.",
            "storage": "Keep in a dry, airtight jar after opening; ...",
            "usage": "Soak overnight for a softer bite ..."
        },
        "frequently_bought_with": [ "...product cards, in the order set on the product" ],
        "similar_products": [ "...up to 4 product cards from the same category" ]
    }
}
```

- `variants[].id` is the `product_variant_id` you pass to the Cart API. `available_quantity` is stock minus quantity reserved by pending orders.
- `nutrients`, `lipid_profile`, `certifications`, `health_benefits`, `storage_tips` and `frequently_bought_with` are set per product from the admin panel (`PUT /admin/product/:id/content`). `storage_tips` is `null` when none are set, so show generic copy.
- `rating`, `review_count` and `rating_breakdown` are computed live from approved reviews.
- Unknown or inactive slug → `code: 3`, `"Product not found"`.

## `GET /product/:slug/reviews`

Approved reviews for a product, newest first. Query: `page` (default `1`), `limit` (default `10`, capped at `20`).

```json
{
    "code": 1,
    "message": "Reviews fetched successfully",
    "data": {
        "rating": 4.8,
        "review_count": 18,
        "breakdown": [ { "stars": 5, "count": 12, "percent": 67 } ],
        "reviews": [
            {
                "id": 1,
                "author": "Ritika Sharma",
                "is_verified_purchase": true,
                "rating": 5,
                "title": "Genuinely oil-rich, not the usual dry almonds",
                "body": "You can taste the difference from day one ...",
                "created_at": "2026-08-01T18:30:00.000Z"
            }
        ]
    },
    "pagination": { "current_page": 1, "per_page": 10, "total": 4, "total_pages": 1 }
}
```

Only reviews an admin has approved are counted or listed. `author` is the reviewer's account name. Unknown slug → `code: 3`.

## `POST /product/:slug/reviews` — write a review (customer token)

```json
{ "rating": 5, "title": "Excellent", "review_text": "Fresh and sweet." }
```

`rating` (1–5) is required; `title` (≤128) and `review_text` (≤1000) are optional. A customer has one review per product — posting again replaces it. Every new or edited review waits for admin approval before it counts, so the response is:

```json
{ "code": 1, "message": "Thanks! Your review will appear once it's approved.", "data": { "rating": 5, "is_verified_purchase": true, "is_approved": false } }
```

`is_verified_purchase` is set automatically when the customer has a paid, non-cancelled order containing the product.

---

# Wishlist (requires token, customer only)

The wishlist saves **products** (the heart on a product card), identified by slug. Every endpoint needs `api-key` + `Authorization: Bearer <customer token>`; an admin token gets `code: 0` `"Access denied"`.

## `GET /product/wishlist`

The customer's saved products, most recently saved first, as full product cards (same shape as `GET /product/home`). Products that were deactivated after being saved are left out.

```json
{ "code": 1, "message": "Wishlist fetched successfully", "data": [ "...product cards" ] }
```

## `PUT /product/wishlist/:slug` — save

```json
{ "code": 1, "message": "Added to wishlist", "data": { "slug": "pure-cow-ghee", "wishlisted": true } }
```

Idempotent: saving an already-saved product still returns success. Unknown/inactive slug → `code: 3`, `"Product not found"`.

## `DELETE /product/wishlist/:slug` — unsave

```json
{ "code": 1, "message": "Removed from wishlist", "data": { "slug": "pure-cow-ghee", "wishlisted": false } }
```

Idempotent: removing a product that isn't saved still returns success.

---

# Addresses (requires token, customer only)

Saved delivery addresses, used by `POST /order`'s `address_id`.

| Method | Path | Notes |
|---|---|---|
| GET | `/user/addresses` | default first, then newest |
| POST | `/user/addresses` | body below; the customer's first address automatically becomes the default |
| PUT | `/user/addresses/:id` | full update, same body |
| DELETE | `/user/addresses/:id` | soft delete; if it was the default, the newest remaining address becomes default |

```json
{
    "full_name": "Ritika Sharma",
    "phone": "+91 98765 43210",
    "address_line1": "12 MG Road",
    "address_line2": "Camp",
    "landmark": "Near Central Park",
    "city": "Pune",
    "state": "Maharashtra",
    "pincode": "411001",
    "address_type": "home",
    "is_default": true
}
```

`address_line2`, `landmark`, `address_type` (`home` | `work` | `other`, default `home`) and `is_default` are optional. Phone accepts the same formats as signup; pincode must be 6 digits. Marking an address default un-marks the others. Editing an address never changes past orders — each order keeps its own copy. Unknown / someone else's id → `code: 3`.

---

# Cart (requires token, customer only)

All cart endpoints identify the cart purely from the logged-in token — never send `user_id`.

## `POST /cart` — add to cart

**Request:**
```json
{ "product_variant_id": 5, "quantity": 2 }
```

If the variant is already in the cart, `quantity` is **added** to the existing line (not replaced) — e.g. 2 already in cart + this call with 3 → line becomes 5.

**Response** (the full, updated cart line item):
```json
{
    "code": 1,
    "message": "Added to cart",
    "data": {
        "id": 1,
        "product_variant_id": 5,
        "product": { "id": 2, "name": "Almonds", "slug": "almonds" },
        "variant": { "id": 5, "variant_name": "Mamra 500g", "weight_value": 500, "weight_unit": "g", "sku": "ALM-MAM-500" },
        "image_url": "https://...",
        "mrp": 899,
        "selling_price": 749,
        "quantity": 2,
        "available_stock": 10,
        "item_total": 1498
    }
}
```

**Errors:** `code: 2` missing/invalid `product_variant_id`/`quantity`, `code: 3` variant not found, `code: 0` `"Only N unit(s) available in stock"` when the requested (or combined) quantity exceeds what's available.

## `GET /cart` — view cart

```json
{
    "code": 1,
    "message": "Cart fetched successfully",
    "data": {
        "items": [ /* same shape as the add-to-cart response's data, one per line */ ],
        "summary": { "subtotal": 1498, "total_items": 2, "item_count": 1 }
    }
}
```

Items are in the order they were first added. `subtotal`/prices always reflect **current** selling price — re-fetch the cart before checkout to catch any price change.

## `PUT /cart/:id` — update quantity

`:id` is the cart line's own `id` (from the cart item, not the variant id).

**Request:** `{ "quantity": 3 }`

Same response shape as add-to-cart. `code: 3` if the line doesn't exist or doesn't belong to you. `code: 0` `"Only N unit(s) available in stock"` if the new quantity exceeds stock.

## `DELETE /cart/:id` — remove one line

```json
{ "code": 1, "message": "Cart item removed", "data": null }
```

`code: 3` if not found / not yours.

## `DELETE /cart` — clear entire cart

```json
{ "code": 1, "message": "Cart cleared", "data": null }
```

---

# Order (requires token, customer only)

## `POST /order` — checkout / place order

Creates an order from **everything currently in the cart**. All pricing is calculated server-side from the database — never send prices/totals from the frontend.

**Request:**
```json
{ "address_id": 12, "notes": "Please deliver after 6 PM" }
```

`address_id` must be one of the logged-in user's own saved addresses. `notes` is optional (max 255 chars).

**Success response:**
```json
{
    "code": 1,
    "message": "Order placed successfully",
    "data": {
        "order_number": "ORD-20260919-0001",
        "subtotal": 897,
        "discount_amount": 0,
        "shipping_amount": 0,
        "tax_amount": 0,
        "total_amount": 897,
        "order_status": "pending",
        "payment_status": "pending",
        "fulfillment_status": "unfulfilled"
    }
}
```

The cart is emptied automatically once the order is placed. `discount_amount`/`shipping_amount`/`tax_amount` are always `0` for now — no coupons, shipping cost or tax logic yet (coming in a later phase), and every order is created as `pending`/`pending`/`unfulfilled`. Pay for it with the Payment APIs below; a successful payment moves it to `confirmed`/`paid`.

**Errors:**
- `code: 2` missing/invalid `address_id`
- `code: 3` `"Address not found"` (doesn't exist or isn't yours)
- `code: 3` `"Your cart is empty"`
- `code: 0` `"<Product> is no longer available. Please update your cart."` — a cart item's product/variant was deactivated since it was added
- `code: 0` `"Only N unit(s) of \"<Product> - <Variant>\" available in stock"` — someone else bought the remaining stock first
- On any error, nothing is created and the cart is left untouched (safe to retry after fixing the issue).

## `GET /order/my-orders` — order history

| param | default |
|---|---|
| `page` | `1` |
| `limit` | `10` (capped at `20`) |

```json
{
    "code": 1,
    "message": "Orders fetched successfully",
    "data": [
        {
            "id": 1,
            "order_number": "ORD-20260919-0001",
            "total_amount": 897,
            "order_status": "pending",
            "payment_status": "pending",
            "fulfillment_status": "unfulfilled",
            "created_at": "2026-09-19T12:09:55.000Z",
            "items": [
                { "product_name": "Almonds", "variant_name": "Mamra 500g", "quantity": 2, "unit_price": 299, "total_price": 897, "image_url": "https://..." }
            ]
        }
    ],
    "pagination": { "current_page": 1, "per_page": 10, "total": 1, "total_pages": 1 }
}
```

Newest orders first.

## `GET /order/:order_number` — order details

Example: `GET /order/ORD-20260919-0001`

```json
{
    "code": 1,
    "message": "Order details fetched successfully",
    "data": {
        "order_number": "ORD-20260919-0001",
        "order_status": "pending",
        "payment_status": "pending",
        "fulfillment_status": "unfulfilled",
        "created_at": "2026-09-19T12:09:55.000Z",
        "customer": { "name": "Test User", "phone": "9999999999", "email": "testuser@example.com" },
        "shipping_address": {
            "name": "Test User", "phone": "9999999999",
            "address_line1": "123 Test Street", "address_line2": null, "landmark": null,
            "city": "Mumbai", "state": "Maharashtra", "country": "India", "pincode": "400001"
        },
        "subtotal": 897, "discount_amount": 0, "shipping_amount": 0, "tax_amount": 0, "total_amount": 897,
        "notes": "Please deliver after 6 PM",
        "items": [
            { "product_name": "Almonds", "variant_name": "Mamra 500g", "sku": "ALM-MAM-500", "quantity": 2, "unit_price": 299, "total_price": 897, "image_url": "https://..." }
        ]
    }
}
```

Product name/variant name/price shown here are a **snapshot from when the order was placed** — they will not change even if the product is later renamed, repriced, or removed. `code: 3` if the order doesn't exist or isn't yours (an invalid-format order number also returns this).

## `PATCH /order/:order_number/cancel` — cancel order

```json
{ "code": 1, "message": "Order cancelled successfully", "data": { "order_number": "ORD-20260919-0001", "order_status": "cancelled" } }
```

Only allowed while `order_status` is still `"pending"`. Once it's moved past that (or already cancelled), you get `code: 0`, `"Order cannot be cancelled once it is <status>"`. `code: 3` if not found/not yours.

---

# Payment — Razorpay (requires token, customer only)

Checkout flow: `POST /order` → `POST /payment/razorpay/order` → open Razorpay Checkout in the browser → `POST /payment/razorpay/verify`.

## `POST /payment/razorpay/order`

**Request:** `{ "order_number": "ORD-20260924-0005" }` — one of the customer's own `pending` orders.

```json
{
    "code": 1,
    "message": "Payment order created",
    "data": {
        "order_number": "ORD-20260924-0005",
        "already_paid": false,
        "key_id": "rzp_test_xxx",
        "razorpay_order_id": "order_Tfmqr...",
        "amount": 32900,
        "currency": "INR",
        "name": "Suvarna7",
        "description": "Order ORD-20260924-0005",
        "prefill": { "name": "Ritika Sharma", "email": "ritika@example.com", "contact": "9876543210" }
    }
}
```

Pass these straight into Razorpay Checkout (`key`, `order_id`, `amount` in **paise**, …). The amount always comes from the order in the database.

- Calling it again for the same order reuses the same Razorpay order instead of creating a new one.
- Before that, it asks Razorpay whether the earlier attempt was actually paid (e.g. the customer paid, then closed the tab before `verify` ran). If so it records the payment and returns `{ "already_paid": true }` — go to the success screen, don't open Checkout.
- `code: 0` if the order is not `pending` (e.g. cancelled).

## `POST /payment/razorpay/verify`

Send Razorpay Checkout's success response, plus the order number:

```json
{
    "order_number": "ORD-20260924-0005",
    "razorpay_order_id": "order_Tfmqr...",
    "razorpay_payment_id": "pay_...",
    "razorpay_signature": "..."
}
```

The server checks the signature (HMAC-SHA256 with the key secret), then fetches the payment from Razorpay to confirm it belongs to this Razorpay order, matches the amount, and is captured (capturing it if it was only authorized). Only then is the order marked `payment_status: "paid"`, `order_status: "confirmed"`.

```json
{ "code": 1, "message": "Payment successful", "data": { "order_number": "ORD-20260924-0005", "order_status": "confirmed", "payment_status": "paid" } }
```

Safe to call twice. `code: 0` `"Payment verification failed"` for a bad signature; `code: 0` with Razorpay's reason if the payment isn't captured or doesn't match. If Razorpay can't be reached, the response asks the customer not to pay again — calling `POST /payment/razorpay/order` later re-checks and records the payment.

---

# Admin (requires token, admin only)

Every endpoint below requires `api-key` + `Authorization: Bearer <admin token>` (obtained via the same `POST /user/login` used by customers — the response's `role` will be `"admin"`). A customer token gets `code: 0` `"Access denied"` on all of these. All list endpoints share the same `page`/`limit`/pagination shape as the customer APIs; all "delete" endpoints are soft deletes (`is_delete = 1`), never a real `DELETE FROM`.

## Dashboard

**`GET /admin/dashboard`** — no params.

```json
{
    "code": 1,
    "message": "Dashboard data fetched successfully",
    "data": {
        "total_users": 12,
        "total_active_products": 8,
        "total_categories": 3,
        "total_orders": 20,
        "pending_orders": 2, "confirmed_orders": 1, "processing_orders": 1,
        "shipped_orders": 3, "delivered_orders": 12, "cancelled_orders": 1,
        "low_stock_variants": 2,
        "recent_orders": [
            { "order_number": "ORD-20260921-0004", "customer_name": "Test User", "total_amount": 240, "order_status": "delivered", "payment_status": "pending", "created_at": "2026-09-21T04:53:37.000Z" }
        ]
    }
}
```

## Category — `/admin/category`

| Method | Path | Notes |
|---|---|---|
| POST | `/admin/category` | `{ "name", "slug"? (auto-generated from name), "description"?, "image_url"?, "is_featured"? }` |
| GET | `/admin/category` | query: `page, limit, search, status` (`active`/`inactive`) |
| GET | `/admin/category/:id` | |
| PUT | `/admin/category/:id` | same body as create (full update) |
| PATCH | `/admin/category/:id/status` | `{ "is_active": 0 \| 1 }` |
| DELETE | `/admin/category/:id` | soft delete |

`slug` has a project-wide unique constraint (checked across active **and** soft-deleted rows) — a duplicate returns `code: 0` `"A category with this slug already exists"`.

## Sub-category — `/admin/subcategory`

Same shape as Category, plus a required `category_id` (must reference a non-deleted category — unknown/deleted id returns `code: 3` `"Category not found"`). Listing also supports `?category_id=`.

## Product — `/admin/product`

| Method | Path | Notes |
|---|---|---|
| POST | `/admin/product` | `{ "sub_category_id", "name", "slug"?, "short_description"?, "description"?, "brand_name"?, "is_featured"?, "is_bestseller"?, "origin"?, "processing"?, "delivery_min_days"?, "delivery_max_days"?, "sort_order"? }` |
| GET | `/admin/product` | query: `page, limit, search, category_id, subcategory_id, status, sort` (`latest`\|`oldest`\|`name_asc`\|`name_desc`) |
| GET | `/admin/product/:id` | full detail: product + category + sub-category + `variants[]` (with stock) + `images[]` + all product-page content (below) |
| PUT | `/admin/product/:id` | full update (the storefront fields `is_bestseller`, `origin`, … are only changed when sent) |
| PUT | `/admin/product/:id/content` | product-page content — see below |
| PATCH | `/admin/product/:id/status` | `{ "is_active": 0 \| 1 }` |
| DELETE | `/admin/product/:id` | soft delete |

### `PUT /admin/product/:id/content`

Everything on the product page besides the basics. Send any of these sections; each one **replaces** that product's list (`[]` clears it, `storage_tips: null` removes the tips). Sections you leave out aren't touched, and all changes apply together or not at all.

```json
{
    "nutrients": [ { "label": "Protein", "value_per_100g": "21.2 g", "daily_value_percent": 42 } ],
    "lipid_profile": [ { "label": "Monounsaturated", "percent": 62, "color": "#23412e" } ],
    "certifications": [ { "label": "100% Chemical-Free", "description": "No fumigation or bleaching." } ],
    "health_benefits": [ "Heart Health", "High Protein" ],
    "storage_tips": { "shelf_life": "…", "storage": "…", "usage": "…" },
    "related_product_ids": [ 12, 15 ]
}
```

Items keep the order you send them in. Labels must be unique within a list, `lipid_profile` percentages can't total more than 100, colours are `#rrggbb`, and a product can't be related to itself. The response is the product's updated content.

## Variant — `/admin/product/:productId/variant`, `/admin/variant/:id`

| Method | Path | Notes |
|---|---|---|
| POST | `/admin/product/:productId/variant` | `{ "variant_name", "weight_value"?, "weight_unit"? (g\|kg\|ml\|l\|pcs), "sku", "mrp", "selling_price", "is_default"? }` |
| GET | `/admin/product/:productId/variant` | list for one product |
| GET | `/admin/variant/:id` | |
| PUT | `/admin/variant/:id` | full update |
| PATCH | `/admin/variant/:id/status` | `{ "is_active": 0 \| 1 }` |
| DELETE | `/admin/variant/:id` | soft delete |

`sku` is globally unique. `selling_price` cannot exceed `mrp`. Setting `is_default: 1` automatically unsets any other default variant on the same product. **Creating a variant automatically creates its inventory row** (`stock_quantity: 0`) so it's immediately visible under Inventory below.

## Product image — `/admin/product/:productId/image`, `/admin/image/:id`

| Method | Path | Notes |
|---|---|---|
| POST | `/admin/product/:productId/image` | `{ "cloudinary_public_id", "image_url", "alt_text"?, "sort_order"?, "is_primary"?, "variant_id"? }` |
| GET | `/admin/product/:productId/image` | ordered by `sort_order` |
| PUT | `/admin/image/:id` | update metadata (not `is_primary` — use the dedicated endpoint below) |
| PATCH | `/admin/image/:id/primary` | marks this image primary, unsets any other primary image on the same product |
| DELETE | `/admin/image/:id` | soft delete |

This API only stores Cloudinary metadata — the actual file upload to Cloudinary happens client-side (unsigned preset or a separate upload step) before calling `POST .../image` with the resulting `public_id`/`url`.

## Inventory — `/admin/inventory`

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/inventory` | query: `page, limit, search` (sku/product/variant name), `low_stock=true` — sorted by lowest available stock first |
| GET | `/admin/inventory/:variantId` | |
| PUT | `/admin/inventory/:variantId` | full overwrite: `{ "stock_quantity", "low_stock_limit"? }` — rejected if below the current reserved quantity |
| PATCH | `/admin/inventory/:variantId/adjust` | `{ "quantity": 20, "type": "add" \| "remove", "reason"? }` |

```json
{ "code": 1, "message": "Inventory adjusted successfully", "data": { "variant_id": 10, "stock_quantity": 50, "reserved_quantity": 0, "available_quantity": 50, "low_stock_limit": 5 } }
```

Removing more than what's currently unreserved returns `code: 0` with the exact available count. Stock can never go negative or below what's already reserved by pending orders. `reason` is accepted for API completeness but not persisted — there is no stock-movement log table yet.

## Reviews — `/admin/review`

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/review` | moderation queue — query: `status` (`pending` default \| `approved`), `product_id, page, limit`; newest first, with product and customer |
| PATCH | `/admin/review/:id/status` | `{ "is_approved": 0 \| 1 }` — only approved reviews show on the site and count towards ratings |
| DELETE | `/admin/review/:id` | soft delete |

## Order — `/admin/order`

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/order` | query: `page, limit, search` (order number/customer name/phone/email), `order_status, payment_status, fulfillment_status, date_from, date_to` (`YYYY-MM-DD`, on `created_at`) |
| GET | `/admin/order/:orderNumber` | full detail incl. the shipping-address snapshot and line items |
| PATCH | `/admin/order/:orderNumber/status` | see below |

**`PATCH /admin/order/:orderNumber/status`** accepts any of `order_status`, `payment_status`, `fulfillment_status` in the same body — only the fields you send are changed; they're never inferred from one another.

```json
{ "order_status": "confirmed" }
```

`order_status` follows a fixed flow: `pending → confirmed → processing → shipped → delivered`, with `cancelled` reachable only from `pending`/`confirmed`/`processing` (not from `shipped`/`delivered`). Any other jump returns `code: 0` with `"Order cannot move from \"X\" to \"Y\""`. Cancelling releases the order's reserved stock automatically. `payment_status` (`pending\|paid\|failed\|refunded`) and `fulfillment_status` (`unfulfilled\|processing\|fulfilled`) can be set directly, independent of `order_status`.

## Customer — `/admin/customer`

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/customer` | query: `page, limit, search` (name/email/phone), `status` |
| GET | `/admin/customer/:id` | profile + their last 20 orders (summary fields only) |
| PATCH | `/admin/customer/:id/status` | `{ "is_active": 0 \| 1 }` — deactivating immediately invalidates the customer's live session/token |

`password_hash` is never returned by any endpoint.

## Shipment — `/admin/shipment`, `/admin/order/:orderNumber/shipment`

Provider-agnostic — `provider` is a free-text field (Ekart, DTDC, Shiprocket, Delhivery, or any other courier), no code changes needed per provider.

| Method | Path | Notes |
|---|---|---|
| POST | `/admin/order/:orderNumber/shipment` | `{ "provider", "awb_number"?, "courier_name"?, "tracking_url"?, "shipping_charge"?, "package_weight"?, "length_cm"?, "width_cm"?, "height_cm"? }` — records a shipment after booking it with a courier (no live courier API integration) |
| GET | `/admin/shipment` | query: `page, limit, search` (AWB/order number), `provider, shipment_status, order_id` |
| GET | `/admin/shipment/:id` | shipment detail + `tracking_history[]` (newest first) |
| PATCH | `/admin/shipment/:id/status` | `{ "shipment_status" }` — one of `created\|pickup_scheduled\|picked_up\|in_transit\|out_for_delivery\|delivered\|failed\|rto\|cancelled` |

Updating `shipment_status` stamps `shipped_at`/`delivered_at` when appropriate and appends a row to `tracking_history` automatically.

---

# Quick integration flow

1. `POST /user/signup` or `POST /user/login` → store `token` + `role`.
2. Browse `GET /product/home`, `GET /product`, `GET /product/:slug` — no token needed.
3. Logged-in customer: `PUT /product/wishlist/:slug` to save items, `POST /cart` to add to cart.
4. `GET /cart` before checkout to show an up-to-date summary.
5. `POST /order` with a saved `address_id` to place the order.
6. `GET /order/my-orders` / `GET /order/:order_number` to show order history and status; `PATCH /order/:order_number/cancel` while still `pending`.

**Not implemented yet** (later phases): OTP/forgot-password, profile editing, Razorpay webhooks and refunds, live courier API integration, coupons, tax, review photos.
