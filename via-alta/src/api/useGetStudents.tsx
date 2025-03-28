import { useState, useEffect } from "react";

export type Student = {
    id: string;
    name: string;
    first_name: string;
    first_surname: string;
    second_surname: string;
    ivd_id: string;
    semestre: string;
    status: string;
    comentario: string;
    isIrregular: boolean;
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

export function useGetStudents() {
    const [result, setResult] = useState<Student[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        setLoading(true);
        
        const fetchStudents = async () => {
            try {
                // Get auth token first
                const token = await getAuthToken();
                
                // Use the token for the students API call
                const response = await fetch(`${API_BASE_URL}/v1/users/all?type=Users::Student`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch students');
                }
                
                const data = await response.json();
                
                // Log the first student to see the actual structure
                if (Array.isArray(data) && data.length > 0) {
                    console.log('Complete first student data:', JSON.stringify(data[0], null, 2));
                }
                
                // Transform the API data to match our expected Student type
                const studentsArray = Array.isArray(data) ? data : 
                                     (data.data && Array.isArray(data.data) ? data.data : []);
                
                const formattedStudents = studentsArray.map((student: any) => {
                    // For debugging - log all available name fields for the first few students
                    if (studentsArray.indexOf(student) < 3) {
                        console.log(`Student ${student.id} name fields:`, {
                            name: student.name,
                            first_name: student.first_name,
                            last_name: student.last_name,
                            surname: student.surname,
                            maternal_surname: student.maternal_surname,
                            paternal_surname: student.paternal_surname,
                            data: student
                        });
                    }
                    
                    // Use all possible field combinations to ensure we get both parts
                    const firstName = student.first_name || student.name || '';
                    const lastName = student.last_name || student.surname || 
                                    student.paternal_surname || student.first_surname || '';
                    
                    return {
                        id: student.id?.toString() || '',
                        // Store separate name components
                        name: student.name || '',
                        first_name: firstName,
                        first_surname: lastName,
                        second_surname: student.second_surname || student.maternal_surname || '',
                        // Store combined name for display
                        ivd_id: student.ivd_id || student.student_id || '',
                        semestre: student.semester?.toString() || 'N/A',
                        status: student.status || 'no-inscrito',
                        comentario: student.comment || '',
                        isIrregular: student.irregular || false,
                    };
                });
                
                setResult(formattedStudents);
            } catch (error: any) {
                setError(error.message);
                console.error("Error fetching students:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    return { loading, result, error };
}

// Group students by semester
export function groupStudentsBySemester(students: Student[] | null) {
    if (!students) return {};
    
    return students.reduce((acc: Record<string, Student[]>, student) => {
        const semester = student.semestre;
        
        if (!acc[semester]) {
            acc[semester] = [];
        }
        
        acc[semester].push(student);
        return acc;
    }, {});
}