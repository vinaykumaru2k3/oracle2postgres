# Project Documentation: `files__explained.md`

## 🎯 Scope
This document provides a comprehensive technical overview of the backend components for the **Oracle to PostgreSQL Migration App**. It covers the Java source code (Spring Boot), database migration scripts (Flyway), and configuration files. It excludes the frontend application and compiled artifacts (e.g., `target/` folder).

---

## 📑 Table of Contents

- [📁 Folder: `src/main/java/com/example/inventory`](#folder-srcmainjavacomexampleinventory)
  - [📄 OraclePostgresMigrationAppApplication.java](#file-oraclepostgresmigrationappapplicationjava)
  - [📄 Product.java](#file-productjava)
  - [📄 Inventory.java](#file-inventoryjava)
  - [📄 AuditLog.java](#file-auditlogjava)
  - [📄 ProductRepository.java](#file-productrepositoryjava)
  - [📄 InventoryRepository.java](#file-inventoryrepositoryjava)
  - [📄 AuditLogRepository.java](#file-auditlogrepositoryjava)
  - [📄 InventoryService.java](#file-inventoryservicejava)
  - [📄 InventoryController.java](#file-inventorycontrollerjava)
- [📁 Folder: `src/main/resources/db/migration`](#folder-srcmainresourcesdbmigration)
  - [📄 V1__init.sql](#file-v1__initsql)
  - [📄 V2__seed.sql](#file-v2__seedsql)
  - [📄 V3__indexes.sql](#file-v3__indexessql)
  - [📄 V4__audit_log_table.sql](#file-v4__audit_log_tablesql)
  - [📄 V5__function.sql](#file-v5__functionsql)
  - [📄 V6__inventory_audit_trigger.sql](#file-v6__inventory_audit_triggersql)
- [📁 Folder: Root Configuration](#folder-root-configuration)
  - [📄 .env_postgres](#file-env_postgres)
  - [📄 pom.xml](#file-pomxml)

---

## 📁 Folder: `src/main/java/com/example/inventory`

**Purpose:** This folder contains the core Java application logic, following the **Model-View-Controller (MVC)** and **Repository** patterns. It manages product entities, inventory levels, and audit logs.

### 📄 File: `OraclePostgresMigrationAppApplication.java`

**Purpose:**
- The entry point of the Spring Boot application.
- Handles environment variable configuration before the application context starts.

**Responsibilities:**
- Bootstrapping the Spring application.
- Loading environment variables from a `.env` file using the `dotenv` library.
- Setting system properties (like timezone and DB credentials).

**Code Snippet:**
```java
public static void main(String[] args) {
    System.setProperty("user.timezone", "Asia/Kolkata");
    Dotenv dotenv = Dotenv.configure()
            .filename(".env_postgres")
            .load();
    dotenv.entries().forEach(entry -> {
        System.setProperty(entry.getKey(), entry.getValue());
    });
    SpringApplication.run(OraclePostgresMigrationAppApplication.class, args);
}
```

**Detailed Explanation:**
1. **Timezone Setting**: Sets the default timezone to `Asia/Kolkata` for consistent timestamp recording.
2. **Environment Loading**: Uses `Dotenv` to read `.env_postgres`. This is crucial for local development where secrets shouldn't be hardcoded.
3. **System Properties**: Maps every key-value pair from the `.env` file to `System.setProperty`, making them available for Spring's property resolution (e.g., `${JDBC_URL}`).
4. **Bootstrapping**: Calls `SpringApplication.run` to start the embedded Tomcat server and Spring container.

---

### 📄 File: `Product.java`

**Purpose:** Represents a physical product in the system.

**Responsibilities:** Mapping the `product` database table to a Java object using JPA.

**Code Snippet:**
```java
@Entity
@Table(name = "product")
@Data
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private BigDecimal price;
    @Column(name = "is_active")
    private Boolean isActive;
}
```

**Key Components:**
- `@Data`: A Lombok annotation that generates getters, setters, `equals`, `hashCode`, and `toString` at compile-time.
- `isActive`: Used for "Soft Deletion". Instead of deleting rows, we mark them inactive.

---

### 📄 File: `Inventory.java`

**Purpose:** Tracks the stock quantity for a specific product.

**Responsibilities:** Mapping the `inventory` table and maintaining the relationship with `Product`.

**Code Snippet:**
```java
@Entity
@Table(name = "inventory")
@Data
public class Inventory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;

    private Integer quantity;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;
}
```

**Logic Note:**
- Even though it's marked `@ManyToOne`, the `unique = true` on `JoinColumn` makes it effectively a **One-to-One** relationship. Each product has exactly one inventory record.

---

### 📄 File: `AuditLog.java`

**Purpose:** Acts as a historical record of all inventory transactions.

**Code Snippet:**
```java
@Entity
@Table(name = "audit_log")
@Data
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "table_name")
    private String tableName;
    private String operation;
    @Column(name = "product_id")
    private Long productId;
    @Column(name = "old_quantity")
    private Integer oldQuantity;
    @Column(name = "new_quantity")
    private Integer newQuantity;
    private LocalDateTime timestamp;
}
```

**Interaction:**
- This entity is **read-only** for the Java application. The data is populated by a **Database Trigger** whenever the `inventory` table is modified.

---

### 📄 File: `ProductRepository.java`

**Purpose:** Data Access Object (DAO) for the `Product` entity.

**Key Queries:**
- **Active Products**: Filters out products marked as `isActive = false`.
- **Low Stock**: Joins `product` and `inventory` to find items where quantity is below a threshold.

**Code Snippet:**
```java
@Query(value = """
  SELECT p.id, p.name, p.price, i.quantity, i.last_updated
  FROM product p
  JOIN inventory i ON p.id = i.product_id
  WHERE COALESCE(p.is_active, false) = true
  AND i.quantity < :threshold
  ORDER BY i.quantity ASC
  """, nativeQuery = true)
List<Object[]> findLowStockProducts(int threshold);
```

---

### 📄 File: `InventoryRepository.java`

**Purpose:** DAO for the `Inventory` entity.

**Key Components:**
- `findRecentUpdates()`: Finds stock changes in the last 24 hours.
- `calculateTotalValue()`: Executes a PostgreSQL function.

**Code Snippet:**
```java
@Query(value = """
  SELECT * FROM inventory
  WHERE last_updated >= NOW() - INTERVAL '1 day'
  ORDER BY last_updated DESC
  """, nativeQuery = true)
List<Inventory> findRecentUpdates();
```

---

### 📄 File: `AuditLogRepository.java`

**Purpose:** 
- Provides the data access layer for the `AuditLog` entity.

**Responsibilities:**
- Fetching historical logs from the `audit_log` table.
- Supporting sorting of logs, specifically by timestamp in descending order to show the latest changes first.

**Code Snippet:**
```java
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findAllByOrderByTimestampDesc();
}
```

**Key Components:**
- `findAllByOrderByTimestampDesc()`: A derived query method that retrieves all audit logs sorted by the `timestamp` field in descending order.

**Dependencies:**
- Extends `JpaRepository` from Spring Data JPA.
- Depends on the `AuditLog` entity.

**Interactions:**
- Used by `InventoryService` to provide the full history of inventory movements for the frontend or reporting.

---

### 📄 File: `InventoryService.java`

**Purpose:** Contains the core "Business Logic".

**Detailed Logic: `updateInventory`**
- **Scenario**: When a stock update is requested.
- **Step 1**: Validates the product exists.
- **Step 2**: Fetches existing inventory or initializes it if not present.
- **Step 3**: Incremental update: `newQty = currentQty + incomingQty`.
- **Step 4**: Sets `lastUpdated` and saves.

**Code Snippet:**
```java
@Transactional
public Inventory updateInventory(Inventory req) {
    // ... validation ...
    Inventory inv = inventoryRepository.findByProduct_Id(productId)
            .orElseGet(() -> {
                Inventory i = new Inventory();
                i.setProduct(product);
                i.setQuantity(0);
                return i;
            });

    int newQty = (inv.getQuantity() == null ? 0 : inv.getQuantity())
            + (req.getQuantity() == null ? 0 : req.getQuantity());

    inv.setQuantity(newQty);
    inv.setLastUpdated(LocalDateTime.now());
    return inventoryRepository.save(inv);
}
```

---

### 📄 File: `InventoryController.java`

**Purpose:** Exposes REST API endpoints.

**Key Endpoints:**
- `GET /api/inventory/low-stock`: Returns products below a certain quantity.
- `GET /api/value`: Calls service to get total inventory value (via DB function).
- `GET /api/audit-log`: Returns the historical log of all changes.

---

## 📁 Folder: `src/main/resources/db/migration`

**Purpose:** Versioned database schema management using Flyway. This folder contains SQL scripts that are executed in order (based on the version prefix `V1`, `V2`, etc.) to build and update the database schema.

### 📄 File: `V1__init.sql`

**Purpose:** 
- Initializes the base schema for the application.

**Responsibilities:**
- Creating the `product` and `inventory` tables.
- Defining primary keys, foreign keys, and constraints.

**Code Snippet:**
```sql
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
    CONSTRAINT fk_product FOREIGN KEY(product_id) REFERENCES product(id) ON DELETE CASCADE
);
```

**Key Components:**
- `BIGSERIAL`: Used for auto-incrementing primary keys in PostgreSQL.
- `UNIQUE NOT NULL`: Ensures a one-to-one mapping between a product and its inventory record.
- `ON DELETE CASCADE`: Ensures that if a product is deleted, its corresponding inventory record is also removed.

---

### 📄 File: `V2__seed.sql`

**Purpose:** 
- Populates the database with initial sample data for testing and development.

**Responsibilities:**
- Inserting 20 initial products into the `product` table.
- Inserting corresponding stock levels into the `inventory` table.
- Synchronizing primary key sequences after manual ID insertion.

**Detailed Explanation:**
- The script uses `INSERT` statements with hardcoded IDs (1-20).
- **Sequence Fix**: Since manual IDs are used, the PostgreSQL sequence for the `id` column must be manually updated to the next available value (e.g., 21) using `setval(pg_get_serial_sequence('product', 'id'), (SELECT MAX(id) FROM product))`.

---

### 📄 File: `V3__indexes.sql`

**Purpose:** 
- Optimizes database performance for common queries.

**Responsibilities:**
- Creating indexes on frequently searched or joined columns.

**Code Snippet:**
```sql
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_product_is_active ON product(is_active);
CREATE INDEX idx_product_price ON product(price);
```

**Key Components:**
- `idx_inventory_product_id`: Speeds up joins between `product` and `inventory`.
- `idx_product_is_active`: Optimizes filtering for active products, which is a common operation in this system.

---

### 📄 File: `V4__audit_log_table.sql`

**Purpose:** 
- Sets up the storage for the audit tracking system.

**Responsibilities:**
- Creating the `audit_log` table.

**Code Snippet:**
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

**Logic Note:**
- This table stores snapshots of quantity changes, including the `old_quantity` and `new_quantity`, along with the type of `operation` (`INSERT` or `UPDATE`).

---

### 📄 File: `V5__function.sql`
- **Logic**: Calculates total value by multiplying active product prices by their quantities.
```sql
CREATE OR REPLACE FUNCTION calculate_total_value()
RETURNS NUMERIC AS $$
BEGIN
  RETURN (SELECT COALESCE(SUM(p.price * i.quantity), 0)
          FROM product p
          JOIN inventory i ON p.id = i.product_id
          WHERE p.is_active = true);
END;
$$ LANGUAGE plpgsql;
```

### 📄 File: `V6__inventory_audit_trigger.sql`
- **Logic**: Automated logging.
- **Process**:
    1. `inventory_audit_fn()` is called on every change.
    2. It captures `OLD.quantity` (before) and `NEW.quantity` (after).
    3. It logs the operation (`INSERT` or `UPDATE`).
```sql
CREATE TRIGGER inventory_audit_trigger
AFTER INSERT OR UPDATE ON inventory
FOR EACH ROW
EXECUTE FUNCTION inventory_audit_fn();
```

---

## 📁 Folder: Root Configuration

**Purpose:** Contains project-wide configuration files for dependencies, build processes, and environment-specific settings.

### 📄 File: `.env_postgres`

**Purpose:** 
- Stores sensitive and environment-specific configuration variables for the PostgreSQL database.

**Responsibilities:**
- Defining the database connection parameters (host, port, name, credentials).

**Key Components:**
- `POSTGRES_HOST`: The address of the database server.
- `POSTGRES_DB`: The name of the specific database to connect to.
- `POSTGRES_USERNAME` & `POSTGRES_PASSWORD`: Authentication credentials.

**Detailed Explanation:**
- This file is read by the `Dotenv` library in `OraclePostgresMigrationAppApplication.java` and injected into the system properties so that Spring Boot's standard `application.properties` (or default settings) can use them.

---

### 📄 File: `pom.xml`

**Purpose:** 
- The Maven Project Object Model file that manages dependencies and build configuration.

**Responsibilities:**
- Declaring all external libraries (Spring Boot, Postgres driver, Flyway, Lombok, Dotenv).
- Configuring the Java compiler version (Java 17).
- Defining build plugins.

**Key Dependencies:**
- `spring-boot-starter-data-jpa`: For ORM and database interactions.
- `postgresql`: The JDBC driver for connecting to PostgreSQL.
- `flyway-core`: For database migrations.
- `lombok`: For reducing boilerplate code (getters/setters).
- `dotenv-java`: For loading the `.env` configuration file.

---

## 💡 Important Notes & Patterns

- **MVC & Repository Pattern**: Separation of concerns between API (Controller), Logic (Service), and Data (Repository).
- **Audit Automation**: The application logic doesn't manually write to `audit_log`. The database trigger handles it, ensuring that even manual DB edits are tracked.
- **Soft Deletion**: `DELETE` requests in the controller call `product.setIsActive(false)`, preserving the record for historical context.
- **Postgres Specifics**: Uses `BIGSERIAL` for auto-incrementing IDs and `INTERVAL` for date arithmetic.
