import { describe, test, expect, beforeEach, jest } from '@jest/globals';

// Mock next/server before importing anything else
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data) => data)
  }
}));

// Mock config/database before importing it
jest.mock('../config/database', () => ({
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
}));

// Mock models before importing schedule-generator
jest.mock('../lib/models/general-schedule', () => ({
  deleteForCycle: jest.fn(),
  saveGeneralSchedule: jest.fn().mockResolvedValue(true),
  saveMultipleScheduleEntries: jest.fn().mockResolvedValue(true),
}));

jest.mock('../lib/models/availability', () => ({
  findByProfessor: jest.fn().mockImplementation((professorId) => {
    return Promise.resolve([
      { 
        IdDisponibilidad: 1, 
        IdProfesor: professorId, 
        Dia: 'Lunes', 
        HoraInicio: '08:00:00', 
        HoraFin: '11:00:00',
        Metadata: JSON.stringify({ 'Lunes-08:00': 101 }) // Subject 1 preference
      },
      { 
        IdDisponibilidad: 2, 
        IdProfesor: professorId, 
        Dia: 'Martes', 
        HoraInicio: '09:00:00', 
        HoraFin: '12:00:00',
        Metadata: JSON.stringify({ 'Martes-09:00': 102 }) // Subject 2 preference
      },
      { 
        IdDisponibilidad: 3, 
        IdProfesor: professorId, 
        Dia: 'Miércoles', 
        HoraInicio: '10:00:00', 
        HoraFin: '13:00:00' 
      }
    ]);
  })
}));

jest.mock('../lib/models/subject', () => ({
  findAll: jest.fn().mockResolvedValue([
    { IdMateria: 101, Nombre: 'Subject 1', HorasClase: 3, Carrera: 'Engineering' },
    { IdMateria: 102, Nombre: 'Subject 2', HorasClase: 2, Carrera: 'Engineering' },
    { IdMateria: 103, Nombre: 'Subject 3', HorasClase: 4, Carrera: 'Engineering' }
  ]),
  findById: jest.fn().mockImplementation((id) => {
    const subjects = {
      101: { IdMateria: 101, Nombre: 'Subject 1', HorasClase: 3, Carrera: 'Engineering' },
      102: { IdMateria: 102, Nombre: 'Subject 2', HorasClase: 2, Carrera: 'Engineering' },
      103: { IdMateria: 103, Nombre: 'Subject 3', HorasClase: 4, Carrera: 'Engineering' }
    };
    return Promise.resolve(subjects[id] || null);
  })
}));

jest.mock('../lib/utils/group-generator', () => ({
  getGroups: jest.fn().mockResolvedValue([
    // Groups for Professor 1 - Teaching multiple subjects
    {
      idgrupo: 1001,
      idmateria: 101, // Subject 1
      idprofesor: 'PROF1',
      idciclo: 1,
      Semestre: 1,
      professor_name: 'Professor 1'
    },
    {
      idgrupo: 1002,
      idmateria: 102, // Subject 2
      idprofesor: 'PROF1', // Same professor
      idciclo: 1,
      Semestre: 2,
      professor_name: 'Professor 1'
    },
    // Groups for Professor 2 - Teaching a single subject
    {
      idgrupo: 1003,
      idmateria: 103, // Subject 3
      idprofesor: 'PROF2',
      idciclo: 1,
      Semestre: 3,
      professor_name: 'Professor 2'
    }
  ]),
  generateGroupsForAllProfessors: jest.fn().mockResolvedValue({ success: true, groups: [] })
}));

// Now import the function under test
import { generateGeneralSchedule } from '../lib/utils/schedule-generator';
import GeneralSchedule from '../lib/models/general-schedule';
import Availability from '../lib/models/availability';

describe('Professor Teaching Multiple Subjects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('A professor should be able to teach multiple subjects', async () => {
    // Run schedule generation
    const result = await generateGeneralSchedule(1);
    
    // Check that GeneralSchedule.saveGeneralSchedule was called
    expect(GeneralSchedule.saveGeneralSchedule).toHaveBeenCalled();
    expect(result).toBe(true);
    
    // Verify that availability was checked for each professor
    expect(Availability.findByProfessor).toHaveBeenCalledWith('PROF1');
    expect(Availability.findByProfessor).toHaveBeenCalledWith('PROF2');
  });

  test('Schedule generation should respect professor subject preferences', async () => {
    // Setup mock to capture schedule items
    (GeneralSchedule.saveGeneralSchedule as jest.Mock).mockImplementation(scheduleItems => {
      // Check that schedule items were generated
      expect(scheduleItems.length).toBeGreaterThan(0);
      
      // Check professor's preferred subjects
      const prof1Items = scheduleItems.filter((item: any) => item.IdGrupo === 1001 || item.IdGrupo === 1002);
      
      // Verify there are items for this professor
      expect(prof1Items.length).toBeGreaterThan(0);
      
      // Find Subject 1 schedule (should be on Monday)
      const subject1Item = prof1Items.find((item: any) => item.IdGrupo === 1001);
      if (subject1Item) {
        expect(subject1Item.Dia).toBe('Lunes');
        expect(subject1Item.HoraInicio).toBe('08:00');
      }
      
      // Find Subject 2 schedule (should be on Tuesday)
      const subject2Item = prof1Items.find((item: any) => item.IdGrupo === 1002);
      if (subject2Item) {
        expect(subject2Item.Dia).toBe('Martes');
        expect(subject2Item.HoraInicio).toBe('09:00');
      }
      
      return Promise.resolve(true);
    });
    
    await generateGeneralSchedule(1);
  });
});
