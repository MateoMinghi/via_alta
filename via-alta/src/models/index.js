import dotenv from 'dotenv';

dotenv.config(); // Variables de entorno

const User = require('./user.js');
const Coordinator = require('./coordinator.js');
const Student = require('./student.js');
const Request = require('./request.js');
const Subject = require('./subject.js');
const Group = require('./group.js');
const Schedule = require('./schedule.js');
const Professor = require('./professor.js');
const Availability = require('./availability.js');
const Classroom = require('./classroom.js');
const Cycle = require('./cycle.js');
const Prerequisite = require('./prerequisite.js');
const Enrollment = require('./enrollment.js');

const models = {
  User,
  Coordinator,
  Student,
  Request,
  Subject,
  Group,
  Schedule,
  Professor,
  Availability,
  Classroom,
  Cycle,
  Prerequisite,
  Enrollment,
};

export default models;
