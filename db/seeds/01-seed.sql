
CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "products" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "stock" INTEGER NOT NULL,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "orders" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "total_amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "order_items" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "payments" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "payments_order_id_key" ON "payments"("order_id");

-- Add foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_user_id_fkey'
    ) THEN
        ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'order_items_order_id_fkey'
    ) THEN
        ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" 
        FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'order_items_product_id_fkey'
    ) THEN
        ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" 
        FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'payments_order_id_fkey'
    ) THEN
        ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" 
        FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Insert test users
INSERT INTO users (email, password, created_at) 
SELECT 'venkat@example.com', 'hashed_password_123', NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'venkat@example.com');

INSERT INTO users (email, password, created_at) 
SELECT 'sai@example.com', 'hashed_password_456', NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'sai@example.com');

-- Insert test products with varying stock levels
INSERT INTO products (name, price, stock) 
SELECT 'Laptop', 55000.99, 10
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Laptop');

INSERT INTO products (name, price, stock) 
SELECT 'Wireless Mouse', 1200.00, 50
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Wireless Mouse');

INSERT INTO products (name, price, stock) 
SELECT 'USB-C Cable', 1700.00, 100
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'USB-C Cable');

INSERT INTO products (name, price, stock) 
SELECT 'Keyboard', 800.00, 25
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Keyboard');

INSERT INTO products (name, price, stock) 
SELECT 'iPhone', 100000.00, 0
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'iphone');

