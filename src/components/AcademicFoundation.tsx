import React, { useEffect, useState } from "react";
import { BookOpen, CalendarDays, CheckCircle, Plus, School } from "lucide-react";

interface AcademicFoundationProps {
  token: string;
}

const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500";

export default function AcademicFoundation({ token }: AcademicFoundationProps) {
  const [terms, setTerms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [term, setTerm] = useState({ academicYear: "2025/2026", termName: "FIRST", termNumber: 1, startDate: "", endDate: "", resultPublishDate: "", promotionDate: "" });
  const [subject, setSubject] = useState({ name: "", code: "", department: "", subjectTeacher: "", stream: "", academicYear: "2025/2026", termName: "", assignedClassIds: [] as string[], isActive: true });
  const [schoolClass, setSchoolClass] = useState({ name: "", level: "JS1", stream: "General", academicYear: "2025/2026", room: "", primaryTeacher: "" });

  const headers = { "content-type": "application/json", Authorization: `Bearer ${token}` };
  const load = async () => {
    const [termResponse, subjectResponse, classResponse] = await Promise.all([
      fetch("/api/academic-terms", { headers }),
      fetch("/api/subjects", { headers }),
      fetch("/api/classes", { headers })
    ]);
    setTerms(termResponse.ok ? await termResponse.json() : []);
    setSubjects(subjectResponse.ok ? await subjectResponse.json() : []);
    setClasses(classResponse.ok ? await classResponse.json() : []);
  };

  useEffect(() => { load(); }, [token]);

  const submit = async (url: string, body: unknown) => {
    const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Request failed");
    setMessage("Saved successfully");
    await load();
  };

  return (
    <div className="space-y-6" id="academic-foundation">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600">Phase 1 Academic Foundation</span>
        <h1 className="mt-2 text-2xl font-black text-slate-800">Terms, subjects, classes and streams</h1>
        <p className="mt-1 text-sm text-slate-500">Maintain the structures that academic records will reference.</p>
      </div>
      {message && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle className="h-4 w-4" />{message}</div>}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 font-bold text-slate-800"><CalendarDays className="h-5 w-5 text-indigo-600" />Academic terms</div>
          <form className="space-y-3" onSubmit={async (event) => { event.preventDefault(); try { await submit("/api/academic-terms", term); } catch (error) { setMessage(error instanceof Error ? error.message : "Request failed"); } }}>
            <input className={inputClass} value={term.academicYear} onChange={(e) => setTerm({ ...term, academicYear: e.target.value })} placeholder="Academic year" />
            <select className={inputClass} value={term.termName} onChange={(e) => setTerm({ ...term, termName: e.target.value, termNumber: ["FIRST", "SECOND", "THIRD"].indexOf(e.target.value) + 1 })}><option>FIRST</option><option>SECOND</option><option>THIRD</option></select>
            <div className="grid grid-cols-2 gap-2"><input required type="date" className={inputClass} value={term.startDate} onChange={(e) => setTerm({ ...term, startDate: e.target.value })} /><input required type="date" className={inputClass} value={term.endDate} onChange={(e) => setTerm({ ...term, endDate: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2"><input type="date" className={inputClass} value={term.resultPublishDate} onChange={(e) => setTerm({ ...term, resultPublishDate: e.target.value })} /><input type="date" className={inputClass} value={term.promotionDate} onChange={(e) => setTerm({ ...term, promotionDate: e.target.value })} /></div>
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold text-white"><Plus className="h-4 w-4" />Create term</button>
          </form>
          <div className="mt-5 space-y-2">{terms.map((item) => <div className="flex justify-between rounded-lg bg-slate-50 p-3 text-sm" key={item.id}><span>{item.academicYear} {item.termName}</span><span className="font-bold text-indigo-600">{item.status}</span></div>)}</div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 font-bold text-slate-800"><BookOpen className="h-5 w-5 text-teal-600" />Subjects</div>
          <form className="space-y-3" onSubmit={async (event) => { event.preventDefault(); try { await submit("/api/subjects", subject); } catch (error) { setMessage(error instanceof Error ? error.message : "Request failed"); } }}>
            <input required className={inputClass} value={subject.name} onChange={(e) => setSubject({ ...subject, name: e.target.value })} placeholder="Subject name" />
            <input required className={inputClass} value={subject.code} onChange={(e) => setSubject({ ...subject, code: e.target.value.toUpperCase() })} placeholder="Subject code" />
            <input className={inputClass} value={subject.department} onChange={(e) => setSubject({ ...subject, department: e.target.value })} placeholder="Department or category" />
            <input className={inputClass} value={subject.subjectTeacher} onChange={(e) => setSubject({ ...subject, subjectTeacher: e.target.value })} placeholder="Subject teacher" />
            <div className="grid grid-cols-2 gap-2"><input className={inputClass} value={subject.stream} onChange={(e) => setSubject({ ...subject, stream: e.target.value })} placeholder="Stream" /><input className={inputClass} value={subject.academicYear} onChange={(e) => setSubject({ ...subject, academicYear: e.target.value })} placeholder="Session" /></div>
            <select className={inputClass} value={subject.termName} onChange={(e) => setSubject({ ...subject, termName: e.target.value })}><option value="">All terms</option><option>FIRST</option><option>SECOND</option><option>THIRD</option></select>
            <div className="space-y-1 rounded-lg border border-slate-200 p-2"><span className="text-xs font-bold text-slate-500">Assigned classes</span>{classes.map((item) => <label className="flex items-center gap-2 text-xs" key={item.id}><input type="checkbox" checked={subject.assignedClassIds.includes(item.id)} onChange={(e) => setSubject({ ...subject, assignedClassIds: e.target.checked ? [...subject.assignedClassIds, item.id] : subject.assignedClassIds.filter((id) => id !== item.id) })} />{item.name}</label>)}</div>
            <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={subject.isActive} onChange={(e) => setSubject({ ...subject, isActive: e.target.checked })} />Active subject</label>
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-bold text-white"><Plus className="h-4 w-4" />Create subject</button>
          </form>
          <div className="mt-5 space-y-2">{subjects.map((item) => <div className="flex justify-between rounded-lg bg-slate-50 p-3 text-sm" key={item.id}><span>{item.name}</span><span className="font-mono text-teal-700">{item.code}</span></div>)}</div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 font-bold text-slate-800"><School className="h-5 w-5 text-amber-600" />Classes and streams</div>
          <form className="space-y-3" onSubmit={async (event) => { event.preventDefault(); try { await submit("/api/classes", schoolClass); } catch (error) { setMessage(error instanceof Error ? error.message : "Request failed"); } }}>
            <input required className={inputClass} value={schoolClass.name} onChange={(e) => setSchoolClass({ ...schoolClass, name: e.target.value })} placeholder="Class name, e.g. JS1 Science" />
            <div className="grid grid-cols-2 gap-2"><select className={inputClass} value={schoolClass.level} onChange={(e) => setSchoolClass({ ...schoolClass, level: e.target.value })}><option>JS1</option><option>JS2</option><option>JS3</option><option>SS1</option><option>SS2</option><option>SS3</option><option>OTHER</option></select><input className={inputClass} value={schoolClass.stream} onChange={(e) => setSchoolClass({ ...schoolClass, stream: e.target.value })} placeholder="Stream" /></div>
            <input className={inputClass} value={schoolClass.academicYear} onChange={(e) => setSchoolClass({ ...schoolClass, academicYear: e.target.value })} placeholder="Academic session" />
            <input className={inputClass} value={schoolClass.room} onChange={(e) => setSchoolClass({ ...schoolClass, room: e.target.value })} placeholder="Room" />
            <input className={inputClass} value={schoolClass.primaryTeacher} onChange={(e) => setSchoolClass({ ...schoolClass, primaryTeacher: e.target.value })} placeholder="Primary teacher" />
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-bold text-white"><Plus className="h-4 w-4" />Create class</button>
          </form>
          <div className="mt-5 space-y-2">{classes.map((item) => <div className="rounded-lg bg-slate-50 p-3 text-sm" key={item.id}><div className="flex justify-between"><span className="font-bold">{item.name}</span><span>{item.level}</span></div><span className="text-xs text-slate-500">{item.academicYear} - {item.stream}</span></div>)}</div>
        </section>
      </div>
    </div>
  );
}
