# PostgreSQL-Specific Features in the Codebase

This document lists all PostgreSQL-specific elements implemented in the Spring Boot application, reflecting the successful migration from Oracle.

---

## 1. Database Connection and Dialect

- **File**: `src/main/resources/application.yml`
- **Configuration**:
  ```yaml
  spring:
    datasource:
      url: jdbc:postgresql://${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
      username: ${POSTGRES_USERNAME}
      password: ${POSTGRES_PASSWORD}
      driver-class-name: org.postgresql.Driver
    jpa:
      database-platform: org.hibernate.dialect.PostgreSQLDialect
  ```
- **Notes**: The application uses `PostgreSQLDialect` to generate compatible SQL for Spring Data JPA (e.g., `LIMIT/OFFSET` for pagination).

---

## 2. Environment Configuration

- **File**: `.env_postgres`
- **Variables**:
  - `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USERNAME`, `POSTGRES_PASSWORD`.
- **Note**: The backend application explicitly loads these variables from `.env_postgres` on startup using `Dotenv` in `OraclePostgresMigrationAppApplication.java`.

---

## 3. ID Generation (Serial / Identity)

- **Flyway DDL**: `V1__init.sql`, `V4__audit_log_table.sql`
- **SQL Implementation**: Uses `BIGSERIAL` for primary keys.
- **Java Implementation**:
  ```java
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  ```
- **Migration Note**: Oracle sequences were replaced by PostgreSQL's `SERIAL`/`BIGSERIAL` column types, which are automatically managed.

---

## 4. PostgreSQL-Specific Native Query Syntax

### 4a. COALESCE (Null Handling)
- **File**: `ProductRepository.java`
- **Implementation**:
  ```sql
  WHERE COALESCE(is_active, false) = true
  ```
- **Migration Note**: Replaced Oracle's `NVL` with the standard `COALESCE` function.

### 4b. NOW() and Time Interval
- **File**: `InventoryRepository.java`
- **Implementation**:
  ```sql
  WHERE last_updated >= NOW() - INTERVAL '1 day'
  ```
- **Migration Note**: Replaced Oracle's `SYSDATE` with `NOW()` and adopted PostgreSQL-style interval syntax.

### 4c. LocalDateTime and Type Casting
- **File**: `InventoryRepository.java`, `InventoryService.java`
- **Implementation**:
  - Uses `java.time.LocalDateTime` for date range queries.
  - No explicit casting (like Oracle's `TO_TIMESTAMP`) is needed in the native queries when using `LocalDateTime` parameters.

---

## 5. Boolean Type Handling

- **Java Entity**: `Boolean isActive` in `Product.java`.
- **PostgreSQL Type**: `BOOLEAN` in `product` table.
- **Queries**: All native queries filter using `= true` instead of Oracle's `= 1`.

---

## 6. PL/pgSQL Function — `calculate_total_value`

- **File**: `V5__function.sql`
- **Implementation**:
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
- **Called via**: `entityManager.createNativeQuery("SELECT calculate_total_value()")` in `InventoryService.java`.

---

## 7. PostgreSQL Trigger and Function

- **File**: `V6__inventory_audit_trigger.sql`
- **Trigger Function**:
  ```sql
  CREATE OR REPLACE FUNCTION inventory_audit_fn()
  RETURNS TRIGGER AS $$
  BEGIN
    INSERT INTO audit_log (table_name, operation, product_id, old_quantity, new_quantity, timestamp)
    VALUES ('inventory', TG_OP, NEW.product_id, OLD.quantity, NEW.quantity, NOW());
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  ```
- **Trigger Definition**:
  ```sql
  CREATE TRIGGER inventory_audit_trigger
  AFTER INSERT OR UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION inventory_audit_fn();
  ```
- **Notes**: Unlike Oracle, PostgreSQL requires a separate trigger function linked to the trigger event using `TG_OP` for the operation name.

---

## 8. Flyway Migration Strategy

- **Location**: `src/main/resources/db/migration`
- **Files**:
  - `V1__init.sql`: Table creation (`product`, `inventory`).
  - `V2__seed.sql`: Initial data seeding.
  - `V3__indexes.sql`: Database indexing.
  - `V4__audit_log_table.sql`: `audit_log` table definition.
  - `V5__function.sql`: Total value calculation function.
  - `V6__inventory_audit_trigger.sql`: Audit logging mechanism.

---

## 9. Timezone Compatibility

- **File**: `OraclePostgresMigrationAppApplication.java`
- **Implementation**: `System.setProperty("user.timezone", "Asia/Kolkata");`
- **Notes**: PostgreSQL requires specific timezone IDs. The application forces "Asia/Kolkata" on startup to avoid "Asia/Calcutta" compatibility errors in the `postgres` Docker environment.
