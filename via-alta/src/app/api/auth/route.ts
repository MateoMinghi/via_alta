import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { ivdId } = await request.json();
    
    if (!ivdId) {
      return NextResponse.json({ error: 'ivdId is required' }, { status: 400 });
    }

    // Fetch user data from Via Diseño API
    const response = await fetch(`https://ivd-qa-0dc175b0ba43.herokuapp.com/v1/users/find_one?ivd_id=${ivdId}`);
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to authenticate with Via Diseño API' }, { status: response.status });
    }
    
    const data = await response.json();
    
    if (!data.data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare user data with sensitive information removed
    const userData = {
      id: data.data.id,
      uid: data.data.uid,
      ivd_id: data.data.ivd_id,
      name: data.data.name,
      first_surname: data.data.first_surname,
      second_surname: data.data.second_surname,
      email: data.data.email,
      status: data.data.status,
      type: data.data.type,
      role: data.data.role
    };
    
    // Set the cookie with the user data
    cookies().set({
      name: 'user',
      value: JSON.stringify(userData),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });
    
    // Return user data in response
    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  // Clear the auth cookie
  cookies().delete('user');
  
  return NextResponse.json({ success: true });
}