import React, { useEffect, useState } from "react";
import { CheckCircle, ClipboardCheck, Plus } from "lucide-react";

interface ContinuousAssessmentProps { token: string; isAdmin?: boolean; }
const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500";
const categories = ["TEST", "QUIZ", "ASSIGNMENT", "PROJECT", "PRACTICAL", "PRESENTATION", "PARTICIPATION"];

export default function ContinuousAssessment({ token, isAdmin = false }: ContinuousAssessmentProps) {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ termId: "", classId: "", subjectId: "", title: "", assessmentType: "TEST", totalMarks: "10", weightInTotal: "0.1", setDate: "", dueDate: "" });
  const [scoreForm, setScoreForm] = useState({ assessmentId: "", studentId: "", score: "", feedback: "" });
  const headers = { "content-type": "application/json", Authorization: `Bearer ${token}` };

  const load = async () => {
    const urls = ["/api/assessments", "/api/assessment-scores", "/api/students", "/api/subjects", "/api/classes", "/api/academic-terms"];
    const responses = await Promise.all(urls.map((url) => fetch(url, { headers })));
    const data = await Promise.all(responses.map((response) => response.ok ? response.json() : []));
    setAssessments(data[0]); setScores(data[1]); setStudents(data[2]); setSubjects(data[3]); setClasses(data[4]); setTerms(data[5]);
  };
  useEffect(() => { load(); }, [token]);

  const submit = async (url: string, body: unknown) => {
    const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Request failed");
    setMessage("Saved successfully"); await load();
  };
  const reviewScore = async (id: string, approvalStatus: string) => {
    const response = await fetch(`/api/assessment-scores/${id}/approve`, { method: "PUT", headers, body: JSON.stringify({ approvalStatus }) });
    const data = await response.json();
    setMessage(response.ok ? `Score ${approvalStatus.toLowerCase()}` : data.message || "Review failed");
    if (response.ok) await load();
  };

  return <div className="space-y-6" id="continuous-assessment">
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600">Phase 3 Continuous Assessment</span><h1 className="mt-2 text-2xl font-black text-slate-800">Assessment register and score entry</h1><p className="mt-1 text-sm text-slate-500">Create weighted class work and submit student scores for approval.</p></div>
    {message && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle className="h-4 w-4" />{message}</div>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center gap-2 font-bold text-slate-800"><Plus className="h-5 w-5 text-indigo-600" />Create assessment</div><form onSubmit={async (event) => { event.preventDefault(); try { await submit("/api/assessments", { ...form, totalMarks: Number(form.totalMarks), weightInTotal: Number(form.weightInTotal) }); } catch (error) { setMessage(error instanceof Error ? error.message : "Request failed"); } }} className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <input required className={inputClass} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <select required className={inputClass} value={form.assessmentType} onChange={(e) => setForm({ ...form, assessmentType: e.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select>
      <select required className={inputClass} value={form.termId} onChange={(e) => setForm({ ...form, termId: e.target.value })}><option value="">Academic term</option>{terms.map((item) => <option key={item.id} value={item.id}>{item.academicYear} {item.termName}</option>)}</select>
      <select required className={inputClass} value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}><option value="">Class</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select required className={inputClass} value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}><option value="">Subject</option>{subjects.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}</select>
      <input required type="number" min="1" className={inputClass} placeholder="Total marks" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} />
      <input required type="number" min="0.01" max="1" step="0.01" className={inputClass} placeholder="Weight, e.g. 0.1" value={form.weightInTotal} onChange={(e) => setForm({ ...form, weightInTotal: e.target.value })} />
      <input required type="date" className={inputClass} value={form.setDate} onChange={(e) => setForm({ ...form, setDate: e.target.value })} /><input required type="date" className={inputClass} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
      <button className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold text-white"><ClipboardCheck className="h-4 w-4" />Save assessment</button>
    </form></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 font-bold text-slate-800">Enter student score</div><form onSubmit={async (event) => { event.preventDefault(); try { await submit("/api/assessment-scores", { ...scoreForm, score: Number(scoreForm.score) }); } catch (error) { setMessage(error instanceof Error ? error.message : "Request failed"); } }} className="grid grid-cols-1 gap-3 md:grid-cols-4">
      <select required className={inputClass} value={scoreForm.assessmentId} onChange={(e) => setScoreForm({ ...scoreForm, assessmentId: e.target.value })}><option value="">Assessment</option>{assessments.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
      <select required className={inputClass} value={scoreForm.studentId} onChange={(e) => setScoreForm({ ...scoreForm, studentId: e.target.value })}><option value="">Student</option>{students.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <input required type="number" min="0" className={inputClass} placeholder="Score" value={scoreForm.score} onChange={(e) => setScoreForm({ ...scoreForm, score: e.target.value })} /><input className={inputClass} placeholder="Feedback" value={scoreForm.feedback} onChange={(e) => setScoreForm({ ...scoreForm, feedback: e.target.value })} />
      <button className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-bold text-white">Save score draft</button>
    </form></section>
    <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Assessment</th><th className="p-4">Student</th><th className="p-4">Score</th><th className="p-4">Status</th>{isAdmin && <th className="p-4">Review</th>}</tr></thead><tbody className="divide-y divide-slate-100">{scores.map((item) => <tr key={item.id}><td className="p-4">{assessments.find((assessment) => assessment.id === item.assessmentId)?.title || item.assessmentId}</td><td className="p-4">{students.find((student) => student.id === item.studentId)?.name || item.studentId}</td><td className="p-4 font-mono">{item.score}</td><td className="p-4">{item.approvalStatus}</td>{isAdmin && <td className="p-4">{item.approvalStatus !== "APPROVED" && <button className="rounded bg-emerald-600 px-2 py-1 text-xs font-bold text-white" onClick={() => reviewScore(item.id, "APPROVED")}>Approve</button>}</td>}</tr>)}</tbody></table></section>
  </div>;
}
