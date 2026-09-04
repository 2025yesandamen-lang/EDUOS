import { pgTable, text, integer, boolean, doublePrecision, jsonb } from "drizzle-orm/pg-core";

// 1. Users Schema
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull(), // ADMIN, TEACHER, STUDENT, PARENT
  tenantId: text("tenant_id").notNull().default("default"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull(),
});

// 2. Classes Schema
export const classes = pgTable("classes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  room: text("room").notNull(),
  primaryTeacher: text("primary_teacher").notNull(),
  academicYear: text("academic_year").notNull().default("2025/2026"),
  level: text("level").notNull().default("OTHER"),
  stream: text("stream").notNull().default("General"),
  isActive: boolean("is_active").notNull().default(true),
  tenantId: text("tenant_id").notNull().default("default"),
});

// 3. Students Schema
export const students = pgTable("students", {
  id: text("id").primaryKey(),
  registrationNumber: text("registration_number").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  classId: text("class_id").notNull(),
  enrollmentDate: text("enrollment_date").notNull(),
  attendanceRate: doublePrecision("attendance_rate").notNull().default(100.0),
  userId: text("user_id"),
  status: text("status").notNull().default("Active"),
  platform: text("platform").default("CBT PRO"),
  stream: text("stream").default(""),
  room: text("room").default(""),
  hostel: text("hostel").default(""),
  tenantId: text("tenant_id").notNull().default("default"),
});

// 4. Admissions Schema
export const admissions = pgTable("admissions", {
  id: text("id").primaryKey(),
  studentName: text("student_name").notNull(),
  studentEmail: text("student_email").notNull(),
  gradeApplied: text("grade_applied").notNull(),
  parentName: text("parent_name").notNull(),
  parentEmail: text("parent_email").notNull(),
  parentPhone: text("parent_phone").notNull(),
  status: text("status").notNull().default("PENDING"), // PENDING, APPROVED, REJECTED
  submittedAt: text("submitted_at").notNull(),
  reviewedAt: text("reviewed_at"),
  remarks: text("remarks"),
  tenantId: text("tenant_id").notNull().default("default"),
});

// 5. Attendance Schema
export const attendance = pgTable("attendance", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  status: text("status").notNull(), // PRESENT, ABSENT, LATE
  remarks: text("remarks"),
  tenantId: text("tenant_id").notNull().default("default"),
});

// 6. Timetable Schema
export const timetable = pgTable("timetable", {
  id: text("id").primaryKey(),
  classId: text("class_id").notNull(),
  subjectId: text("subject_id"),
  subject: text("subject").notNull(),
  dayOfWeek: text("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  teacher: text("teacher").notNull(),
  room: text("room").notNull(),
  tenantId: text("tenant_id").notNull().default("default"),
});

// 7. Parents Schema
export const parents = pgTable("parents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  childStudentId: text("child_student_id").notNull(),
  tempPassword: text("temp_password"),
  userId: text("user_id"),
  tenantId: text("tenant_id").notNull().default("default"),
});

// 8. Exams Schema
export const exams = pgTable("exams", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  duration: integer("duration").notNull(), // in minutes
  passingScore: integer("passing_score").notNull().default(40),
  status: text("status").notNull().default("DRAFT"), // DRAFT, PUBLISHED
  totalQuestions: integer("total_questions").notNull().default(0),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  tenantId: text("tenant_id").notNull().default("default"),
});

// 9. Questions Schema
export const questions = pgTable("questions", {
  id: text("id").primaryKey(),
  examId: text("exam_id").notNull(),
  text: text("text").notNull(),
  type: text("type").notNull(), // MCQ, TRUE_FALSE, ESSAY
  options: jsonb("options").notNull().default([]), // String options
  answer: text("answer").notNull(),
  scorePoints: integer("score_points").notNull().default(10),
  tenantId: text("tenant_id").notNull().default("default"),
});

// 10. Exam Attempts Schema
export const examAttempts = pgTable("exam_attempts", {
  id: text("id").primaryKey(),
  examId: text("exam_id").notNull(),
  studentId: text("student_id").notNull(),
  startTime: text("start_time").notNull(),
  submitTime: text("submit_time"),
  answers: jsonb("answers").notNull().default({}), // key-value maps of { questionId: string }
  score: integer("score").notNull().default(0),
  percentage: doublePrecision("percentage").notNull().default(0.0),
  status: text("status").notNull().default("PENDING_GRADING"), // PASS, FAIL, PENDING_GRADING
  gradePoint: text("grade_point").default("F"),
  remarks: text("remarks"),
  isSubmitted: boolean("is_submitted").notNull().default(false),
  violationsCount: integer("violations_count").notNull().default(0),
  tenantId: text("tenant_id").notNull().default("default"),
});

// 11. Tenants Schema
export const tenants = pgTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  subdomain: text("subdomain").notNull().unique(),
  logoUrl: text("logo_url"),
  backgroundImageUrl: text("background_image_url"),
  primaryColor: text("primary_color").notNull().default("#4f46e5"),
  secondaryColor: text("secondary_color").notNull().default("#0d9488"),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  address: text("address").notNull(),
  status: text("status").notNull().default("active"),
  plan: text("plan").notNull().default("Basic"),
  academicYear: text("academic_year").notNull().default("2025/2026"),
  createdAt: text("created_at").notNull(),
});

// ============= PHASE 1: FOUNDATION TABLES =============

// 12. Academic Terms Schema
// Foundation for all academic operations - CRITICAL TABLE
export const academicTerms = pgTable("academic_terms", {
  id: text("id").primaryKey(),
  
  // Academic year (e.g., "2025/2026")
  academicYear: text("academic_year").notNull(),
  
  // Term identifier: "FIRST", "SECOND", "THIRD"
  termName: text("term_name").notNull(),
  termNumber: integer("term_number").notNull(), // 1, 2, 3
  
  // Dates
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  
  // Important dates
  resultPublishDate: text("result_publish_date"),
  promotionDate: text("promotion_date"),
  
  // Status: PLANNED, ACTIVE, ENDED, CLOSED
  status: text("status").notNull().default("ACTIVE"),
  
  // Audit trail
  createdAt: text("created_at").notNull(),
  createdBy: text("created_by"),
  closedAt: text("closed_at"),
  
  tenantId: text("tenant_id").notNull().default("default"),
});

// 13. Subjects Schema
// Course/subject management - CRITICAL TABLE
export const subjects = pgTable("subjects", {
  id: text("id").primaryKey(),
  
  // Subject name and code
  name: text("name").notNull(), // "Mathematics", "English Language"
  code: text("code").notNull().unique(), // "MAT101", "ENG101"
  
  description: text("description"),
  department: text("department"),
  subjectTeacher: text("subject_teacher"),
  assignedClassIds: jsonb("assigned_class_ids").notNull().default([]),
  academicYear: text("academic_year").notNull().default("2025/2026"),
  termName: text("term_name"),
  isActive: boolean("is_active").notNull().default(true),
  
  // Credits for weighting
  credits: integer("credits").notNull().default(3),
  
  // Required vs elective
  isRequired: boolean("is_required").notNull().default(true),
  
  // Academic stream (Science, Commerce, Arts)
  stream: text("stream"),
  
  // Subject level/year
  yearLevel: integer("year_level"), // 1, 2, 3 for JSS/SSS
  
  // Prerequisite
  prerequisiteSubjectId: text("prerequisite_subject_id"),
  minGradePrerequisite: text("min_grade_prerequisite"), // "B+", "C", etc.
  
  // Subject type
  subjectType: text("subject_type").default("CORE"), // CORE, ELECTIVE, OPTIONAL
  
  // Audit
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  
  tenantId: text("tenant_id").notNull().default("default"),
});

// 14. Grades Schema
// Student academic performance - CRITICAL TABLE
export const grades = pgTable("grades", {
  id: text("id").primaryKey(),
  
  // Links
  studentId: text("student_id").notNull(),
  subjectId: text("subject_id").notNull(),
  termId: text("term_id").notNull(), // Links to academicTerms
  classId: text("class_id").notNull(),
  academicYear: text("academic_year").notNull().default("2025/2026"),
  
  // Scoring - Continuous Assessment
  continuousAssessmentScore: doublePrecision("ca_score"), // out of 10
  
  // Scoring - Exam
  examScore: doublePrecision("exam_score"), // out of 100
  projectScore: doublePrecision("project_score"),
  assignmentScore: doublePrecision("assignment_score"),
  
  // Calculated total score
  totalScore: doublePrecision("total_score"), // Final score on 0-100 scale
  
  // Letter grade
  letterGrade: text("letter_grade"), // "A", "B+", "B", "C", "D", "F"
  
  // GPA points (4.0 scale)
  gpaPoints: doublePrecision("gpa_points"),
  approvalStatus: text("approval_status").notNull().default("DRAFT"),
  approvedBy: text("approved_by"),
  approvedAt: text("approved_at"),
  
  // Teacher remarks
  remarks: text("remarks"),
  
  // Who entered this
  enteredBy: text("entered_by"), // Teacher ID
  enteredAt: text("entered_at"),
  
  // Audit
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  
  tenantId: text("tenant_id").notNull().default("default"),
});

export const gradingSchemes = pgTable("grading_schemes", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  academicYear: text("academic_year").notNull(),
  caWeight: doublePrecision("ca_weight").notNull(),
  examWeight: doublePrecision("exam_weight").notNull(),
  projectWeight: doublePrecision("project_weight").notNull().default(0),
  assignmentWeight: doublePrecision("assignment_weight").notNull().default(0),
  bands: jsonb("bands").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull(),
  tenantId: text("tenant_id").notNull().default("default")
});

// 15. Assessments Schema
// Tests, quizzes, assignments - CRITICAL TABLE
export const assessments = pgTable("assessments", {
  id: text("id").primaryKey(),
  
  // Links
  termId: text("term_id").notNull(),
  classId: text("class_id").notNull(),
  subjectId: text("subject_id").notNull(),
  
  // Details
  title: text("title").notNull(), // "Class Test 1", "Project: Science Fair"
  description: text("description"),
  
  // Type: TEST, QUIZ, ASSIGNMENT, PROJECT, PRESENTATION, PARTICIPATION
  assessmentType: text("assessment_type").notNull(),
  
  // Marks
  totalMarks: integer("total_marks").notNull(), // Max marks (10, 20, 50, etc.)
  
  // Weight in final calculation (0.1 = 10%)
  weightInTotal: doublePrecision("weight_in_total").notNull(),
  
  // Timeline
  setDate: text("set_date").notNull(),
  dueDate: text("due_date").notNull(),
  submissionMethod: text("submission_method"), // "IN_CLASS", "ONLINE", "PAPER"
  publishedDate: text("published_date"),
  
  // Status: DRAFT, PUBLISHED, CLOSED
  status: text("status").notNull().default("DRAFT"),
  
  // Who created it
  createdBy: text("created_by"), // Teacher ID
  createdAt: text("created_at").notNull(),
  
  // Instructions/attachments
  instructionsUrl: text("instructions_url"),
  attachmentUrl: text("attachment_url"),
  
  tenantId: text("tenant_id").notNull().default("default"),
});

export const assessmentScores = pgTable("assessment_scores", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id").notNull(),
  studentId: text("student_id").notNull(),
  score: doublePrecision("score").notNull(),
  feedback: text("feedback"),
  approvalStatus: text("approval_status").notNull().default("DRAFT"),
  enteredBy: text("entered_by").notNull(),
  enteredAt: text("entered_at").notNull(),
  approvedBy: text("approved_by"),
  approvedAt: text("approved_at"),
  updatedAt: text("updated_at").notNull(),
  tenantId: text("tenant_id").notNull().default("default")
});

// 16. Promotions Schema
// Student advancement workflow - CRITICAL TABLE
export const promotions = pgTable("promotions", {
  id: text("id").primaryKey(),
  
  // Student and class info
  studentId: text("student_id").notNull(),
  currentClassId: text("current_class_id").notNull(),
  promotedClassId: text("promoted_class_id"), // NULL if not promoted
  
  // Academic year
  academicYear: text("academic_year").notNull(),
  
  // Status: PROMOTED, RETAINED, GRADUATED, TRANSFERRED
  promotionStatus: text("promotion_status").notNull(),
  
  // Criteria used
  cumulativeGPA: doublePrecision("cumulative_gpa"),
  attendancePercentage: doublePrecision("attendance_percentage"),
  passedAllSubjects: boolean("passed_all_subjects"),
  failedSubjectCount: integer("failed_subject_count"),
  
  // Remedial plan if retained
  remedialPlan: text("remedial_plan"), // JSON
  
  // Graduation info
  graduationStatus: text("graduation_status"), // "HONOURS", "PASS", "WITH_DISTINCTION"
  
  // Approval workflow
  proposedBy: text("proposed_by"), // Teacher/HOD ID
  proposedDate: text("proposed_date"),
  approvedBy: text("approved_by"), // Admin/Principal ID
  approvedDate: text("approved_date"),
  
  // Notes
  comments: text("comments"),
  
  // Effective date
  effectiveDate: text("effective_date"),
  
  // Audit
  createdAt: text("created_at").notNull(),
  
  tenantId: text("tenant_id").notNull().default("default"),
});

// ============= PHASE 3: CONDUCT/BEHAVIOR MANAGEMENT =============

// 17. Disciplinary Records Schema
// Student incident reporting and progressive discipline workflow
export const disciplinaryRecords = pgTable("disciplinary_records", {
  id: text("id").primaryKey(),
  
  // Student and incident info
  studentId: text("student_id").notNull(),
  incidentDate: text("incident_date").notNull(),
  description: text("description").notNull(), // What happened
  
  // Severity levels
  severity: text("severity").notNull(), // MINOR, MODERATE, SEVERE
  
  // Disciplinary action
  action: text("action").notNull(), // WARNING, DETENTION, SUSPENSION, EXPULSION, PARENT_MEETING, COUNSELING
  actionDuration: text("action_duration"), // e.g., "3 days" for suspension
  
  // Reporting and approval
  reportedBy: text("reported_by").notNull(), // Teacher/Admin ID
  reportedAt: text("reported_at").notNull(),
  approvedBy: text("approved_by"), // Admin/Principal ID
  approvedAt: text("approved_at"),
  
  // Parent notification
  parentNotifiedAt: text("parent_notified_at"),
  notificationMethod: text("notification_method"), // EMAIL, SMS, IN_PERSON
  
  // Status
  status: text("status").notNull().default("PENDING"), // PENDING, APPROVED, COMPLETED, APPEALED
  
  // Additional info
  remarks: text("remarks"),
  witnesses: text("witnesses"), // JSON array of witness names
  attachmentUrl: text("attachment_url"), // Evidence/documentation URL
  
  // Appeal process
  appearedDate: text("appealed_date"),
  appealReason: text("appeal_reason"),
  appealResult: text("appeal_result"), // UPHELD, OVERTURNED, MODIFIED
  
  // Audit
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  
  tenantId: text("tenant_id").notNull().default("default"),
});

// ============= PHASE 4: HEALTH & MEDICAL RECORDS =============

// 18. Health Records Schema
// Student medical information and health tracking
export const healthRecords = pgTable("health_records", {
  id: text("id").primaryKey(),
  
  // Student info
  studentId: text("student_id").notNull(),
  
  // Basic health info
  bloodType: text("blood_type"), // A, B, AB, O (with +/-)
  height: doublePrecision("height"), // in cm
  weight: doublePrecision("weight"), // in kg
  
  // Medical conditions
  allergies: text("allergies"), // JSON array of allergy objects {name, severity, reaction}
  chronicConditions: text("chronic_conditions"), // JSON array {name, medication, lastCheckup}
  disabilities: text("disabilities"), // JSON array {type, description, accommodation}
  
  // Immunization
  vaccinations: text("vaccinations"), // JSON array {name, date, provider, certificateUrl}
  lastCheckupDate: text("last_checkup_date"),
  nextCheckupDate: text("next_checkup_date"),
  
  // Medication
  currentMedications: text("current_medications"), // JSON array {name, dosage, frequency, prescribedDate}
  
  // Emergency contacts
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  emergencyContactRelation: text("emergency_contact_relation"), // PARENT, GUARDIAN, RELATIVE
  emergencyContactEmail: text("emergency_contact_email"),
  
  // Medical provider info
  primaryPhysician: text("primary_physician"), // Doctor name
  physicianPhone: text("physician_phone"),
  physicianAddress: text("physician_address"),
  insuranceProvider: text("insurance_provider"),
  insurancePolicyNumber: text("insurance_policy_number"),
  
  // Special requirements
  specialNeeds: text("special_needs"), // JSON array of special accommodations needed
  dietaryRestrictions: text("dietary_restrictions"), // JSON array
  
  // Parent/Guardian access consent
  parentConsentGiven: boolean("parent_consent_given").notNull().default(false),
  consentDate: text("consent_date"),
  
  // Audit
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  updatedBy: text("updated_by"), // School nurse/admin ID
  
  tenantId: text("tenant_id").notNull().default("default"),
});

