
export enum UserRole {
  OPERATOR = 'Operator',
  LINE_LEADER = 'Line Leader',
  INSPECTOR = 'Quality Inspector',
  SHIFT_INCHARGE = 'Shift Incharge',
  MANAGER = 'Manager'
}

export type UserStatus = 'active' | 'disabled';

export type ModuleType = 'RF_CODING' | 'PCB_1PH' | 'PCB_3PH' | 'LTCT' | 'GENERAL';

export interface User {
  id: string;
  name: string;
  employeeId: string;
  username: string;
  mobile: string;
  email: string;
  role: UserRole.SHIFT_INCHARGE | UserRole.MANAGER;
  password?: string;
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string;
}

export interface OperatorAssignmentRecord {
  id: string;
  date: string;
  shift: 'A' | 'B' | 'C';
  moduleType: ModuleType;
  station: string;
  stationName: string;
  operatorName: string;
  operatorId: string;
  createdAt: string;
}

export interface BaseNGRecord {
  id: string;
  date: string;
  shift: 'A' | 'B' | 'C';
  moduleType: ModuleType;
  station: string;
  stationName?: string;
  vendor: string;
  customer: string;
  firmware: string;
  lineLeader: string;
  quantity: number;
  createdAt: string;
  createdBy: string;
  submitterName: string;
  submitterEmployeeId: string;
  submitterRole: UserRole.OPERATOR | UserRole.LINE_LEADER | UserRole.INSPECTOR;
  operatorName?: string;
  operatorId?: string;
  pcbNumber?: string;
  isDuplicateConfirmed?: boolean;
}

export interface RFCodingRecord extends BaseNGRecord {
  block: 'A' | 'B';
  rgType: '4G' | 'RF';
  partCode: string;
  pcbType: 'G23' | 'G13' | 'Cavili' | 'Other';
  issueDescription: string;
  ngReason: string;
}

export interface MainPCBRecord extends BaseNGRecord {
  issueType: 'Process Issue' | 'Vendor Issue';
  issueCategory: 'Digit Cut' | 'PCB Off' | 'Programming Fail' | 'Operation Skip' | 'No Clear' | 'Components Damage' | 'Other Issue';
  componentName?: string;
  otherIssueDescription?: string;
  reasonDescription: string;
  shiftInchargeProduction: string;
}

export interface ProcessObservationRecord {
  id: string;
  date: string;
  shift: 'A' | 'B' | 'C';
  moduleType: ModuleType;
  station: string;
  vendor?: string;
  lineLeader?: string;
  observationCategory: 'Material Related' | 'Line Related' | 'Operator Related' | 'General Observation';
  issueDescription: string;
  issueFoundAt: string;
  responsibleType: string;
  correctiveAction: string;
  actionOwner: string;
  targetDate: string;
  quantityAffected: number;
  status: 'Pending' | 'In Progress' | 'Closed';
  closureDate?: string;
  remarks?: string;
  observerName: string;
  observerEmployeeId: string;
  operatorName?: string;
  severity: 'Low' | 'Medium' | 'High';
  isRepeated: boolean;
  createdAt: string;
}

// DOCUMENT MODULE TYPES
export interface RFCodingCheckpointRecord {
  id: string;
  date: string;
  area: string;
  lineNo: string;
  shift: 'A' | 'B';
  lineLeader: string;
  userId: string;
  qualityChecker: string;
  checkpoints: {
    id: string;
    description: string;
    status: 'OK' | 'NOT OK' | '';
    remarks: string;
  }[];
  createdAt: string;
}

export interface ProcessCheckSheetRecord {
  id: string;
  date: string;
  area: string;
  lineNo: string;
  shift: 'A' | 'B';
  lineLeader: string;
  supervisor: string;
  qualityChecker: string;
  userId: string;
  checkpoints: {
    id: string;
    description: string;
    status: 'OK' | 'NOT OK' | '';
    remarks: string;
  }[];
  createdAt: string;
}

export interface PatrollingCheckSheetRecord {
  id: string;
  date: string;
  area: string;
  lineNo: string;
  lineLeader: string;
  supervisor?: string;
  qualityChecker: string;
  userId: string;
  shift: 'A' | 'B';
  timeSlot: string;
  checkpoints: {
    id: string;
    description: string;
    status: 'OK' | 'NOK' | 'Not Become OK' | '';
    remarks: string;
  }[];
  createdAt: string;
}

export interface GeneralCheckSheetRecord {
  id: string;
  date: string;
  shift: 'A' | 'B';
  checkedBy: string;
  items: {
    id: string;
    category: string;
    description: string;
    status: 'OK' | 'NOT OK' | '';
    remarks: string;
  }[];
  createdAt: string;
}

// Prediction Types
export interface StationRisk {
  station: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  confidence: number;
  reason: string;
}

export interface ForecastPoint {
  date: string;
  actual?: number;
  predicted: number;
}

export interface PredictionData {
  predictedTopIssue: string;
  predictedHighRiskStation: string;
  predictedArea: string;
  forecastedQuantityNextDay: number;
  forecastedQuantityNextWeek: number;
  confidenceLevel: number;
  managementInsight: string;
  stationRisks: StationRisk[];
  forecastTrend: ForecastPoint[];
}
