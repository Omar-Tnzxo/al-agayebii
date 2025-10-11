/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // إزالة env لأن متغيرات البيئة ستأتي من .env.local
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      }
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // إعداد مهلة زمنية للبناء
  staticPageGenerationTimeout: 180,
  
  // إعداد حد أقصى للاتصالات
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  typescript: {
    // ✅ تفعيل التحقق من أخطاء البناء
    ignoreBuildErrors: false,
  },
  eslint: {
    // ✅ تجاهل أخطاء البناء مؤقتاً
    ignoreDuringBuilds: true,
  },
  modularizeImports: {
    // Cherry-pick only the used icon component instead of importing the whole library
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/#{member}',
    },
  },
  experimental: {
    // إعداد صحيح للـ external packages
    optimizePackageImports: ['lucide-react'],
  },
  // إعداد External packages خارج experimental
  serverExternalPackages: ['@supabase/supabase-js'],
  // إعدادات مخصصة
  env: {
    CUSTOM_KEY: 'custom_value',
  },
  // تحسين webpack للتعامل مع مشاكل الملفات ومشاكل Supabase
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // لا حاجة لتعريف self في بيئة الخادم بعد الآن

    // إزالة جميع polyfills غير الضرورية من client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
      };
    }

    return config;
  },
  // إعدادات الشبكة والمهلة الزمنية
  async rewrites() {
    return [];
  },
  // Headers أمان
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex',
          },
        ],
      },
    ];
  },
  // إعدادات البناء
  poweredByHeader: false,
  compress: true,
};

module.exports = nextConfig; 