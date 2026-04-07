# Oracle-Specific Features in the Codebase

This document lists all Oracle-specific elements currently implemented in the Spring Boot application, including their actual code locations and migration notes for switching to PostgreSQL.

---

## 1. Database Dialect

- **File**: `src/main/resources/application.yml`
- **Current**:
  ```yaml
  database-platform: org.hibernate.dialect.OracleDialect
  driver-class-name: oracle.jdbc.OracleDriver
  url: jdbc:oracle:thin:@${ORACLE_HOST}:${ORACLE_PORT}/${ORACLE_SERVICE}
  ```
- **Migration**: Change to:
  ```yaml
  database-platform: org.hibernate.dialect.PostgreSQLDialect
  driver-class-name: org.postgresql.Driver
  url: jdbc:postgresql://${PG_HOST}:${PG_PORT}/${PG_DB}
  ```

---

## 2. Sequences for ID Generation

- **Files**: `Product.java`, `Inventory.java`
- **Current**:
  ```java
  @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "product_seq")
  @SequenceGenerator(name = "product_seq", sequenceName = "product_seq", allocationSize = 1)
  ```
- **Migration**: PostgreSQL supports sequences natively. Can keep `GenerationType.SEQUENCE` or switch to `GenerationType.IDENTITY` which maps to PostgreSQL's `SERIAL`/`BIGSERIAL`.

---

## 3. Oracle Native Query Syntax

### 3a. ROWNUM (Pagination)
- **File**: `ProductRepository.java`
- **Current**:
  ```java
  @Query(value = "SELECT * FROM product WHERE ROWNUM <= ?1", nativeQuery = true)
  List<Product> findProductsWithLimit(int limit);
  ```
- **Migration**: Replace `ROWNUM` with `LIMIT`:
  ```sql
  SELECT * FROM product LIMIT ?1
  ```

### 3b. NVL (Null Handling)
- **File**: `ProductRepository.java`
- **Current**:
  ```java
  @Query(value = "SELECT * FROM product WHERE NVL(is_active, 0) = 1", nativeQuery = true)
  List<Product> findActiveProducts();
  ```
- **Migration**: Replace `NVL` with `COALESCE`:
  ```sql
  SELECT * FROM product WHERE COALESCE(is_active, false) = true
  ```

### 3c. SYSDATE (Current Timestamp)
- **File**: `InventoryRepository.java`
- **Current**:
  ```java
  @Query(value = "SELECT * FROM inventory WHERE last_updated >= SYSDATE - INTERVAL '1' DAY", nativeQuery = true)
  List<Inventory> findRecentUpdates();
  ```
- **Migration**: Replace `SYSDATE` with `NOW()`:
  ```sql
  SELECT * FROM inventory WHERE last_updated >= NOW() - INTERVAL '1 day'
  ```

---

## 4. Boolean Mapped to NUMBER(1)

- **File**: `Product.java`
- **Current**: Oracle has no native `BOOLEAN` type. Hibernate maps Java `Boolean` to `NUMBER(1)` (0 = false, 1 = true). The `is_active` column is stored as `NUMBER(1)`.
- **Migration**: PostgreSQL has a native `BOOLEAN` type. No Java code change needed — Hibernate handles the mapping automatically when the dialect is switched.

---

## 5. Stored Procedure — `calculate_total_value`

- **File**: `oracle-init.sql`, called from `InventoryService.java`
- **Current Oracle procedure**:
  ```sql
  CREATE OR REPLACE PROCEDURE calculate_total_value (total OUT NUMBER) AS
  BEGIN
    SELECT NVL(SUM(p.price * i.quantity), 0) INTO total
    FROM product p
    JOIN inventory i ON p.id = i.product_id
    WHERE p.is_active = 1;
  END;
  ```
- **Called via**:
  ```java
  StoredProcedureQuery query = entityManager.createStoredProcedureQuery("calculate_total_value");
  query.registerStoredProcedureParameter(1, BigDecimal.class, ParameterMode.OUT);
  query.execute();
  return (BigDecimal) query.getOutputParameterValue(1);
  ```
- **Status**: Created and VALID in Oracle. Exposed via `GET /api/value` → returns `72045`.
- **Migration**: Convert to a PostgreSQL function using PL/pgSQL:
  ```sql
  CREATE OR REPLACE FUNCTION calculate_total_value()
  RETURNS NUMERIC AS $$
  DECLARE total NUMERIC;
  BEGIN
    SELECT COALESCE(SUM(p.price * i.quantity), 0) INTO total
    FROM product p
    JOIN inventory i ON p.id = i.product_id
    WHERE p.is_active = true;
    RETURN total;
  END;
  $$ LANGUAGE plpgsql;
  ```
  Update the Java call to use `createStoredProcedureQuery("calculate_total_value")` with no OUT parameter, or replace with a JPQL query:
  ```java
  @Query("SELECT SUM(p.price * i.quantity) FROM Product p JOIN Inventory i ON p.id = i.productId WHERE p.isActive = true")
  BigDecimal calculateTotalValue();
  ```

---

## 6. View — `active_products_with_stock`

- **File**: `oracle-init.sql`, queried from `ProductRepository.java`
- **Current Oracle view**:
  ```sql
  CREATE OR REPLACE VIEW active_products_with_stock AS
  SELECT p.id, p.name, p.price, i.quantity, i.last_updated
  FROM product p
  JOIN inventory i ON p.id = i.product_id
  WHERE p.is_active = 1;
  ```
- **Queried via**:
  ```java
  @Query(value = "SELECT * FROM active_products_with_stock ORDER BY quantity DESC", nativeQuery = true)
  List<Object[]> findActiveProductsWithStock();
  ```
- **Status**: Created and VALID in Oracle. Exposed via `GET /api/active-stock` → returns all 20 active products sorted by quantity descending.
- **Migration**: PostgreSQL views use identical `CREATE OR REPLACE VIEW` syntax. Only change needed is `WHERE p.is_active = 1` → `WHERE p.is_active = true`.

---

## 7. Trigger — `inventory_audit_trigger`

- **File**: `oracle-init.sql`
- **Current Oracle trigger**:
  ```sql
  CREATE OR REPLACE TRIGGER inventory_audit_trigger
  AFTER INSERT OR UPDATE ON inventory
  FOR EACH ROW
  BEGIN
    INSERT INTO audit_log (table_name, operation, product_id, old_quantity, new_quantity, timestamp)
    VALUES ('inventory',
            CASE WHEN INSERTING THEN 'INSERT' WHEN UPDATING THEN 'UPDATE' END,
            :NEW.product_id, :OLD.quantity, :NEW.quantity, SYSDATE);
  END;
  ```
- **Status**: Defined in `oracle-init.sql`. The `audit_log` table exists in Oracle. Note: the trigger DDL uses Oracle's `/` PL/SQL terminator and must be run via `sqlplus` directly — it cannot be executed through `jdbcTemplate.execute()`.
- **Migration**: PostgreSQL triggers require a separate trigger function:
  ```sql
  CREATE OR REPLACE FUNCTION inventory_audit_fn()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO audit_log (table_name, operation, product_id, old_quantity, new_quantity, timestamp)
    VALUES ('inventory',
            TG_OP,
            NEW.product_id,
            OLD.quantity,
            NEW.quantity,
            NOW());
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER inventory_audit_trigger
  AFTER INSERT OR UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION inventory_audit_fn();
  ```

---

## 8. Audit Log Table

- **File**: `oracle-init.sql`, mapped by `AuditLog.java`
- **Current Oracle DDL**:
  ```sql
  CREATE TABLE audit_log (
    id        NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    table_name VARCHAR2(50),
    operation  VARCHAR2(10),
    product_id NUMBER,
    old_quantity NUMBER,
    new_quantity NUMBER,
    timestamp  TIMESTAMP DEFAULT SYSDATE
  );
  ```
- **Status**: Table exists in Oracle (`VALID`). JPA entity `AuditLog.java` maps to it using `@GeneratedValue(strategy = GenerationType.IDENTITY)`.
- **Migration**:
  ```sql
  CREATE TABLE audit_log (
    id           BIGSERIAL PRIMARY KEY,
    table_name   VARCHAR(50),
    operation    VARCHAR(10),
    product_id   BIGINT,
    old_quantity INTEGER,
    new_quantity INTEGER,
    timestamp    TIMESTAMP DEFAULT NOW()
  );
  ```
  No Java changes needed — `GenerationType.IDENTITY` works with PostgreSQL `BIGSERIAL`.

---

## 9. Init Script Execution

- **File**: `OraclePostgresMigrationAppApplication.java`
- **Current**: On startup, `oracle-init.sql` is read and each DDL statement (split by blank lines) is executed individually via `jdbcTemplate.execute()`. PL/SQL blocks (procedures, triggers) with Oracle's `/` terminator **cannot** be run this way — they must be created directly in Oracle via `sqlplus`.
- **Migration**: For PostgreSQL, all DDL including functions and triggers can be executed via `jdbcTemplate.execute()` since PostgreSQL uses `$$` dollar-quoting instead of `/`.

---

## Summary: Oracle → PostgreSQL Migration Checklist

| # | Item | File(s) | Change Required |
|---|------|---------|-----------------|
| 1 | Dialect & driver | `application.yml` | Switch to `PostgreSQLDialect` + `postgresql` driver |
| 2 | Sequences | `Product.java`, `Inventory.java` | Keep or switch to `IDENTITY` |
| 3 | `ROWNUM` | `ProductRepository.java` | Replace with `LIMIT` |
| 4 | `NVL` | `ProductRepository.java` | Replace with `COALESCE` |
| 5 | `SYSDATE` | `InventoryRepository.java` | Replace with `NOW()` |
| 6 | `NUMBER(1)` boolean | `Product.java` | Auto-handled by dialect switch |
| 7 | Stored procedure | `oracle-init.sql`, `InventoryService.java` | Rewrite as PL/pgSQL function |
| 8 | View | `oracle-init.sql`, `ProductRepository.java` | Change `= 1` to `= true` |
| 9 | Trigger | `oracle-init.sql` | Rewrite with trigger function pattern |
| 10 | Audit log table | `oracle-init.sql`, `AuditLog.java` | `NUMBER` → `BIGINT`, `VARCHAR2` → `VARCHAR`, `SYSDATE` → `NOW()` |
| 11 | Init script runner | `OraclePostgresMigrationAppApplication.java` | Can run all DDL via `jdbcTemplate` in PostgreSQL |
