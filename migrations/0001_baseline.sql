CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  room TEXT NOT NULL,
  primary_teacher TEXT NOT NULL,
  tenant_id TEXT NOT NULL DEFAULT 'default'
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  registration_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  class_id TEXT NOT NULL,
  enrollment_date TEXT NOT NULL,
  attendance_rate DOUBLE PRECISION NOT NULL DEFAULT 100.0,
  user_id TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  platform TEXT DEFAULT 'CBT PRO',
  stream TEXT DEFAULT '',
  room TEXT DEFAULT '',
  hostel TEXT DEFAULT '',
  tenant_id TEXT NOT NULL DEFAULT 'default'
);

CREATE TABLE IF NOT EXISTS admissions (
  id TEXT PRIMARY KEY,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  grade_applied TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  parent_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  submitted_at TEXT NOT NULL,
  reviewed_at TEXT,
  remarks TEXT,
  tenant_id TEXT NOT NULL DEFAULT 'default'
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  remarks TEXT,
  tenant_id TEXT NOT NULL DEFAULT 'default'
);

CREATE TABLE IF NOT EXISTS timetable (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  day_of_week TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  teacher TEXT NOT NULL,
  room TEXT NOT NULL,
  tenant_id TEXT NOT NULL DEFAULT 'default'
);

CREATE TABLE IF NOT EXISTS parents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  child_student_id TEXT NOT NULL,
  temp_password TEXT,
  user_id TEXT,
  tenant_id TEXT NOT NULL DEFAULT 'default'
);

CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  duration INTEGER NOT NULL,
  passing_score INTEGER NOT NULL DEFAULT 40,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  total_questions INTEGER NOT NULL DEFAULT 0,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  tenant_id TEXT NOT NULL DEFAULT 'default'
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  text TEXT NOT NULL,
  type TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  answer TEXT NOT NULL,
  score_points INTEGER NOT NULL DEFAULT 10,
  tenant_id TEXT NOT NULL DEFAULT 'default'
);

CREATE TABLE IF NOT EXISTS exam_attempts (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  start_time TEXT NOT NULL,
  submit_time TEXT,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score INTEGER NOT NULL DEFAULT 0,
  percentage DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  status TEXT NOT NULL DEFAULT 'PENDING_GRADING',
  grade_point TEXT DEFAULT 'F',
  remarks TEXT,
  is_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  violations_count INTEGER NOT NULL DEFAULT 0,
  tenant_id TEXT NOT NULL DEFAULT 'default'
);

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subdomain TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  background_image_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#4f46e5',
  secondary_color TEXT NOT NULL DEFAULT '#0d9488',
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  plan TEXT NOT NULL DEFAULT 'Basic',
  academic_year TEXT NOT NULL DEFAULT '2025/2026',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS academic_terms (
  id TEXT PRIMARY KEY,
  academic_year TEXT NOT NULL,
  term_name TEXT NOT NULL,
  term_number INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  result_publish_date TEXT,
  promotion_date TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,
  created_by TEXT,
  closed_at TEXT,
  tenant_id TEXT NOT NULL DEFAULT 'default'
);

CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  credits INTEGER NOT NULL DEFAULT 3,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  stream TEXT,
  year_level INTEGER,
  prerequisite_subject_id TEXT,
  min_grade_prerequisite TEXT,
  subject_type TEXT DEFAULT 'CORE',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  tenant_id TEXT NOT NULL DEFAULT 'default'
);

CREATE TABLE IF NOT EXISTS grades (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  term_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  ca_score DOUBLE PRECISION,
  exam_score DOUBLE PRECISION,
  total_score DOUBLE PRECISION,
  letter_grade TEXT,
  gpa_points DOUBLE PRECISION,
  remarks TEXT,
  entered_by TEXT,
  entered_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  tenant_id TEXT NOT NULL DEFAULT 'default'
);

CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY,
  term_id TEXT NOT NULL,
  class_id TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assessment_type TEXT NOT NULL,
  total_marks INTEGER NOT NULL,
  weight_in_total DOUBLE PRECISION NOT NULL,
  set_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  submission_method TEXT,
  published_date TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  created_by TEXT,
  created_at TEXT NOT NULL,
  instructions_url TEXT,
  attachment_url TEXT,
  tenant_id TEXT NOT NULL DEFAULT 'default'
);

CREATE TABLE IF NOT EXISTS promotions (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  current_class_id TEXT NOT NULL,
  promoted_class_id TEXT,
  academic_year TEXT NOT NULL,
  promotion_status TEXT NOT NULL,
  cumulative_gpa DOUBLE PRECISION,
  attendance_percentage DOUBLE PRECISION,
  passed_all_subjects BOOLEAN,
  failed_subject_count INTEGER,
  remedial_plan TEXT,
  graduation_status TEXT,
  proposed_by TEXT,
  proposed_date TEXT,
  approved_by TEXT,
  approved_date TEXT,
  comments TEXT,
  effective_date TEXT,
  created_at TEXT NOT NULL,
  tenant_id TEXT NOT NULL DEFAULT 'default'
);

CREATE TABLE IF NOT EXISTS disciplinary_records (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  incident_date TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL,
  action TEXT NOT NULL,
  action_duration TEXT,
  reported_by TEXT NOT NULL,
  reported_at TEXT NOT NULL,
  approved_by TEXT,
  approved_at TEXT,
  parent_notified_at TEXT,
  notification_method TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  remarks TEXT,
  witnesses TEXT,
  attachment_url TEXT,
  appealed_date TEXT,
  appeal_reason TEXT,
  appeal_result TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  tenant_id TEXT NOT NULL DEFAULT 'default'
);

CREATE TABLE IF NOT EXISTS health_records (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  blood_type TEXT,
  height DOUBLE PRECISION,
  weight DOUBLE PRECISION,
  allergies TEXT,
  chronic_conditions TEXT,
  disabilities TEXT,
  vaccinations TEXT,
  last_checkup_date TEXT,
  next_checkup_date TEXT,
  current_medications TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  emergency_contact_email TEXT,
  primary_physician TEXT,
  physician_phone TEXT,
  physician_address TEXT,
  insurance_provider TEXT,
  insurance_policy_number TEXT,
  special_needs TEXT,
  dietary_restrictions TEXT,
  parent_consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  consent_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT,
  tenant_id TEXT NOT NULL DEFAULT 'default'
);

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
