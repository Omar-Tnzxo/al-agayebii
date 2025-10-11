import { logger } from '@/lib/utils/logger';
import { sanitizeInput } from '@/lib/security/encryption';

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  jsonLd?: any;
  robots?: string;
  alternateLinks?: { hreflang: string; href: string }[];
}

export interface ProductSEO {
  name: string;
  description: string;
  price: number;
  currency: string;
  availability: 'InStock' | 'OutOfStock' | 'PreOrder';
  brand: string;
  category: string;
  images: string[];
  rating?: number;
  reviewCount?: number;
  sku?: string;
  gtin?: string;
}

export interface CategorySEO {
  name: string;
  description: string;
  products: ProductSEO[];
  totalProducts: number;
}

class SEOOptimizer {
  private static instance: SEOOptimizer;
  private siteConfig = {
    siteName: 'متجر العجايبي',
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://al-agayebi.com',
    defaultImage: '/images/og-default.jpg',
    logoUrl: process.env.NEXT_PUBLIC_LOGO_URL || '/logo.png',
    twitterHandle: '@alagayebi',
    language: 'ar',
    direction: 'rtl',
    charset: 'UTF-8'
  };

  private constructor() {}

  public static getInstance(): SEOOptimizer {
    if (!SEOOptimizer.instance) {
      SEOOptimizer.instance = new SEOOptimizer();
    }
    return SEOOptimizer.instance;
  }

  /**
   * إنشاء metadata للصفحة الرئيسية
   */
  generateHomepageSEO(): SEOMetadata {
    const title = 'متجر العجايبي - أدوات ومعدات عالية الجودة | أدوات كهربائية وصحية';
    const description = 'اكتشف مجموعة واسعة من الأدوات الكهربائية والصحية وأدوات العمل عالية الجودة في متجر العجايبي. أسعار تنافسية وجودة مضمونة مع خدمة توصيل سريع في جميع أنحاء المملكة.';
    
    return {
      title,
      description,
      keywords: [
        'أدوات كهربائية',
        'أدوات صحية',
        'معدات العمل',
        'أدوات البناء',
        'العجايبي',
        'متجر أدوات',
        'السعودية',
        'جودة عالية',
        'أسعار تنافسية'
      ],
      canonical: this.siteConfig.siteUrl,
      ogTitle: title,
      ogDescription: description,
      ogImage: `${this.siteConfig.siteUrl}${this.siteConfig.defaultImage}`,
      ogType: 'website',
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: `${this.siteConfig.siteUrl}${this.siteConfig.defaultImage}`,
      jsonLd: this.generateOrganizationSchema(),
      robots: 'index, follow'
    };
  }

  /**
   * إنشاء metadata لصفحة المنتج
   */
  generateProductSEO(product: ProductSEO): SEOMetadata {
    const title = `${product.name} - ${product.brand} | متجر العجايبي`;
    const description = `اشتري ${product.name} من ${product.brand} بأفضل سعر ${product.price} ${product.currency}. ${product.description.substring(0, 100)}...`;
    
    const keywords = [
      product.name,
      product.brand,
      product.category,
      'أدوات',
      'العجايبي',
      'جودة عالية',
      product.availability === 'InStock' ? 'متوفر' : 'غير متوفر'
    ];

    return {
      title,
      description: sanitizeInput(description),
      keywords,
      canonical: `${this.siteConfig.siteUrl}/products/${product.sku}`,
      ogTitle: title,
      ogDescription: description,
      ogImage: product.images[0] || this.siteConfig.defaultImage,
      ogType: 'product',
      twitterCard: 'summary_large_image',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: product.images[0] || this.siteConfig.defaultImage,
      jsonLd: this.generateProductSchema(product),
      robots: product.availability === 'InStock' ? 'index, follow' : 'index, nofollow'
    };
  }

  /**
   * إنشاء metadata لصفحة التصنيف
   */
  generateCategorySEO(category: CategorySEO): SEOMetadata {
    const title = `${category.name} - مجموعة من ${category.totalProducts} منتج | متجر العجايبي`;
    const description = `تسوق من مجموعة ${category.name} في متجر العجايبي. ${category.totalProducts} منتج عالي الجودة بأسعار تنافسية. ${category.description}`;
    
    const keywords = [
      category.name,
      'أدوات',
      'العجايبي',
      'تسوق',
      'جودة عالية',
      'أسعار تنافسية',
      ...category.products.slice(0, 5).map(p => p.name)
    ];

    return {
      title,
      description: sanitizeInput(description),
      keywords,
      canonical: `${this.siteConfig.siteUrl}/categories/${encodeURIComponent(category.name)}`,
      ogTitle: title,
      ogDescription: description,
      ogImage: category.products[0]?.images[0] || this.siteConfig.defaultImage,
      ogType: 'website',
      twitterCard: 'summary',
      twitterTitle: title,
      twitterDescription: description,
      twitterImage: category.products[0]?.images[0] || this.siteConfig.defaultImage,
      jsonLd: this.generateCategorySchema(category),
      robots: 'index, follow'
    };
  }

  /**
   * إنشاء Schema.org للمنظمة
   */
  private generateOrganizationSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: this.siteConfig.siteName,
      url: this.siteConfig.siteUrl,
      logo: this.siteConfig.logoUrl.startsWith('http') ? this.siteConfig.logoUrl : `${this.siteConfig.siteUrl}${this.siteConfig.logoUrl}`,
      description: 'متجر العجايبي للأدوات والمعدات عالية الجودة',
      sameAs: [
        'https://twitter.com/alagayebi',
        'https://facebook.com/alagayebi',
        'https://instagram.com/alagayebi'
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+966-XX-XXX-XXXX',
        contactType: 'Customer Service',
        availableLanguage: 'Arabic'
      },
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'SA',
        addressLocality: 'الرياض'
      }
    };
  }

  /**
   * إنشاء Schema.org للمنتج
   */
  private generateProductSchema(product: ProductSEO) {
    const schema: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.images,
      brand: {
        '@type': 'Brand',
        name: product.brand
      },
      category: product.category,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: product.currency,
        availability: `https://schema.org/${product.availability}`,
        seller: {
          '@type': 'Organization',
          name: this.siteConfig.siteName
        }
      }
    };

    // إضافة معلومات التقييم إذا وجدت
    if (product.rating && product.reviewCount) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
        bestRating: 5,
        worstRating: 1
      };
    }

    // إضافة معرفات المنتج
    if (product.sku) {
      schema.sku = product.sku;
    }
    if (product.gtin) {
      schema.gtin = product.gtin;
    }

    return schema;
  }

  /**
   * إنشاء Schema.org للتصنيف
   */
  private generateCategorySchema(category: CategorySEO) {
    return {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: category.name,
      description: category.description,
      numberOfItems: category.totalProducts,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: category.products.length,
        itemListElement: category.products.map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            name: product.name,
            image: product.images[0],
            offers: {
              '@type': 'Offer',
              price: product.price,
              priceCurrency: product.currency,
              availability: `https://schema.org/${product.availability}`
            }
          }
        }))
      }
    };
  }

  /**
   * إنشاء Sitemap XML
   */
  generateSitemap(urls: Array<{
    url: string;
    lastmod?: string;
    changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: number;
  }>): string {
    const sitemapHeader = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    const sitemapFooter = '</urlset>';
    
    const urlElements = urls.map(({ url, lastmod, changefreq, priority }) => {
      const loc = `<loc>${this.siteConfig.siteUrl}${url}</loc>`;
      const lastmodEl = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
      const changefreqEl = changefreq ? `<changefreq>${changefreq}</changefreq>` : '';
      const priorityEl = priority ? `<priority>${priority}</priority>` : '';
      
      return `<url>${loc}${lastmodEl}${changefreqEl}${priorityEl}</url>`;
    }).join('\n');

    return `${sitemapHeader}\n${urlElements}\n${sitemapFooter}`;
  }

  /**
   * إنشاء robots.txt
   */
  generateRobotsTxt(): string {
    return `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${this.siteConfig.siteUrl}/sitemap.xml

# Disallow admin pages
Disallow: /admin/
Disallow: /api/
Disallow: /login
Disallow: /register

# Allow important pages
Allow: /products/
Allow: /categories/
Allow: /about
Allow: /contact`;
  }

  /**
   * إنشاء Breadcrumb Schema
   */
  generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: `${this.siteConfig.siteUrl}${crumb.url}`
      }))
    };
  }

  /**
   * تحسين النص للـ SEO
   */
  optimizeContent(text: string, targetKeywords: string[]): {
    optimizedText: string;
    keywordDensity: number;
    suggestions: string[];
  } {
    const words = text.toLowerCase().split(/\s+/);
    const totalWords = words.length;
    
    let keywordCount = 0;
    const suggestions: string[] = [];
    
    // حساب كثافة الكلمات المفتاحية
    targetKeywords.forEach(keyword => {
      const keywordWords = keyword.toLowerCase().split(/\s+/);
      const occurrences = this.countKeywordOccurrences(text.toLowerCase(), keyword.toLowerCase());
      keywordCount += occurrences;
    });

    const keywordDensity = (keywordCount / totalWords) * 100;
    
    // اقتراحات للتحسين
    if (keywordDensity < 1) {
      suggestions.push('كثافة الكلمات المفتاحية منخفضة. حاول إضافة المزيد من الكلمات المفتاحية بشكل طبيعي.');
    } else if (keywordDensity > 3) {
      suggestions.push('كثافة الكلمات المفتاحية عالية. قلل من استخدام الكلمات المفتاحية لتجنب العقوبات.');
    }

    if (totalWords < 150) {
      suggestions.push('النص قصير جداً. حاول إضافة المزيد من المحتوى المفيد.');
    }

    return {
      optimizedText: text,
      keywordDensity: Math.round(keywordDensity * 100) / 100,
      suggestions
    };
  }

  /**
   * عد تكرارات الكلمة المفتاحية
   */
  private countKeywordOccurrences(text: string, keyword: string): number {
    const regex = new RegExp(keyword, 'gi');
    const matches = text.match(regex);
    return matches ? matches.length : 0;
  }

  /**
   * تحديد الأولوية للصفحات
   */
  getPagePriority(pageType: 'home' | 'category' | 'product' | 'blog' | 'other'): number {
    switch (pageType) {
      case 'home': return 1.0;
      case 'category': return 0.8;
      case 'product': return 0.6;
      case 'blog': return 0.5;
      default: return 0.3;
    }
  }

  /**
   * تسجيل إحصائيات SEO
   */
  logSEOMetrics(pageUrl: string, metadata: SEOMetadata): void {
    logger.info('🔍 SEO metadata generated', {
      url: pageUrl,
      titleLength: metadata.title.length,
      descriptionLength: metadata.description.length,
      keywordCount: metadata.keywords.length,
      hasJsonLd: !!metadata.jsonLd,
      hasOgImage: !!metadata.ogImage
    });

    // تحذيرات SEO
    if (metadata.title.length > 60) {
      logger.warn('⚠️ SEO Warning: Title too long', { url: pageUrl, length: metadata.title.length });
    }
    
    if (metadata.description.length > 160) {
      logger.warn('⚠️ SEO Warning: Description too long', { url: pageUrl, length: metadata.description.length });
    }
    
    if (metadata.keywords.length < 3) {
      logger.warn('⚠️ SEO Warning: Too few keywords', { url: pageUrl, count: metadata.keywords.length });
    }
  }
}

// مثيل وحيد من محسن SEO
export const seoOptimizer = SEOOptimizer.getInstance();

// دوال مساعدة
export const generateHomepageSEO = () => seoOptimizer.generateHomepageSEO();
export const generateProductSEO = (product: ProductSEO) => seoOptimizer.generateProductSEO(product);
export const generateCategorySEO = (category: CategorySEO) => seoOptimizer.generateCategorySEO(category);
export const generateSitemap = (urls: any[]) => seoOptimizer.generateSitemap(urls);
export const generateRobotsTxt = () => seoOptimizer.generateRobotsTxt(); 