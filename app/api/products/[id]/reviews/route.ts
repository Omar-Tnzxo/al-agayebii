import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const productId = context.params.id;

    const result = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (result.error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error fetching reviews:', result.error);
      }
      return NextResponse.json({ success: false, error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data || [] });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Request error:', error);
    }
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const productId = context.params.id;
    const body = await request.json();

    const result = await supabase
      .from('reviews')
      .insert({
        product_id: productId,
        reviewer_name: body.reviewer_name,
        rating: body.rating,
        comment: body.comment || null
      })
      .select()
      .single();

    if (result.error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error adding review:', result.error);
      }
      return NextResponse.json({ success: false, error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data }, { status: 201 });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Request error:', error);
    }
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}