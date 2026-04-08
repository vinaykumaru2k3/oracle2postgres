-- src/main/resources/db/migration/V2__seed.sql

-- Products
INSERT INTO product (id, name, price, is_active) VALUES
(1, 'Laptop', 1200.00, true),
(2, 'Mouse', 25.00, true),
(3, 'Keyboard', 75.00, true),
(4, 'Monitor', 300.00, true),
(5, 'Headphones', 150.00, true),
(6, 'Printer', 200.00, true),
(7, 'Tablet', 400.00, true),
(8, 'Smartphone', 800.00, true),
(9, 'Router', 100.00, true),
(10, 'Webcam', 50.00, true),
(11, 'External Hard Drive', 120.00, true),
(12, 'USB Flash Drive', 20.00, true),
(13, 'Graphics Card', 500.00, true),
(14, 'Power Supply', 80.00, true),
(15, 'Motherboard', 250.00, true),
(16, 'RAM Module', 60.00, true),
(17, 'SSD Drive', 150.00, true),
(18, 'CPU Cooler', 70.00, true),
(19, 'Case Fan', 15.00, true),
(20, 'Microphone', 90.00, true);

-- Inventory
INSERT INTO inventory (product_id, quantity, last_updated) VALUES
(1, 10, NOW()),
(2, 50, NOW()),
(3, 30, NOW()),
(4, 15, NOW()),
(5, 25, NOW()),
(6, 8, NOW()),
(7, 12, NOW()),
(8, 20, NOW()),
(9, 35, NOW()),
(10, 40, NOW()),
(11, 18, NOW()),
(12, 100, NOW()),
(13, 5, NOW()),
(14, 22, NOW()),
(15, 7, NOW()),
(16, 60, NOW()),
(17, 14, NOW()),
(18, 28, NOW()),
(19, 75, NOW()),
(20, 16, NOW());

-- Fix sequences (critical after manual IDs)
SELECT setval(pg_get_serial_sequence('product', 'id'), (SELECT MAX(id) FROM product));
SELECT setval(pg_get_serial_sequence('inventory', 'id'), (SELECT MAX(id) FROM inventory));