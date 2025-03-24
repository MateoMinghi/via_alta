import { useState, useEffect } from "react";

type Subject = {
    id: number;
    title: string;
    professor: string;
    credits: number;
    salon: string;
    semester: number;
    hours: { day: string; time: string }[];
};

const GENERAL_SCHEDULE_KEY = 'via-alta-schedule';

export function useGetSubjects() {
    const [result, setResult] = useState<Subject[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        try {
            // Get data from general schedule storage
            const savedSchedule = localStorage.getItem(GENERAL_SCHEDULE_KEY);
            if (savedSchedule) {
                const generalSchedule = JSON.parse(savedSchedule);
                
                // Create a map to group classes by their unique identifiers
                const subjectMap = new Map();
                
                generalSchedule.forEach((item: any) => {
                    // Create a unique key for each subject
                    const key = `${item.subject}-${item.teacher}-${item.semester}`;
                    
                    if (!subjectMap.has(key)) {
                        // Create new subject entry
                        subjectMap.set(key, {
                            id: Math.random(), // Generate temporary id
                            title: item.subject,
                            professor: item.teacher,
                            credits: item.credits || 0,
                            salon: item.classroom,
                            semester: item.semester,
                            hours: [{
                                day: item.day,
                                time: item.time
                            }]
                        });
                    } else {
                        // Add new hour to existing subject
                        const subject = subjectMap.get(key);
                        subject.hours.push({
                            day: item.day,
                            time: item.time
                        });
                    }
                });
                
                // Convert map to array
                const subjects: Subject[] = Array.from(subjectMap.values());
                setResult(subjects);
            } else {
                setResult([]);
            }
            setLoading(false);
        } catch (err: any) {
            console.error('Error loading subjects:', err);
            setError(err?.message || 'An error occurred');
            setLoading(false);
        }
    }, []);

    return { result, loading, error };
}