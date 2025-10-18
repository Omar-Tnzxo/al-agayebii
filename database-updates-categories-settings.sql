-- إضافة إعدادات صفحة التصنيفات في site_settings

-- Hero Section Settings
INSERT INTO site_settings (key, value) VALUES
('categories_hero_title', 'تصنيفات المنتجات')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value) VALUES
('categories_hero_subtitle', 'اكتشف مجموعة واسعة من المنتجات المصنفة خصيصاً لتلبية احتياجاتك')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value) VALUES
('categories_hero_badge', 'استكشف تشكيلتنا المميزة')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Features Section Settings
INSERT INTO site_settings (key, value) VALUES
('categories_feature1_title', 'تشكيلة واسعة')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value) VALUES
('categories_feature1_description', 'مئات المنتجات المتنوعة في جميع الفئات')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value) VALUES
('categories_feature2_title', 'جودة عالية')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value) VALUES
('categories_feature2_description', 'منتجات أصلية ومضمونة 100%')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value) VALUES
('categories_feature3_title', 'أسعار تنافسية')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value) VALUES
('categories_feature3_description', 'أفضل الأسعار مع عروض مستمرة')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Enable/Disable Features Section
INSERT INTO site_settings (key, value) VALUES
('categories_show_features', 'true')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
