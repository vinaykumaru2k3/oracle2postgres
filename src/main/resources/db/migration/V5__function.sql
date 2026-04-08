CREATE OR REPLACE FUNCTION calculate_total_value()
RETURNS NUMERIC AS $$
DECLARE total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(p.price * i.quantity), 0)
  INTO total
  FROM product p
  JOIN inventory i ON p.id = i.product_id
  WHERE p.is_active = true;

  RETURN total;
END;
$$ LANGUAGE plpgsql;