-- src/main/resources/db/migration/V6__inventory_audit_trigger.sql

-- Function
CREATE OR REPLACE FUNCTION inventory_audit_fn()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    table_name,
    operation,
    product_id,
    old_quantity,
    new_quantity,
    timestamp
  )
  VALUES (
    'inventory',
    TG_OP,
    NEW.product_id,
    OLD.quantity,
    NEW.quantity,
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER inventory_audit_trigger
AFTER INSERT OR UPDATE ON inventory
FOR EACH ROW
EXECUTE FUNCTION inventory_audit_fn();