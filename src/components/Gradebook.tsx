import React, { useEffect, useState } from "react";
import { CheckCircle, ClipboardList, Plus } from "lucide-react";

interface GradebookProps { token: string; isAdmin?: boolean; }
const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500";

export default function Gradebook({ token, isAdmin = false }: GradebookProps) {
  const [grades, setGrades] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ studentId: "", subjectId: "", termId: "", classId: "", academicYear: "2025/2026", ca: "", exam: "", project: "", assignment: "", remarks: "" });
  const headers = { "content-type": "application/json", Authorization: `Bearer ${token}` };

  const load = async () => {
    const responses = await Promise.all(["/api/grades", "/api/students", "/api/subjects", "/api/academic-terms"].map((url) => fetch(url, { headers })));
    const data = await Promise.all(responses.map((response) => response.ok ? response.json() : []));
    setGrades(data[0]); setStudents(data[1]); setSubjects(data[2]); setTerms(data[3]);
  };
  useEffect(() => { load(); }, [token]);

  const createGrade = async (event: React.FormEvent) => {
    event.preventDefault();
    const student = students.find((item) => item.id === form.studentId);
    try {
      const response = await fetch("/api/grades", { method: "POST", headers, body: JSON.stringify({ studentId: form.studentId, subjectId: form.subjectId, termId: form.termId, classId: form.classId || student?.classId, academicYear: form.academicYear, continuousAssessmentScore: Number(form.ca || 0), examScore: Number(form.exam || 0), projectScore: Number(form.project || 0), assignmentScore: Number(form.assignment || 0), remarks: form.remarks }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to save grade");
      setMessage(`Grade saved: ${data.letterGrade} (${data.totalScore})`); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save grade"); }
  };

  const approve = async (id: string, approvalStatus: string) => {
    const response = await fetch(`/api/grades/${id}/approve`, { method: "PUT", headers, body: JSON.stringify({ approvalStatus }) });
    if (response.ok) { setMessage(`Grade ${approvalStatus.toLowerCase()}`); await load(); }
  };

  return <div className="space-y-6" id="gradebook">
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600">Phase 2 Academic Records</span><h1 className="mt-2 text-2xl font-black text-slate-800">Gradebook and approval queue</h1><p className="mt-1 text-sm text-slate-500">Enter component scores using the active school grading policy.</p></div>
    {message && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle className="h-4 w-4" />{message}</div>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2 font-bold text-slate-800"><Plus className="h-5 w-5 text-indigo-600" />Enter grade</div><form onSubmit={createGrade} className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <select required className={inputClass} value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}><option value="">Student</option>{students.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select required className={inputClass} value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}><option value="">Subject</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}</select>
      <select required className={inputClass} value={form.termId} onChange={(e) => setForm({ ...form, termId: e.target.value })}><option value="">Academic term</option>{terms.map((item) => <option key={item.id} value={item.id}>{item.academicYear} {item.termName}</option>)}</select>
      {[["ca", "CA score"], ["exam", "Exam score"], ["project", "Project score"], ["assignment", "Assignment score"]].map(([key, label]) => <input key={key} type="number" min="0" max="100" className={inputClass} placeholder={label} value={(form as any)[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />)}
      <input className={inputClass} placeholder="Teacher remark" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /><button className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold text-white"><ClipboardList className="h-4 w-4" />Save draft</button>
    </form></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Student</th><th className="p-4">Subject</th><th className="p-4">Score</th><th className="p-4">Grade</th><th className="p-4">Status</th>{isAdmin && <th className="p-4">Review</th>}</tr></thead><tbody className="divide-y divide-slate-100">{grades.map((item) => <tr key={item.id}><td className="p-4">{item.studentName || item.studentId}</td><td className="p-4">{item.subjectName || item.subjectId}</td><td className="p-4 font-mono">{item.totalScore ?? "-"}</td><td className="p-4 font-bold">{item.letterGrade || "-"}</td><td className="p-4">{item.approvalStatus || "DRAFT"}</td>{isAdmin && <td className="p-4">{item.approvalStatus !== "APPROVED" && <button className="rounded bg-emerald-600 px-2 py-1 text-xs font-bold text-white" onClick={() => approve(item.id, "APPROVED")}>Approve</button>}</td>}</tr>)}</tbody></table></section>
  </div>;
}
