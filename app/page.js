"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";

const STATUSES = ["open","in_progress","blocked","completed","needs_verification"];
const STATUS_LABELS = {open:"Open",in_progress:"In Progress",blocked:"Blocked",completed:"Completed",needs_verification:"Needs Verification"};
const HINTS = {Innovation:"Huda Ahmed Muhammed Flatah",IT:"Abdulhamid Abu Bakr",Advisory:"Abeer Mahmoud Al-Tamimi"};

function consultantFor(source, consultants) {
  const s = source || "";
  const exact = consultants.find(c => s.includes(c.name));
  if (exact) return exact.name;
  for (const [hint,name] of Object.entries(HINTS)) if (s.includes(hint)) return name;
  return "Consolidated / execution item";
}
function bytes(n){return n ? Math.max(1,Math.round(n/1024))+" KB" : "0 KB";}
function groupLatest(rows,key){const o={}; for(const r of rows) if(!o[r[key]]) o[r[key]]=r; return o;}
function groupAll(rows,key){return rows.reduce((o,r)=>{(o[r[key]] ||= []).push(r);return o;},{});}

export default function Page(){
  const [session,setSession]=useState(null),[mode,setMode]=useState("signin"),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[authMsg,setAuthMsg]=useState("");
  const [tasks,setTasks]=useState([]),[consultants,setConsultants]=useState([]),[notes,setNotes]=useState({}),[questions,setQuestions]=useState({}),[evidence,setEvidence]=useState({});
  const [query,setQuery]=useState(""),[phase,setPhase]=useState("all"),[status,setStatus]=useState("all"),[priority,setPriority]=useState("all"),[consultant,setConsultant]=useState("all");
  const [expanded,setExpanded]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState("");

  useEffect(()=>{supabase.auth.getSession().then(({data})=>setSession(data.session));const {data}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));return()=>data.subscription.unsubscribe();},[]);
  useEffect(()=>{if(session) loadData();},[session]);

  async function auth(e){
    e.preventDefault();setBusy(true);setAuthMsg("");
    const r=mode==="signin"?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password});
    if(r.error)setAuthMsg(r.error.message);else if(mode==="signup")setAuthMsg("Account created. Check your email if confirmation is enabled.");
    setBusy(false);
  }
  async function loadData(){
    setBusy(true);setError("");
    const rs=await Promise.all([
      supabase.from("monshaat_tasks").select("*").order("phase").order("title"),
      supabase.from("monshaat_consultants").select("*").order("name"),
      supabase.from("monshaat_task_notes").select("*").order("created_at",{ascending:false}),
      supabase.from("monshaat_follow_up_questions").select("*").order("created_at",{ascending:false}),
      supabase.from("monshaat_evidence").select("*").order("created_at",{ascending:false})
    ]);
    const bad=rs.find(x=>x.error)?.error;
    if(bad)setError(bad.message);else{setTasks(rs[0].data||[]);setConsultants(rs[1].data||[]);setNotes(groupLatest(rs[2].data||[],"task_id"));setQuestions(groupAll(rs[3].data||[],"task_id"));setEvidence(groupAll(rs[4].data||[],"task_id"));}
    setBusy(false);
  }
  async function updateTask(id,patch){
    setBusy(true);
    const p={...patch,updated_at:new Date().toISOString()};
    if(patch.status==="completed"){p.progress=100;p.completed_at=new Date().toISOString();}
    else if(patch.status){p.completed_at=null;}
    const r=await supabase.from("monshaat_tasks").update(p).eq("id",id).select().single();
    if(r.error)setError(r.error.message);else setTasks(v=>v.map(t=>t.id===id?r.data:t));setBusy(false);
  }
  async function saveNote(id,value){
    if(!value.trim())return;
    const r=await supabase.from("monshaat_task_notes").insert({task_id:id,note:value.trim(),author:session.user.email}).select().single();
    if(r.error)setError(r.error.message);else setNotes(v=>({...v,[id]:r.data}));
  }
  async function addQuestion(id,value){
    if(!value.trim())return;
    const r=await supabase.from("monshaat_follow_up_questions").insert({task_id:id,question:value.trim(),status:"open"}).select().single();
    if(r.error)setError(r.error.message);else setQuestions(v=>({...v,[id]:[r.data,...(v[id]||[])]}));
  }
  async function uploadEvidence(task,file){
    if(!file)return;setBusy(true);
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_"),path=session.user.id+"/"+task.id+"/"+crypto.randomUUID()+"-"+safe;
    const u=await supabase.storage.from("monshaat-evidence").upload(path,file,{upsert:false});
    if(u.error){setError(u.error.message);setBusy(false);return;}
    const r=await supabase.from("monshaat_evidence").insert({task_id:task.id,storage_path:path,file_name:file.name,mime_type:file.type||"application/octet-stream",file_size:file.size,uploaded_by:session.user.id,verification_status:"pending"}).select().single();
    if(r.error){await supabase.storage.from("monshaat-evidence").remove([path]);setError(r.error.message);}else setEvidence(v=>({...v,[task.id]:[r.data,...(v[task.id]||[])]}));
    setBusy(false);
  }
  async function openEvidence(item){
    const r=await supabase.storage.from("monshaat-evidence").createSignedUrl(item.storage_path,300);
    if(r.error)setError(r.error.message);else window.open(r.data.signedUrl,"_blank","noopener,noreferrer");
  }
  async function deleteEvidence(item,id){
    if(!confirm("Delete this evidence file?"))return;setBusy(true);
    const a=await supabase.storage.from("monshaat-evidence").remove([item.storage_path]);
    if(a.error)setError(a.error.message);else{const r=await supabase.from("monshaat_evidence").delete().eq("id",item.id);if(r.error)setError(r.error.message);else setEvidence(v=>({...v,[id]:(v[id]||[]).filter(x=>x.id!==item.id)}));}
    setBusy(false);
  }
  async function reviewEvidence(item,statusValue){
    const r=await supabase.from("monshaat_evidence").update({verification_status:statusValue}).eq("id",item.id).select().single();
    if(r.error)setError(r.error.message);else setEvidence(v=>Object.fromEntries(Object.entries(v).map(([k,l])=>[k,l.map(x=>x.id===item.id?r.data:x)])));
  }

  const filtered=useMemo(()=>tasks.filter(t=>{
    const hay=[t.title,t.description,t.phase_name,t.source,t.owner].filter(Boolean).join(" ").toLowerCase();
    return (!query||hay.includes(query.toLowerCase()))&&(phase==="all"||String(t.phase)===phase)&&(status==="all"||t.status===status)&&(priority==="all"||t.priority===priority)&&(consultant==="all"||consultantFor(t.source,consultants)===consultant);
  }),[tasks,query,phase,status,priority,consultant,consultants]);
  const stats=useMemo(()=>{const c=s=>tasks.filter(t=>t.status===s).length,done=c("completed");return{total:tasks.length,done,progress:tasks.length?Math.round(tasks.reduce((a,t)=>a+(t.progress||0),0)/tasks.length):0,ip:c("in_progress"),blocked:c("blocked"),follow:c("needs_verification"),open:c("open"),evidence:Object.values(evidence).reduce((a,l)=>a+l.length,0),pending:Object.values(evidence).flat().filter(x=>["pending","needs_review"].includes(x.verification_status)).length};},[tasks,evidence]);
  const phases=[...new Set(tasks.map(t=>t.phase).filter(x=>x!=null))].sort((a,b)=>a-b);

  if(!session)return <main className="authShell"><section className="authCard"><div className="brand">M</div><h1>Munshaat Action Tracker</h1><p>ElderWise / SilaCares execution workbench</p><form onSubmit={auth}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required/></label><button className="primary" disabled={busy}>{busy?"Working...":mode==="signin"?"Sign in":"Create account"}</button></form>{authMsg&&<div className="notice">{authMsg}</div>}<button className="linkButton" onClick={()=>{setMode(mode==="signin"?"signup":"signin");setAuthMsg("")}}>{mode==="signin"?"Need an account? Create one":"Already have an account? Sign in"}</button><p className="fine">Private application. Data and evidence are protected by Supabase Auth and RLS.</p></section></main>;

  return <main className="shell">
    <header className="hero"><div><div className="eyebrow">ELDERWISE / SILACARES</div><h1>Monshaat Action Tracker</h1><p>Recommendations → execution → evidence → follow-up</p></div><div className="heroActions"><span>{session.user.email}</span><button onClick={()=>supabase.auth.signOut()}>Sign out</button></div></header>
    <div className="notice dark">Execution aid only. Legal, medical, regulatory, and opportunity details require official verification before reliance.</div>
    <section className="stats">{[["Total Tasks",stats.total,""],["Completed",stats.done,"green"],["Progress",stats.progress+"%","blue"],["In Progress",stats.ip,""],["Blocked",stats.blocked,"red"],["Follow-up",stats.follow,"amber"],["Evidence",stats.evidence,""],["Verification Pending",stats.pending,"purple"]].map(x=><div className="stat" key={x[0]}><span>{x[0]}</span><strong className={x[2]}>{x[1]}</strong></div>)}</section>
    <section className="toolbar"><input placeholder="Search tasks, sources, owners..." value={query} onChange={e=>setQuery(e.target.value)}/><select value={phase} onChange={e=>setPhase(e.target.value)}><option value="all">All phases</option>{phases.map(p=><option key={p} value={p}>Phase {p}</option>)}</select><select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All statuses</option>{STATUSES.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select><select value={priority} onChange={e=>setPriority(e.target.value)}><option value="all">All priorities</option>{["critical","high","medium","low"].map(s=><option key={s} value={s}>{s}</option>)}</select><select value={consultant} onChange={e=>setConsultant(e.target.value)}><option value="all">All consultants</option>{consultants.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}</select><button onClick={loadData}>{busy?"Refreshing...":"Refresh"}</button></section>
    {error&&<div className="error">{error}<button onClick={()=>setError("")}>×</button></div>}
    <section className="phaseSummary">{phases.map(p=>{const rows=tasks.filter(t=>t.phase===p),done=rows.filter(t=>t.status==="completed").length;return <div key={p}><b>Phase {p}</b><span>{done}/{rows.length}</span><div className="miniBar"><i style={{width:rows.length?(done/rows.length*100)+"%":"0%"}}/></div></div>})}</section>
    <section className="taskList">{filtered.map(task=>{const open=expanded===task.id,ev=evidence[task.id]||[],qs=questions[task.id]||[],note=notes[task.id]?.note||"";return <article className={"taskCard "+(task.status==="completed"?"done":"")} key={task.id}>
      <div className="taskMain"><div className="taskTop"><span className="phaseTag">P{task.phase}</span><span className={"priority "+task.priority}>{task.priority}</span><span className={"status "+task.status}>{STATUS_LABELS[task.status]}</span>{task.needs_verification&&<span className="verify">Needs verification</span>}</div><h2>{task.title}</h2><p>{task.description}</p><div className="meta"><span>Consultant: <b>{consultantFor(task.source,consultants)}</b></span><span>Source: {task.source||"—"}</span></div><div className="progressLine"><i style={{width:(task.progress||0)+"%"}}/></div></div>
      <div className="taskControls"><select value={task.status} onChange={e=>updateTask(task.id,{status:e.target.value})}>{STATUSES.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}</select><input type="number" min="0" max="100" value={task.progress||0} onChange={e=>updateTask(task.id,{progress:Math.max(0,Math.min(100,Number(e.target.value)))})}/><button onClick={()=>setExpanded(open?null:task.id)}>{open?"Close":"Open task"}</button></div>
      {open&&<div className="detail"><div className="detailGrid">
        <section><h3>Progress note</h3><textarea defaultValue={note} placeholder="What was done, what remains, and what changed?" id={"note-"+task.id}/><button className="small" onClick={()=>saveNote(task.id,document.getElementById("note-"+task.id).value)}>Save note</button></section>
        <section><h3>Blocker / reason not completed</h3><textarea defaultValue={task.blocker_reason||""} placeholder="Why is this blocked or still open?" id={"block-"+task.id}/><button className="small" onClick={()=>updateTask(task.id,{blocker_reason:document.getElementById("block-"+task.id).value||null})}>Save blocker</button></section>
        <section><h3>Follow-up question</h3><div className="questionAdd"><input placeholder="Question for Monshaat..." id={"q-"+task.id}/><button className="small" onClick={()=>{const el=document.getElementById("q-"+task.id);addQuestion(task.id,el.value);el.value=""}}>Add</button></div><div className="items">{qs.map(q=><div className="item" key={q.id}><span>{q.question}</span><select value={q.status} onChange={async e=>{const s=e.target.value,r=await supabase.from("monshaat_follow_up_questions").update({status:s,answered_at:s==="answered"?new Date().toISOString():null}).eq("id",q.id);if(r.error)setError(r.error.message);else setQuestions(v=>({...v,[task.id]:v[task.id].map(x=>x.id===q.id?{...x,status:s}:x)}));}}><option value="open">Open</option><option value="answered">Answered</option><option value="dismissed">Dismissed</option></select></div>)}</div></section>
        <section><h3>Evidence</h3><label className="upload">Upload evidence<input type="file" onChange={e=>uploadEvidence(task,e.target.files?.[0])}/></label><div className="items">{ev.map(item=><div className="item evidence" key={item.id}><span>📎 {item.file_name}<small>{bytes(item.file_size)} · {item.verification_status}</small></span><div><button className="tiny" onClick={()=>openEvidence(item)}>Open</button><select value={item.verification_status} onChange={e=>reviewEvidence(item,e.target.value)}><option value="pending">Pending</option><option value="needs_review">Needs Review</option><option value="verified">Verified</option><option value="rejected">Rejected</option></select><button className="tiny danger" onClick={()=>deleteEvidence(item,task.id)}>Delete</button></div></div>)}</div><p className="fine">Files remain in private Supabase Storage. Evidence review never auto-completes a task.</p></section>
      </div></div>}
    </article>)}{!filtered.length&&<div className="empty">No tasks match the current filters.</div>}</section>
    <footer>Munshaat · {stats.open} open · {stats.done} completed · live Supabase state</footer>
  </main>;
}