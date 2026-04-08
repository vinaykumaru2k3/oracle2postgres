-- src/main/resources/db/migration/V3__indexes.sql

-- Index for faster joins on inventory → product
CREATE INDEX idx_inventory_product_id ON inventory(product_id);

-- Optional: filter active products faster
CREATE INDEX idx_product_is_active ON product(is_active);

-- Optional: sort/search by price
CREATE INDEX idx_product_price ON product(price);