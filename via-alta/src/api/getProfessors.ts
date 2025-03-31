export type Professor = {
    id: number;
    name: string;
    department: string;
};

// API configuration
const API_BASE_URL = 'https://ivd-qa-0dc175b0ba43.herokuapp.com';
// Using the new credentials that were working in the hook example
const CLIENT_ID = 'enrollments_app';
const CLIENT_SECRET = 'VgwMa3qPS85rrtDHt72mhKejQfTQnNth';

// Function to get authentication token
async function getAuthToken(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/m2m/authenticate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
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

export async function getProfessors(): Promise<{ loading: boolean; result: Professor[] | null; error: string }> {
    let result: Professor[] | null = null;
    let loading = true;
    let error = "";

    try {
        // Get auth token first
        const token = await getAuthToken();

        // Use the token for the professors API call
        const response = await fetch(`${API_BASE_URL}/v1/users/all?type=Users::Professor`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch professors: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        // More flexible handling of API response format
        // This tries to extract an array of professors from various possible structures
        // Including the empty object case we've been seeing
        const professorsData = Array.isArray(data) 
            ? data 
            : data.data || data.professors || data.results || [];
        
        // Transform the API data to match our expected Professor type
        const formattedProfessors = professorsData.map((professor: any) => ({
            id: professor.id || 0,
            name: `${professor.title || ''} ${professor.first_name || ''} ${professor.last_name || ''}`.trim(),
            department: professor.department || 'General',
        }));

        result = formattedProfessors;
        
        // Add helpful logging
        console.log(`Found ${formattedProfessors.length} professors`);
        
        // Set appropriate error if no professors found
        if (formattedProfessors.length === 0) {
            console.warn("No professors found in the system");
            error = "No professors found in the system. Please contact an administrator.";
        }

    } catch (caughtError: any) {
        error = caughtError.message;
        console.error("Error fetching professors:", caughtError);
        result = []; // Set to empty array on error
    } finally {
        loading = false;
    }

    return { loading, result, error };
}