import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

interface UserRole {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface UserSession {
  id: number;
  uid: string;
  ivd_id: number;
  name: string;
  first_surname: string;
  second_surname: string;
  email: string;
  role: UserRole;
  [key: string]: any;
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('user');
  
  if (!userCookie?.value) {
    return null;
  }

  try {
    return JSON.parse(userCookie.value) as UserSession;
  } catch (error) {
    console.error('Failed to parse user session:', error);
    return null;
  }
}

export function getUserFromRequest(req: NextRequest): UserSession | null {
  const userId = req.headers.get('x-user-id');
  const userRole = req.headers.get('x-user-role');

  if (!userId || !userRole) {
    return null;
  }

  // This is just the basic info extracted from headers
  // In a real scenario, you might want to fetch the full user details
  return {
    ivd_id: Number(userId),
    role: {
      name: userRole,
    } as UserRole,
  } as UserSession;
}

export async function isAuthorized(allowedRoles: string[]): Promise<boolean> {
  const session = await getSession();
  
  if (!session) {
    return false;
  }
  
  return allowedRoles.includes(session.role.name);
}

export async function getUserId(): Promise<number | null> {
  const session = await getSession();
  return session?.ivd_id || null;
}

export async function getUserRole(): Promise<string | null> {
  const session = await getSession();
  return session?.role?.name || null;
}