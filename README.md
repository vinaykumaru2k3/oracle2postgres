# Oracle to PostgreSQL Migration App

A Spring Boot + React application for managing product inventory, built to demonstrate and document a real database migration from Oracle to PostgreSQL. The app exposes a full REST API backed by Oracle Database and a fully componentised React frontend with a monochromatic Zoho-style UI.

---

## Project Overview

This project serves as a hands-on learning tool for Oracle → PostgreSQL migration. It uses Oracle Database as the primary data store and is structured to make switching to PostgreSQL straightforward. The application supports full product CRUD, inventory management, audit logging, low-stock alerting, and real-time reporting.

### Features

- **Full Product CRUD** — Create, edit (inline), soft-delete, and manage products with name, price, and active status
- **Inventory Tracking** — Update and track stock quantities with timestamps and date-range filtering
- **Low Stock Alerts** — Configurable threshold banner that highlights items below a set quantity
- **Audit Log** — Every inventory change is recorded in Oracle's `audit_log` table and exposed via API
- **REST API** — 14 endpoints covering products, inventory, active stock, low stock, value, summary, audit log
- **React Frontend** — Multi-tab SPA (Dashboard, Items, Inventory, Reports) with monochromatic theme
- **DataGrid** — Sortable, paginated tables (12 rows/page) with loading skeletons across all tabs
- **Oracle-Specific Features** — Stored procedure, trigger, view, audit log table, `NVL`, `SYSDATE`, `TO_TIMESTAMP`
- **Migration Ready** — Fully documented Oracle → PostgreSQL migration checklist in `ORACLE_SPECIFICS.md`

### Technologies

| Layer | Stack |
|---|---|
| Backend | Java 17, Spring Boot 3.2.0, Spring Data JPA, Hibernate |
| Database | Oracle Free 23c (Docker) |
| Frontend | React 18, custom CSS (monochromatic), no external UI library |
| Build | Maven |
| Containerisation | Docker (Oracle Free image) |
| Other | Lombok, dotenv-java, ESLint, Prettier, Husky |

---

## Prerequisites

- **Java 17+**
- **Maven 3.6+**
- **Node.js 16+** and npm
- **Docker** (for Oracle Database)
- **Git**

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/vinaykumaru2k3/oracle2postgres.git
cd oracle2postgres
```

### 2. Start Oracle Database with Docker

```powershell
docker pull gvenzl/oracle-free
docker run -d `
  --name oracle-free `
  -p 1521:1521 `
  -e ORACLE_PASSWORD=oracle `
  gvenzl/oracle-free
```

Wait for the container to fully initialise (2–3 minutes):

```powershell
docker logs -f oracle-free
```

Connection details:
- **Username**: `system`
- **Password**: `oracle`
- **Service Name**: `FREEPDB1`
- **Port**: `1521`

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

The `.env` file should contain:

```env
ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_SERVICE=FREEPDB1
ORACLE_USERNAME=system
ORACLE_PASSWORD=oracle
```

### 4. Run the Oracle Init Script

The stored procedure and trigger must be created directly via `sqlplus` (they use Oracle's PL/SQL `/` terminator which cannot run through JDBC):

```powershell
docker cp src/main/resources/oracle-init.sql oracle-free:/tmp/oracle-init.sql
docker exec oracle-free bash -c "sqlplus system/oracle@FREEPDB1 @/tmp/oracle-init.sql"
```

The view (`active_products_with_stock`) and audit table are created automatically on first startup.

### 5. Build and Run the Backend

```bash
mvn clean install
mvn spring-boot:run
```

The backend starts on `http://localhost:8080`. On first run it inserts 20 sample products and 20 inventory records automatically.

### 6. Run the Frontend

```bash
cd frontend
npm install
npm start
```

The frontend starts on `http://localhost:3000` and proxies all `/api/*` calls to the backend.

---

## API Endpoints

### Products

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | Get all products (sorted by ID) |
| `GET` | `/api/products?page=0&size=12` | Get paginated products |
| `GET` | `/api/products/{id}` | Get a single product by ID |
| `POST` | `/api/products` | Create a new product |
| `PUT` | `/api/products/{id}` | Update product name / price / status |
| `DELETE` | `/api/products/{id}` | Soft delete — sets `isActive = false` |

### Inventory

| Method | Endpoint | Description |
|---|---|---|
| `PUT` | `/api/inventory` | Update stock quantity for a product |
| `GET` | `/api/inventory/recent` | Inventory updates from the last 24 hours |
| `GET` | `/api/inventory/range?from=&to=` | Inventory updates within a date range |
| `GET` | `/api/inventory/low-stock?threshold=10` | Active products below the stock threshold |

### Reporting & Other

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/active-stock` | All active products with stock, sorted by quantity |
| `GET` | `/api/value` | Total inventory value (via Oracle stored procedure) |
| `GET` | `/api/reports/summary` | Single-call KPI summary (counts, value) |
| `GET` | `/api/audit-log` | Full audit log ordered by timestamp DESC |

### Example Requests

```bash
# Create a product
curl -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{"name": "Laptop", "price": 1200.00, "isActive": true}'

# Update a product
curl -X PUT http://localhost:8080/api/products/21 \
  -H "Content-Type: application/json" \
  -d '{"name": "Laptop Pro", "price": 1400.00}'

# Soft delete a product
curl -X DELETE http://localhost:8080/api/products/21

# Update inventory
curl -X PUT http://localhost:8080/api/inventory \
  -H "Content-Type: application/json" \
  -d '{"productId": 21, "quantity": 10}'

# Get low stock items below 15 units
curl http://localhost:8080/api/inventory/low-stock?threshold=15

# Get inventory updates in a date range
curl "http://localhost:8080/api/inventory/range?from=2026-01-01T00:00:00&to=2026-12-31T23:59:59"

# Get dashboard summary
curl http://localhost:8080/api/reports/summary

# Get audit log
curl http://localhost:8080/api/audit-log
```

---

## Project Structure

```
oracle_postgres_migration_app/
├── src/main/java/com/example/inventory/
│   ├── OraclePostgresMigrationAppApplication.java  # Startup + sample data seeder
│   ├── Product.java                                # JPA entity
│   ├── Inventory.java                              # JPA entity
│   ├── AuditLog.java                               # JPA entity (audit table)
│   ├── ProductRepository.java                      # Paginated, low-stock, active-stock queries
│   ├── InventoryRepository.java                    # SYSDATE, TO_TIMESTAMP, date-range queries
│   ├── AuditLogRepository.java                     # Audit log query (ORDER BY timestamp DESC)
│   ├── InventoryService.java                       # Full business logic + stored proc call
│   └── InventoryController.java                    # 14 REST endpoints
├── src/main/resources/
│   ├── application.yml                             # Oracle datasource config
│   └── oracle-init.sql                             # View + audit table DDL
├── frontend/src/
│   ├── App.js                                      # Root component, tab routing, all API calls
│   ├── App.css                                     # Global layout + banner + threshold styles
│   ├── components/
│   │   ├── Sidebar.js                              # Fixed sidebar with SVG nav icons
│   │   ├── Header.js                               # Topbar with search + inventory value
│   │   ├── StatCard.js                             # KPI summary card
│   │   ├── DataGrid.js                             # Sortable, paginated table with skeletons
│   │   ├── SalesActivity.js                        # Activity summary cards
│   │   ├── InventorySummary.js                     # Inventory KPI panel
│   │   ├── ProductDetails.js                       # Product stats + pie chart
│   │   ├── TopSellingItems.js                      # Top 5 items by stock quantity
│   │   ├── OrderTables.js                          # Stock overview table
│   │   ├── ProductList.js                          # Products DataGrid with inline edit + delete
│   │   ├── ProductForm.js                          # Add new product form
│   │   ├── InventoryForm.js                        # Update stock form (product dropdown)
│   │   └── Alert.js                               # Toast notification
│   └── styles/                                     # Per-component CSS files
├── ORACLE_SPECIFICS.md                             # Full Oracle → PostgreSQL migration guide
├── GFS_Migration_Guide_v3.pdf                      # Reference migration document
├── .env                                            # Local environment variables (git-ignored)
├── .env.example                                    # Environment variable template
└── pom.xml
```

---

## Frontend — Tab Overview

| Tab | Contents |
|---|---|
| **Dashboard** | KPI stat cards, sales activity, inventory summary, product details pie chart, top stock items, order overview |
| **Items** | Add new product form, paginated + sortable products DataGrid with inline edit and delete |
| **Inventory** | Threshold config, update stock form, active stock DataGrid (with total value column), recent updates DataGrid |
| **Reports** | KPI cards, product details chart, top stock items |

### Frontend Features

- **Inline Edit** — Click the pencil icon on any product row to edit name and price directly in the table
- **Soft Delete** — Trash icon per row opens a confirm modal before deactivating the product
- **Low Stock Banner** — Dismissible black banner showing item names and quantities below the configured threshold
- **Column Sorting** — Click any column header to sort ascending/descending
- **Loading Skeletons** — Shimmer placeholder rows while data loads
- **Threshold Config** — Number input in the Inventory tab controls the low-stock threshold live
- **Total Value Column** — `price × quantity` shown per row in the Active Stock table
- **Search** — Global search bar filters products and inventory by name across all tabs

---

## Oracle-Specific Features

See [`ORACLE_SPECIFICS.md`](./ORACLE_SPECIFICS.md) for the full breakdown. Summary:

| Feature | Oracle Implementation | PostgreSQL Migration |
|---|---|---|
| Sequences | `@SequenceGenerator` | Keep or use `IDENTITY` |
| Pagination | Dialect-generated `ROWNUM` subquery | Dialect-generated `LIMIT/OFFSET` |
| Null handling | `NVL` | `COALESCE` |
| Timestamp | `SYSDATE` | `NOW()` |
| Date parsing | `TO_TIMESTAMP(..., 'YYYY-MM-DD"T"HH24:MI:SS')` | `::timestamp` cast |
| Boolean | `NUMBER(1)` | Native `BOOLEAN` |
| Stored procedure | `calculate_total_value` (OUT param) | PL/pgSQL function, replace `StoredProcedureQuery` |
| View | `active_products_with_stock` | Same syntax, change `= 1` to `= true` |
| Trigger | `INSERTING`/`UPDATING` conditionals | `TG_OP` in trigger function |
| Audit table | `NUMBER`, `VARCHAR2`, `SYSDATE` | `BIGINT`, `VARCHAR`, `NOW()` |

---

## Development

### Running Tests

No automated tests are currently implemented. Test manually via the frontend at `http://localhost:3000` or directly against the API endpoints listed above.

### Linting and Pre-commit Hooks

```powershell
cd frontend
npm run prepare   # Sets up Husky pre-commit hooks
```

Pre-commit hooks run ESLint and Prettier on all frontend JS/CSS files.

### Switching to PostgreSQL

1. Update `application.yml` — change driver, URL, and dialect to PostgreSQL
2. Replace Oracle-specific SQL in repositories (`NVL` → `COALESCE`, `SYSDATE` → `NOW()`, `TO_TIMESTAMP` format → `::timestamp`)
3. Rewrite the stored procedure as a PL/pgSQL function and replace `StoredProcedureQuery` call
4. Rewrite the trigger using PostgreSQL's trigger function pattern with `TG_OP`
5. Update all native queries that use `= 1` for boolean to `= true`
6. Run with a PostgreSQL container instead of Oracle

Full details in [`ORACLE_SPECIFICS.md`](./ORACLE_SPECIFICS.md).

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Oracle connection refused | Ensure `oracle-free` container is running: `docker ps` |
| `/api/value` returns 500 | Stored procedure not created — run `oracle-init.sql` via `sqlplus` |
| `/api/active-stock` returns 500 | View not created — run the view DDL via `sqlplus` |
| `/api/audit-log` returns empty | Trigger not created — run `oracle-init.sql` via `sqlplus`, then update some inventory |
| Port 8080 in use | Change server port in `application.yml` |
| Port 3000 in use | Set `PORT=3001` before `npm start` |
| Frontend shows no data | Check backend is running and proxy in `package.json` points to `http://localhost:8080` |
| Sample data not inserted | Data only seeds when the `product` table is empty on startup |
| Low stock banner not showing | Adjust the threshold in the Inventory tab — default is 10 units |

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: your feature"`
4. Push to your fork: `git push origin feature/your-feature`
5. Open a pull request

---

## License

This project is for educational purposes. Feel free to use and modify as needed.
