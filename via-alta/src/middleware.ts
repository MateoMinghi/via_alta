import { NextRequest, NextResponse } from 'next/server';
import { User } from './context/AuthContext';

export function middleware(request: NextRequest) {
  // Get the current path
  const path = request.nextUrl.pathname;
  
  // Check if the path is an API route and should be protected
  const isApiRoute = path.startsWith('/api/') && !path.startsWith('/api/auth');
  
  // If it's not a protected API route, continue
  if (!isApiRoute) {
    return NextResponse.next();
  }

  // Check for user session
  const userSession = request.cookies.get('user')?.value;
  
  if (!userSession) {
    // Return unauthorized if no session exists
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Parse user data
    const user = JSON.parse(userSession) as User;
    
    // Check user roles for specific route access
    if (path.startsWith('/api/admin') && user.role.name !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    if (path.startsWith('/api/coordinador') && !['admin', 'coordinator'].includes(user.role.name)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    if (path.startsWith('/api/estudiante') && user.role.name !== 'student' && !['admin', 'coordinator'].includes(user.role.name)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Attach user info to the request headers for later use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.ivd_id.toString());
    requestHeaders.set('x-user-role', user.role.name);
    
    // Continue with modified request
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
  } catch (error) {
    // Handle parsing errors
    console.error('Session parsing error:', error);
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Match all API routes except auth endpoints
    '/api/:path*',
    // Exclude auth endpoints
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)'
  ]
}