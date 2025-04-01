export type Professor = {
    id: number;
    name: string;
    department: string;
    classes?: string;
};

// API configuration
const API_BASE_URL = 'https://ivd-qa-0dc175b0ba43.herokuapp.com';
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
        const professorsData = Array.isArray(data) 
            ? data 
            : data.data || data.professors || data.results || [];
        
        // Transform the API data to match our expected Professor type
        const formattedProfessors = professorsData.map((professor: any) => ({
            id: professor.id || 0,
            name: `${professor.title || ''} ${professor.first_name || ''} ${professor.last_name || ''}`.trim(),
            department: professor.department || 'General',
        }));

        // After getting professors from external API, sync with our database
        try {
            const dbResponse = await fetch('/api/professors');
            const dbData = await dbResponse.json();
            if (dbData.success) {
                // Merge data from external API with database data
                result = formattedProfessors.map((prof: Professor) => {
                    const dbProf = dbData.data.find((p: any) => p.IdProfesor === prof.id.toString());
                    return {
                        ...prof,
                        classes: dbProf?.Clases || ''
                    };
                });
            }
        } catch (dbError) {
            console.error("Error fetching from local database:", dbError);
            result = formattedProfessors;
        }
        
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
        
        // Try to fetch from local database as fallback
        try {
            const dbResponse = await fetch('/api/professors');
            const dbData = await dbResponse.json();
            if (dbData.success) {
                result = dbData.data.map((prof: any) => ({
                    id: parseInt(prof.IdProfesor),
                    name: prof.Nombre,
                    department: 'General',
                    classes: prof.Clases || ''
                }));
                if (result && result.length > 0) {
                    error = ""; // Clear error if we got data from database
                }
            }
        } catch (dbError) {
            console.error("Error fetching from local database:", dbError);
            result = [];
        }
    } finally {
        loading = false;
    }

    return { loading, result, error };
}

export async function updateProfessorClasses(
    professorId: number, 
    classes: string
): Promise<boolean> {
    try {
        const response = await fetch('/api/professors', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                professorId,
                classes
            }),
        });

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error("Error updating professor classes:", error);
        return false;
    }
}

export async function getProfessorsFromDatabase(): Promise<Professor[]> {
    try {
        const response = await fetch('/api/professors');
        const data = await response.json();
        if (data.success) {
            return data.data.map((prof: any) => ({
                id: parseInt(prof.IdProfesor),
                name: prof.Nombre,
                department: 'General',
                classes: prof.Clases || ''
            }));
        }
        throw new Error(data.error || 'Error fetching professors from database');
    } catch (error) {
        console.error("Error getting professors from database:", error);
        return [];
    }
}