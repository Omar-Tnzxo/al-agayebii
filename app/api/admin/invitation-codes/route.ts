import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - List all invitation codes
export async function GET(request: NextRequest) {
  try {
    const { data: codes, error } = await supabase
      .from('invitation_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitation codes:', error);
      return NextResponse.json(
        { success: false, error: 'فشل في جلب أكواد الدعوة' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      codes: codes || [],
    });
  } catch (error: any) {
    console.error('Error in GET invitation codes:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

// POST - Create new invitation code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { max_uses = 1, expires_in_days = 7 } = body;

    const code = Math.floor(10000000 + Math.random() * 90000000).toString();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expires_in_days);

    const { data, error } = await supabase
      .from('invitation_codes')
      .insert({
        code,
        max_uses,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation code:', error);
      return NextResponse.json(
        { success: false, error: 'فشل في إنشاء كود الدعوة' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      code: data,
      message: 'تم إنشاء كود الدعوة بنجاح',
    });
  } catch (error: any) {
    console.error('Error in POST invitation code:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

// DELETE - Delete invitation code
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const codeId = searchParams.get('id');

    if (!codeId) {
      return NextResponse.json(
        { success: false, error: 'معرف الكود مطلوب' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('invitation_codes')
      .delete()
      .eq('id', codeId);

    if (error) {
      console.error('Error deleting invitation code:', error);
      return NextResponse.json(
        { success: false, error: 'فشل في حذف كود الدعوة' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف كود الدعوة بنجاح',
    });
  } catch (error: any) {
    console.error('Error in DELETE invitation code:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}

// PATCH - Toggle code activation
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'معرف الكود مطلوب' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('invitation_codes')
      .update({ is_active })
      .eq('id', id);

    if (error) {
      console.error('Error updating invitation code:', error);
      return NextResponse.json(
        { success: false, error: 'فشل في تحديث كود الدعوة' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: is_active ? 'تم تفعيل الكود بنجاح' : 'تم تعطيل الكود بنجاح',
    });
  } catch (error: any) {
    console.error('Error in PATCH invitation code:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}
