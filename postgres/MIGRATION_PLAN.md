# PostgreSQL Migration Plan

## Tables

- `users`
- `vendor_applications`
- `products`
- `products.stock`
- `orders`
- `orders.size`
- `order_tracking_events`
- `carts`
- `cart_items`
- `reviews`
- `otps`

## Relationships

- `products.vendor_id -> users.id`
- `vendor_applications.user_id -> users.id`
- `orders.user_id -> users.id`
- `orders.vendor_id -> users.id`
- `orders.product_id -> products.id`
- `order_tracking_events.order_id -> orders.id`
- `cart_items.cart_id -> carts.id`
- `cart_items.product_id -> products.id`
- `reviews.user_id -> users.id`
- `reviews.product_id -> products.id`

## Schema Changes

- MongoDB `ObjectId` references are stored as text IDs so existing IDs can be migrated without remapping.
- Embedded arrays become child tables.
- Mongoose enums become `CHECK` constraints.
- `timestamps` become `created_at` and `updated_at` columns.
- The current global cart becomes a singleton `carts` row with related `cart_items`.
- OTP upsert behavior is preserved with a unique `phone` constraint.
- Product stock is nullable for unlimited items.

## MongoDB-to-PostgreSQL Alternatives

- `populate()` becomes SQL joins in repository methods.
- `trackingEvents` array becomes `order_tracking_events`.
- `Cart.findOne()` without user scoping becomes a default cart scope.
- No direct Mongo TTL index exists here; OTP expiry remains application-enforced.

## Migration Risks

- The existing app uses a global cart, which is unusual in PostgreSQL too; this is preserved for compatibility.
- Some MongoDB documents may contain fields not represented in the current schema; those should be reviewed before cutover.
- Existing Mongo IDs are not UUIDs, so the PostgreSQL layer uses text IDs to keep old references intact.
- There is no repo-managed static seed data in the current project, so the seed script only initializes baseline rows and remains idempotent.
