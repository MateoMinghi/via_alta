import { NextRequest, NextResponse } from 'next/server';
import { User } from './context/AuthContext';

export function middleware(request: NextRequest) {
  // Get the current path
  const path = request.nextUrl.pathname;
  
  // Check if the path is an API route that should be protected
  const isApiRoute = path.startsWith('/api/') && 
                     !path.startsWith('/api/auth') && 
                     path !== '/api/auth/session';  // Allow session check API
  
  // Check if path is a protected client route
  const isProtectedClientRoute = 
    (path.startsWith('/dashboard') || path.startsWith('/estudiante')) &&
    path !== '/dashboard/login';

  // If it's not a protected route, continue
  if (!isApiRoute && !isProtectedClientRoute) {
    return NextResponse.next();
  }

  // Check for user session
  const userSession = request.cookies.get('user')?.value;
  
  if (!userSession) {
    // For API routes, return unauthorized
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // For protected client routes, redirect to login
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    // Parse user data
    const user = JSON.parse(userSession) as User;
    
    // For client routes, check if the user has access to the route
    if (isProtectedClientRoute) {
      if (path.startsWith('/dashboard') && !['admin', 'coordinator'].includes(user.role.name)) {
        return NextResponse.redirect(new URL('/estudiante', request.url));
      }
      
      if (path.startsWith('/estudiante') && user.role.name !== 'student') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    
    // For API routes, check specific permissions
    if (isApiRoute) {
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
    }
    
    // If all checks pass for client routes, allow the request
    return NextResponse.next();
  } catch (error) {
    // Handle parsing errors
    console.error('Session parsing error:', error);
    
    // For API routes, return JSON error
    if (isApiRoute) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    // For client routes, redirect to login
    return NextResponse.redirect(new URL('/', request.url));
  }
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Match all API routes except auth endpoints
    '/api/:path*',
    // Match protected client routes
    '/dashboard/:path*',
    '/estudiante/:path*',
    // Exclude static files and favicon
    '/((?!_next/static|_next/image|favicon.ico|api/auth/session).*)'
  ]
}