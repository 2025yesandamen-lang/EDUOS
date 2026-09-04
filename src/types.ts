/**
 * Types for CBT PRO X - AI-Powered Educational Operating System
 */

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'PARENT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
}

export interface Student {
  id: string;
  registrationNumber: string;
  name: string;
  email?: string;
  classId?: string;
  className?: string; // Loaded helper
  enrollmentDate: string;
  attendanceRate: number;
  userId?: string;
  status?: 'Active' | 'Graduated' | 'Suspended';
  platform?: string;
  stream?: string;
  room?: string;
  hostel?: string;
}

export interface AdmissionApplication {
  id: string;
  studentName: string;
  studentEmail: string;
  gradeApplied: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedAt?: string;
  remarks?: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName?: string; // Loaded helper
  date: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  room: string;
  primaryTeacher: string;
  academicYear?: string;
  level?: string;
  stream?: string;
  isActive?: boolean;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface TimetableEntry {
  id: string;
  classId: string;
  subjectId?: string;
  className?: string; // Loaded helper
  subject: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // e.g. "08:30"
  endTime: string;   // e.g. "10:00"
  teacher: string;
  room: string;
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  phone: string;
  childStudentId: string;
  childName?: string; // Loaded helper
  tempPassword?: string; // Set upon provisioning
  userId?: string;
}

export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'ESSAY';

export interface Question {
  id: string;
  examId: string;
  text: string;
  type: QuestionType;
  options: string[]; // Options for MCQ or True/False
  answer: string;    // Correct answer (e.g. option text, or "True"/"False", or keywords for essay)
  scorePoints: number;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  passingScore: number; // e.g. 40 (percentage)
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  totalQuestions: number;
  startTime: string;
  endTime: string;
  questions?: Question[];
}

export interface ExamAttempt {
  id: string;
  examId: string;
  examTitle?: string; // Loaded helper
  studentId: string;
  studentName?: string; // Loaded helper
  startTime: string;
  submitTime?: string;
  answers: Record<string, string>; // questionId -> submittedAnswer
  score: number;
  percentage: number;
  status: 'PASS' | 'FAIL' | 'PENDING_GRADING';
  gradePoint?: string; // A+, A, B, C, D, F
  remarks?: string;
  isSubmitted: boolean;
  violationsCount: number;
}

// ============= PHASE 1: ACADEMIC OPERATIONS =============

export type TermName = 'FIRST' | 'SECOND' | 'THIRD';
export type TermStatus = 'PLANNED' | 'ACTIVE' | 'ENDED' | 'CLOSED';

export interface AcademicTerm {
  id: string;
  academicYear: string; // e.g. "2025/2026"
  termName: TermName;
  termNumber: number; // 1, 2, 3
  startDate: string;
  endDate: string;
  resultPublishDate?: string;
  promotionDate?: string;
  status: TermStatus;
  createdAt: string;
  createdBy?: string;
  closedAt?: string;
  tenantId: string;
}

export type Stream = 'Science' | 'Commerce' | 'Arts' | 'Vocational';
export type SubjectType = 'CORE' | 'ELECTIVE' | 'OPTIONAL';

export interface Subject {
  id: string;
  name: string; // e.g. "Mathematics", "English Language"
  code: string; // e.g. "MAT101"
  description?: string;
  department?: string;
  subjectTeacher?: string;
  assignedClassIds?: string[];
  academicYear: string;
  termName?: TermName;
  isActive: boolean;
  credits: number; // For weighting in GPA
  isRequired: boolean;
  stream?: Stream;
  yearLevel?: number; // 1, 2, 3
  prerequisiteSubjectId?: string;
  minGradePrerequisite?: string; // e.g. "B+", "C"
  subjectType: SubjectType;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
}

export type LetterGrade = 'A' | 'B+' | 'B' | 'B-' | 'C' | 'C-' | 'D' | 'F';

export interface Grade {
  id: string;
  studentId: string;
  studentName?: string; // Loaded helper
  subjectId: string;
  subjectName?: string; // Loaded helper
  termId: string;
  classId: string;
  academicYear: string;
  continuousAssessmentScore?: number; // out of 10
  examScore?: number; // out of 100
  projectScore?: number;
  assignmentScore?: number;
  totalScore?: number; // Final score 0-100
  letterGrade?: LetterGrade;
  gpaPoints?: number; // 4.0 scale
  approvalStatus: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
  enteredBy?: string; // Teacher ID
  enteredAt?: string;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
}

export type AssessmentType = 'TEST' | 'QUIZ' | 'ASSIGNMENT' | 'PROJECT' | 'PRESENTATION' | 'PARTICIPATION';
export type SubmissionMethod = 'IN_CLASS' | 'ONLINE' | 'PAPER';
export type AssessmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED';

export interface Assessment {
  id: string;
  termId: string;
  classId: string;
  subjectId: string;
  title: string; // e.g. "Class Test 1", "Project: Science Fair"
  description?: string;
  assessmentType: AssessmentType;
  totalMarks: number; // Max marks (10, 20, 50, etc.)
  weightInTotal: number; // 0.1 = 10%
  setDate: string;
  dueDate: string;
  submissionMethod?: SubmissionMethod;
  publishedDate?: string;
  status: AssessmentStatus;
  createdBy?: string; // Teacher ID
  createdAt: string;
  instructionsUrl?: string;
  attachmentUrl?: string;
  tenantId: string;
}

export interface AssessmentScore {
  id: string;
  assessmentId: string;
  studentId: string;
  score: number;
  feedback?: string;
  approvalStatus: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  enteredBy: string;
  enteredAt: string;
  approvedBy?: string;
  approvedAt?: string;
  updatedAt: string;
  tenantId: string;
}

export type PromotionStatus = 'PROMOTED' | 'RETAINED' | 'GRADUATED' | 'TRANSFERRED';
export type GraduationStatus = 'HONOURS' | 'PASS' | 'WITH_DISTINCTION';

export interface Promotion {
  id: string;
  studentId: string;
  studentName?: string; // Loaded helper
  currentClassId: string;
  promotedClassId?: string; // NULL if not promoted
  academicYear: string;
  promotionStatus: PromotionStatus;
  cumulativeGPA?: number;
  attendancePercentage?: number;
  passedAllSubjects?: boolean;
  failedSubjectCount?: number;
  remedialPlan?: string; // JSON stringified
  graduationStatus?: GraduationStatus;
  proposedBy?: string; // Teacher/HOD ID
  proposedDate?: string;
  approvedBy?: string; // Admin/Principal ID
  approvedDate?: string;
  comments?: string;
  effectiveDate?: string;
  createdAt: string;
  tenantId: string;
}

// ============= PHASE 3: CONDUCT/BEHAVIOR MANAGEMENT =============

export type DisciplineSeverity = 'MINOR' | 'MODERATE' | 'SEVERE';
export type DisciplineAction = 'WARNING' | 'DETENTION' | 'SUSPENSION' | 'EXPULSION' | 'PARENT_MEETING' | 'COUNSELING';
export type DisciplineStatus = 'PENDING' | 'APPROVED' | 'COMPLETED' | 'APPEALED';
export type NotificationMethod = 'EMAIL' | 'SMS' | 'IN_PERSON';
export type AppealResult = 'UPHELD' | 'OVERTURNED' | 'MODIFIED';

export interface DisciplinaryRecord {
  id: string;
  studentId: string;
  studentName?: string; // Loaded helper
  incidentDate: string;
  description: string;
  severity: DisciplineSeverity;
  action: DisciplineAction;
  actionDuration?: string; // e.g., "3 days"
  reportedBy: string; // Teacher/Admin ID
  reportedByName?: string; // Loaded helper
  reportedAt: string;
  approvedBy?: string; // Admin/Principal ID
  approvedByName?: string; // Loaded helper
  approvedAt?: string;
  parentNotifiedAt?: string;
  notificationMethod?: NotificationMethod;
  status: DisciplineStatus;
  remarks?: string;
  witnesses?: string; // JSON array
  attachmentUrl?: string;
  appearedDate?: string;
  appealReason?: string;
  appealResult?: AppealResult;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
}

// ============= PHASE 4: HEALTH & MEDICAL RECORDS =============

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type EmergencyContactRelation = 'PARENT' | 'GUARDIAN' | 'RELATIVE' | 'SIBLING' | 'OTHER';

export interface Allergy {
  name: string;
  severity?: 'MILD' | 'MODERATE' | 'SEVERE'; // Severity level
  reaction?: string; // Description of allergic reaction
}

export interface ChronicCondition {
  name: string; // e.g., "Asthma", "Diabetes"
  medication?: string; // Current medication
  lastCheckup?: string; // Date of last medical visit
}

export interface Disability {
  type: string; // PHYSICAL, VISUAL, HEARING, LEARNING, etc.
  description: string;
  accommodation?: string; // Special accommodation needed
}

export interface Vaccination {
  name: string; // e.g., "COVID-19", "Polio"
  date: string; // Date administered
  provider?: string; // Medical provider name
  certificateUrl?: string; // URL to vaccination certificate
}

export interface Medication {
  name: string;
  dosage: string; // e.g., "500mg"
  frequency: string; // e.g., "Twice daily"
  prescribedDate?: string;
}

export interface SpecialNeed {
  type: string;
  description: string;
  accommodation?: string;
}

export interface DietaryRestriction {
  type: string; // VEGETARIAN, VEGAN, ALLERGY, RELIGIOUS, etc.
  description?: string;
}

export interface HealthRecord {
  id: string;
  studentId: string;
  studentName?: string; // Loaded helper
  bloodType?: BloodType;
  height?: number; // in cm
  weight?: number; // in kg
  allergies?: Allergy[]; // Parsed from JSON
  chronicConditions?: ChronicCondition[]; // Parsed from JSON
  disabilities?: Disability[]; // Parsed from JSON
  vaccinations?: Vaccination[]; // Parsed from JSON
  lastCheckupDate?: string;
  nextCheckupDate?: string;
  currentMedications?: Medication[]; // Parsed from JSON
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: EmergencyContactRelation;
  emergencyContactEmail?: string;
  primaryPhysician?: string; // Doctor name
  physicianPhone?: string;
  physicianAddress?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  specialNeeds?: SpecialNeed[]; // Parsed from JSON
  dietaryRestrictions?: DietaryRestriction[]; // Parsed from JSON
  parentConsentGiven: boolean;
  consentDate?: string;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string; // School nurse/admin ID
  tenantId: string;
}
