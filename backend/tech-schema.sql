-- HORENOVA TECH: additive, namespaced schema. Never modifies HORENOVA jobs/recruitment data.
CREATE TABLE IF NOT EXISTS ht_venues (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_wix_id varchar(80) NOT NULL,
 name varchar(120) NOT NULL,
 slug varchar(70) NOT NULL UNIQUE,
 city varchar(90) NOT NULL DEFAULT '',
 status varchar(16) NOT NULL DEFAULT 'PILOT' CHECK (status IN ('PILOT','ACTIVE','SUSPENDED')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ht_venues_owner_idx ON ht_venues(owner_wix_id);
CREATE TABLE IF NOT EXISTS ht_products (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 venue_id uuid NOT NULL REFERENCES ht_venues(id),
 sku varchar(60),
 name varchar(140) NOT NULL,
 category varchar(80) NOT NULL DEFAULT 'Autres',
 price_centimes integer NOT NULL DEFAULT 0 CHECK (price_centimes >= 0 AND price_centimes <= 100000000),
 stock_qty integer NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
 active boolean NOT NULL DEFAULT true,
 menu_visible boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(venue_id, sku)
);
CREATE INDEX IF NOT EXISTS ht_products_venue_idx ON ht_products(venue_id);
CREATE TABLE IF NOT EXISTS ht_sales (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 venue_id uuid NOT NULL REFERENCES ht_venues(id),
 actor_wix_id varchar(80) NOT NULL,
 table_label varchar(24) NOT NULL DEFAULT 'COMPTOIR',
 client_reference varchar(90) NOT NULL,
 total_centimes bigint NOT NULL CHECK(total_centimes >= 0 AND total_centimes <= 9000000000000),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(venue_id, client_reference)
);
CREATE INDEX IF NOT EXISTS ht_sales_venue_time_idx ON ht_sales(venue_id,created_at DESC);
CREATE TABLE IF NOT EXISTS ht_sale_lines (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 sale_id uuid NOT NULL REFERENCES ht_sales(id),
 product_id uuid NOT NULL REFERENCES ht_products(id),
 product_name varchar(140) NOT NULL,
 quantity integer NOT NULL CHECK(quantity > 0 AND quantity <= 10000),
 unit_price_centimes integer NOT NULL CHECK(unit_price_centimes >= 0),
 line_total_centimes bigint NOT NULL CHECK(line_total_centimes >= 0),
 UNIQUE(sale_id,product_id)
);
CREATE TABLE IF NOT EXISTS ht_stock_movements (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 venue_id uuid NOT NULL REFERENCES ht_venues(id),
 product_id uuid NOT NULL REFERENCES ht_products(id),
 sale_id uuid REFERENCES ht_sales(id),
 actor_wix_id varchar(80) NOT NULL,
 delta integer NOT NULL CHECK(delta <> 0),
 reason varchar(200) NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ht_stock_movements_venue_time_idx ON ht_stock_movements(venue_id,created_at DESC);
