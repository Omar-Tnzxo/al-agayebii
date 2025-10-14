-- =====================================
-- إصلاح حقول قاعدة البيانات
-- Fix Database Fields
-- =====================================

-- 1. إضافة حقل sales_count إذا لم يكن موجوداً
ALTER TABLE products ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;

-- 2. إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_products_sales_count ON products(sales_count DESC);
CREATE INDEX IF NOT EXISTS idx_products_view_count ON products(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_discount ON products(discount_percentage) WHERE discount_percentage > 0;
CREATE INDEX IF NOT EXISTS idx_products_category_type ON products(category_type);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active) WHERE is_active = true;

-- 3. تحديث sales_count من order_items
UPDATE products p
SET sales_count = COALESCE((
  SELECT SUM(oi.quantity)
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  WHERE oi.product_id = p.id
    AND o.status NOT IN ('cancelled', 'pending')
), 0);

-- 4. إنشاء trigger لتحديث sales_count تلقائياً عند إضافة طلب
CREATE OR REPLACE FUNCTION update_product_sales_count()
RETURNS TRIGGER AS $$
BEGIN
  -- عند إضافة order_item جديد
  IF (TG_OP = 'INSERT') THEN
    UPDATE products 
    SET sales_count = sales_count + NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
  END IF;
  
  -- عند تحديث order_item
  IF (TG_OP = 'UPDATE') THEN
    UPDATE products 
    SET sales_count = sales_count - OLD.quantity + NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
  END IF;
  
  -- عند حذف order_item
  IF (TG_OP = 'DELETE') THEN
    UPDATE products 
    SET sales_count = sales_count - OLD.quantity
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- حذف trigger القديم إذا كان موجوداً
DROP TRIGGER IF EXISTS trigger_update_sales_count ON order_items;

-- إنشاء trigger جديد
CREATE TRIGGER trigger_update_sales_count
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_product_sales_count();

-- 5. إنشاء فهارس للأقسام
CREATE INDEX IF NOT EXISTS idx_homepage_sections_active ON homepage_sections(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_homepage_section_products_section ON homepage_section_products(section_id, sort_order);

-- 6. التحقق من النتائج
SELECT 
  'Products with sales' as check_type,
  COUNT(*) as count,
  SUM(sales_count) as total_sales
FROM products 
WHERE sales_count > 0;

SELECT 
  'Products with discounts' as check_type,
  COUNT(*) as count
FROM products 
WHERE discount_percentage > 0;

SELECT 
  'Active sections' as check_type,
  COUNT(*) as count
FROM homepage_sections 
WHERE is_active = true;

-- ✅ تم تطبيق التحديثات بنجاح!
