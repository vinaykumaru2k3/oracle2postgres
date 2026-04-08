-- src/main/resources/db/migration/V4__audit_log_table.sql

CREATE TABLE audit_log (
  id           BIGSERIAL PRIMARY KEY,
  table_name   VARCHAR(50),
  operation    VARCHAR(10),
  product_id   BIGINT,
  old_quantity INTEGER,
  new_quantity INTEGER,
  timestamp    TIMESTAMP DEFAULT NOW()
);