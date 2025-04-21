import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import LocalUser from '@/lib/models/local-user';
import { authenticatedRequest } from '@/lib/m2mAuth';

// Import the setup token handler function directly
import { POST as sendSetupToken } from '../auth/send-setup-token/route';

interface ViaDisenioUser {
  id: number;
  uid: string;
  ivd_id: number;
  name: string;
  first_surname: string;
  second_surname: string;
  email: string;
  email_personal?: string;
  status: string;
  type: string;
  semester?: number;
  regular?: boolean;
  role: {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
  };
}

interface ViaDisenioResponse {
  data: ViaDisenioUser;
}

export async function POST(request: NextRequest) {
  try {
    const { ivdId, password } = await request.json();
    
    if (!ivdId) {
      return NextResponse.json({ error: 'ivdId is required' }, { status: 400 });
    }

    // Check if user has set a password in our system
    const localUser = await LocalUser.findByIvdId(ivdId);
    const isFirstTimeUser = !localUser;
    
    // If user has set a password, verify it
    if (localUser) {
      const passwordValid = password ? await LocalUser.verifyPassword(ivdId, password) : false;
      
      if (!passwordValid) {
        return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
      }
    } else if (!localUser && password) {
      // If we have no local user but they provided a password, it's incorrect
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    // Fetch user data from Via Diseño API using M2M authentication
    try {
      // Use the authenticatedRequest utility to make secure API calls
      const userData = await authenticatedRequest<ViaDisenioResponse>(
        `/v1/users/find_one?ivd_id=${ivdId}`
      );
      
      if (!userData.data) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const host = request.headers.get('host');
      // For first-time users without a password, trigger a setup token email instead of direct redirect
      if (isFirstTimeUser) {
        // Create setup token by directly calling the function instead of making an HTTP request
        try {
          // Create a new request object to pass to the setup token handler
          const setupTokenRequest = new NextRequest(`https://${host}/api/auth/send-setup-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ivd_id: userData.data.ivd_id.toString(),
              email: userData.data.email,
              name: `${userData.data.name} ${userData.data.first_surname}`
            })
          });
          
          // Call the setup token handler function directly
          const setupTokenResponse = await sendSetupToken(setupTokenRequest);
          
          if (!setupTokenResponse.ok) {
            const setupTokenData = await setupTokenResponse.json();
            throw new Error(setupTokenData.error || 'Failed to create setup token');
          }
          
          const setupTokenData = await setupTokenResponse.json();
          
          // Return a response indicating that the user needs to check their email
          return NextResponse.json({
            first_time_login: true,
            email_sent: true,
            user: {
              ivd_id: userData.data.ivd_id,
              email: userData.data.email,
              name: `${userData.data.name} ${userData.data.first_surname}`,
            },
            message: setupTokenData.message || 'Se ha enviado un enlace para configurar tu contraseña al correo electrónico institucional.'
          });
        } catch (tokenError) {
          console.error('Error creating setup token:', tokenError);
          return NextResponse.json({ error: 'Error creating setup token' }, { status: 500 });
        }
      }

      // Check if the student is regular or irregular
      let isRegularStudent = true; // Default to regular
      if (userData.data.role.name === 'student') {
        // Check if the API provides the regular status directly
        if (userData.data.regular !== undefined) {
          isRegularStudent = !!userData.data.regular;
        } else {
          // If not provided directly, make an additional API call to determine status
          try {
            const studentDetails = await authenticatedRequest<any>(
              `/v1/users/${userData.data.id}/details`
            );
            if (studentDetails && studentDetails.data) {
              isRegularStudent = !(studentDetails.data.irregular || false);
            }
          } catch (detailsError) {
            console.warn('Failed to fetch detailed student info, assuming regular student:', detailsError);
          }
        }
      }

      // Prepare user data with sensitive information removed
      const userInfo = {
        id: userData.data.id,
        uid: userData.data.uid,
        ivd_id: userData.data.ivd_id,
        name: userData.data.name,
        first_surname: userData.data.first_surname,
        second_surname: userData.data.second_surname,
        email: userData.data.email,
        status: userData.data.status,
        type: userData.data.type,
        role: userData.data.role,
        has_password: !!localUser,
        semester: userData.data.semester,
        regular: isRegularStudent // Add the regular/irregular status
      };
      
      // Create a response object
      const response = NextResponse.json({ user: userInfo });
      
      // Set the cookie in the response object - with more secure settings and explicit expiration
      const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
      const expiryDate = new Date(Date.now() + oneWeekInMs);
      
      response.cookies.set({
        name: 'user',
        value: JSON.stringify(userInfo),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        expires: expiryDate, // Explicitly set expiration date
        path: '/',
        sameSite: 'lax', // Add sameSite for additional security
      });
      
      // Return the response with the cookie
      return response;
      
    } catch (apiError) {
      console.error('Error fetching user from Via Diseño API:', apiError);
      return NextResponse.json({ 
        error: 'Failed to authenticate with Via Diseño API' 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  // Create a response object
  const response = NextResponse.json({ success: true });
  
  // Clear the auth cookie using the response object
  response.cookies.delete('user');
  
  return response;
}