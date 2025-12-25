-- Migration: Add flash_sale_purchases table for per-user purchase tracking
-- Date: 2024-12-23
-- Purpose: Prevent race condition and enforce per-user limits in flash sales

-- Create flash_sale_purchases table
CREATE TABLE IF NOT EXISTS "flash_sale_purchases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flash_sale_product_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "flash_sale_purchases_flash_sale_product_id_user_id_key" 
    UNIQUE ("flash_sale_product_id", "user_id")
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "flash_sale_purchases_flash_sale_product_id_idx" 
ON "flash_sale_purchases"("flash_sale_product_id");

CREATE INDEX IF NOT EXISTS "flash_sale_purchases_user_id_idx" 
ON "flash_sale_purchases"("user_id");

-- Verify table created
SELECT 'flash_sale_purchases table created successfully' AS status;
