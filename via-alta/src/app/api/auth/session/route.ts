import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authenticatedRequest } from '@/lib/m2mAuth';

/**
 * Session validation endpoint
 * Checks if the user's session cookie is valid and returns the user data
 */
export async function GET(request: NextRequest) {
  try {
    // Get the user cookie
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('user');
    
    if (!userCookie?.value) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Parse the user data from the cookie
    const user = JSON.parse(userCookie.value);
    
    if (!user?.ivd_id) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    // Optionally validate with the IVD API to ensure the user still exists
    try {
      const response = await authenticatedRequest<{ data: any }>(
        `/v1/users/find_one?ivd_id=${user.ivd_id}`
      );
      
      if (!response.data) {
        // If the user no longer exists in the IVD system, clear the cookie
        const responseWithClearedCookie = NextResponse.json({ user: null }, { status: 401 });
        responseWithClearedCookie.cookies.delete('user');
        return responseWithClearedCookie;
      }
      
      // User is valid, return the user data from the cookie
      return NextResponse.json({ user });
    } catch (error) {
      // If API validation fails, still return the user from the cookie
      // This helps maintain sessions even if the external API is temporarily unavailable
      console.warn('Unable to validate user with IVD API, returning cookie data:', error);
      return NextResponse.json({ user });
    }
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}