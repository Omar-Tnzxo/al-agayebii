import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const adminSession = request.cookies.get('admin_session');
    
    if (!adminSession || !adminSession.value) {
      return NextResponse.json({
        authenticated: false
      });
    }

    // Parse session data
    const sessionParts = adminSession.value.split(':');
    if (sessionParts.length !== 3) {
      return NextResponse.json({
        authenticated: false
      });
    }

    const [adminId, email, role] = sessionParts;

    return NextResponse.json({
      authenticated: true,
      adminUser: {
        id: adminId,
        email: email,
        role: role,
      }
    });
  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json({
      authenticated: false
    });
  }
}
