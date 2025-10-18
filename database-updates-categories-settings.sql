-- إضافة إعدادات صفحة التصنيفات في site_settings

-- Hero Section Settings
INSERT INTO site_settings (key, value, description) VALUES
('categories_hero_title', 'تصنيفات المنتجات', 'عنوان صفحة التصنيفات في Hero Section')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value, description) VALUES
('categories_hero_subtitle', 'اكتشف مجموعة واسعة من المنتجات المصنفة خصيصاً لتلبية احتياجاتك', 'وصف صفحة التصنيفات في Hero Section')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value, description) VALUES
('categories_hero_badge', 'استكشف تشكيلتنا المميزة', 'نص الـ Badge في Hero Section')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Features Section Settings
INSERT INTO site_settings (key, value, description) VALUES
('categories_feature1_title', 'تشكيلة واسعة', 'عنوان الميزة الأولى')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value, description) VALUES
('categories_feature1_description', 'مئات المنتجات المتنوعة في جميع الفئات', 'وصف الميزة الأولى')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value, description) VALUES
('categories_feature2_title', 'جودة عالية', 'عنوان الميزة الثانية')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value, description) VALUES
('categories_feature2_description', 'منتجات أصلية ومضمونة 100%', 'وصف الميزة الثانية')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value, description) VALUES
('categories_feature3_title', 'أسعار تنافسية', 'عنوان الميزة الثالثة')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO site_settings (key, value, description) VALUES
('categories_feature3_description', 'أفضل الأسعار مع عروض مستمرة', 'وصف الميزة الثالثة')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Enable/Disable Features Section
INSERT INTO site_settings (key, value, description) VALUES
('categories_show_features', 'true', 'إظهار/إخفاء قسم المميزات في صفحة التصنيفات')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
