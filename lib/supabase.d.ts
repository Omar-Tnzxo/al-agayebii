// هذا ملف وهمي لتعريف أنواع البيانات المفقودة بعد إزالة Supabase
// يستخدم لتجنب أخطاء TypeScript في الملفات التي قد تحاول استيراد هذه الوحدة

declare module '@/lib/supabase' {
  // تعريف عميل Supabase الوهمي
  export const supabase: {
    auth: {
      signInWithPassword: (credentials: {
        email: string;
        password: string;
      }) => Promise<{
        data: { session: any; user: any } | null;
        error: { message: string } | null;
      }>;
      signUp: (credentials: {
        email: string;
        password: string;
      }) => Promise<{
        data: { user: any } | null;
        error: { message: string } | null;
      }>;
      getSession: () => Promise<{
        data: { session: any | null };
        error: { message: string } | null;
      }>;
      setSession: (session: any) => Promise<{
        error: { message: string } | null;
      }>;
    };
    from: (table: string) => {
      select: (query?: string) => {
        eq: (column: string, value: any) => Promise<{
          data: any[] | null;
          error: { message: string } | null;
        }>;
      };
      insert: (data: any) => {
        select: () => Promise<{
          data: any[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  };

  // وظيفة فحص إذا كان المستخدم مشرف
  export const isAdmin: () => Promise<boolean>;
} 