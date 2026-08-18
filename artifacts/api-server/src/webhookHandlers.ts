import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { pool } from '@workspace/db';
import { randomUUID } from 'crypto';

async function recordOrder(session: any): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Idempotency — skip if already recorded
    const existing = await client.query(
      'SELECT id FROM orders WHERE stripe_session_id = $1',
      [session.id]
    );
    if (existing.rows.length > 0) {
      await client.query('COMMIT');
      return;
    }

    const orderId        = randomUUID();
    const customerEmail  = session.customer_details?.email ?? session.customer_email ?? '';
    const customerName   = session.customer_details?.name  ?? '';
    const totalDollars   = (session.amount_total ?? 0) / 100;
    const shipping       = session.shipping_details?.address
      ? JSON.stringify(session.shipping_details.address)
      : null;

    await client.query(
      `INSERT INTO orders
         (id, stripe_session_id, customer_email, customer_name, total, status, shipping_address)
       VALUES ($1, $2, $3, $4, $5, 'paid', $6)`,
      [orderId, session.id, customerEmail, customerName, totalDollars, shipping]
    );

    // Parse cart metadata so we can annotate items with variant info
    const cartMeta: { id: string; qty: number; storage?: string; color?: string; condition?: string }[] = [];
    try {
      if (session.metadata?.cart) {
        const parsed = JSON.parse(session.metadata.cart);
        if (Array.isArray(parsed)) cartMeta.push(...parsed);
      }
    } catch { /* ignore parse errors */ }

    // Retrieve expanded line items from Stripe
    let lineItems: any[] = [];
    try {
      const stripe   = await getUncachableStripeClient();
      const expanded = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items.data.price.product'],
      });
      lineItems = expanded.line_items?.data ?? [];
    } catch (e) {
      console.error('Webhook: could not expand line items', e);
    }

    for (const li of lineItems) {
      const product      = li.price?.product;
      const productId    = product?.metadata?.productId ?? null;
      const productName  = product?.name ?? li.description ?? 'Unknown';
      const productImage = Array.isArray(product?.images) ? product.images[0] ?? null : null;
      const priceDollars = (li.price?.unit_amount ?? 0) / 100;
      const qty          = li.quantity ?? 1;

      // Match variant info from cart metadata by productId
      const meta = cartMeta.find(m => m.id === productId);

      // id is SERIAL — do NOT include it; let Postgres auto-assign
      await client.query(
        `INSERT INTO order_items
           (order_id, product_id, product_name, product_image, price, quantity, storage, color, condition)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [orderId, productId, productName, productImage, priceDollars, qty,
         meta?.storage ?? null, meta?.color ?? null, meta?.condition ?? null]
      );

      // Inventory is decremented atomically at checkout (stripe-checkout.ts).
      // Sync the products.stock denormalized column from current inventory quantity.
      if (productId) {
        await client.query(
          `UPDATE products p
           SET stock = COALESCE((SELECT i.quantity FROM inventory i WHERE i.product_id = p.id), 0),
               updated_at = NOW()
           WHERE p.id = $1`,
          [productId]
        );
      }
    }

    await client.query('COMMIT');
    console.log(`Order recorded: ${orderId} for session ${session.id}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to record order:', err);
    throw err;
  } finally {
    client.release();
  }
}

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    // Let stripe-replit-sync handle its own processing
    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    // Additionally handle order recording for checkout.session.completed
    try {
      const stripe        = await getUncachableStripeClient();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) return; // can't verify independently without secret

      const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      if (event.type === 'checkout.session.completed') {
        await recordOrder(event.data.object as any);
      }
    } catch (verifyErr: any) {
      // Non-fatal: stripe-replit-sync already handled payment
      console.error('Order recording error (non-fatal):', verifyErr.message);
    }
  }
}
