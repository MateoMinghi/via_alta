import { NextResponse } from 'next/server';

const API_BASE_URL = 'https://ivd-qa-0dc175b0ba43.herokuapp.com';
const CLIENT_ID = 'payments_app';
const CLIENT_SECRET = 'a_client_secret';

async function getAuthToken(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/m2m/authenticate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to authenticate');
    }

    const data = await response.json();
    return data.token;
}

async function fetchCourses(): Promise<any[]> {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE_URL}/v1/courses/all`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch courses');
    }

    const data = await response.json();
    return data.data;
}

export async function GET() {
    try {
        const courses = await fetchCourses();
        return NextResponse.json({
            success: true,
            data: courses
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
        return NextResponse.json(
            { success: false, error: 'Error fetching courses' },
            { status: 500 }
        );
    }
}