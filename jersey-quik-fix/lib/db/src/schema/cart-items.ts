import { pgTable, serial, text, decimal, integer, timestamp, unique } from "drizzle-orm/pg-core";

export const cartItems = pgTable(
  "cart_items",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    productId: text("product_id").notNull(),
    productName: text("product_name").notNull(),
    productCategory: text("product_category"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull().default(1),
    image: text("image"),
    sku: text("sku"),
    badge: text("badge"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [unique().on(t.userId, t.productId)]
);
