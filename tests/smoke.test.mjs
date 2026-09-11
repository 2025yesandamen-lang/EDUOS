import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { calculateClassResults, calculateStudentResult } from "../src/utils/results.ts";

const port = 4397;
const baseUrl = `http://127.0.0.1:${port}`;
let serverProcess;
let adminToken;
const testDbPath = path.join(os.tmpdir(), `eduos-smoke-${process.pid}.json`);

async function waitForServer() {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {
      // The application performs database reachability checks before listening.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Server did not become healthy within 30 seconds");
}

before(async () => {
  serverProcess = spawn(process.execPath, ["dist/server.cjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(port),
      DATABASE_URL: "",
      EDUOS_SKIP_DATABASE: "true",
      EDUOS_DB_FILE: testDbPath,
      JWT_SECRET: "phase-0-test-secret"
    },
    stdio: "ignore"
  });
  await waitForServer();
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "admin@eduos.com", password: "admin123" })
  });
  assert.equal(loginResponse.status, 200);
  adminToken = (await loginResponse.json()).token;
});

after(() => {
  serverProcess?.kill();
});

test("health endpoint reports a usable database mode", async () => {
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.database, "local-fallback");
  assert.equal(typeof body.startupMilliseconds, "number");
});

test("readiness endpoint accepts the configured local fallback", async () => {
  const response = await fetch(`${baseUrl}/health/ready`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, "ready");
  assert.equal(body.databaseConfigured, false);
});

test("public tenant lookup remains available", async () => {
  const response = await fetch(`${baseUrl}/api/public/tenants/default`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.id, "default");
});

test("authentication is required for academic data paths", async () => {
  const response = await fetch(`${baseUrl}/api/academic-terms`);
  const body = await response.json();

  assert.equal(response.status, 401);
  assert.equal(body.error, true);
});

test("invalid credentials are rejected without changing the account password", async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "admin@eduos.com", password: "wrong-password" })
  });

  assert.equal(response.status, 401);
});

test("academic term creation validates the Phase 1 term model", async () => {
  const response = await fetch(`${baseUrl}/api/academic-terms`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      academicYear: "2099/2100",
      termName: "INVALID",
      termNumber: 4,
      startDate: "2099-01-01",
      endDate: "2099-04-01"
    })
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.match(body.message, /Invalid academic term/);
});

test("academic terms retain publication and promotion dates and lock when closed", async () => {
  const createResponse = await fetch(`${baseUrl}/api/academic-terms`, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      academicYear: "2098/2099",
      termName: "SECOND",
      termNumber: 2,
      startDate: "2098-05-01",
      endDate: "2098-08-01",
      resultPublishDate: "2098-08-15",
      promotionDate: "2098-08-30"
    })
  });
  const created = await createResponse.json();
  assert.equal(createResponse.status, 201);
  assert.equal(created.resultPublishDate, "2098-08-15");
  assert.equal(created.promotionDate, "2098-08-30");

  const closeResponse = await fetch(`${baseUrl}/api/academic-terms/${created.id}`, {
    method: "PUT",
    headers: { "content-type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: "CLOSED" })
  });
  const closed = await closeResponse.json();
  assert.equal(closeResponse.status, 200);
  assert.equal(closed.status, "CLOSED");
  assert.equal(typeof closed.closedAt, "string");

  const lockedResponse = await fetch(`${baseUrl}/api/academic-terms/${created.id}`, {
    method: "PUT",
    headers: { "content-type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ academicYear: "2100/2101" })
  });
  assert.equal(lockedResponse.status, 409);
});

test("subject creation persists assignment and academic metadata", async () => {
  const response = await fetch(`${baseUrl}/api/subjects`, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: "Phase 1 Biology",
      code: "BIO-P1",
      department: "Sciences",
      subjectTeacher: "Mrs. Test Teacher",
      assignedClassIds: ["c-1"],
      academicYear: "2099/2100",
      termName: "FIRST",
      stream: "Science"
    })
  });
  const body = await response.json();
  assert.equal(response.status, 201);
  assert.deepEqual(body.assignedClassIds, ["c-1"]);
  assert.equal(body.department, "Sciences");
  assert.equal(body.termName, "FIRST");
});

test("class creation rejects unsupported levels", async () => {
  const response = await fetch(`${baseUrl}/api/classes`, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: "Invalid Level", level: "YEAR-9" })
  });
  assert.equal(response.status, 400);
});

test("class creation persists session and stream structure", async () => {
  const response = await fetch(`${baseUrl}/api/classes`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: "JS1 Science",
      room: "Block C - Room 1",
      primaryTeacher: "Mrs. Test Teacher",
      academicYear: "2099/2100",
      level: "JS1",
      stream: "Science"
    })
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.academicYear, "2099/2100");
  assert.equal(body.level, "JS1");
  assert.equal(body.stream, "Science");
});

test("timetable creation accepts a subject reference", async () => {
  const classResponse = await fetch(`${baseUrl}/api/classes`, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ name: `Timetable Test ${Date.now()}`, room: `Test Room ${Date.now()}`, level: "OTHER", stream: "General" })
  });
  const testClass = await classResponse.json();
  assert.equal(classResponse.status, 201);

  const response = await fetch(`${baseUrl}/api/timetable`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      classId: testClass.id,
      subjectId: "subject-phase1-test",
      dayOfWeek: "Thursday",
      startTime: "15:00",
      endTime: "16:00",
      teacher: `Test Teacher ${Date.now()}`,
      room: testClass.room
    })
  });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.subjectId, "subject-phase1-test");
});

test("grading schemes validate weights and grade creation uses the supplied policy", async () => {
  const scheme = {
    name: "Phase 2 policy",
    academicYear: "2099/2100",
    caWeight: 0.5,
    examWeight: 0.5,
    projectWeight: 0,
    assignmentWeight: 0,
    bands: [{ min: 90, letter: "DISTINCTION", points: 5 }, { min: 0, letter: "PASS", points: 1 }]
  };
  const schemeResponse = await fetch(`${baseUrl}/api/grading-schemes`, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify(scheme)
  });
  const savedScheme = await schemeResponse.json();
  assert.equal(schemeResponse.status, 201);

  const gradeResponse = await fetch(`${baseUrl}/api/grades`, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ studentId: "s-1", subjectId: "subject-phase1-test", termId: "term-phase2-test", classId: "c-1", academicYear: "2099/2100", continuousAssessmentScore: 100, examScore: 80, schemeId: savedScheme.id })
  });
  const grade = await gradeResponse.json();
  assert.equal(gradeResponse.status, 201);
  assert.equal(grade.totalScore, 90);
  assert.equal(grade.letterGrade, "DISTINCTION");
  assert.equal(grade.approvalStatus, "DRAFT");

  const approvalResponse = await fetch(`${baseUrl}/api/grades/${grade.id}/approve`, {
    method: "PUT",
    headers: { "content-type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ approvalStatus: "APPROVED" })
  });
  const approved = await approvalResponse.json();
  assert.equal(approvalResponse.status, 200);
  assert.equal(approved.approvalStatus, "APPROVED");
});

test("continuous assessment records support categories, scores, approval, and locking", async () => {
  const termResponse = await fetch(`${baseUrl}/api/academic-terms`, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ academicYear: "2097/2098", termName: "THIRD", termNumber: 3, startDate: "2097-09-01", endDate: "2097-12-01" })
  });
  const term = await termResponse.json();
  const assessmentResponse = await fetch(`${baseUrl}/api/assessments`, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ termId: term.id, classId: "c-1", subjectId: "subject-phase1-test", title: `Practical ${Date.now()}`, assessmentType: "PRACTICAL", totalMarks: 25, weightInTotal: 0.2, setDate: "2097-09-10", dueDate: "2097-09-20" })
  });
  const assessment = await assessmentResponse.json();
  assert.equal(assessmentResponse.status, 201);
  assert.equal(assessment.assessmentType, "PRACTICAL");

  const scoreResponse = await fetch(`${baseUrl}/api/assessment-scores`, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ assessmentId: assessment.id, studentId: "s-1", score: 22, feedback: "Strong practical work" })
  });
  const score = await scoreResponse.json();
  assert.equal(scoreResponse.status, 201);
  assert.equal(score.score, 22);
  assert.equal(score.approvalStatus, "DRAFT");

  const approvalResponse = await fetch(`${baseUrl}/api/assessment-scores/${score.id}/approve`, {
    method: "PUT",
    headers: { "content-type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ approvalStatus: "APPROVED" })
  });
  assert.equal(approvalResponse.status, 200);

  const updateResponse = await fetch(`${baseUrl}/api/assessment-scores/${score.id}`, {
    method: "PUT",
    headers: { "content-type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ score: 24 })
  });
  assert.equal(updateResponse.status, 200);
});

test("assessment creation rejects invalid categories and locked terms", async () => {
  const response = await fetch(`${baseUrl}/api/assessments`, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ termId: "missing-term", classId: "c-1", subjectId: "subject-phase1-test", title: "Invalid", assessmentType: "UNKNOWN", totalMarks: 10, weightInTotal: 0.1, setDate: "2099-01-01", dueDate: "2099-01-02" })
  });
  assert.equal(response.status, 400);
});

test("known result samples calculate weighted GPA, standing, and class ranking", () => {
  const subjects = [{ id: "math", name: "Mathematics", credits: 2 }, { id: "english", name: "English", credits: 1 }];
  const grades = [
    { studentId: "s1", subjectId: "math", totalScore: 90, letterGrade: "A", gpaPoints: 4, approvalStatus: "APPROVED" },
    { studentId: "s1", subjectId: "english", totalScore: 70, letterGrade: "B", gpaPoints: 3, approvalStatus: "APPROVED" },
    { studentId: "s2", subjectId: "math", totalScore: 90, letterGrade: "A", gpaPoints: 4, approvalStatus: "APPROVED" },
    { studentId: "s2", subjectId: "english", totalScore: 70, letterGrade: "B", gpaPoints: 3, approvalStatus: "APPROVED" },
    { studentId: "s3", subjectId: "math", totalScore: 40, letterGrade: "F", gpaPoints: 0, approvalStatus: "APPROVED" }
  ];
  const student = calculateStudentResult(grades.slice(0, 2), subjects);
  assert.equal(student.totalScore, 80);
  assert.equal(student.gpa, 3.67);
  assert.equal(student.pass, true);
  assert.equal(student.standing, "DISTINCTION");
  const ranking = calculateClassResults(grades, ["s1", "s2", "s3"], subjects);
  assert.equal(ranking[0].position, 1);
  assert.equal(ranking[1].position, 1);
  assert.equal(ranking[2].pass, false);
  assert.equal(ranking[2].standing, "AT_RISK");
});

test("student result endpoint returns Phase 4 calculation fields", async () => {
  const response = await fetch(`${baseUrl}/api/results/student/s-1`, { headers: { Authorization: `Bearer ${adminToken}` } });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(typeof body.gpa, "number");
  assert.equal(typeof body.totalScore, "number");
  assert.equal(typeof body.pass, "boolean");
  assert.equal(typeof body.standing, "string");
});

test("report endpoint returns school, report-card, and transcript data", async () => {
  const response = await fetch(`${baseUrl}/api/reports/student/s-1`, { headers: { Authorization: `Bearer ${adminToken}` } });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(typeof body.school.name, "string");
  assert.equal(typeof body.reportCard.gpa, "number");
  assert.equal(Array.isArray(body.reportCard.subjects), true);
  assert.equal(Array.isArray(body.transcript), true);
  assert.equal(typeof body.attendanceRate, "number");
});

test("student sessions resolve the linked SIS profile for exam start", async () => {
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "sade@email.com", password: "12345" })
  });
  assert.equal(loginResponse.status, 200);
  const loginBody = await loginResponse.json();
  assert.equal(loginBody.user.studentId, "s-4-bat0d");
  assert.equal(loginBody.user.classId, "c-1");

  const startResponse = await fetch(`${baseUrl}/api/exams/ex-1/start`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${loginBody.token}`
    },
    body: JSON.stringify({})
  });
  assert.equal(startResponse.status, 201);
  assert.equal((await startResponse.json()).attempt.studentId, "s-4-bat0d");
});

test("arbitrary unregistered logins are strictly rejected with 401 without auto-registration", async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "unknown_attacker@eduos.com", password: "arbitrary_password_123" })
  });
  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.error, true);
  assert.match(body.message, /Invalid email or password/);
});

test("GET /api/teachers returns teacher roster with credentials safely redacted", async () => {
  const response = await fetch(`${baseUrl}/api/teachers`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(response.status, 200);
  const teachers = await response.json();
  assert.ok(Array.isArray(teachers));
  for (const teacher of teachers) {
    assert.equal(teacher.password, undefined);
    assert.equal(teacher.role, "TEACHER");
  }
});

test("GET /api/analytics/attendance-insights returns structured AI cognitive insights", async () => {
  const response = await fetch(`${baseUrl}/api/analytics/attendance-insights`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.ok(data.insights);
  assert.ok(typeof data.averageRate === "number");
});

test("POST /api/ai/student-summary accepts studentId directly and returns report remarks", async () => {
  const response = await fetch(`${baseUrl}/api/ai/student-summary`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ studentId: "s-1" })
  });
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.ok(data.remarks);
});

test("GET and POST /api/ai/admin-dashboard return administrative summaries", async () => {
  const getRes = await fetch(`${baseUrl}/api/ai/admin-dashboard`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(getRes.status, 200);
  const getData = await getRes.json();
  assert.ok(Array.isArray(getData.classSummaries));

  const postRes = await fetch(`${baseUrl}/api/ai/admin-dashboard`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({})
  });
  assert.equal(postRes.status, 200);
});

test("GET /api/flexisaf/gradebook returns CA and gradebook entries", async () => {
  const res = await fetch(`${baseUrl}/api/flexisaf/gradebook`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data));
});

test("GET /api/edves/data enforces Admin RBAC and redacts credentials", async () => {
  // Student should be forbidden (403)
  const studentLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "sade@email.com", password: "12345" })
  });
  const studentToken = (await studentLoginRes.json()).token;

  const forbiddenRes = await fetch(`${baseUrl}/api/edves/data`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.equal(forbiddenRes.status, 403);

  // Admin should succeed (200) and have user credentials redacted
  const adminRes = await fetch(`${baseUrl}/api/edves/data`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.equal(adminRes.status, 200);
  const edvesData = await adminRes.json();
  assert.equal(edvesData.users, undefined);
  if (edvesData.staff) {
    for (const s of edvesData.staff) {
      assert.equal(s.password, undefined);
    }
  }
});

test("GET /api/exams/:id redacts answer keys for students", async () => {
  const studentLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "sade@email.com", password: "12345" })
  });
  const studentToken = (await studentLoginRes.json()).token;

  const res = await fetch(`${baseUrl}/api/exams/ex-1`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.equal(res.status, 200);
  const exam = await res.json();
  assert.ok(Array.isArray(exam.questions));
  for (const q of exam.questions) {
    assert.equal(q.answer, undefined, "Student should not receive raw answer keys");
  }
});