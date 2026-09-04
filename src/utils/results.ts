export interface ResultGrade {
  studentId: string;
  subjectId: string;
  totalScore?: number;
  letterGrade?: string;
  gpaPoints?: number;
  approvalStatus?: string;
}

export interface ResultSubject {
  id: string;
  name?: string;
  credits?: number;
}

export function isPublishedGrade(grade: ResultGrade): boolean {
  return !grade.approvalStatus || grade.approvalStatus === "APPROVED";
}

export function calculateStudentResult(grades: ResultGrade[], subjects: ResultSubject[]) {
  const subjectMap = new Map(subjects.map((subject) => [subject.id, subject]));
  const published = grades.filter(isPublishedGrade);
  const creditTotal = published.reduce((sum, grade) => sum + (subjectMap.get(grade.subjectId)?.credits || 1), 0);
  const weightedPoints = published.reduce((sum, grade) => sum + (grade.gpaPoints || 0) * (subjectMap.get(grade.subjectId)?.credits || 1), 0);
  const totalScore = published.length ? published.reduce((sum, grade) => sum + (grade.totalScore || 0), 0) / published.length : 0;
  const passedSubjects = published.filter((grade) => (grade.letterGrade || "F") !== "F").length;
  const failedSubjects = published.length - passedSubjects;
  const gpa = creditTotal ? weightedPoints / creditTotal : 0;
  return {
    subjectCount: published.length,
    subjects: published.map((grade) => ({ ...grade, subjectName: subjectMap.get(grade.subjectId)?.name || grade.subjectId })),
    totalScore: Math.round(totalScore * 100) / 100,
    gpa: Math.round(gpa * 100) / 100,
    passedSubjects,
    failedSubjects,
    pass: published.length > 0 && failedSubjects === 0,
    standing: getAcademicStanding(gpa, failedSubjects === 0 && published.length > 0)
  };
}

export function calculateClassResults(grades: ResultGrade[], studentIds: string[], subjects: ResultSubject[]) {
  const results = studentIds.map((studentId) => ({ studentId, ...calculateStudentResult(grades.filter((grade) => grade.studentId === studentId), subjects) }))
    .sort((left, right) => right.totalScore - left.totalScore);
  let previousScore: number | null = null;
  let previousPosition = 0;
  return results.map((result, index) => {
    const position = previousScore === result.totalScore ? previousPosition : index + 1;
    previousScore = result.totalScore;
    previousPosition = position;
    return { ...result, position };
  });
}

export function getAcademicStanding(gpa: number, passed: boolean): string {
  if (!passed) return "AT_RISK";
  if (gpa >= 3.5) return "DISTINCTION";
  if (gpa >= 3.0) return "EXCELLENT";
  if (gpa >= 2.5) return "GOOD";
  if (gpa >= 2.0) return "SATISFACTORY";
  return "AT_RISK";
}
