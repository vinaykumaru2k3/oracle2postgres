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
- **Impact**: Spring Data's `Page<Product> findAll(Pageable pageable)` generates Oracle-specific `ROWNUM`-based subquery pagination when using `OracleDialect`. Switching to `PostgreSQLDialect` automatically generates clean `LIMIT/OFFSET` instead — no Java change needed.
- **Migration**: Keep `GenerationType.SEQUENCE` or switch to `GenerationType.IDENTITY` which maps to PostgreSQL `SERIAL`/`BIGSERIAL`.

---

## 3. Oracle Native Query Syntax

### 3a. NVL (Null Handling)
- **File**: `ProductRepository.java`
- **Current**:
  ```java
  @Query(value = "SELECT * FROM product WHERE NVL(is_active, 0) = 1", nativeQuery = true)
  List<Product> findActiveProducts();
  ```
- **Also used in**:
  ```java
  @Query(value = "... WHERE NVL(p.is_active, 0) = 1 AND i.quantity < :threshold ...", nativeQuery = true)
  List<Object[]> findLowStockProducts(@Param("threshold") int threshold);
  ```
- **Migration**: Replace all `NVL` with `COALESCE` and `= 1` with `= true`:
  ```sql
  SELECT * FROM product WHERE COALESCE(is_active, false) = true
  ```

### 3b. SYSDATE (Current Timestamp)
- **File**: `InventoryRepository.java`
- **Current**:
  ```java
  @Query(value = "SELECT * FROM inventory WHERE last_updated >= SYSDATE - INTERVAL '1' DAY ORDER BY last_updated DESC", nativeQuery = true)
  List<Inventory> findRecentUpdates();
  ```
- **Migration**: Replace `SYSDATE` with `NOW()` and fix interval syntax:
  ```sql
  SELECT * FROM inventory WHERE last_updated >= NOW() - INTERVAL '1 day' ORDER BY last_updated DESC
  ```

### 3c. TO_TIMESTAMP with Oracle Format Mask
- **File**: `InventoryRepository.java`
- **Current**:
  ```java
  @Query(value = """
      SELECT * FROM inventory
      WHERE last_updated >= TO_TIMESTAMP(:from, 'YYYY-MM-DD"T"HH24:MI:SS')
        AND last_updated <= TO_TIMESTAMP(:to,   'YYYY-MM-DD"T"HH24:MI:SS')
      ORDER BY last_updated DESC
      """, nativeQuery = true)
  List<Inventory> findByDateRange(@Param("from") String from, @Param("to") String to);
  ```
- **Migration**: PostgreSQL uses `::timestamp` cast or a different `TO_TIMESTAMP` format:
  ```sql
  SELECT * FROM inventory
  WHERE last_updated >= :from::timestamp
    AND last_updated <= :to::timestamp
  ORDER BY last_updated DESC
  ```

---

## 4. Boolean Mapped to NUMBER(1)

- **File**: `Product.java`
- **Current**: Oracle has no native `BOOLEAN` type. Hibernate maps Java `Boolean` to `NUMBER(1)` (0 = false, 1 = true). All native queries that filter on `is_active` use `= 1` or `NVL(is_active, 0) = 1`.
- **Affected queries**: `findActiveProducts`, `findLowStockProducts`, `active_products_with_stock` view, `calculate_total_value` procedure.
- **Migration**: PostgreSQL has a native `BOOLEAN` type. Hibernate handles the entity mapping automatically on dialect switch. All native queries must change `= 1` → `= true` and `NVL(..., 0)` → `COALESCE(..., false)`.

---

## 5. Spring Data Pagination — Dialect-Generated SQL

- **File**: `ProductRepository.java`, `InventoryService.java`
- **Current**:
  ```java
  Page<Product> findAll(Pageable pageable);  // used by GET /api/products?page=&size=
  ```
  With `OracleDialect`, Hibernate generates a `ROWNUM`-based subquery:
  ```sql
  SELECT * FROM (SELECT ..., ROWNUM rnum FROM product WHERE ROWNUM <= ?)
  WHERE rnum > ?
  ```
- **Migration**: Switching to `PostgreSQLDialect` automatically generates:
  ```sql
  SELECT * FROM product ORDER BY id LIMIT ? OFFSET ?
  ```
  No Java code change needed — the dialect handles it.

---

## 6. Stored Procedure — `calculate_total_value`

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
- **Status**: VALID in Oracle. Called by `GET /api/value` and `GET /api/reports/summary`.
- **Migration**: PostgreSQL functions don't use `OUT` parameters the same way. Rewrite as a PL/pgSQL function and update the Java call:
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
  Replace the Java `StoredProcedureQuery` call with a native query:
  ```java
  @Query(value = "SELECT calculate_total_value()", nativeQuery = true)
  BigDecimal calculateTotalValue();
  ```

---

## 7. View — `active_products_with_stock`

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
- **Status**: VALID in Oracle. Used by `GET /api/active-stock` and drives the Active Stock DataGrid, Top Stock Items, and low-stock threshold comparisons in the frontend.
- **Migration**: View syntax is identical in PostgreSQL. Only change: `WHERE p.is_active = 1` → `WHERE p.is_active = true`.

---

## 8. Trigger — `inventory_audit_trigger`

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
- **Status**: Defined in `oracle-init.sql`. Fires on every `PUT /api/inventory` call and on the soft-delete path (`DELETE /api/products/{id}` sets `is_active = false` which does not touch inventory, so the trigger fires only on direct inventory updates). Audit data is now exposed via `GET /api/audit-log`.
- **Note**: Must be created via `sqlplus` — Oracle's `/` PL/SQL terminator cannot run through `jdbcTemplate.execute()`.
- **Migration**: PostgreSQL requires a separate trigger function. Oracle's `INSERTING`/`UPDATING` conditionals become `TG_OP`:
  ```sql
  CREATE OR REPLACE FUNCTION inventory_audit_fn()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO audit_log (table_name, operation, product_id, old_quantity, new_quantity, timestamp)
    VALUES ('inventory', TG_OP, NEW.product_id, OLD.quantity, NEW.quantity, NOW());
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER inventory_audit_trigger
  AFTER INSERT OR UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION inventory_audit_fn();
  ```

---

## 9. Audit Log Table

- **File**: `oracle-init.sql`, mapped by `AuditLog.java`, queried by `AuditLogRepository.java`
- **Current Oracle DDL**:
  ```sql
  CREATE TABLE audit_log (
    id           NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    table_name   VARCHAR2(50),
    operation    VARCHAR2(10),
    product_id   NUMBER,
    old_quantity NUMBER,
    new_quantity NUMBER,
    timestamp    TIMESTAMP DEFAULT SYSDATE
  );
  ```
- **Status**: Table exists in Oracle. Fully exposed via `GET /api/audit-log` (returns all rows ordered by timestamp DESC). `AuditLogRepository` uses a native `ORDER BY timestamp DESC` query.
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

## 10. Init Script Execution

- **File**: `OraclePostgresMigrationAppApplication.java`
- **Current**: On startup, `oracle-init.sql` is split by blank lines and each DDL statement is executed individually via `jdbcTemplate.execute()`. PL/SQL blocks (procedures, triggers) with Oracle's `/` terminator **cannot** run this way — they must be created directly via `sqlplus`.
- **Migration**: PostgreSQL uses `$$` dollar-quoting instead of `/`, so all DDL including functions and triggers can be executed via `jdbcTemplate.execute()` — no `sqlplus` step needed.

---

## Summary: Oracle → PostgreSQL Migration Checklist

| # | Item | File(s) | Change Required |
|---|------|---------|-----------------|
| 1 | Dialect & driver | `application.yml` | Switch to `PostgreSQLDialect` + `postgresql` driver |
| 2 | Sequences | `Product.java`, `Inventory.java` | Keep or switch to `IDENTITY` |
| 3 | `NVL` | `ProductRepository.java` | Replace with `COALESCE` in all native queries |
| 4 | `SYSDATE` | `InventoryRepository.java` | Replace with `NOW()` |
| 5 | `TO_TIMESTAMP` format mask | `InventoryRepository.java` | Use `::timestamp` cast instead |
| 6 | `NUMBER(1)` boolean | `Product.java` + all native queries | Auto-handled by dialect; fix `= 1` → `= true` in native SQL |
| 7 | Spring Data pagination | `ProductRepository.java` | Auto-handled by dialect switch (`ROWNUM` → `LIMIT/OFFSET`) |
| 8 | Stored procedure (OUT param) | `oracle-init.sql`, `InventoryService.java` | Rewrite as PL/pgSQL function, replace `StoredProcedureQuery` |
| 9 | View | `oracle-init.sql`, `ProductRepository.java` | Change `= 1` to `= true` |
| 10 | Trigger | `oracle-init.sql` | Rewrite with trigger function + `TG_OP` |
| 11 | Audit log table | `oracle-init.sql`, `AuditLog.java` | `NUMBER` → `BIGINT`, `VARCHAR2` → `VARCHAR`, `SYSDATE` → `NOW()` |
| 12 | Init script runner | `OraclePostgresMigrationAppApplication.java` | Can run all DDL via `jdbcTemplate` in PostgreSQL |
