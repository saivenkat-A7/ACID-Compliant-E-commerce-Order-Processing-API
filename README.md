# E-commerce Order Processing API

A robust, ACID-compliant e-commerce order processing API built with Node.js, Express, PostgreSQL, and Prisma ORM. This project demonstrates implementation of database transactions, concurrency control, and data consistency in a production-grade backend system.



## Overview

This API handles e-commerce order processing with ACID transaction guarantees. It ensures data integrity across complex operations like inventory management, order creation, and payment processing.

### ACID Properties Implementation

- **Atomicity**: All operations within a transaction succeed or fail together
- **Consistency**: Database maintains valid state across all transactions
- **Isolation**: Concurrent transactions don't interfere with each other
- **Durability**: Committed transactions persist even after system failures

## Features

ACID-compliant database transactions using Prisma  
Connection pooling for optimized database performance  
Automatic inventory management with stock validation  
Idempotent order cancellation  
Structured JSON logging with transaction tracing  
Comprehensive error handling and rollback mechanisms  
Docker containerization with health checks  
Automated database seeding for testing  

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 13
- **ORM**: Prisma 5.x
- **Logging**: Winston
- **Containerization**: Docker & Docker Compose

## Architecture

### Service Layer Pattern

The application follows a clean architecture with separation of concerns:

```
┌─────────────┐
│   Routes    │  HTTP Layer
└──────┬──────┘
       │
┌──────▼──────┐
│ Controllers │  Request/Response Handling
└──────┬──────┘
       │
┌──────▼──────┐
│  Services   │  Business Logic & Transactions
└──────┬──────┘
       │
┌──────▼──────┐
│   Prisma    │  Data Access Layer
└──────┬──────┘
       │
┌──────▼──────┐
│ PostgreSQL  │  Database
└─────────────┘
```

### Transaction Flow

**Order Creation**:
1. Start database transaction
2. Validate user and products
3. Check inventory availability
4. Decrease product stock
5. Create order and order items
6. Process payment (simulated)
7. Create payment record
8. Commit transaction (or rollback on any failure)

**Order Cancellation**:
1. Start database transaction
2. Validate order exists and is cancelable
3. Restore product inventory
4. Update order status to 'cancelled'
5. Commit transaction (idempotent - safe to retry)



## Quick Start

### 1. Clone the Repository

```bash
git clone 

```

### 2. Configure Environment

```bash
cp .env.example .env
```

The default configuration works with Docker Compose. Modify if needed:

```env
API_PORT=8080
DATABASE_URL="postgresql://user:password@db:5432/ecommerce"
DB_USER=user
DB_PASSWORD=password
DB_NAME=ecommerce
```

### 3. Start with Docker Compose

```bash
docker-compose up --build
```

This command will:
- Build the application container
- Start PostgreSQL with automatic seeding
- Run database migrations
- Start the API server on port 8080

### 4. Verify Installation

Health check:
```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "ok",
  "db": "healthy"
}
```

## API Documentation

### Base URL

```
http://localhost:8080/api
```

### Endpoints

#### 1. Get All Products

```http
GET /api/products
```

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "name": "Laptop",
    "price": 999.99,
    "stock": 10
  }
]
```

#### 2. Create Order

```http
POST /api/orders
```

**Request Body**:
```json
{
  "userId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 2
    }
  ]
}
```

**Response**: `201 Created`
```json
{
  "orderId": 1,
  "status": "processing",
  "totalAmount": 1999.98
}
```

**Error Response**: `400 Bad Request` (Insufficient stock)
```json
{
  "error": "Insufficient stock for product Laptop. Available: 1, Requested: 2"
}
```

#### 3. Get Order Details

```http
GET /api/orders/:orderId
```

**Response**: `200 OK`
```json
{
  "orderId": 1,
  "status": "processing",
  "totalAmount": 1999.98,
  "createdAt": "2026-02-15T12:30:00.000Z",
  "user": {
    "id": 1,
    "email": "john.doe@example.com"
  },
  "items": [
    {
      "productId": 1,
      "productName": "Laptop",
      "quantity": 2,
      "price": 999.99
    }
  ]
}
```

#### 4. Cancel Order

```http
PUT /api/orders/:orderId/cancel
```

**Response**: `200 OK`
```json
{
  "orderId": 1,
  "status": "cancelled"
}
```

**Note**: This endpoint is idempotent. Canceling an already-canceled order returns success.

### Health Check

```http
GET /health
```

**Response**: `200 OK`
```json
{
  "status": "ok",
  "db": "healthy"
}
```

## Database Schema

### Tables

#### users
- `id`: Primary Key (SERIAL)
- `email`: VARCHAR (UNIQUE, NOT NULL)
- `password`: VARCHAR (NOT NULL)
- `created_at`: TIMESTAMP

#### products
- `id`: Primary Key (SERIAL)
- `name`: VARCHAR (NOT NULL)
- `price`: DECIMAL(10,2) (NOT NULL)
- `stock`: INTEGER (NOT NULL, CHECK >= 0)

#### orders
- `id`: Primary Key (SERIAL)
- `user_id`: Foreign Key → users.id
- `status`: VARCHAR ('pending', 'processing', 'shipped', 'delivered', 'cancelled')
- `total_amount`: DECIMAL(10,2)
- `created_at`: TIMESTAMP

#### order_items
- `id`: Primary Key (SERIAL)
- `order_id`: Foreign Key → orders.id
- `product_id`: Foreign Key → products.id
- `quantity`: INTEGER (NOT NULL)
- `price`: DECIMAL(10,2) (NOT NULL)

#### payments
- `id`: Primary Key (SERIAL)
- `order_id`: Foreign Key → orders.id (UNIQUE)
- `amount`: DECIMAL(10,2)
- `status`: VARCHAR ('succeeded', 'failed')
- `created_at`: TIMESTAMP

### Seed Data

The database is automatically seeded with:
- 2 test users
- 5 products (including 1 out-of-stock item)

## Testing

### Manual Testing

**Test 1: Successful Order Creation**
```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "items": [
      {"productId": 1, "quantity": 1}
    ]
  }'
```

**Test 2: Insufficient Stock (Should Fail)**
```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "items": [
      {"productId": 5, "quantity": 1}
    ]
  }'
```

**Test 3: Order Cancellation**
```bash
# Create an order first, then cancel it
curl -X PUT http://localhost:8080/api/orders/1/cancel
```

**Test 4: Idempotent Cancellation**
```bash
# Cancel the same order again - should still succeed
curl -X PUT http://localhost:8080/api/orders/1/cancel
```

### Verification

After each test, verify the database state:

```bash
docker-compose exec db psql -U user -d ecommerce -c "SELECT * FROM products;"
docker-compose exec db psql -U user -d ecommerce -c "SELECT * FROM orders;"
```

## Project Structure

```
.
├── src/
│   ├── controllers/         # Request handlers
│   │   ├── healthController.js
│   │   ├── orderController.js
│   │   └── productController.js
│   ├── services/           # Business logic
│   │   ├── orderService.js
│   │   └── paymentService.js
│   ├── routes/             # API routes
│   │   └── api.js
│   ├── utils/              # Utilities
│   │   ├── db.js          # Database client
│   │   └── logger.js      # Structured logging
│   ├── app.js             # Express app setup
│   └── server.js          # Server entry point
├── prisma/
│   └── schema.prisma      # Database schema
├── db/
│   └── seeds/             # Database seed files
│       └── 01-seed.sql
├── docker-compose.yml     # Docker orchestration
├── Dockerfile            # Application container
├── package.json          # Dependencies
├── .env.example          # Environment template
├── submission.json       # Test data config
└── README.md            # This file
```

## Key Implementation Details

### Transaction Isolation

Prisma uses PostgreSQL's default `READ COMMITTED` isolation level, which prevents:
- Dirty reads
- Lost updates

For scenarios requiring stronger guarantees, you can configure `REPEATABLE READ` or `SERIALIZABLE` isolation levels.

### Connection Pooling

Prisma automatically manages connection pooling with sensible defaults:
- Maximum pool size: 10 connections
- Minimum pool size: 2 connections
- Connection timeout: 10 seconds

### Error Handling

The application implements comprehensive error handling:
- Transaction rollbacks on any failure
- Specific error messages for common issues
- Structured logging for debugging
- HTTP status codes following REST conventions

### Structured Logging

All transactions are logged with:
- Unique transaction IDs
- Event types (START, COMMIT, ROLLBACK)
- Contextual information (user, products, quantities)
- Timestamps in ISO format

Example log output:
```
TRANSACTION_START { transactionId: 'txn_1234', userId: 1 }
INVENTORY_CHECK_SUCCESS { transactionId: 'txn_1234', productId: 1 }
ORDER_CREATED { transactionId: 'txn_1234', orderId: 1 }
PAYMENT_SUCCESS { transactionId: 'txn_1234', orderId: 1 }
TRANSACTION_COMMIT { transactionId: 'txn_1234', orderId: 1 }
```

## Troubleshooting

### Database Connection Issues

If the app can't connect to the database:

```bash
# Check database logs
docker-compose logs db

# Verify database is healthy
docker-compose ps

# Restart services
docker-compose restart
```

### Port Conflicts

If port 8080 or 5432 is already in use:

1. Update `.env`:
```env
API_PORT=3000
```

2. Update `docker-compose.yml` port mapping accordingly

### Migrations Not Running

```bash
# Manually run migrations
docker-compose exec app npx prisma migrate deploy

# Or rebuild containers
docker-compose down -v
docker-compose up --build
```

## Production Considerations

For production deployment, consider:

1. **Security**:
   - Use strong passwords
   - Implement authentication & authorization
   - Enable HTTPS/TLS
   - Validate and sanitize all inputs

2. **Performance**:
   - Configure connection pool size based on load
   - Add database indexes on foreign keys
   - Implement caching (Redis)
   - Set up read replicas

3. **Monitoring**:
   - Integrate application monitoring (DataDog, New Relic)
   - Set up database monitoring
   - Configure alerting for failed transactions
   - Track API response times

4. **Scalability**:
   - Horizontal scaling with load balancer
   - Database connection pooling optimization
   - Implement rate limiting
   - Use message queues for async operations

## License

MIT

## Contact

For questions or support, please open an issue in the repository.
