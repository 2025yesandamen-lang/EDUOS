import React, { useEffect, useState } from "react";
import { BarChart3, CheckCircle, Search } from "lucide-react";

interface ResultsSummaryProps { token: string; user: any; }
const inputClass = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500";

export default function ResultsSummary({ token, user }: ResultsSummaryProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [studentId, setStudentId] = useState(user.role === "STUDENT" ? user.studentId : "");
  const [result, setResult] = useState<any | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user.role === "ADMIN" || user.role === "TEACHER") fetch("/api/students", { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.ok ? response.json() : []).then(setStudents);
  }, [token, user.role]);

  useEffect(() => {
    if (!studentId) return;
    setMessage("");
    fetch(`/api/results/student/${studentId}`, { headers: { Authorization: `Bearer ${token}` } }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.message || "Unable to load result"); setResult(data); }).catch((error) => setMessage(error.message));
  }, [studentId, token]);

  return <div className="space-y-6" id="results-summary">
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600">Phase 4 Result Calculation</span><h1 className="mt-2 text-2xl font-black text-slate-800">Academic result summary</h1><p className="mt-1 text-sm text-slate-500">Review published subject grades, GPA, standing, and pass status.</p></div>
    {(user.role === "ADMIN" || user.role === "TEACHER") && <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><Search className="h-4 w-4 text-slate-400" /><select className={inputClass} value={studentId} onChange={(event) => setStudentId(event.target.value)}>{students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></div>}
    {message && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{message}</div>}
    {result && <><div className="grid grid-cols-2 gap-4 md:grid-cols-5">{[["Average", result.totalScore], ["GPA", result.gpa], ["Subjects", result.subjectCount], ["Passed", result.passedSubjects], ["Failed", result.failedSubjects]].map(([label, value]) => <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" key={label as string}><span className="block text-xs uppercase text-slate-400">{label}</span><strong className="mt-1 block text-xl text-slate-800">{value}</strong></div>)}</div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2 font-bold text-slate-800"><BarChart3 className="h-5 w-5 text-indigo-600" />Published subject results <span className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${result.pass ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{result.pass ? "PASS" : "AT RISK"} - {result.standing}</span></div><div className="divide-y divide-slate-100">{result.subjects.map((subject: any) => <div className="flex items-center justify-between py-3 text-sm" key={subject.id}><span>{subject.subjectName}</span><span className="font-mono font-bold">{subject.totalScore} - {subject.letterGrade} ({subject.gpaPoints})</span></div>)}</div></div></>}
    {!result && !message && <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500"><CheckCircle className="h-4 w-4" />No published result records available.</div>}
  </div>;
}
