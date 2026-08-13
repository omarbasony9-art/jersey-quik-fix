#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Jersey Quik Fix — PostgreSQL → D1 data export/import helper
#
# This script safely exports data from the Render PostgreSQL database and
# produces Wrangler-compatible SQL INSERT files that can be imported into D1.
#
# SAFETY RULES:
#   • Source (PostgreSQL) data is NEVER modified or deleted.
#   • D1 is NOT touched unless you explicitly run the import commands below.
#   • Run this in a terminal where DATABASE_URL is set to the Render connection
#     string (available as an env var in the Render dashboard).
#
# PREREQUISITES:
#   • psql  (brew install postgresql or apt install postgresql-client)
#   • wrangler (npm install -g wrangler and wrangler login)
#   • DATABASE_URL env var pointing to Render PostgreSQL
#
# USAGE:
#   export DATABASE_URL="postgres://..."
#   chmod +x scripts/export-pg-to-d1.sh
#   ./scripts/export-pg-to-d1.sh
#
#   Then review the generated SQL files in ./d1-export/ and run the imports:
#   wrangler d1 execute jersey-quik-fix-d1 --remote --file=./d1-export/repair_tickets.sql
#   wrangler d1 execute jersey-quik-fix-d1 --remote --file=./d1-export/trade_inquiries.sql
#   wrangler d1 execute jersey-quik-fix-d1 --remote --file=./d1-export/email_subscribers.sql
#   wrangler d1 execute jersey-quik-fix-d1 --remote --file=./d1-export/membership_codes.sql
#   wrangler d1 execute jersey-quik-fix-d1 --remote --file=./d1-export/cart_items.sql
#   wrangler d1 execute jersey-quik-fix-d1 --remote --file=./d1-export/site_content.sql
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set."
  echo "Set it to your Render PostgreSQL connection string and re-run."
  exit 1
fi

OUT="./d1-export"
mkdir -p "$OUT"
echo "Exporting to $OUT ..."

# ── Helper: escape a SQL string value ────────────────────────────────────────
# psql -c COPY outputs tab-separated or CSV; we use psql -c "SELECT ..." with
# explicit quoting to produce INSERT statements instead.

# ── repair_tickets ────────────────────────────────────────────────────────────
psql "$DATABASE_URL" -q -t -A -F $'\t' -c "
SELECT
  id, ticket, category, brand, model, issue, name, phone,
  COALESCE(email,''), COALESCE(date,''), status,
  to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"')
FROM repair_tickets
ORDER BY created_at;
" | awk -F'\t' 'BEGIN{print "BEGIN TRANSACTION;"}
{
  gsub(/'\''/,"'\'''\''", $3); gsub(/'\''/,"'\'''\''", $4); gsub(/'\''/,"'\'''\''", $5);
  gsub(/'\''/,"'\'''\''", $6); gsub(/'\''/,"'\'''\''", $7); gsub(/'\''/,"'\'''\''", $8);
  printf "INSERT OR IGNORE INTO repair_tickets (id,ticket,category,brand,model,issue,name,phone,email,date,status,created_at) VALUES ('\''%s'\'','\'\'%s'\'','\'\'%s'\'','\'\'%s'\'','\'\'%s'\'','\'\'%s'\'','\'\'%s'\'','\'\'%s'\'','\'\'%s'\'','\'\'%s'\'','\'\'%s'\'','\'\'%s'\'');\n", $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
}
END{print "COMMIT;"}' > "$OUT/repair_tickets.sql"
echo "  repair_tickets.sql written ($(wc -l < "$OUT/repair_tickets.sql") lines)"

# ── email_subscribers ─────────────────────────────────────────────────────────
psql "$DATABASE_URL" -q -t -A -F $'\t' -c "
SELECT
  id, email, COALESCE(name,''), COALESCE(source,'website'),
  to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"')
FROM email_subscribers
ORDER BY created_at;
" | awk -F'\t' 'BEGIN{print "BEGIN TRANSACTION;"}
{
  gsub(/'\''/,"'\'''\''", $2); gsub(/'\''/,"'\'''\''", $3);
  printf "INSERT OR IGNORE INTO email_subscribers (id,email,name,source,created_at) VALUES ('\''%s'\'','\'\'%s'\'','\'\'%s'\'','\'\'%s'\'','\'\'%s'\'');\n", $1,$2,$3,$4,$5
}
END{print "COMMIT;"}' > "$OUT/email_subscribers.sql"
echo "  email_subscribers.sql written"

# ── trade_inquiries ───────────────────────────────────────────────────────────
psql "$DATABASE_URL" -q -t -A -F $'\t' -c "
SELECT
  id, name, email, phone, device_type, device_description, condition,
  COALESCE(notes,''), COALESCE(status,'New'),
  to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"')
FROM trade_inquiries
ORDER BY created_at;
" | awk -F'\t' 'BEGIN{print "BEGIN TRANSACTION;"}
{
  gsub(/'\''/,"'\'''\''", $2); gsub(/'\''/,"'\'''\''", $6); gsub(/'\''/,"'\'''\''", $8);
  printf "INSERT OR IGNORE INTO trade_inquiries (id,name,email,phone,device_type,device_description,condition,notes,status,created_at) VALUES (%s,'\''%s'\'','\'\'%s'\'','\'\'%s'\'','\'\'%s'\'','\'\'%s'\'','\'\'%s'\'','\'\'%s'\'','\'\'%s'\'','\'\'%s'\'');\n", $1,$2,$3,$4,$5,$6,$7,$8,$9,$10
}
END{print "COMMIT;"}' > "$OUT/trade_inquiries.sql"
echo "  trade_inquiries.sql written"

# ── membership_codes ──────────────────────────────────────────────────────────
psql "$DATABASE_URL" -q -t -A -F $'\t' -c "
SELECT
  id, email, COALESCE(user_id,'NULL'), code,
  COALESCE(stripe_session_id,'NULL'),
  discount_percent,
  CASE WHEN is_active THEN 1 ELSE 0 END,
  to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"'),
  to_char(expires_at AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"')
FROM membership_codes
ORDER BY created_at;
" | awk -F'\t' 'BEGIN{print "BEGIN TRANSACTION;"}
{
  uid = ($3 == "NULL") ? "NULL" : "'\''" $3 "'\''"
  sess = ($5 == "NULL") ? "NULL" : "'\''" $5 "'\''"
  printf "INSERT OR IGNORE INTO membership_codes (id,email,user_id,code,stripe_session_id,discount_percent,is_active,created_at,expires_at) VALUES ('\''%s'\'','\'\'%s'\'','\'\'%s'\'','\'\'%s'\'','\'\'%s'\'','\'\'%s'\'','\'\'%s'\'','\'\'%s'\'','\'\'%s'\'');\n", $1,$2,$3,$4,$5,$6,$7,$8,$9
}
END{print "COMMIT;"}' > "$OUT/membership_codes.sql"
echo "  membership_codes.sql written"

# ── cart_items ────────────────────────────────────────────────────────────────
psql "$DATABASE_URL" -q -t -A -F $'\t' -c "
SELECT
  user_id, product_id, product_name,
  COALESCE(product_category,'NULL'), price::float, quantity,
  COALESCE(image,'NULL'), COALESCE(sku,'NULL'), COALESCE(badge,'NULL'),
  to_char(COALESCE(created_at,now()) AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"'),
  to_char(COALESCE(updated_at,now()) AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"')
FROM cart_items
ORDER BY id;
" | awk -F'\t' 'BEGIN{print "BEGIN TRANSACTION;"}
{
  cat = ($4 == "NULL") ? "NULL" : "'\''" $4 "'\''"
  img = ($7 == "NULL") ? "NULL" : "'\''" $7 "'\''"
  sku = ($8 == "NULL") ? "NULL" : "'\''" $8 "'\''"
  badge = ($9 == "NULL") ? "NULL" : "'\''" $9 "'\''"
  printf "INSERT OR IGNORE INTO cart_items (user_id,product_id,product_name,product_category,price,quantity,image,sku,badge,created_at,updated_at) VALUES ('\''%s'\'','\'\'%s'\'','\'\'%s'\'',%s,%s,%s,%s,%s,%s,'\'\'%s'\'','\'\'%s'\'');\n", $1,$2,$3,cat,$5,$6,img,sku,badge,$10,$11
}
END{print "COMMIT;"}' > "$OUT/cart_items.sql"
echo "  cart_items.sql written"

# ── site_content ──────────────────────────────────────────────────────────────
# The data column is JSONB in Postgres — export it as a JSON string.
psql "$DATABASE_URL" -q -t -A -c "
SELECT key, data::text,
  to_char(COALESCE(updated_at,now()) AT TIME ZONE 'UTC','YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"')
FROM site_content;
" | while IFS='|' read -r key data updated_at; do
  # Write each row separately (data may be very large with embedded quotes)
  python3 -c "
import sys, json
key = sys.argv[1]
data = sys.argv[2]
updated_at = sys.argv[3]
escaped = data.replace(\"'\", \"''\")
print(f\"INSERT OR REPLACE INTO site_content (key, data, updated_at) VALUES ('{key}', '{escaped}', '{updated_at}');\")
" "$key" "$data" "$updated_at"
done > "$OUT/site_content.sql"
echo "  site_content.sql written"

echo ""
echo "Export complete.  Review files in $OUT/ then import with:"
echo "  wrangler d1 execute jersey-quik-fix-d1 --remote --file=./d1-export/repair_tickets.sql"
echo "  wrangler d1 execute jersey-quik-fix-d1 --remote --file=./d1-export/email_subscribers.sql"
echo "  wrangler d1 execute jersey-quik-fix-d1 --remote --file=./d1-export/trade_inquiries.sql"
echo "  wrangler d1 execute jersey-quik-fix-d1 --remote --file=./d1-export/membership_codes.sql"
echo "  wrangler d1 execute jersey-quik-fix-d1 --remote --file=./d1-export/cart_items.sql"
echo "  wrangler d1 execute jersey-quik-fix-d1 --remote --file=./d1-export/site_content.sql"
