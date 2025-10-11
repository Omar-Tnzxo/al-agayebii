import { NextRequest, NextResponse } from 'next/server';
import { getShippingSettings, calculateShipping } from '@/lib/store/shipping';

/**
 * POST /api/shipping-cost/calculate
 * حساب تكلفة الشحن بناءً على المبلغ الإجمالي (مبسط)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subtotal = 0 } = body;

    // التحقق من صحة المدخلات
    if (typeof subtotal !== 'number' || subtotal < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'المبلغ الإجمالي غير صحيح'
        },
        { status: 400 }
      );
    }

    // حساب تكلفة الشحن
    const result = await calculateShipping(subtotal);

    // جلب الإعدادات للمعلومات الإضافية
    const settings = await getShippingSettings();

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        company_name: settings.company_name,
        subtotal,
        total: subtotal + result.cost
      },
      message: 'تم حساب تكلفة الشحن بنجاح'
    });

  } catch (error) {
    console.error('خطأ غير متوقع في حساب الشحن:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'خطأ غير متوقع في الخادم'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/shipping-cost/calculate
 * حساب تكلفة الشحن عبر query parameters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subtotal = parseFloat(searchParams.get('subtotal') || '0');

    // استخدام نفس المنطق من POST
    return await POST(new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({ subtotal }),
      headers: { 'Content-Type': 'application/json' }
    }));

  } catch (error) {
    console.error('خطأ في GET حساب الشحن:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'خطأ غير متوقع في الخادم'
      },
      { status: 500 }
    );
  }
}
