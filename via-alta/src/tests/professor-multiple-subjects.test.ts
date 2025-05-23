import { generateGeneralSchedule } from '../lib/utils/schedule-generator';
import GeneralSchedule from '../lib/models/general-schedule';
import Subject from '../lib/models/subject';
import Availability from '../lib/models/availability';
import { getGroups, generateGroupsForAllProfessors } from '../lib/utils/group-generator';
import pool from '../config/database';

// Mock implementations
jest.mock('../lib/models/general-schedule');
jest.mock('../lib/models/availability');
jest.mock('../lib/models/subject');
jest.mock('../lib/utils/group-generator');
jest.mock('../config/database');

describe('Professor Teaching Multiple Subjects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock pool query for getLatestCycleId
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [{ idciclo: 1 }]
    });
    
    // Mock GeneralSchedule methods
    (GeneralSchedule.deleteForCycle as jest.Mock).mockResolvedValue(undefined);
    (GeneralSchedule.saveGeneralSchedule as jest.Mock).mockResolvedValue(true);
    
    // Mock Subject.findAll
    (Subject.findAll as jest.Mock).mockResolvedValue([
      { IdMateria: 101, Nombre: 'Subject 1', HorasClase: 3, Carrera: 'Engineering' },
      { IdMateria: 102, Nombre: 'Subject 2', HorasClase: 2, Carrera: 'Engineering' },
      { IdMateria: 103, Nombre: 'Subject 3', HorasClase: 4, Carrera: 'Engineering' }
    ]);
    
    // Mock Availability.findByProfessor
    (Availability.findByProfessor as jest.Mock).mockImplementation((professorId) => {
      return Promise.resolve([
        { 
          IdDisponibilidad: 1, 
          IdProfesor: professorId, 
          Dia: 'Lunes', 
          HoraInicio: '08:00:00', 
          HoraFin: '11:00:00' 
        },
        { 
          IdDisponibilidad: 2, 
          IdProfesor: professorId, 
          Dia: 'Martes', 
          HoraInicio: '09:00:00', 
          HoraFin: '12:00:00' 
        },
        { 
          IdDisponibilidad: 3, 
          IdProfesor: professorId, 
          Dia: 'Miércoles', 
          HoraInicio: '10:00:00', 
          HoraFin: '13:00:00' 
        }
      ]);
    });
    
    // Mock getGroups
    (getGroups as jest.Mock).mockResolvedValue([
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
    ]);
    
    // Mock generateGroupsForAllProfessors
    (generateGroupsForAllProfessors as jest.Mock).mockResolvedValue({ success: true, groups: [] });
  });

  test('A professor should be able to teach multiple subjects', async () => {
    // Run schedule generation
    const result = await generateGeneralSchedule(1);
    
    // Check that GeneralSchedule.saveGeneralSchedule was called
    expect(GeneralSchedule.saveGeneralSchedule).toHaveBeenCalled();
    expect(result).toBe(true);
    
    // Verify that correct groups were processed
    expect(getGroups).toHaveBeenCalledWith({ idCiclo: 1 });
    
    // Verify correct professors were looked up for availability
    expect(Availability.findByProfessor).toHaveBeenCalledWith('PROF1');
    expect(Availability.findByProfessor).toHaveBeenCalledWith('PROF2');
  });

  test('Schedule generation should respect professor availability', async () => {
    // Use a more precise mock for GeneralSchedule.saveGeneralSchedule to capture schedule items
    (GeneralSchedule.saveGeneralSchedule as jest.Mock).mockImplementation(scheduleItems => {
      // Verify schedule items were generated correctly
      expect(scheduleItems.length).toBeGreaterThan(0);
      
      // Check that Professor 1 is assigned to multiple subjects
      const prof1Items = scheduleItems.filter((item: any) => 
        item.IdGrupo === 1001 || item.IdGrupo === 1002
      );
      
      expect(prof1Items.length).toBeGreaterThan(0);
      
      // Verify subjects are scheduled within professor availability
      for (const item of prof1Items) {
        const hourStart = parseInt(item.HoraInicio.split(':')[0]);
        
        // Check if class is scheduled within available hours
        switch(item.Dia) {
          case 'Lunes':
            expect(hourStart).toBeGreaterThanOrEqual(8);
            expect(hourStart).toBeLessThan(11);
            break;
          case 'Martes':
            expect(hourStart).toBeGreaterThanOrEqual(9);
            expect(hourStart).toBeLessThan(12);
            break;
          case 'Miércoles':
            expect(hourStart).toBeGreaterThanOrEqual(10);
            expect(hourStart).toBeLessThan(13);
            break;
        }
      }
      
      return Promise.resolve(true);
    });
    
    await generateGeneralSchedule(1);
  });

  test('Professors should not have scheduling conflicts between subjects', async () => {
    // Capture schedule items to check for conflicts
    let capturedScheduleItems: any[] = [];
    
    (GeneralSchedule.saveGeneralSchedule as jest.Mock).mockImplementation(scheduleItems => {
      capturedScheduleItems = [...scheduleItems];
      return Promise.resolve(true);
    });
    
    await generateGeneralSchedule(1);
    
    // Group items by professor and check for conflicts
    const prof1Items = capturedScheduleItems.filter((item: any) => 
      item.IdGrupo === 1001 || item.IdGrupo === 1002
    );
    
    // Ensure no overlapping time slots for the same professor
    for (let i = 0; i < prof1Items.length; i++) {
      const class1 = prof1Items[i];
      
      for (let j = i + 1; j < prof1Items.length; j++) {
        const class2 = prof1Items[j];
        
        // If classes are on the same day, ensure no time overlap
        if (class1.Dia === class2.Dia) {
          const hour1Start = parseInt(class1.HoraInicio.split(':')[0]);
          const hour1End = parseInt(class1.HoraFin.split(':')[0]);
          const hour2Start = parseInt(class2.HoraInicio.split(':')[0]);
          const hour2End = parseInt(class2.HoraFin.split(':')[0]);
          
          // Check for overlap
          const overlap = (hour1Start < hour2End && hour2Start < hour1End);
          expect(overlap).toBe(false);
        }
      }
    }
  });
});
