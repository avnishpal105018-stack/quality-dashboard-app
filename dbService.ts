
import { 
  User, 
  RFCodingRecord, 
  MainPCBRecord, 
  UserRole, 
  BaseNGRecord, 
  ModuleType, 
  ProcessObservationRecord, 
  OperatorAssignmentRecord,
  ProcessCheckSheetRecord,
  PatrollingCheckSheetRecord,
  GeneralCheckSheetRecord,
  RFCodingCheckpointRecord,
  UserStatus
} from '../types';

const USERS_KEY = 'kimbal_users_db';
const RECORDS_KEY = 'kimbal_coding_area_records'; 
const OBSERVATIONS_KEY = 'kimbal_process_observations';
const ASSIGNMENTS_KEY = 'kimbal_operator_assignments';

// DOCUMENT KEYS (Master storage lists)
const RF_CODING_SHEETS_KEY = 'kimbal_rf_coding_sheets';
const PROCESS_SHEETS_KEY = 'kimbal_process_sheets';
const PATROLLING_SHEETS_KEY = 'kimbal_patrolling_sheets';
const GENERAL_SHEETS_KEY = 'kimbal_general_sheets';

const hashSim = (str: string) => btoa(str).split('').reverse().join('');
const compareSim = (plain: string, hashed: string) => hashSim(plain) === hashed;

const INITIAL_USERS: User[] = [
  { 
    id: '1', 
    name: 'Admin Manager', 
    employeeId: 'KIM001', 
    username: 'admin', 
    password: hashSim('password123'),
    mobile: '9999999999', 
    email: 'admin@kimbal.com', 
    role: UserRole.MANAGER, 
    status: 'active',
    createdAt: new Date().toISOString() 
  }
];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const initializeDB = () => {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(RECORDS_KEY)) {
    localStorage.setItem(RECORDS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(ASSIGNMENTS_KEY)) {
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(OBSERVATIONS_KEY)) {
    localStorage.setItem(OBSERVATIONS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(RF_CODING_SHEETS_KEY)) {
    localStorage.setItem(RF_CODING_SHEETS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(PROCESS_SHEETS_KEY)) {
    localStorage.setItem(PROCESS_SHEETS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(PATROLLING_SHEETS_KEY)) {
    localStorage.setItem(PATROLLING_SHEETS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(GENERAL_SHEETS_KEY)) {
    localStorage.setItem(GENERAL_SHEETS_KEY, JSON.stringify([]));
  }
};

initializeDB();

export const dbService = {
  getUsers: (): User[] => JSON.parse(localStorage.getItem(USERS_KEY) || '[]'),
  
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'status'>): User => {
    const users = dbService.getUsers();
    const exists = users.some(u => u.username === user.username || u.employeeId === user.employeeId);
    if (exists) {
      throw new Error("User profile already exists in the master database.");
    }

    const newUser: User = { 
      ...user, 
      id: 'USER_' + Math.random().toString(36).substr(2, 9).toUpperCase(), 
      status: 'active', 
      password: user.password ? hashSim(user.password) : undefined,
      createdAt: new Date().toISOString() 
    };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return newUser;
  },

  getRecords: (): (RFCodingRecord | MainPCBRecord)[] => JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]'),

  addRecord: async (record: any): Promise<any> => {
    await delay(800); 
    const records = dbService.getRecords();
    const newRecord = { 
      ...record, 
      id: 'REC_' + Date.now(), 
      createdAt: new Date().toISOString(), 
      quantity: Number(record.quantity) 
    };
    records.push(newRecord);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    return newRecord;
  },

  getObservations: (): ProcessObservationRecord[] => JSON.parse(localStorage.getItem(OBSERVATIONS_KEY) || '[]'),

  addObservation: async (obs: Partial<ProcessObservationRecord>): Promise<ProcessObservationRecord> => {
    await delay(600);
    const observations = dbService.getObservations();
    const newObs: ProcessObservationRecord = { ...obs as any, id: 'OBS_' + Date.now(), createdAt: new Date().toISOString() };
    observations.push(newObs);
    localStorage.setItem(OBSERVATIONS_KEY, JSON.stringify(observations));
    return newObs;
  },

  // DOCUMENT REPOSITORY METHODS - Strictly Appends
  getRFCodingSheets: (): RFCodingCheckpointRecord[] => JSON.parse(localStorage.getItem(RF_CODING_SHEETS_KEY) || '[]'),
  addRFCodingSheet: async (sheet: Partial<RFCodingCheckpointRecord>): Promise<RFCodingCheckpointRecord> => {
    await delay(500);
    const sheets = dbService.getRFCodingSheets();
    const newSheet: RFCodingCheckpointRecord = { 
      ...sheet as any, 
      id: 'RFCH_' + Date.now(), 
      createdAt: new Date().toISOString() 
    };
    sheets.push(newSheet);
    localStorage.setItem(RF_CODING_SHEETS_KEY, JSON.stringify(sheets));
    return newSheet;
  },

  getProcessSheets: (): ProcessCheckSheetRecord[] => JSON.parse(localStorage.getItem(PROCESS_SHEETS_KEY) || '[]'),
  addProcessSheet: async (sheet: Partial<ProcessCheckSheetRecord>): Promise<ProcessCheckSheetRecord> => {
    await delay(500);
    const sheets = dbService.getProcessSheets();
    const newSheet: ProcessCheckSheetRecord = { 
      ...sheet as any, 
      id: 'PROC_' + Date.now(), 
      createdAt: new Date().toISOString() 
    };
    sheets.push(newSheet);
    localStorage.setItem(PROCESS_SHEETS_KEY, JSON.stringify(sheets));
    return newSheet;
  },

  getPatrollingSheets: (): PatrollingCheckSheetRecord[] => JSON.parse(localStorage.getItem(PATROLLING_SHEETS_KEY) || '[]'),
  addPatrollingSheet: async (sheet: Partial<PatrollingCheckSheetRecord>): Promise<PatrollingCheckSheetRecord> => {
    await delay(500);
    const sheets = dbService.getPatrollingSheets();
    const newSheet: PatrollingCheckSheetRecord = { 
      ...sheet as any, 
      id: 'PATR_' + Date.now(), 
      createdAt: new Date().toISOString() 
    };
    sheets.push(newSheet);
    localStorage.setItem(PATROLLING_SHEETS_KEY, JSON.stringify(sheets));
    return newSheet;
  },

  getGeneralSheets: (): GeneralCheckSheetRecord[] => JSON.parse(localStorage.getItem(GENERAL_SHEETS_KEY) || '[]'),
  addGeneralSheet: async (sheet: Partial<GeneralCheckSheetRecord>): Promise<GeneralCheckSheetRecord> => {
    await delay(500);
    const sheets = dbService.getGeneralSheets();
    const newSheet: GeneralCheckSheetRecord = { ...sheet as any, id: 'GEN_' + Date.now(), createdAt: new Date().toISOString() };
    sheets.push(newSheet);
    localStorage.setItem(GENERAL_SHEETS_KEY, JSON.stringify(sheets));
    return newSheet;
  },

  checkDuplicatePCB: (pcbNumber: string, moduleType: ModuleType): boolean => {
    if (!pcbNumber) return false;
    const records = dbService.getRecords();
    return records.some(r => r.pcbNumber === pcbNumber && r.moduleType === moduleType);
  },

  findUserByMobile: (mobile: string): User | undefined => dbService.getUsers().find(u => u.mobile === mobile),
  isUsernameAvailable: (username: string): boolean => !dbService.getUsers().some(u => u.username === username),
  validateCredentials: (username: string, plainPass: string): User | null => {
    const user = dbService.getUsers().find(u => u.username === username);
    if (user && user.password && compareSim(plainPass, user.password)) {
      return user;
    }
    return null;
  },

  updateLastLogin: (userId: string) => {
    const users = dbService.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx].lastLoginAt = new Date().toISOString();
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  },

  updateUserStatus: (userId: string, status: UserStatus) => {
    const users = dbService.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx].status = status;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
  },

  deleteUser: (userId: string) => {
    const users = dbService.getUsers().filter(u => u.id !== userId);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getOperatorAssignments: (): OperatorAssignmentRecord[] => JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY) || '[]'),

  addOperatorAssignment: async (assignment: Partial<OperatorAssignmentRecord>): Promise<OperatorAssignmentRecord> => {
    await delay(400);
    const assignments = dbService.getOperatorAssignments();
    const newAssignment: OperatorAssignmentRecord = { ...assignment as any, id: 'ASGN_' + Date.now(), createdAt: new Date().toISOString() };
    assignments.push(newAssignment);
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
    return newAssignment;
  },

  getOperatorAssignmentHistory: (operatorId: string, date: string): OperatorAssignmentRecord | undefined => {
    const assignments = dbService.getOperatorAssignments();
    return assignments
      .filter(a => a.operatorId === operatorId && a.date < date)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
  },

  getPreviousShiftOperator: (moduleType: string, shift: string, station: string, date: string): OperatorAssignmentRecord | undefined => {
    const assignments = dbService.getOperatorAssignments();
    return assignments
      .filter(a => a.moduleType === moduleType && a.station === station && a.date < date)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
  },

  getPreviousAssignment: (moduleType: ModuleType, shift: string, station: string, date: string): OperatorAssignmentRecord | undefined => {
    return dbService.getPreviousShiftOperator(moduleType, shift, station, date);
  },

  getPreviousAssignmentByOperator: (operatorId: string, date: string): OperatorAssignmentRecord | undefined => {
    return dbService.getOperatorAssignmentHistory(operatorId, date);
  }
};
