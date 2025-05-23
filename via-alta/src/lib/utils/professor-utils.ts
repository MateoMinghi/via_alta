/**
 * Utility functions for working with professor classes
 */

export interface Subject {
  id: number;
  name: string;
}

/**
 * Parses the professor's classes string and returns an array of subject objects
 * The classes string has the format "SubjectName1,SubjectName2,SubjectName3"
 */
export function parseClassesToSubjects(classes: string = ''): Subject[] {
  if (!classes || typeof classes !== 'string') {
    return [];
  }

  // Split by comma and filter out empty strings
  const classNames = classes
    .split(',')
    .map(c => c.trim())
    .filter(Boolean);

  // Transform to Subject objects with unique IDs
  return classNames.map((name, index) => ({
    id: index + 1, // Use simple numeric IDs for now
    name
  }));
}
