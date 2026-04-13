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

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
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

**Purpose:** Versioned database schema management using Flyway.

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

## 💡 Important Notes & Patterns

- **MVC & Repository Pattern**: Separation of concerns between API (Controller), Logic (Service), and Data (Repository).
- **Audit Automation**: The application logic doesn't manually write to `audit_log`. The database trigger handles it, ensuring that even manual DB edits are tracked.
- **Soft Deletion**: `DELETE` requests in the controller call `product.setIsActive(false)`, preserving the record for historical context.
- **Postgres Specifics**: Uses `BIGSERIAL` for auto-incrementing IDs and `INTERVAL` for date arithmetic.
