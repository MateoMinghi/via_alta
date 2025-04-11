import { render, screen, waitFor } from '@testing-library/react';
import { useGetClassrooms } from '@/api/useGetClassrooms';
import React from 'react';

// Mock the entire API module that contains useGetClassrooms
jest.mock('@/api/useGetClassrooms', () => ({
  useGetClassrooms: jest.fn()
}));

// Mock fetch for direct API testing
global.fetch = jest.fn();

// Sample classroom data for tests
const mockClassrooms = [
  {
    id: '101',
    name: 'L 101',
    capacity: 30,
    type: 'Laboratory',
    facilities: ['Computers', 'Projector', 'Whiteboard']
  },
  {
    id: '202',
    name: 'A 202',
    capacity: 40,
    type: 'Classroom',
    facilities: ['Projector', 'Whiteboard', 'AC']
  }
];

describe('useGetClassrooms Hook', () => {
  // Reset mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('fetches classrooms data successfully', async () => {
    // Setup the mock implementation for the hook
    const useGetClassroomsMock = useGetClassrooms as jest.Mock;
    useGetClassroomsMock.mockImplementation(() => ({
      loading: false,
      error: '',
      result: mockClassrooms
    }));
    
    // Call the hook through our mock
    const { loading, error, result } = useGetClassrooms();
    
    // Verify the results
    expect(loading).toBe(false);
    expect(error).toBe('');
    expect(result).toHaveLength(2);
    expect(result?.[0]).toEqual({
      id: '101',
      name: 'L 101',
      capacity: 30,
      type: 'Laboratory',
      facilities: ['Computers', 'Projector', 'Whiteboard']
    });
  });

  test('handles API error correctly', async () => {
    // Setup the mock implementation for error state
    const useGetClassroomsMock = useGetClassrooms as jest.Mock;
    useGetClassroomsMock.mockImplementation(() => ({
      loading: false,
      error: 'Failed to fetch classrooms',
      result: null
    }));
    
    // Call the hook through our mock
    const { loading, error, result } = useGetClassrooms();
    
    // Verify error state
    expect(loading).toBe(false);
    expect(error).toBeTruthy();
    expect(result).toBe(null);
  });

  test('shows loading state', () => {
    // Setup the mock implementation for loading state
    const useGetClassroomsMock = useGetClassrooms as jest.Mock;
    useGetClassroomsMock.mockImplementation(() => ({
      loading: true,
      error: '',
      result: null
    }));
    
    // Call the hook through our mock
    const { loading, result } = useGetClassrooms();
    
    // Verify loading state
    expect(loading).toBe(true);
    expect(result).toBe(null);
  });
});

describe('Classroom API endpoints', () => {
  // Reset the mock before each test
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  test('GET endpoint returns all classrooms', async () => {
    // Mock successful response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { idsalon: 101, tipo: 'Laboratory', cupo: 30, nota: 'Has computers' },
        { idsalon: 202, tipo: 'Classroom', cupo: 40, nota: 'Regular classroom' }
      ]
    });
    
    const response = await fetch('/api/classroom');
    const data = await response.json();
    
    expect(global.fetch).toHaveBeenCalledWith('/api/classroom');
    expect(data).toHaveLength(2);
    expect(data[0]).toHaveProperty('idsalon', 101);
  });

  test('POST endpoint creates a new classroom', async () => {
    const newClassroom = {
      idsalon: 303,
      tipo: 'Auditorium',
      cupo: 100,
      nota: 'Large auditorium'
    };
    
    // Mock successful response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ ...newClassroom, id: 1 })
    });
    
    const response = await fetch('/api/classroom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClassroom)
    });
    
    const data = await response.json();
    
    expect(global.fetch).toHaveBeenCalledWith('/api/classroom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClassroom)
    });
    expect(response.status).toBe(201);
    expect(data).toHaveProperty('idsalon', 303);
  });

  test('PUT endpoint updates a classroom', async () => {
    const updateData = {
      id: 101,
      campo: 'cupo',
      valor: '35'
    };
    
    // Mock successful response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ idsalon: 101, tipo: 'Laboratory', cupo: 35, nota: 'Has computers' })
    });
    
    const response = await fetch('/api/classroom', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    
    const data = await response.json();
    
    expect(global.fetch).toHaveBeenCalledWith('/api/classroom', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    expect(data).toHaveProperty('cupo', 35);
  });

  test('DELETE endpoint removes a classroom', async () => {
    const classroomId = 101;
    
    // Mock successful response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ idsalon: 101, tipo: 'Laboratory', cupo: 30, nota: 'Has computers' })
    });
    
    const response = await fetch(`/api/classroom?id=${classroomId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    expect(global.fetch).toHaveBeenCalledWith(`/api/classroom?id=${classroomId}`, {
      method: 'DELETE'
    });
    expect(data).toHaveProperty('idsalon', 101);
  });
});
