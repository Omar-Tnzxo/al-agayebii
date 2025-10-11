/**
 * Script لإنشاء مدير جديد في جدول admin_users
 * 
 * تشغيل: node create-admin.js
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// محاولة قراءة متغيرات البيئة من ملفات مختلفة
function loadEnvVars() {
  const envFiles = ['.env.local', '.env'];
  
  for (const file of envFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`🔍 قراءة متغيرات البيئة من: ${file}`);
      try {
        require('dotenv').config({ path: filePath });
        break;
      } catch (error) {
        console.log(`⚠️ خطأ في قراءة ${file}:`, error.message);
      }
    }
  }
}

loadEnvVars();

async function createAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('🔧 فحص متغيرات البيئة:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ موجود' : '❌ مفقود');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ موجود' : '❌ مفقود');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ موجود' : '❌ مفقود');
  
  if (!supabaseUrl) {
    console.error('\n❌ NEXT_PUBLIC_SUPABASE_URL مفقود!');
    process.exit(1);
  }
  
  // استخدم service key أولاً، ثم anon key كـ fallback
  const apiKey = supabaseServiceKey || supabaseAnonKey;
  
  if (!apiKey) {
    console.error('\n❌ لا يوجد API key صالح!');
    console.log('\nتأكد من وجود أحد هذين المتغيرين:');
    console.log('   SUPABASE_SERVICE_ROLE_KEY (مفضل)');
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY (بديل)');
    process.exit(1);
  }
  
  console.log(`🔑 استخدام ${supabaseServiceKey ? 'Service Role Key' : 'Anon Key'}`);
  
  const supabase = createClient(supabaseUrl, apiKey);
  
  // اختبار الاتصال أولاً
  console.log('\n🔗 اختبار الاتصال بقاعدة البيانات...');
  try {
    const { data, error } = await supabase.from('admin_users').select('count').limit(1);
    if (error) {
      console.error('❌ خطأ في الاتصال:', error.message);
      
      if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
        console.log('\n💡 نصائح لحل المشكلة:');
        console.log('1. تحقق من صحة SUPABASE_SERVICE_ROLE_KEY');
        console.log('2. تأكد من أن المفتاح لم تنته صلاحيته');
        console.log('3. تحقق من إعدادات Supabase في لوحة التحكم');
      }
      
      process.exit(1);
    }
    console.log('✅ تم الاتصال بنجاح');
  } catch (error) {
    console.error('❌ فشل الاتصال:', error.message);
    process.exit(1);
  }
  
  // بيانات المديرين التجريبيين
  const admins = [
    {
      email: 'admin@alagayebi.com',
      password: 'admin123',
      role: 'admin',
      phone: '+201234567890'
    },
    {
      email: 'omar@admin.com',
      password: '12345678',
      role: 'admin',
      phone: '+201234567891'
    }
  ];
  
  for (const admin of admins) {
    try {
      console.log(`\n📝 إنشاء مدير: ${admin.email}`);
      
      // التحقق إذا كان المدير موجود بالفعل
      const { data: existingAdmin } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', admin.email)
        .single();
      
      if (existingAdmin) {
        console.log(`⚠️  المدير ${admin.email} موجود بالفعل`);
        continue;
      }
      
      // تشفير كلمة المرور
      console.log('🔐 تشفير كلمة المرور...');
      const passwordHash = await bcrypt.hash(admin.password, 12);
      
      // إدراج المدير الجديد
      const { data, error } = await supabase
        .from('admin_users')
        .insert({
          email: admin.email,
          password_hash: passwordHash,
          role: admin.role,
          phone: admin.phone,
          is_active: true
        })
        .select()
        .single();
      
      if (error) {
        console.error(`❌ خطأ في إنشاء ${admin.email}:`, error.message);
      } else {
        console.log(`✅ تم إنشاء المدير ${admin.email} بنجاح`);
        console.log(`   🆔 ID: ${data.id}`);
        console.log(`   🔑 كلمة المرور: ${admin.password}`);
      }
      
    } catch (error) {
      console.error(`❌ خطأ في إنشاء ${admin.email}:`, error.message);
    }
  }
  
  console.log('\n📋 ملخص بيانات الدخول:');
  console.log('┌─────────────────────────┬─────────────┐');
  console.log('│ الإيميل                 │ كلمة المرور │');
  console.log('├─────────────────────────┼─────────────┤');
  console.log('│ admin@alagayebi.com     │ admin123    │');
  console.log('│ omar@admin.com          │ 12345678    │');
  console.log('└─────────────────────────┴─────────────┘');
  
  console.log('\n🌐 صفحة تسجيل الدخول: http://localhost:3000/admin');
}

createAdmin()
  .then(() => {
    console.log('\n🎉 تم الانتهاء من إنشاء المديرين');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ خطأ عام:', error);
    process.exit(1);
  });