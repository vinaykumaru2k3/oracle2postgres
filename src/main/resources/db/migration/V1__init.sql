-- src/main/resources/db/migration/V1__init.sql

CREATE TABLE product (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255),
    price NUMERIC(19,2),
    is_active BOOLEAN
);

CREATE TABLE inventory (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT UNIQUE NOT NULL,
    quantity INTEGER,
    last_updated TIMESTAMP,
    CONSTRAINT fk_product
        FOREIGN KEY(product_id)
        REFERENCES product(id)
        ON DELETE CASCADE
);