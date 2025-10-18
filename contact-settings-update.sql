-- إضافة إعدادات صفحة التواصل الكاملة إلى site_settings
-- تشغيل هذا السكريبت لإضافة جميع إعدادات التواصل الاجتماعي والمعلومات الضرورية

-- حذف الإعدادات القديمة إذا كانت موجودة (اختياري)
-- DELETE FROM site_settings WHERE key LIKE 'contact_%';

-- معلومات الشركة الأساسية
INSERT INTO site_settings (key, value, updated_at)
VALUES
  ('contact_company_name', 'متجر العجايبي', NOW()),
  ('contact_tagline', 'متجرك الموثوق للأدوات الكهربائية والصحية', NOW()),
  ('contact_description', 'نحن نقدم أفضل الأدوات والمعدات بأعلى جودة وأفضل الأسعار', NOW())
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value, updated_at = NOW();

-- معلومات الاتصال
INSERT INTO site_settings (key, value, updated_at)
VALUES
  ('contact_primary_phone', '01234567890', NOW()),
  ('contact_secondary_phone', '', NOW()),
  ('contact_whatsapp', '201234567890', NOW()),
  ('contact_primary_email', 'info@alagayebi.com', NOW()),
  ('contact_sales_email', 'sales@alagayebi.com', NOW()),
  ('contact_support_email', 'support@alagayebi.com', NOW())
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value, updated_at = NOW();

-- العنوان وساعات العمل
INSERT INTO site_settings (key, value, updated_at)
VALUES
  ('contact_full_address', 'الجيزه 6 اكتوبر ابني بيتك المرحلة السادسة', NOW()),
  ('contact_city', '6 أكتوبر', NOW()),
  ('contact_governorate', 'الجيزة', NOW()),
  ('contact_postal_code', '', NOW()),
  ('contact_landmark', 'بجوار مسجد الرحمن', NOW()),
  ('contact_working_days', 'السبت - الخميس', NOW()),
  ('contact_working_hours', '9:00 صباحاً - 9:00 مساءً', NOW()),
  ('contact_weekend_status', 'مغلق يوم الجمعة', NOW())
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value, updated_at = NOW();

-- وسائل التواصل الاجتماعي (جميع المنصات)
INSERT INTO site_settings (key, value, updated_at)
VALUES
  ('contact_facebook_url', 'https://facebook.com/alagayebi', NOW()),
  ('contact_instagram_url', 'https://instagram.com/alagayebi', NOW()),
  ('contact_twitter_url', 'https://twitter.com/alagayebi', NOW()),
  ('contact_linkedin_url', '', NOW()),
  ('contact_youtube_url', 'https://youtube.com/@alagayebi', NOW()),
  ('contact_tiktok_url', 'https://tiktok.com/@alagayebi', NOW()),
  ('contact_snapchat_url', '', NOW()),
  ('contact_telegram_url', '', NOW()),
  ('contact_pinterest_url', '', NOW()),
  ('contact_whatsapp_business_url', '', NOW())
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value, updated_at = NOW();

-- معلومات إضافية
INSERT INTO site_settings (key, value, updated_at)
VALUES
  ('contact_shipping_info', 'التوصيل لجميع أنحاء الجمهورية خلال 2-5 أيام عمل', NOW()),
  ('contact_payment_methods', 'الدفع عند الاستلام - بطاقات الائتمان - المحافظ الإلكترونية', NOW()),
  ('contact_warranty_info', 'ضمان شامل على جميع المنتجات', NOW())
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value, updated_at = NOW();

-- إعدادات الخريطة
INSERT INTO site_settings (key, value, updated_at)
VALUES
  ('contact_google_maps_url', '', NOW()),
  ('contact_map_latitude', '30.0444', NOW()),
  ('contact_map_longitude', '31.2357', NOW()),
  ('contact_show_map', 'false', NOW())
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value, updated_at = NOW();

-- إعدادات النموذج والـ FAQ
INSERT INTO site_settings (key, value, updated_at)
VALUES
  ('contact_enable_form', 'false', NOW()),
  ('contact_form_email', 'contact@alagayebi.com', NOW()),
  ('contact_form_success_message', 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.', NOW()),
  ('contact_form_error_message', 'حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى.', NOW()),
  ('contact_enable_faq', 'false', NOW())
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value, updated_at = NOW();
