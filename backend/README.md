# Suvarna — Backend API Documentation

Backend API for the Suvarna dry fruits e-commerce app. This document covers every API currently implemented — Auth, Product, Wishlist, Cart, Order and Admin — for frontend integration.

## Base URL

```
http://localhost:5020/api/v1
```

Replace the host with the deployed API domain in production.

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
| `phone` | yes | exactly 10 digits, must start with 6–9 |
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

`login` accepts **either email or phone**.

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

---

# Product (public — no token required)

## `GET /product/home`

No query params.

```json
{
    "code": 1,
    "message": "Home data fetched successfully",
    "data": {
        "categories": [
            { "id": 1, "name": "Dry Fruits", "slug": "dry-fruits", "image_url": "https://..." }
        ],
        "featured_products": [
            {
                "id": 1,
                "name": "Mamra Almonds",
                "slug": "mamra-almonds",
                "short_description": "Premium quality almonds",
                "min_price": 299,
                "max_price": 749,
                "image_url": "https://..."
            }
        ],
        "best_sellers": [
            {
                "id": 4,
                "name": "High Seller Almonds",
                "slug": "high-seller-almonds",
                "short_description": "Premium quality almonds",
                "min_price": 299,
                "max_price": 299,
                "image_url": "https://..."
            }
        ]
    }
}
```

`best_sellers` uses the exact same card shape as `featured_products` and product listing — same card component works for all three. It's ranked by total quantity sold across all **non-cancelled** orders (cancelled orders never resulted in a real sale, so they don't count), not a manually-set flag — it fills in automatically as orders come in.

All three arrays can be empty (e.g. `best_sellers` is empty until at least one real order exists) — render sections conditionally (hide a section rather than showing an empty state for it).

## `GET /product`

Listing with filters, search, sort and pagination. All query params are optional.

| param | default | notes |
|---|---|---|
| `page` | `1` | |
| `limit` | `12` | capped at `24` |
| `category` | — | category slug, e.g. `dry-fruits` |
| `subcategory` | — | sub-category slug, e.g. `almonds` |
| `search` | — | matches product name / short description / brand |
| `min_price` / `max_price` | — | matches products with at least one variant priced in this range |
| `sort` | `latest` | one of `latest`, `price_asc`, `price_desc`, `name_asc`, `name_desc` |

Invalid/garbage values for any param **silently fall back to the default** rather than erroring — safe to pass through directly from the URL bar.

Example: `GET /product?category=dry-fruits&sort=price_asc&page=1&limit=12`

```json
{
    "code": 1,
    "message": "Products fetched successfully",
    "data": [
        {
            "id": 1,
            "name": "Mamra Almonds",
            "slug": "mamra-almonds",
            "short_description": "Premium quality almonds",
            "image_url": "https://...",
            "min_price": 299,
            "max_price": 749,
            "category": { "id": 1, "name": "Dry Fruits", "slug": "dry-fruits" },
            "sub_category": { "id": 1, "name": "Almonds", "slug": "almonds" }
        }
    ],
    "pagination": { "current_page": 1, "per_page": 12, "total": 2, "total_pages": 1 }
}
```

A product only appears here if it has at least one active, in-stock-tracked variant.

## `GET /product/:slug`

Example: `GET /product/mamra-almonds`

```json
{
    "code": 1,
    "message": "Product details fetched successfully",
    "data": {
        "id": 1,
        "name": "Mamra Almonds",
        "slug": "mamra-almonds",
        "short_description": "Premium quality almonds",
        "description": "Full description...",
        "brand_name": "Suvarna",
        "category": { "id": 1, "name": "Dry Fruits", "slug": "dry-fruits" },
        "sub_category": { "id": 1, "name": "Almonds", "slug": "almonds" },
        "variants": [
            {
                "id": 1,
                "variant_name": "Mamra 100g",
                "weight_value": 100,
                "weight_unit": "g",
                "sku": "ALM-MAM-100",
                "mrp": 399,
                "selling_price": 299,
                "is_default": true,
                "stock_quantity": 20,
                "in_stock": true
            }
        ],
        "images": [
            { "id": 2, "image_url": "https://...", "alt_text": "Almonds main", "sort_order": 1, "is_primary": 1 }
        ]
    }
}
```

`variant_id` (from here) is what you pass to Wishlist and Cart APIs. Unknown/inactive slug → `code: 3`, `"Product not found"`.

---

# Wishlist (requires token, customer only)

## `POST /product/wishlist/toggle`

One call flips wishlist state for a variant — add if not present, remove if already there.

**Headers:** `api-key`, `Authorization: Bearer <token>` (must be a customer token — an admin token gets `code: 0` `"Access denied"`).

**Request:**
```json
{ "variant_id": 5 }
```

**Response (now wishlisted):**
```json
{ "code": 1, "message": "Added to wishlist", "data": { "variant_id": 5, "wishlisted": true } }
```

**Response (now removed):**
```json
{ "code": 1, "message": "Removed from wishlist", "data": { "variant_id": 5, "wishlisted": false } }
```

Use the `wishlisted` boolean in the response to update the UI's heart/wishlist icon — don't assume based on what you clicked. Unknown/inactive `variant_id` → `code: 3`, `"Product variant not found"`.

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

`subtotal`/prices always reflect **current** selling price — re-fetch the cart before checkout to catch any price change.

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

The cart is emptied automatically once the order is placed. `discount_amount`/`shipping_amount`/`tax_amount` are always `0` for now — no coupons, shipping cost or tax logic yet (coming in a later phase), and **no payment gateway is wired up yet** — every order is created as `pending`/`pending`/`unfulfilled`.

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
| POST | `/admin/product` | `{ "sub_category_id", "name", "slug"?, "short_description"?, "description"?, "brand_name"?, "is_featured"? }` |
| GET | `/admin/product` | query: `page, limit, search, category_id, subcategory_id, status, sort` (`latest`\|`oldest`\|`name_asc`\|`name_desc`) |
| GET | `/admin/product/:id` | full detail: product + category + sub-category + `variants[]` (with stock) + `images[]` in 3 queries, no N+1 |
| PUT | `/admin/product/:id` | full update |
| PATCH | `/admin/product/:id/status` | `{ "is_active": 0 \| 1 }` |
| DELETE | `/admin/product/:id` | soft delete |

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
3. Logged-in customer: `POST /product/wishlist/toggle` to save items, `POST /cart` to add to cart.
4. `GET /cart` before checkout to show an up-to-date summary.
5. `POST /order` with a saved `address_id` to place the order.
6. `GET /order/my-orders` / `GET /order/:order_number` to show order history and status; `PATCH /order/:order_number/cancel` while still `pending`.

**Not implemented yet** (later phases): OTP/forgot-password, profile/address management endpoints, payment gateway, live courier API integration, coupons, tax, reviews.
