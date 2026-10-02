import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import {
  ShieldCheck,
  ArrowRight,
  LockKeyhole,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  Search,
  Pencil,
  Trash2,
  LogOut,
  AlertCircle
} from "lucide-react";
import "./styles.css";

/* =========================
   API HELPER
========================= */

const api = async (path, options = {}) => {
  const baseUrl = import.meta.env.VITE_API_URL || "";

  const response = await fetch(baseUrl + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

/* =========================
   STATUS
========================= */

function Status({ value }) {
  return (
    <span
      className={
        "status " +
        String(value || "")
          .toLowerCase()
          .replaceAll(" ", "-")
      }
    >
      {value || "Pending"}
    </span>
  );
}

/* =========================
   NAVIGATION
========================= */

function Nav({ setPage }) {
  return (
    <header className="nav">
      <button
        className="brand"
        onClick={() => setPage("home")}
      >
        <span className="brand-icon">
          <ShieldCheck size={20} />
        </span>

        e-Complaint Box
      </button>

      <nav>
        <button onClick={() => setPage("home")}>
          Home
        </button>

        <button onClick={() => setPage("submit")}>
          Submit Complaint
        </button>

        <button onClick={() => setPage("track")}>
          Track Complaint
        </button>

        <button
          className="admin-link"
          onClick={() => setPage("admin-login")}
        >
          Admin
        </button>
      </nav>
    </header>
  );
}

/* =========================
   HOME
========================= */

function Home({ setPage }) {
  const [id, setId] = useState("");
  const [result, setResult] = useState(null);

  const track = async () => {
    if (!id.trim()) return;

    try {
      const data = await api(
        "/api/complaints/" + id.trim()
      );

      setResult(data);
    } catch {
      setResult("not-found");
    }
  };

  return (
    <>
      <section className="hero">
        <div>
          <div className="eyebrow">
            ANONYMOUS • SECURE • SIMPLE
          </div>

          <h1>
            Speak up.
            <br />
            <span>Stay anonymous.</span>
          </h1>

          <p>
            Report college issues without sharing your
            name, student ID, email, or phone number.
          </p>

          <div className="actions">
            <button
              className="btn primary"
              onClick={() => setPage("submit")}
            >
              Submit a Complaint <ArrowRight />
            </button>

            <button
              className="btn secondary"
              onClick={() => setPage("track")}
            >
              Track Complaint
            </button>
          </div>
        </div>

        <div className="hero-card">
          <div className="card-icon">
            <LockKeyhole />
          </div>

          <h3>Your identity is not required</h3>

          <p>
            Only complaint information is collected.
            A unique tracking ID is generated for
            follow-up.
          </p>

          <div className="mini">
            ✓ No name required
          </div>

          <div className="mini">
            ✓ No student ID required
          </div>

          <div className="mini">
            ✓ Track using complaint ID
          </div>
        </div>
      </section>

      <section className="section">
        <div className="eyebrow">
          HOW IT WORKS
        </div>

        <h2>Three simple steps</h2>

        <div className="steps">
          <Step
            n="01"
            t="Write your complaint"
            d="Choose a category and explain the issue."
          />

          <Step
            n="02"
            t="Submit anonymously"
            d="No personal identity fields are required."
          />

          <Step
            n="03"
            t="Track the action"
            d="Use your complaint ID for updates."
          />
        </div>
      </section>

      <section className="section track-strip">
        <div>
          <div className="eyebrow">
            QUICK TRACK
          </div>

          <h2>Already submitted?</h2>

          <p>Enter your complaint ID.</p>
        </div>

        <div className="track-box">
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="ECB-2026-123"
          />

          <button
            className="btn primary"
            onClick={track}
          >
            Track
          </button>

          {result &&
            result !== "not-found" && (
              <div className="result">
                <Status value={result.status} />{" "}
                {result.subject}
              </div>
            )}

          {result === "not-found" && (
            <div className="error">
              Complaint not found.
            </div>
          )}
        </div>
      </section>
    </>
  );
}

/* =========================
   STEP
========================= */

function Step({ n, t, d }) {
  return (
    <div className="step">
      <b>{n}</b>
      <h3>{t}</h3>
      <p>{d}</p>
    </div>
  );
}

/* =========================
   SUBMIT
========================= */

function Submit({ setPage }) {
  const [f, setF] = useState({
    category: "",
    subject: "",
    description: ""
  });

  const [err, setErr] = useState("");
  const [done, setDone] = useState("");

  const go = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      const data = await api(
        "/api/complaints",
        {
          method: "POST",
          body: JSON.stringify(f)
        }
      );

      setDone(
        data?.complaint?.id ||
        data?.id ||
        ""
      );

      setF({
        category: "",
        subject: "",
        description: ""
      });
    } catch (error) {
      setErr(error.message);
    }
  };

  if (done) {
    return (
      <main className="page success">
        <div className="success-icon">
          <CheckCircle2 size={48} />
        </div>

        <div className="eyebrow">
          SUBMITTED
        </div>

        <h1>Complaint submitted.</h1>

        <p>
          Save this tracking ID. It is the only way
          to check your complaint.
        </p>

        <div className="id-box">
          {done}
        </div>

        <button
          className="btn primary"
          onClick={() => setPage("track")}
        >
          Track Complaint
        </button>
      </main>
    );
  }

  return (
    <main className="page narrow">
      <button
        className="back"
        onClick={() => setPage("home")}
      >
        ← Back
      </button>

      <div className="eyebrow">
        ANONYMOUS SUBMISSION
      </div>

      <h1>Submit a complaint</h1>

      <p>
        No name, student ID, email or phone number
        is required.
      </p>

      <form
        className="form"
        onSubmit={go}
      >
        <div className="privacy">
          <LockKeyhole size={18} />

          Do not include your name or identifying
          details in the complaint text.
        </div>

        <label>
          Category

          <select
            value={f.category}
            onChange={(e) =>
              setF({
                ...f,
                category: e.target.value
              })
            }
          >
            <option value="">
              Select category
            </option>

            {[
              "Academic",
              "Infrastructure",
              "Cleanliness",
              "Administration",
              "Faculty",
              "Other"
            ].map((x) => (
              <option key={x}>
                {x}
              </option>
            ))}
          </select>
        </label>

        <label>
          Subject

          <input
            value={f.subject}
            maxLength="100"
            onChange={(e) =>
              setF({
                ...f,
                subject: e.target.value
              })
            }
          />
        </label>

        <label>
          Complaint details

          <textarea
            rows="7"
            maxLength="2000"
            value={f.description}
            onChange={(e) =>
              setF({
                ...f,
                description: e.target.value
              })
            }
          />
        </label>

        {err && (
          <div className="error">
            <AlertCircle size={16} />
            {err}
          </div>
        )}

        <button className="btn primary full">
          Submit Anonymously
          <ArrowRight />
        </button>
      </form>
    </main>
  );
}

/* =========================
   TRACK
========================= */

function Track({ setPage }) {
  const [id, setId] = useState("");
  const [complaint, setComplaint] =
    useState(null);

  const go = async () => {
    if (!id.trim()) return;

    try {
      const data = await api(
        "/api/complaints/" + id.trim()
      );

      setComplaint(data);
    } catch {
      setComplaint("not-found");
    }
  };

  return (
    <main className="page narrow">
      <button
        className="back"
        onClick={() => setPage("home")}
      >
        ← Back
      </button>

      <div className="eyebrow">
        COMPLAINT TRACKING
      </div>

      <h1>Track your complaint</h1>

      <p>
        Enter the complaint ID generated after
        submission.
      </p>

      <div className="track-form">
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="ECB-2026-123"
        />

        <button
          className="btn primary"
          onClick={go}
        >
          <Search />
          Search
        </button>
      </div>

      {complaint === "not-found" && (
        <div className="empty">
          <AlertCircle />

          <h3>
            Complaint not found
          </h3>
        </div>
      )}

      {complaint &&
        complaint !== "not-found" && (
          <div className="details">
            <div className="top">
              <div>
                <small>
                  {complaint.id}
                </small>

                <h2>
                  {complaint.subject}
                </h2>
              </div>

              <Status
                value={complaint.status}
              />
            </div>

            <p>
              <b>Category:</b>{" "}
              {complaint.category}
            </p>

            {complaint.created_at && (
              <p>
                <b>Submitted:</b>{" "}
                {new Date(
                  complaint.created_at
                ).toLocaleString()}
              </p>
            )}

            <hr />

            <h4>Complaint</h4>

            <p>
              {complaint.description}
            </p>

            <hr />

            <h4>Admin response</h4>

            <p>
              {complaint.response ||
                "No response has been added yet."}
            </p>
          </div>
        )}
    </main>
  );
}

/* =========================
   ADMIN LOGIN
========================= */

function AdminLogin({
  setPage,
  onLogin
}) {
  const [email, setEmail] =
    useState("admin@demo.app");

  const [password, setPassword] =
    useState("demo1234");

  const [err, setErr] =
    useState("");

  const go = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      const data = await api(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      localStorage.setItem(
        "adminToken",
        data.token
      );

      onLogin();
    } catch (error) {
      setErr(error.message);
    }
  };

  return (
    <main className="login">
      <div className="login-card">
        <button
          className="back"
          onClick={() => setPage("home")}
        >
          ← Back
        </button>

        <div className="login-icon">
          <LockKeyhole />
        </div>

        <div className="eyebrow">
          ADMIN PANEL
        </div>

        <h1>Admin login</h1>

        <p>
          Manage anonymous complaints.
        </p>

        <form onSubmit={go}>
          <label>
            Email

            <input
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />
          </label>

          <label>
            Password

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />
          </label>

          {err && (
            <div className="error">
              {err}
            </div>
          )}

          <button className="btn primary full">
            Login
            <ArrowRight />
          </button>
        </form>
      </div>
    </main>
  );
}

/* =========================
   ADMIN DASHBOARD
========================= */

function Admin({ logout }) {
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] =
    useState("All");
  const [edit, setEdit] =
    useState(null);

  const load = async () => {
    try {
      const data = await api(
        "/api/admin/complaints",
        {
          headers: {
            Authorization:
              "Bearer " +
              localStorage.getItem(
                "adminToken"
              )
          }
        }
      );

      /*
        IMPORTANT FIX:
        Backend response can be:
        { complaints: [...] }
        OR
        [...]
        We always convert it to an array.
      */

      const complaints =
        Array.isArray(data)
          ? data
          : Array.isArray(data?.complaints)
          ? data.complaints
          : Array.isArray(data?.rows)
          ? data.rows
          : [];

      setList(complaints);
    } catch (error) {
      console.error(
        "Failed to load complaints:",
        error
      );

      setList([]);

      logout();
    }
  };

  useEffect(() => {
    load();
  }, []);

  /*
    EXTRA SAFETY:
    Even if something unexpected comes from
    backend, filter will never crash.
  */

  const safeList = Array.isArray(list)
    ? list
    : [];

  const filtered =
    safeList.filter((c) => {
      const searchText =
        `${c?.id || ""} ${
          c?.subject || ""
        } ${c?.category || ""}`.toLowerCase();

      const matchesSearch =
        searchText.includes(
          q.toLowerCase()
        );

      const matchesFilter =
        filter === "All" ||
        c?.status === filter;

      return (
        matchesSearch &&
        matchesFilter
      );
    });

  const save = async (complaint) => {
    try {
      await api(
        "/api/admin/complaints/" +
          complaint.id,
        {
          method: "PUT",
          headers: {
            Authorization:
              "Bearer " +
              localStorage.getItem(
                "adminToken"
              )
          },
          body: JSON.stringify({
            status: complaint.status,
            response:
              complaint.response || ""
          })
        }
      );

      setEdit(null);

      await load();
    } catch (error) {
      alert(error.message);
    }
  };

  const del = async (id) => {
    if (
      !confirm(
        "Delete complaint?"
      )
    ) {
      return;
    }

    try {
      await api(
        "/api/admin/complaints/" + id,
        {
          method: "DELETE",
          headers: {
            Authorization:
              "Bearer " +
              localStorage.getItem(
                "adminToken"
              )
          }
        }
      );

      await load();
    } catch (error) {
      alert(error.message);
    }
  };

  const count = (status) =>
    safeList.filter(
      (c) => c?.status === status
    ).length;

  return (
    <div className="admin">
      <aside>
        <div className="brand">
          <span className="brand-icon">
            <ShieldCheck size={20} />
          </span>

          e-Complaint Box
        </div>

        <div className="side-active">
          <ClipboardList />
          Dashboard
        </div>

        <div>
          <MessageSquare />
          Complaints
        </div>

        <button onClick={logout}>
          <LogOut />
          Logout
        </button>
      </aside>

      <main className="admin-main">
        <div className="admin-head">
          <div>
            <div className="eyebrow">
              COLLEGE ADMINISTRATION
            </div>

            <h1>
              Complaint Dashboard
            </h1>

            <p>
              Review complaints and update
              action taken.
            </p>
          </div>
        </div>

        <div className="stats">
          <Stat
            t="Total"
            v={safeList.length}
          />

          <Stat
            t="Pending"
            v={count("Pending")}
          />

          <Stat
            t="In Progress"
            v={count("In Progress")}
          />

          <Stat
            t="Resolved"
            v={count("Resolved")}
          />
        </div>

        <div className="admin-card">
          <div className="toolbar">
            <div className="search">
              <Search />

              <input
                value={q}
                onChange={(e) =>
                  setQ(e.target.value)
                }
                placeholder="Search..."
              />
            </div>

            <select
              value={filter}
              onChange={(e) =>
                setFilter(
                  e.target.value
                )
              }
            >
              <option>All</option>
              <option>Pending</option>
              <option>
                In Progress
              </option>
              <option>Resolved</option>
            </select>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Complaint</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      style={{
                        textAlign:
                          "center",
                        padding:
                          "30px"
                      }}
                    >
                      No complaints found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => (
                    <tr key={c.id}>
                      <td>
                        {c.id}
                      </td>

                      <td>
                        <b>
                          {c.subject}
                        </b>

                        <small>
                          {String(
                            c.description ||
                              ""
                          ).slice(
                            0,
                            65
                          )}
                        </small>
                      </td>

                      <td>
                        {c.category}
                      </td>

                      <td>
                        <Status
                          value={
                            c.status
                          }
                        />
                      </td>

                      <td>
                        <button
                          className="icon"
                          onClick={() =>
                            setEdit({
                              ...c
                            })
                          }
                        >
                          <Pencil
                            size={16}
                          />
                        </button>

                        <button
                          className="icon danger"
                          onClick={() =>
                            del(c.id)
                          }
                        >
                          <Trash2
                            size={16}
                          />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {edit && (
        <div className="modal-bg">
          <div className="modal">
            <h2>
              Update complaint
            </h2>

            <p>
              {edit.subject}
            </p>

            <label>
              Status

              <select
                value={
                  edit.status
                }
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    status:
                      e.target.value
                  })
                }
              >
                <option>
                  Pending
                </option>

                <option>
                  In Progress
                </option>

                <option>
                  Resolved
                </option>
              </select>
            </label>

            <label>
              Admin response

              <textarea
                rows="6"
                value={
                  edit.response ||
                  ""
                }
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    response:
                      e.target.value
                  })
                }
              />
            </label>

            <div className="modal-actions">
              <button
                className="btn secondary"
                onClick={() =>
                  setEdit(null)
                }
              >
                Cancel
              </button>

              <button
                className="btn primary"
                onClick={() =>
                  save(edit)
                }
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   STAT
========================= */

function Stat({ t, v }) {
  return (
    <div className="stat">
      <small>{t}</small>
      <strong>{v}</strong>
    </div>
  );
}

/* =========================
   APP
========================= */

function App() {
  const [page, setPage] =
    useState("home");

  const [logged, setLogged] =
    useState(
      !!localStorage.getItem(
        "adminToken"
      )
    );

  const logout = () => {
    localStorage.removeItem(
      "adminToken"
    );

    setLogged(false);
    setPage("home");
  };

  let content;

  if (page === "home") {
    content = (
      <Home setPage={setPage} />
    );
  } else if (page === "submit") {
    content = (
      <Submit setPage={setPage} />
    );
  } else if (page === "track") {
    content = (
      <Track setPage={setPage} />
    );
  } else if (
    page === "admin-login"
  ) {
    content = (
      <AdminLogin
        setPage={setPage}
        onLogin={() => {
          setLogged(true);
          setPage("admin");
        }}
      />
    );
  } else if (
    page === "admin" &&
    logged
  ) {
    content = (
      <Admin logout={logout} />
    );
  } else {
    content = (
      <AdminLogin
        setPage={setPage}
        onLogin={() => {
          setLogged(true);
          setPage("admin");
        }}
      />
    );
  }

  if (page === "admin") {
    return content;
  }

  return (
    <>
      <Nav setPage={setPage} />

      {content}

      <footer>
        e-Complaint Box • Anonymous College
        Complaint Management System
      </footer>
    </>
  );
}

/* =========================
   RENDER
========================= */

ReactDOM
  .createRoot(
    document.getElementById("root")
  )
  .render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );