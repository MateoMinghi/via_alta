import dotenv from "dotenv";

dotenv.config(); // Variables de entorno

import User from "./user";
import Coordinator from "./coordinator";
import Student from "./student";
import Request from "./request";
import Subject from "./subject";
import Group from "./group";
import Schedule from "./schedule";
import Professor from "./professor";
import Availability from "./availability";
import Classroom from "./classroom";
import Cycle from "./cycle";
import Prerequisite from "./prerequisite";
import Enrollment from "./enrollment";

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
