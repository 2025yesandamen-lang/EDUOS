# EDUOS - Implementation Guide for Critical Features

## 🎯 Start Here: The 5 Tables You MUST Add First

These tables form the foundation for a real education system. Add them before anything else.

---

## TABLE 1: Academic Terms (Foundation)

```typescript
// src/db/schema.ts - ADD THIS

export const academicTerms = pgTable("academic_terms", {
  id: text("id").primaryKey(),
  
  // Academic year (e.g., "2025/2026")
  academicYear: text("academic_year").notNull(),
  
  // Term identifier: "FIRST", "SECOND", "THIRD" (African) 
  // or "SPRING", "FALL" (US/UK)
  termName: text("term_name").notNull(),
  termNumber: integer("term_number").notNull(), // 1, 2, 3
  
  // Dates
  startDate: text("start_date").notNull(), // "2025-09-01"
  endDate: text("end_date").notNull(),     // "2025-12-15"
  
  // When grades are published to parents
  resultPublishDate: text("result_publish_date"),
  
  // When promotions happen
  promotionDate: text("promotion_date"),
  
  // Status
  status: text("status").notNull().default("ACTIVE"), 
  // PLANNED, ACTIVE, ENDED, CLOSED (no changes allowed)
  
  // Audit trail
  createdAt: text("created_at").notNull(),
  createdBy: text("created_by"),
  closedAt: text("closed_at"),
  
  // Multi-tenancy
  tenantId: text("tenant_id").notNull().default("default"),
});

// Indexes
export const termYearIndex = index("idx_term_year_tenant").on(academicTerms.academicYear, academicTerms.tenantId);
export const termStatusIndex = index("idx_term_status").on(academicTerms.status, academicTerms.tenantId);
```

**Why this first?** Every exam, assessment, and grade needs a term context.

---

## TABLE 2: Subjects (Course Catalog)

```typescript
export const subjects = pgTable("subjects", {
  id: text("id").primaryKey(),
  
  // Subject name
  name: text("name").notNull(), // "Mathematics", "English Language", "Biology"
  
  // Short code for identification
  code: text("code").notNull().unique(), // "MAT101", "ENG101", "BIO201"
  
  // Description
  description: text("description"),
  
  // Credits (for universities mostly, but useful for secondary)
  credits: integer("credits").notNull().default(3),
  
  // Is this a required subject or elective?
  isRequired: boolean("is_required").notNull().default(true),
  
  // Academic stream (if applicable)
  // Examples: "Science", "Commerce", "Arts", "STEM", "Humanities"
  stream: text("stream"),
  
  // Prerequisite subject (if any)
  // Example: "Must pass MAT100 to take MAT200"
  prerequisiteSubjectId: text("prerequisite_subject_id"),
  
  // Minimum grade needed in prerequisite
  minGradePrerequisite: text("min_grade_prerequisite"), // "B+", "C", etc.
  
  // Subject type
  subjectType: text("subject_type").default("CORE"), // CORE, ELECTIVE, OPTIONAL
  
  // For curriculum sequencing
  yearLevel: integer("year_level"), // 1 (JSS1), 2 (JSS2), 3 (JSS3), etc.
  
  // Audit
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  
  tenantId: text("tenant_id").notNull().default("default"),
});

export const subjectIndex = index("idx_subject_stream_tenant").on(subjects.stream, subjects.tenantId);
```

**Why needed?** Instead of storing "Mathematics" as a string in timetable, reference `subjects.id`.

---

## TABLE 3: Grades (The Heart of Education)

```typescript
export const grades = pgTable("grades", {
  id: text("id").primaryKey(),
  
  // Links
  studentId: text("student_id").notNull(),
  subjectId: text("subject_id").notNull(),
  termId: text("term_id").notNull(), // Links to academicTerms.id
  classId: text("class_id").notNull(),
  
  // Continuous Assessment (typically out of 10)
  continuousAssessmentScore: doublePrecision("ca_score"), // e.g., 8.5
  
  // Exam Score (typically out of 100)
  examScore: doublePrecision("exam_score"), // e.g., 75.0
  
  // Calculated total (CA formula + Exam formula)
  // Typical formula: (CA/10 × 0.30) + (Exam/100 × 0.70)
  // Result should be: 0-100 scale
  totalScore: doublePrecision("total_score"), // e.g., 76.5
  
  // Letter grade based on score
  letterGrade: text("letter_grade"), // "A", "B+", "B", "C", "D", "F"
  
  // GPA points (for 4.0 scale GPA calculation)
  // A+ = 4.0, A = 4.0, A- = 3.7, B+ = 3.3, B = 3.0, etc.
  gpaPoints: doublePrecision("gpa_points"), // e.g., 3.5
  
  // Teacher remarks
  remarks: text("remarks"), // "Good effort", "Needs improvement"
  
  // Who entered the grades
  enteredBy: text("entered_by"), // Teacher ID
  enteredAt: text("entered_at"),
  
  // Audit
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  
  tenantId: text("tenant_id").notNull().default("default"),
});

export const gradeIndex = index("idx_grade_student_term").on(
  grades.studentId, 
  grades.termId, 
  grades.tenantId
);
export const gpaIndex = index("idx_gpa_calculation").on(
  grades.studentId, 
  grades.termId
);
```

**Critical:** This is where you store final grades. Use this for transcripts and GPA calculation.

---

## TABLE 4: Assessments (Tests, Quizzes, Assignments)

```typescript
export const assessments = pgTable("assessments", {
  id: text("id").primaryKey(),
  
  // Links
  termId: text("term_id").notNull(), // Which term?
  classId: text("class_id").notNull(), // Which class?
  subjectId: text("subject_id").notNull(), // Which subject?
  
  // Assessment details
  title: text("title").notNull(), // "Class Test 1", "Project: Science Fair"
  description: text("description"),
  
  // Type of assessment
  assessmentType: text("assessment_type").notNull(),
  // Options: "TEST", "QUIZ", "ASSIGNMENT", "PROJECT", "PRESENTATION", "PARTICIPATION"
  
  // Marks
  totalMarks: integer("total_marks").notNull(), // Max marks (e.g., 20, 10, 50)
  
  // Weighting in final grade
  // If you have: CA Test (20%), Assignments (10%), Project (20%), Exam (50%)
  // This field would be 0.20, 0.10, 0.20 respectively
  weightInTotal: doublePrecision("weight_in_total").notNull(), // 0.1 to 1.0
  
  // Timeline
  setDate: text("set_date").notNull(), // When assigned
  dueDate: text("due_date").notNull(), // When due
  submissionMethod: text("submission_method"), // "IN_CLASS", "ONLINE", "PAPER"
  publishedDate: text("published_date"), // When results shown to students
  
  // Status
  status: text("status").notNull().default("DRAFT"),
  // DRAFT (teacher editing), PUBLISHED (students can see), CLOSED (no submission)
  
  // Who created it
  createdBy: text("created_by"), // Teacher ID
  createdAt: text("created_at").notNull(),
  
  // Attachments/Instructions
  instructionsUrl: text("instructions_url"), // Link to PDF or file
  attachmentUrl: text("attachment_url"), // Sample question paper
  
  tenantId: text("tenant_id").notNull().default("default"),
});

export const assessmentIndex = index("idx_assessment_class_term").on(
  assessments.classId,
  assessments.termId,
  assessments.tenantId
);
```

**Why separate from exams?** Continuous Assessment is different from final exams. Track both separately.

---

## TABLE 5: Promotions (End-of-Year Workflow)

```typescript
export const promotions = pgTable("promotions", {
  id: text("id").primaryKey(),
  
  // The student
  studentId: text("student_id").notNull(),
  
  // Current class and next class
  currentClassId: text("current_class_id").notNull(), // JSS3B
  promotedClassId: text("promoted_class_id"), // SSS1A (can be NULL if not promoted)
  
  // Year
  academicYear: text("academic_year").notNull(), // "2025/2026"
  
  // Promotion decision
  promotionStatus: text("promotion_status").notNull(),
  // Options: "PROMOTED", "RETAINED", "GRADUATED", "TRANSFERRED"
  
  // Criteria used in decision
  cumulativeGPA: doublePrecision("cumulative_gpa"), // e.g., 3.2
  attendancePercentage: doublePrecision("attendance_percentage"), // e.g., 95.5
  passedAllSubjects: boolean("passed_all_subjects"),
  failedSubjectCount: integer("failed_subject_count"),
  
  // If retained, remedial plan
  remedialPlan: text("remedial_plan"), // JSON: {"subject": "Math", "type": "TUTORING"}
  
  // If graduated
  graduationStatus: text("graduation_status"), // "HONOURS", "PASS", "WITH_DISTINCTION"
  
  // Approval workflow
  proposedBy: text("proposed_by"), // Teacher/HOD who proposed
  proposedDate: text("proposed_date"),
  approvedBy: text("approved_by"), // Admin/Principal
  approvedDate: text("approved_date"),
  
  // Comments
  comments: text("comments"),
  
  // Dates
  effectiveDate: text("effective_date"), // When promotion takes effect
  createdAt: text("created_at").notNull(),
  
  tenantId: text("tenant_id").notNull().default("default"),
});

export const promotionIndex = index("idx_promotion_student_year").on(
  promotions.studentId,
  promotions.academicYear,
  promotions.tenantId
);
```

**Purpose:** Manages automatic promotion at term/year end.

---

## 🔗 UPDATE EXISTING TABLES

### Update `exams` table to link to term:

```typescript
// Add this column to exams table:
termId: text("term_id").notNull(), // Links to academicTerms.id

// And update timetable to use subject ID:
// Change: subject: text("subject").notNull(),
// To: subjectId: text("subject_id").notNull(), // Links to subjects.id
```

### Update `students` table:

```typescript
// Add streaming information:
streamId: text("stream_id"), // Science, Commerce, Arts - links to a streams table or enum
currentTermId: text("current_term_id"), // For quick lookup of current term info
```

---

## 📋 API ENDPOINTS TO CREATE

### 1. Terms API

```typescript
// GET /api/terms - List all terms for current tenant
// POST /api/terms - Create new term (admin only)
// GET /api/terms/:id - Get term details
// PUT /api/terms/:id - Update term (admin only)
// GET /api/terms/current - Get currently active term
```

### 2. Subjects API

```typescript
// GET /api/subjects - List all subjects
// POST /api/subjects - Create subject (admin only)
// GET /api/subjects/:id - Get subject details
// GET /api/subjects/stream/:stream - Get subjects by stream
// GET /api/subjects/class/:classId - Get subjects taught in class
```

### 3. Grades API

```typescript
// POST /api/grades - Create/submit grade (teacher only)
// GET /api/grades/student/:studentId/term/:termId - Get student grades for term
// GET /api/grades/student/:studentId - Get all student grades (for transcript)
// PUT /api/grades/:id - Update grade (teacher/admin)
// DELETE /api/grades/:id - Remove grade (admin only)
// GET /api/gpa/student/:studentId - Calculate current GPA
```

### 4. Assessments API

```typescript
// POST /api/assessments - Create assessment (teacher only)
// GET /api/assessments/class/:classId/term/:termId - List class assessments
// POST /api/assessments/:id/submit - Student submits assignment
// POST /api/assessments/:id/score - Teacher scores submission
// GET /api/assessments/:id/submissions - Get all submissions
```

### 5. Promotions API

```typescript
// POST /api/promotions - Propose promotions (bulk)
// GET /api/promotions/pending - Get pending promotions for approval
// PUT /api/promotions/:id/approve - Approve promotion (admin)
// POST /api/promotions/execute - Execute approved promotions
// GET /api/promotions/student/:studentId - Get promotion history
```

---

## 🧮 GRADING LOGIC EXAMPLE

```typescript
// Function to calculate final grade
function calculateFinalGrade(
  continuousAssessment: number, // out of 10
  examScore: number, // out of 100
  assessmentScores: number[] // various assignments, quizzes
): {
  totalScore: number;
  letterGrade: string;
  gpaPoints: number;
} {
  // Formula: CA (30%) + Exams (60%) + Other Assessments (10%)
  const caPercentage = (continuousAssessment / 10) * 100; // Convert to 100 scale
  const otherAssessmentAvg = assessmentScores.length > 0 
    ? assessmentScores.reduce((a, b) => a + b) / assessmentScores.length 
    : 0;

  const totalScore = 
    (caPercentage * 0.30) +
    (examScore * 0.60) +
    (otherAssessmentAvg * 0.10);

  // Map score to letter grade (African secondary school grading)
  let letterGrade: string;
  let gpaPoints: number;

  if (totalScore >= 90) {
    letterGrade = "A+";
    gpaPoints = 4.0;
  } else if (totalScore >= 80) {
    letterGrade = "A";
    gpaPoints = 4.0;
  } else if (totalScore >= 75) {
    letterGrade = "B+";
    gpaPoints = 3.7;
  } else if (totalScore >= 70) {
    letterGrade = "B";
    gpaPoints = 3.3;
  } else if (totalScore >= 65) {
    letterGrade = "C+";
    gpaPoints = 3.0;
  } else if (totalScore >= 60) {
    letterGrade = "C";
    gpaPoints = 2.7;
  } else if (totalScore >= 50) {
    letterGrade = "D";
    gpaPoints = 2.0;
  } else {
    letterGrade = "F";
    gpaPoints = 0.0;
  }

  return { totalScore, letterGrade, gpaPoints };
}

// Function to calculate cumulative GPA
function calculateCumulativeGPA(grades: Grade[]): number {
  if (grades.length === 0) return 0;
  const totalGPA = grades.reduce((sum, grade) => sum + (grade.gpaPoints || 0), 0);
  return totalGPA / grades.length; // Average GPA
}
```

---

## 🎓 TRANSCRIPT GENERATION EXAMPLE

```typescript
interface StudentTranscript {
  studentName: string;
  registrationNumber: string;
  graduationStatus: 'GRADUATED' | 'ACTIVE' | 'NOT_APPLICABLE';
  cumulativeGPA: number;
  termsRecorded: TermRecord[];
}

interface TermRecord {
  academicYear: string;
  termName: string;
  termGPA: number;
  subjectRecords: SubjectGrade[];
  promotion: {
    status: 'PROMOTED' | 'RETAINED' | 'GRADUATED';
    toClass: string;
  };
}

async function generateTranscript(
  studentId: string,
  tenantId: string
): Promise<StudentTranscript> {
  // 1. Get student info
  const student = await dbGetStudentById(studentId);
  
  // 2. Get all grades for student
  const allGrades = await db
    .select()
    .from(grades)
    .where(eq(grades.studentId, studentId));
  
  // 3. Group by term
  const groupedByTerm = new Map<string, Grade[]>();
  allGrades.forEach(grade => {
    if (!groupedByTerm.has(grade.termId)) {
      groupedByTerm.set(grade.termId, []);
    }
    groupedByTerm.get(grade.termId)!.push(grade);
  });
  
  // 4. Calculate term GPAs and promotions
  const termsRecorded = await Promise.all(
    Array.from(groupedByTerm.entries()).map(async ([termId, termGrades]) => {
      const term = await dbGetTermById(termId);
      const termGPA = calculateCumulativeGPA(termGrades);
      
      const subjectRecords = await Promise.all(
        termGrades.map(async (g) => ({
          subject: (await dbGetSubjectById(g.subjectId)).name,
          score: g.totalScore,
          grade: g.letterGrade,
          credits: (await dbGetSubjectById(g.subjectId)).credits
        }))
      );
      
      const promotion = await db
        .select()
        .from(promotions)
        .where(
          and(
            eq(promotions.studentId, studentId),
            eq(promotions.academicYear, term.academicYear)
          )
        )
        .limit(1);
      
      return {
        academicYear: term.academicYear,
        termName: term.termName,
        termGPA,
        subjectRecords,
        promotion: {
          status: promotion[0]?.promotionStatus,
          toClass: promotion[0]?.promotedClassId
        }
      };
    })
  );
  
  // 5. Calculate cumulative GPA
  const cumulativeGPA = calculateCumulativeGPA(allGrades);
  
  return {
    studentName: student.name,
    registrationNumber: student.registrationNumber,
    graduationStatus: // determine from promotions
      allGrades.some(g => {
        const prom = promotions.find(p => p.studentId === studentId);
        return prom?.promotionStatus === 'GRADUATED';
      }) ? 'GRADUATED' : 'ACTIVE',
    cumulativeGPA,
    termsRecorded
  };
}
```

---

## 📊 DATA MIGRATION STRATEGY

If you already have students and data:

```typescript
// 1. Create all new tables
await createNewTables();

// 2. Migrate academic year data to terms
const academicYears = new Set(students.map(s => s.enrollmentDate.substring(0, 4)));
for (const year of academicYears) {
  await dbAddTerm({
    academicYear: `${year}/${year + 1}`,
    termName: 'FIRST',
    termNumber: 1,
    startDate: `${year}-09-01`,
    endDate: `${year}-12-15`,
    status: 'ENDED'
  });
  // Repeat for term 2 and 3
}

// 3. Create default subjects
const defaultSubjects = [
  { name: 'English Language', code: 'ENG101' },
  { name: 'Mathematics', code: 'MAT101' },
  { name: 'Biology', code: 'BIO101' },
  // ... etc
];
for (const subject of defaultSubjects) {
  await dbAddSubject(subject);
}

// 4. Manually enter existing exam scores as grades (data entry task)
// or import from CSV file

// 5. Update timetable references to use new subject IDs
```

---

## 🧪 TESTING CHECKLIST

- [ ] Create 3 terms (FIRST, SECOND, THIRD)
- [ ] Create 5+ subjects with different streams
- [ ] Add 20+ grades for a student across different subjects and terms
- [ ] Calculate GPA correctly
- [ ] Generate transcript correctly
- [ ] Test promotion logic (promote, retain, graduate)
- [ ] Test assessment weighting in final grade
- [ ] Test API endpoints for each new module
- [ ] Test data retrieval for reports

---

## 🚀 IMPLEMENTATION TIMELINE

| Week | Tasks | Files to Change |
|------|-------|-----------------|
| 1 | Create term + subject tables, API endpoints | `schema.ts`, `server.ts`, `dbProvider.ts` |
| 2 | Create grades table, grading logic, transcript API | `schema.ts`, `server.ts` |
| 3 | Create assessments table, scoring API | `schema.ts`, `server.ts` |
| 4 | Create promotions table, workflow | `schema.ts`, `server.ts` |
| 5 | Frontend: Grades dashboard, transcript view | New components |
| 6 | Frontend: Assessment module | New components |
| 7 | Testing, bug fixes, integration | All files |
| 8 | Training, deployment | Deployment files |

