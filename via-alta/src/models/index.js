import dotenv from 'dotenv';

dotenv.config(); // Variables de entorno

const User = require('./user');
const Coordinator = require('./coordinator');
const Student = require('./student');
const Request = require('./request');
const Subject = require('./subject');
const Group = require('./group');
const Schedule = require('./schedule');
const Professor = require('./professor');
const Availability = require('./availability');
const Classroom = require('./classroom');
const Cycle = require('./cycle');
const Prerequisite = require('./prerequisite');
const Enrollment = require('./enrollment');

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
  Enrollment
};

export default models;