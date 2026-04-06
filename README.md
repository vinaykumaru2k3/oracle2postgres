# Oracle to PostgreSQL Migration App

A simple Spring Boot application for managing product inventory, designed to demonstrate database migration from Oracle to PostgreSQL. The app includes a backend API built with Spring Boot and a React frontend for user interaction.

## Project Overview

This project serves as a learning tool for database migration. It currently uses Oracle Database as the primary data store and is structured to facilitate switching to PostgreSQL. The application allows creating products, updating inventory, and viewing recent inventory changes.

### Features
- **Product Management**: Create and manage products with name, price, and active status.
- **Inventory Tracking**: Update and track inventory quantities with timestamps.
- **REST API**: Exposes endpoints for product and inventory operations.
- **React Frontend**: A simple SPA for interacting with the API.
- **Database Migration Ready**: Configured for easy switch between Oracle and PostgreSQL.

### Technologies Used
- **Backend**: Java 17, Spring Boot 3.2.0, Spring Data JPA, Hibernate
- **Database**: Oracle Database (current), PostgreSQL (target for migration)
- **Frontend**: React 18, Axios for API calls
- **Build Tool**: Maven
- **Containerization**: Docker (for Oracle DB)
- **Other**: Lombok for boilerplate reduction

## Prerequisites

Before setting up the project, ensure you have the following installed on your machine:

- **Java 17** or higher
- **Maven 3.6+**
- **Node.js 16+** and npm
- **Docker** (for running Oracle Database)
- **Git** (for cloning the repository)

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/vinaykumaru2k3/oracle2postgres.git
cd oracle2postgres
```

### 2. Set Up Oracle Database with Docker
Pull the Oracle Free image and run the container:

```powershell
docker pull gvenzl/oracle-free
docker run -d `
  --name oracle-free `
  -p 1521:1521 `
  -e ORACLE_PASSWORD=oracle `
  gvenzl/oracle-free
```

- **Username**: system
- **Password**: oracle
- **Service Name**: FREEPDB1
- **Port**: 1521

Wait for the container to fully initialize (this may take a few minutes). You can check the logs with:
```powershell
docker logs oracle-free
```

### 3. Configure Environment Variables
Copy the example environment file and update it with your database credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual Oracle database details (the file is ignored by Git for security).

### 4. Build and Run the Backend
Navigate to the root directory and run:

```bash
mvn clean install
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`.

### 5. Set Up and Run the Frontend
Navigate to the `frontend` directory:

```powershell
cd frontend
npm install
npm start
```

The frontend will start on `http://localhost:3000`.

### 6. Set Up Linting and Pre-commit Hooks
After installing dependencies, set up Husky for pre-commit hooks:

```powershell
cd frontend
npm run prepare  # Sets up Husky (may show deprecated warning, but works)
```

Pre-commit hooks will run ESLint, Prettier on frontend code, and Spotless on backend Java code.

## Usage

### API Endpoints
- **POST /api/products**: Create a new product
  - Body: `{"name": "Product Name", "price": 99.99, "isActive": true}`
- **PUT /api/inventory**: Update inventory for a product
  - Body: `{"productId": 1, "quantity": 10}`
- **GET /api/products**: Get all products
- **GET /api/inventory/recent**: Get recent inventory updates

### Frontend Interaction
Open `http://localhost:3000` in your browser. The React app provides:
- A form to create new products
- A table to view existing products
- A form to update inventory
- A table to view recent inventory changes
- Toggle to show/hide inactive products

## Development

### Project Structure
- `src/main/java/com/example/inventory/`: Backend source code
  - `OraclePostgresMigrationAppApplication.java`: Main application class
  - `Product.java` & `Inventory.java`: JPA entities
  - `ProductRepository.java` & `InventoryRepository.java`: Data access layers
  - `InventoryService.java`: Business logic
  - `InventoryController.java`: REST controllers
- `src/main/resources/application.yml`: Configuration
- `frontend/`: React application
  - `src/App.js`: Main component
  - `src/App.css`: Styles

### Database Schema
The application uses JPA to auto-create tables. Key tables:
- `PRODUCT`: id (sequence), name, price, is_active
- `INVENTORY`: id (sequence), product_id (unique), quantity, last_updated

### Switching to PostgreSQL
To migrate to PostgreSQL:
1. Update `application.yml` to use PostgreSQL datasource.
2. Change dialect to `PostgreSQLDialect`.
3. Update custom queries in repositories (e.g., `ROWNUM` to `LIMIT`, `NVL` to `COALESCE`, `SYSDATE` to `NOW()`).
4. Run with PostgreSQL container instead of Oracle.

### Running Tests
Currently, no automated tests are implemented. You can test manually via the API or frontend.

## Contributing
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Make changes and commit: `git commit -m "Add your feature"`.
4. Push to your fork: `git push origin feature/your-feature`.
5. Create a pull request.

## Troubleshooting
- **Oracle Connection Issues**: Ensure the Docker container is running and accessible. Check environment variables.
- **Port Conflicts**: If ports 8080 or 3000 are in use, update the configurations.
- **Build Errors**: Ensure all prerequisites are installed and versions match.
- **Frontend Issues**: Clear npm cache with `npm cache clean --force` and reinstall dependencies.

## License
This project is for educational purposes. Feel free to use and modify as needed.