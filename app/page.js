"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabase";

const STATUSES = ["open", "in_progress", "blocked", "completed", "needs_verification"];
const STATUS_LABELS = {
  open: "Open",
  in_progress: "In Progress",
  blocked: "Blocked",
  completed: "Completed",
  needs_verification: "Needs Verification"
};
const PRIORITIES = ["critical", "high", "medium", "low"];\nconst INACTIVITY_MS = 10 * 60 * 1000;\nconst LOGIN_MAX_FAILURES = 5;\nconst LOGIN_LOCKOUT_MS = 60 * 1000;\nconst LAST_ACTIVITY_KEY = "munshaat:last-activity";
const HINTS = {
  Innovation: "Huda Ahmed Muhammed Flatah",
  IT: "Abdulhamid Abu Bakr",
  Advisory: "Abeer Mahmoud Al-Tamimi"
};

function consultantFor(source, consultants) {
  const s = source || "";
  const exact = consultants.find((c) => s.includes(c.name));
  if (exact) return exact.name;
  for (const [hint, name] of Object.entries(HINTS)) {
    if (s.includes(hint)) return name;
  }
  return "Consolidated / execution item";
}

function bytes(n) {
  return n ? Math.max(1, Math.round(n / 1024)) + " KB" : "0 KB";
}

function groupLatest(rows, key) {
  const result = {};
  for (const row of rows) {
    if (!result[row[key]]) result[row[key]] = row;
  }
  return result;
}

function groupAll(rows, key) {
  return rows.reduce((result, row) => {
    if (!result[row[key]]) result[row[key]] = [];
    result[row[key]].push(row);
    return result;
  }, {});
}

function StatCards({ stats }) {
  const cards = [
    ["Total Tasks", stats.total, ""],
    ["Completed", stats.done, "green"],
    ["Progress", stats.progress + "%", "blue"],
    ["In Progress", stats.ip, ""],
    ["Blocked", stats.blocked, "red"],
    ["Follow-up", stats.follow, "amber"],
    ["Evidence", stats.evidence, ""],
    ["Verification Pending", stats.pending, "purple"]
  ];
  return (
    <section className="stats">
      {cards.map(([label, value, cls]) => (
        <div className="stat" key={label}>
          <span>{label}</span>
          <strong className={cls}>{value}</strong>
        </div>
      ))}
    </section>
  );
}

function TaskCard({
  task,
  consultants,
  expanded,
  setExpanded,
  evidence,
  questions,
  note,
  updateTask,
  saveNote,
  addQuestion,
  updateQuestionStatus,
  uploadEvidence,
  openEvidence,
  deleteEvidence,
  reviewEvidence,
  analyzeEvidence,
  evidenceAnalysis,
  recommendations
}) {
  const isOpen = expanded === task.id;
  const ev = evidence[task.id] || [];
  const qs = questions[task.id] || [];
  const recommendation = recommendations.find((r) => r.id === task.recommendation_id);

  return (
    <article className={"taskCard " + (task.status === "completed" ? "done" : "")}>
      <div className="taskMain">
        <div className="taskTop">
          <span className="phaseTag">P{task.phase}</span>
          <span className={"priority " + task.priority}>{task.priority}</span>
          <span className={"status " + task.status}>{STATUS_LABELS[task.status]}</span>
          {task.needs_verification && <span className="verify">Needs verification</span>}
        </div>
        <h2>{task.title}</h2>
        <p>{task.description}</p>
        <div className="meta">
          <span>
            Consultant: <b>{consultantFor(task.source, consultants)}</b>
          </span>
          <span>Source: {task.source || "—"}</span>
          {recommendation?.received_date && <span>Received: {recommendation.received_date}</span>}
          <span>Due: {task.due_date || "Not set"}</span>
        </div>
        <div className="progressLine">
          <i style={{ width: (task.progress || 0) + "%" }} />
        </div>
      </div>

      <div className="taskControls">
        <select
          value={task.status}
          onChange={(e) => updateTask(task.id, { status: e.target.value })}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          max="100"
          value={task.progress || 0}
          onChange={(e) =>
            updateTask(task.id, {
              progress: Math.max(0, Math.min(100, Number(e.target.value)))
            })
          }
        />
        <input
          type="date"
          value={task.due_date || ""}
          title="Optional due date / urgency timeline"
          onChange={(e) => updateTask(task.id, { due_date: e.target.value || null })}
        />
        <button onClick={() => setExpanded(isOpen ? null : task.id)}>
          {isOpen ? "Close" : "Open task"}
        </button>
      </div>

      {isOpen && (
        <div className="detail">
          <div className="detailGrid">
            <section>
              <h3>Progress note</h3>
              <textarea
                defaultValue={note}
                placeholder="What was done, what remains, and what changed?"
                id={"note-" + task.id}
              />
              <button
                className="small"
                onClick={() =>
                  saveNote(
                    task.id,
                    document.getElementById("note-" + task.id).value
                  )
                }
              >
                Save note
              </button>
            </section>

            <section>
              <h3>Blocker / reason not completed</h3>
              <textarea
                defaultValue={task.blocker_reason || ""}
                placeholder="Why is this blocked or still open?"
                id={"block-" + task.id}
              />
              <button
                className="small"
                onClick={() =>
                  updateTask(task.id, {
                    blocker_reason:
                      document.getElementById("block-" + task.id).value || null
                  })
                }
              >
                Save blocker
              </button>
            </section>

            <section>
              <h3>Follow-up question</h3>
              <div className="questionAdd">
                <input
                  placeholder="Question for Monshaat..."
                  id={"q-" + task.id}
                />
                <button
                  className="small"
                  onClick={() => {
                    const el = document.getElementById("q-" + task.id);
                    addQuestion(task.id, el.value);
                    el.value = "";
                  }}
                >
                  Add
                </button>
              </div>
              <div className="items">
                {qs.map((q) => (
                  <div className="item" key={q.id}>
                    <span>{q.question}</span>
                    <select
                      value={q.status}
                      onChange={(e) =>
                        updateQuestionStatus(q.id, task.id, e.target.value)
                      }
                    >
                      <option value="open">Open</option>
                      <option value="answered">Answered</option>
                      <option value="dismissed">Dismissed</option>
                    </select>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3>Evidence</h3>
              <label className="upload">
                Upload evidence
                <input
                  type="file"
                  onChange={(e) => uploadEvidence(task, e.target.files?.[0])}
                />
              </label>
              <div className="items">
                {ev.map((item) => (
                  <div className="item evidence" key={item.id}>
                    <span>
                      📎 {item.file_name}
                      <small>
                        {bytes(item.file_size)} · {item.verification_status}
                      </small>
                    </span>
                    <div>
                      <button className="tiny" onClick={() => openEvidence(item)}>
                        Open
                      </button>
                      <button className="tiny" onClick={() => analyzeEvidence(item, task)}>
                        Analyze AI
                      </button>
                      <select
                        value={item.verification_status}
                        onChange={(e) => reviewEvidence(item, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="needs_review">Needs Review</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <button
                        className="tiny danger"
                        onClick={() => deleteEvidence(item, task.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {ev.map((item) => evidenceAnalysis[item.id] && (
                <div className="aiResult" key={"analysis-" + item.id}>
                  <b>AI assessment: {evidenceAnalysis[item.id].result}</b>
                  <span>Confidence: {Math.round((evidenceAnalysis[item.id].confidence || 0) * 100)}%</span>
                  <p>{evidenceAnalysis[item.id].rationale}</p>
                  {evidenceAnalysis[item.id].missing_items?.length > 0 && (
                    <small>Missing: {evidenceAnalysis[item.id].missing_items.join("; ")}</small>
                  )}
                </div>
              ))}
              <p className="fine">
                Files remain in private Supabase Storage. AI review is advisory and never auto-completes a task.
              </p>
            </section>
          </div>
        </div>
      )}
    </article>
  );
}

function EmailIntake({
  emailFile,
  setEmailFile,
  emailInputMode,
  setEmailInputMode,
  emailText,
  setEmailText,
  emailReceivedDate,
  setEmailReceivedDate,
  emailBusy,
  emailAnalysis,
  emailStatus,
  canAnalyzeEmail,
  onAnalyze,
  onApprove
}) {
  return (
    <section className="emailPanel">
      <div className="panelHead">
        <div>
          <div className="eyebrow">CONSULTANT EMAIL INTAKE</div>
          <h2>Upload or paste a consultant email</h2>
          <p>Arabic emails can be analyzed and converted into proposed recommendations and executable tasks.</p>
        </div>
      </div>

      <div className="emailModeTabs">
        <button
          type="button"
          className={emailInputMode === "file" ? "active" : ""}
          onClick={() => {
            setEmailInputMode("file");
            setEmailText("");
          }}
        >
          Upload file
        </button>
        <button
          type="button"
          className={emailInputMode === "paste" ? "active" : ""}
          onClick={() => {
            setEmailInputMode("paste");
            setEmailFile(null);
          }}
        >
          Paste email content
        </button>
      </div>

      <div className="emailForm">
        {emailInputMode === "file" ? (
          <label className="upload">Choose email/document
            <input
              type="file"
              accept=".eml,.txt,.html,.htm,.pdf,image/*"
              onChange={(e) => setEmailFile(e.target.files?.[0] || null)}
            />
          </label>
        ) : (
          <label className="pasteField">
            Paste consultant email
            <textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              placeholder="Paste the complete Arabic or English consultant email here..."
              rows={12}
              maxLength={200000}
            />
            <span className="fine">{emailText.length.toLocaleString()} / 200,000 characters</span>
          </label>
        )}

        <label>Recommendation received date <span className="fine">(optional)</span>
          <input type="date" value={emailReceivedDate} onChange={(e) => setEmailReceivedDate(e.target.value)} />
        </label>
        <button className="primary" disabled={!canAnalyzeEmail || emailBusy} onClick={onAnalyze}>
          {emailBusy ? "Analyzing..." : "Analyze email"}
        </button>
      </div>

      {emailFile && <div className="notice">Selected: <b>{emailFile.name}</b> · {Math.round(emailFile.size / 1024)} KB</div>}
      {emailStatus && <div className="notice">{emailStatus}</div>}

      {emailAnalysis && (
        <div className="emailAnalysis">
          <div className="analysisTop">
            <div><b>Consultant:</b> {emailAnalysis.consultant_name || "Not identified"}</div>
            <div><b>Received:</b> {emailAnalysis.received_date || emailReceivedDate || "Not identified"}</div>
          </div>
          <p>{emailAnalysis.summary}</p>
          {(emailAnalysis.recommendations || []).map((rec, i) => (
            <article className="proposal" key={i}>
              <div className="taskTop"><span className={"priority " + rec.priority}>{rec.priority}</span><b>{rec.title}</b></div>
              <p>{rec.description}</p>
              <small>Source: {rec.source_excerpt || "—"}</small>
              <ul>{(rec.tasks || []).map((t, j) => <li key={j}><b>{t.title}</b>{t.due_date ? " · due " + t.due_date : " · no deadline stated"}</li>)}</ul>
            </article>
          ))}
          <button className="primary" onClick={onApprove} disabled={emailBusy}>Add approved recommendations & tasks to tracker</button>
          <p className="fine">Review the AI proposal before adding it. The source email is not treated as a legal or regulatory authority.</p>
        </div>
      )}
    </section>
  );
}

export default function Page() {
  const [session, setSession] = useState(null);
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMsg, setAuthMsg] = useState("");
  const [tasks, setTasks] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [notes, setNotes] = useState({});
  const [questions, setQuestions] = useState({});
  const [evidence, setEvidence] = useState({});
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState("all");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [consultant, setConsultant] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [recommendations, setRecommendations] = useState([]);
  const [sortBy, setSortBy] = useState("received_desc");
  const [emailFile, setEmailFile] = useState(null);
  const [emailReceivedDate, setEmailReceivedDate] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailAnalysis, setEmailAnalysis] = useState(null);
  const [emailStatus, setEmailStatus] = useState("");
  const [emailRecordId, setEmailRecordId] = useState(null);
  const [evidenceAnalysis, setEvidenceAnalysis] = useState({});

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;

      if (data.session) {
        const lastActivity = Number(window.localStorage.getItem(LAST_ACTIVITY_KEY) || "0");
        if (lastActivity && Date.now() - lastActivity >= INACTIVITY_MS) {
          await supabase.auth.signOut({ scope: "local" });
          window.localStorage.removeItem(LAST_ACTIVITY_KEY);
          setAuthMsg("Your previous session expired after 10 minutes of inactivity. Please sign in again.");
          setSession(null);
          return;
        }

        window.localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
        setSession(data.session);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession) {
        window.localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
      } else {
        window.localStorage.removeItem(LAST_ACTIVITY_KEY);
      }
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    let lastActivity = Date.now();
    const activityEvents = ["pointerdown", "keydown", "touchstart", "scroll", "mousemove"];

    const markActivity = () => {
      lastActivity = Date.now();
      window.localStorage.setItem(LAST_ACTIVITY_KEY, String(lastActivity));
    };

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true });
    });

    const timer = window.setInterval(async () => {
      if (Date.now() - lastActivity >= INACTIVITY_MS) {
        window.clearInterval(timer);
        window.localStorage.removeItem(LAST_ACTIVITY_KEY);
        await supabase.auth.signOut({ scope: "local" });
        setSession(null);
        setAuthMsg("You were signed out after 10 minutes of inactivity. Please sign in again.");
      }
    }, 5000);

    return () => {
      window.clearInterval(timer);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
      });
    };
  }, [session]);

  useEffect(() => {
    if (session) loadData();
  }, [session]);

  async function auth(e) {
    e.preventDefault();

    const now = Date.now();
    if (now < loginBlockedUntil) {
      const seconds = Math.ceil((loginBlockedUntil - now) / 1000);
      setAuthMsg("Too many sign-in attempts. Try again in " + seconds + " seconds.");
      return;
    }

    setBusy(true);
    setAuthMsg("");

    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              emailRedirectTo: window.location.origin
            }
          });

    if (result.error) {
      const nextFailures = loginFailures + 1;
      if (nextFailures >= LOGIN_MAX_FAILURES) {
        setLoginFailures(0);
        setLoginBlockedUntil(Date.now() + LOGIN_LOCKOUT_MS);
        setAuthMsg("Too many failed attempts. Sign-in is temporarily locked for 60 seconds.");
      } else {
        setLoginFailures(nextFailures);
        setAuthMsg(result.error.message);
      }
    } else {
      setLoginFailures(0);
      setLoginBlockedUntil(0);
      window.localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
      if (mode === "signup") {
        setAuthMsg("Account created. Check your email if confirmation is enabled.");
      }
    }

    setBusy(false);
  }

  async function loadData() {
    setBusy(true);
    setError("");
    const results = await Promise.all([
      supabase.from("monshaat_tasks").select("*").order("phase").order("title"),
      supabase.from("monshaat_recommendations").select("*").order("received_date", { ascending: false }),
      supabase.from("monshaat_consultants").select("*").order("name"),
      supabase.from("monshaat_task_notes").select("*").order("created_at", { ascending: false }),
      supabase.from("monshaat_follow_up_questions").select("*").order("created_at", { ascending: false }),
      supabase.from("monshaat_evidence").select("*").order("created_at", { ascending: false })
    ]);

    const bad = results.find((item) => item.error)?.error;
    if (bad) {
      setError(bad.message);
    } else {
      setTasks(results[0].data || []);
      setRecommendations(results[1].data || []);
      setConsultants(results[2].data || []);
      setNotes(groupLatest(results[3].data || [], "task_id"));
      setQuestions(groupAll(results[4].data || [], "task_id"));
      setEvidence(groupAll(results[5].data || [], "task_id"));
    }
    setBusy(false);
  }

  async function updateTask(id, patch) {
    setBusy(true);
    const payload = { ...patch, updated_at: new Date().toISOString() };
    if (patch.status === "completed") {
      payload.progress = 100;
      payload.completed_at = new Date().toISOString();
    } else if (patch.status) {
      payload.completed_at = null;
    }

    const result = await supabase
      .from("monshaat_tasks")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (result.error) {
      setError(result.error.message);
    } else {
      setTasks((current) =>
        current.map((task) => (task.id === id ? result.data : task))
      );
    }
    setBusy(false);
  }

  async function saveNote(id, value) {
    if (!value.trim()) return;
    const result = await supabase
      .from("monshaat_task_notes")
      .insert({
        task_id: id,
        note: value.trim(),
        author: session.user.email
      })
      .select()
      .single();

    if (result.error) {
      setError(result.error.message);
    } else {
      setNotes((current) => ({ ...current, [id]: result.data }));
    }
  }

  async function addQuestion(id, value) {
    if (!value.trim()) return;
    const result = await supabase
      .from("monshaat_follow_up_questions")
      .insert({
        task_id: id,
        question: value.trim(),
        status: "open"
      })
      .select()
      .single();

    if (result.error) {
      setError(result.error.message);
    } else {
      setQuestions((current) => ({
        ...current,
        [id]: [result.data, ...(current[id] || [])]
      }));
    }
  }

  async function updateQuestionStatus(questionId, taskId, statusValue) {
    const result = await supabase
      .from("monshaat_follow_up_questions")
      .update({
        status: statusValue,
        answered_at:
          statusValue === "answered" ? new Date().toISOString() : null
      })
      .eq("id", questionId);

    if (result.error) {
      setError(result.error.message);
    } else {
      setQuestions((current) => ({
        ...current,
        [taskId]: (current[taskId] || []).map((question) =>
          question.id === questionId
            ? { ...question, status: statusValue }
            : question
        )
      }));
    }
  }

  async function uploadEvidence(task, file) {
    if (!file) return;
    setBusy(true);

    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path =
      session.user.id +
      "/" +
      task.id +
      "/" +
      crypto.randomUUID() +
      "-" +
      safe;

    const upload = await supabase.storage
      .from("monshaat-evidence")
      .upload(path, file, { upsert: false });

    if (upload.error) {
      setError(upload.error.message);
      setBusy(false);
      return;
    }

    const result = await supabase
      .from("monshaat_evidence")
      .insert({
        task_id: task.id,
        storage_path: path,
        file_name: file.name,
        mime_type: file.type || "application/octet-stream",
        file_size: file.size,
        uploaded_by: session.user.id,
        verification_status: "pending"
      })
      .select()
      .single();

    if (result.error) {
      await supabase.storage.from("monshaat-evidence").remove([path]);
      setError(result.error.message);
    } else {
      setEvidence((current) => ({
        ...current,
        [task.id]: [result.data, ...(current[task.id] || [])]
      }));
    }
    setBusy(false);
  }

  async function openEvidence(item) {
    const result = await supabase.storage
      .from("monshaat-evidence")
      .createSignedUrl(item.storage_path, 300);

    if (result.error) {
      setError(result.error.message);
    } else {
      window.open(result.data.signedUrl, "_blank", "noopener,noreferrer");
    }
  }

  async function deleteEvidence(item, taskId) {
    if (!confirm("Delete this evidence file?")) return;
    setBusy(true);

    const removed = await supabase.storage
      .from("monshaat-evidence")
      .remove([item.storage_path]);

    if (removed.error) {
      setError(removed.error.message);
    } else {
      const result = await supabase
        .from("monshaat_evidence")
        .delete()
        .eq("id", item.id);

      if (result.error) {
        setError(result.error.message);
      } else {
        setEvidence((current) => ({
          ...current,
          [taskId]: (current[taskId] || []).filter(
            (entry) => entry.id !== item.id
          )
        }));
      }
    }
    setBusy(false);
  }

  async function reviewEvidence(item, statusValue) {
    const result = await supabase
      .from("monshaat_evidence")
      .update({ verification_status: statusValue })
      .eq("id", item.id)
      .select()
      .single();

    if (result.error) {
      setError(result.error.message);
    } else {
      setEvidence((current) =>
        Object.fromEntries(
          Object.entries(current).map(([key, list]) => [
            key,
            list.map((entry) => (entry.id === item.id ? result.data : entry))
          ])
        )
      );
    }
  }

  async function analyzeEvidence(item, task) {
    setBusy(true);
    setError("");
    try {
      const download = await supabase.storage.from("monshaat-evidence").download(item.storage_path);
      if (download.error) throw download.error;
      const file = download.data;
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data, error: fnError } = await supabase.functions.invoke("analyze-document", {
        body: { mode: "evidence", filename: item.file_name, mime_type: item.mime_type, file_base64: base64, task }
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      const result = data.result;
      setEvidenceAnalysis((current) => ({ ...current, [item.id]: result }));
      await supabase.from("monshaat_evidence_reviews").insert({
        evidence_id: item.id,
        reviewer: session.user.email,
        review_type: "ai_assessment",
        result: result.result,
        confidence: result.confidence,
        rationale: result.rationale
      });
    } catch (e) {
      setError(e.message || "Evidence analysis failed.");
    } finally {
      setBusy(false);
    }
  }

  async function readFilePayload(file) {
    const binaryTypes = ["application/pdf"];
    if (binaryTypes.includes(file.type) || file.type.startsWith("image/")) {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      return { file_base64: dataUrl.split(",")[1], content: null };
    }
    return { file_base64: null, content: await file.text() };
  }

  async function analyzeEmail() {
    const hasPaste = emailInputMode === "paste" && emailText.trim().length > 0;
    if (!emailFile && !hasPaste) return;

    setEmailBusy(true); setEmailStatus(""); setEmailAnalysis(null); setError("");

    try {
      let sourceFile = emailFile;
      let payload;

      if (emailInputMode === "paste") {
        sourceFile = new File(
          [emailText.trim()],
          "pasted-consultant-email.txt",
          { type: "text/plain" }
        );
        setEmailFile(sourceFile);
        payload = { file_base64: null, content: emailText.trim() };
      } else {
        payload = await readFilePayload(emailFile);
      }

      const safeName = sourceFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = session.user.id + "/" + crypto.randomUUID() + "-" + safeName;

      const upload = await supabase.storage
        .from("monshaat-email-source")
        .upload(storagePath, sourceFile, {
          upsert: false,
          contentType: sourceFile.type || "text/plain"
        });

      if (upload.error) throw upload.error;

      const inserted = await supabase
        .from("monshaat_emails")
        .insert({
          uploaded_by: session.user.id,
          file_name: sourceFile.name,
          mime_type: sourceFile.type || "text/plain",
          storage_path: storagePath,
          received_at: emailReceivedDate
            ? new Date(emailReceivedDate + "T00:00:00").toISOString()
            : null,
          raw_text: payload.content || "[binary document stored privately in Supabase Storage]",
          language: "ar",
          status: "uploaded"
        })
        .select()
        .single();

      if (inserted.error) throw inserted.error;
      setEmailRecordId(inserted.data.id);

      const { data, error: fnError } = await supabase.functions.invoke("analyze-document", {
        body: {
          mode: "email",
          filename: sourceFile.name,
          mime_type: sourceFile.type || "text/plain",
          ...payload
        }
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setEmailAnalysis(data.result);
      await supabase
        .from("monshaat_emails")
        .update({
          status: "analyzed",
          analysis: data.result,
          updated_at: new Date().toISOString()
        })
        .eq("id", inserted.data.id);

      setEmailStatus("Analysis complete. Review the proposed actions before adding them to the tracker.");
    } catch (e) {
      setEmailStatus("");
      setError(e.message || "Email analysis failed.");
    } finally {
      setEmailBusy(false);
    }
  }

  async function approveEmailAnalysis() {
    if (!emailAnalysis || !emailRecordId) return;
    setEmailBusy(true); setError("");
    try {
      const consultantName = emailAnalysis.consultant_name;
      const matched = consultants.find((c) => consultantName && c.name.toLowerCase() === consultantName.toLowerCase()) || consultants.find((c) => consultantName && c.name.toLowerCase().includes(consultantName.toLowerCase()));
      const sessionInsert = await supabase.from("monshaat_sessions").insert({
        consultant_id: matched?.id || null,
        session_date: emailAnalysis.received_date || emailReceivedDate || null,
        title: "Consultant email: " + (emailFile?.name || "uploaded email"),
        summary: emailAnalysis.summary || null,
        source: "Uploaded consultant email"
      }).select().single();
      if (sessionInsert.error) throw sessionInsert.error;
      for (const rec of emailAnalysis.recommendations || []) {
        const recInsert = await supabase.from("monshaat_recommendations").insert({
          session_id: sessionInsert.data.id,
          title: rec.title,
          description: rec.description || null,
          source: rec.source_excerpt || emailFile?.name || "Uploaded consultant email",
          received_date: emailAnalysis.received_date || emailReceivedDate || null,
          source_email_id: emailRecordId
        }).select().single();
        if (recInsert.error) throw recInsert.error;
        for (const t of rec.tasks || []) {
          const taskInsert = await supabase.from("monshaat_tasks").insert({
            recommendation_id: recInsert.data.id,
            task_key: "email-" + emailRecordId + "-" + Math.random().toString(36).slice(2, 10),
            title: t.title,
            description: t.description || null,
            priority: t.priority || rec.priority || "medium",
            due_date: t.due_date || rec.due_date || null,
            status: "open",
            progress: 0,
            source: "Consultant email: " + (emailFile?.name || "uploaded email")
          });
          if (taskInsert.error) throw taskInsert.error;
        }
      }
      await supabase.from("monshaat_emails").update({ status: "converted", updated_at: new Date().toISOString() }).eq("id", emailRecordId);
      setEmailStatus("Approved recommendations and tasks have been added to the tracker.");
      await loadData();
      setEmailAnalysis(null); setEmailFile(null); setEmailRecordId(null);
    } catch (e) { setError(e.message || "Could not add the email actions."); }
    finally { setEmailBusy(false); }
  }

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      const haystack = [
        task.title,
        task.description,
        task.phase_name,
        task.source,
        task.owner
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!query || haystack.includes(query.toLowerCase())) &&
        (phase === "all" || String(task.phase) === phase) &&
        (status === "all" || task.status === status) &&
        (priority === "all" || task.priority === priority) &&
        (consultant === "all" ||
          consultantFor(task.source, consultants) === consultant)
      );
    });
  }, [tasks, query, phase, status, priority, consultant, consultants]);

  const sortedFiltered = useMemo(() => {
    const priorityRank = { critical: 1, high: 2, medium: 3, low: 4 };
    const recMap = Object.fromEntries(recommendations.map((r) => [r.id, r]));
    return [...filtered].sort((a, b) => {
      if (sortBy === "priority") return (priorityRank[a.priority] || 9) - (priorityRank[b.priority] || 9);
      if (sortBy === "priority_desc") return (priorityRank[b.priority] || 9) - (priorityRank[a.priority] || 9);
      if (sortBy === "due_asc" || sortBy === "due_desc") {
        const av = a.due_date ? new Date(a.due_date).getTime() : Number.POSITIVE_INFINITY;
        const bv = b.due_date ? new Date(b.due_date).getTime() : Number.POSITIVE_INFINITY;
        return sortBy === "due_asc" ? av - bv : bv - av;
      }
      const ad = recMap[a.recommendation_id]?.received_date || null;
      const bd = recMap[b.recommendation_id]?.received_date || null;
      const av = ad ? new Date(ad).getTime() : 0;
      const bv = bd ? new Date(bd).getTime() : 0;
      return sortBy === "received_asc" ? av - bv : bv - av;
    });
  }, [filtered, recommendations, sortBy]);

  const stats = useMemo(() => {
    const count = (value) => tasks.filter((task) => task.status === value).length;
    const done = count("completed");
    const allEvidence = Object.values(evidence).flat();

    return {
      total: tasks.length,
      done,
      progress: tasks.length
        ? Math.round(
            tasks.reduce((sum, task) => sum + (task.progress || 0), 0) /
              tasks.length
          )
        : 0,
      ip: count("in_progress"),
      blocked: count("blocked"),
      follow: count("needs_verification"),
      open: count("open"),
      evidence: allEvidence.length,
      pending: allEvidence.filter((item) =>
        ["pending", "needs_review"].includes(item.verification_status)
      ).length
    };
  }, [tasks, evidence]);

  const phases = useMemo(() => {
    return [...new Set(tasks.map((task) => task.phase).filter((value) => value != null))].sort(
      (a, b) => a - b
    );
  }, [tasks]);

  if (!session) {
    return (
      <main className="authShell">
        <section className="authCard">
          <div className="brand">M</div>
          <h1>Munshaat Action Tracker</h1>
          <p>ElderWise / SilaCares execution workbench</p>
          <form onSubmit={auth}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </label>
            <button className="primary" disabled={busy}>
              {busy ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
          {authMsg && <div className="notice">{authMsg}</div>}
          <button
            className="linkButton"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setAuthMsg("");
            }}
          >
            {mode === "signin"
              ? "Need an account? Create one"
              : "Already have an account? Sign in"}
          </button>
          <p className="fine">
            Private application. Data and evidence are protected by Supabase
            Auth and RLS.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="hero">
        <div>
          <div className="eyebrow">ELDERWISE / SILACARES</div>
          <h1>Monshaat Action Tracker</h1>
          <p>Recommendations → execution → evidence → follow-up</p>
        </div>
        <div className="heroActions">
          <span>{session.user.email}</span>
          <button onClick={async () => { window.localStorage.removeItem(LAST_ACTIVITY_KEY); await supabase.auth.signOut({ scope: "local" }); }}>Sign out</button>
        </div>
      </header>

      <div className="notice dark">
        Execution aid only. Legal, medical, regulatory, and opportunity details
        require official verification before reliance.
      </div>

      <nav className="tabs">
        <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>Action Tracker</button>
        <button className={activeTab === "email" ? "active" : ""} onClick={() => setActiveTab("email")}>Email Intake</button>
      </nav>

      {activeTab === "email" ? (
        <EmailIntake
          emailFile={emailFile}
          setEmailFile={setEmailFile}
          emailInputMode={emailInputMode}
          setEmailInputMode={setEmailInputMode}
          emailText={emailText}
          setEmailText={setEmailText}
          emailReceivedDate={emailReceivedDate}
          setEmailReceivedDate={setEmailReceivedDate}
          emailBusy={emailBusy}
          emailAnalysis={emailAnalysis}
          emailStatus={emailStatus}
          canAnalyzeEmail={emailInputMode === "paste" ? emailText.trim().length > 0 : !!emailFile}
          onAnalyze={analyzeEmail}
          onApprove={approveEmailAnalysis}
        />
      ) : <>
      <StatCards stats={stats} />

      <section className="toolbar">
        <input
          placeholder="Search tasks, sources, owners..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={phase} onChange={(e) => setPhase(e.target.value)}>
          <option value="all">All phases</option>
          {phases.map((p) => (
            <option key={p} value={p}>Phase {p}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="all">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select value={consultant} onChange={(e) => setConsultant(e.target.value)}>
          <option value="all">All consultants</option>
          {consultants.map((c) => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="received_desc">Newest recommendation first</option>
          <option value="received_asc">Oldest recommendation first</option>
          <option value="due_asc">Soonest due date first</option>
          <option value="due_desc">Latest due date first</option>
          <option value="priority">Highest priority first</option>
          <option value="priority_desc">Lowest priority first</option>
        </select>
        <button onClick={loadData}>{busy ? "Refreshing..." : "Refresh"}</button>
      </section>

      {error && (
        <div className="error">
          {error}
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      <section className="phaseSummary">
        {phases.map((p) => {
          const rows = tasks.filter((task) => task.phase === p);
          const done = rows.filter((task) => task.status === "completed").length;
          const width = rows.length ? (done / rows.length) * 100 : 0;
          return (
            <div key={p}>
              <b>Phase {p}</b>
              <span>{done}/{rows.length}</span>
              <div className="miniBar">
                <i style={{ width: width + "%" }} />
              </div>
            </div>
          );
        })}
      </section>

      <section className="taskList">
        {sortedFiltered.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            consultants={consultants}
            expanded={expanded}
            setExpanded={setExpanded}
            evidence={evidence}
            questions={questions}
            note={notes[task.id]?.note || ""}
            updateTask={updateTask}
            saveNote={saveNote}
            addQuestion={addQuestion}
            updateQuestionStatus={updateQuestionStatus}
            uploadEvidence={uploadEvidence}
            openEvidence={openEvidence}
            deleteEvidence={deleteEvidence}
            reviewEvidence={reviewEvidence}
            analyzeEvidence={analyzeEvidence}
            evidenceAnalysis={evidenceAnalysis}
            recommendations={recommendations}
          />
        ))}
        {!sortedFiltered.length && (
          <div className="empty">No tasks match the current filters.</div>
        )}
      </section>
      </>}

      <footer>
        Munshaat · {stats.open} open · {stats.done} completed · live Supabase state
      </footer>
    </main>
  );
}
