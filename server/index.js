import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const { Pool } = pg;
const app = express();

/* =========================
   BASIC CONFIG
========================= */

app.use(cors());
app.use(express.json({ limit: "20kb" }));

/* =========================
   DATABASE
========================= */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

/* =========================
   COMPLAINT ID
========================= */

const id = () =>
  `ECB-${new Date().getFullYear()}-${crypto.randomInt(100, 1000)}`;

/* =========================
   AUTH MIDDLEWARE
========================= */

const auth = (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.replace("Bearer ", "");

    req.admin = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
};

/* =========================
   DATABASE INITIALIZATION
========================= */

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admins(
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS complaints(
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      response TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  const email =
    process.env.ADMIN_EMAIL || "admin@demo.app";

  const pass =
    process.env.ADMIN_PASSWORD || "demo1234";

  const hash = await bcrypt.hash(pass, 12);

  await pool.query(
    `
      INSERT INTO admins(email, password_hash)
      VALUES($1, $2)
      ON CONFLICT(email) DO NOTHING
    `,
    [email, hash]
  );
}

/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", async (_, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      ok: true,
    });
  } catch (error) {
    console.error("HEALTH ERROR:", error);

    res.status(500).json({
      ok: false,
    });
  }
});

/* =========================
   ADMIN LOGIN
========================= */

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM admins WHERE email=$1",
      [email]
    );

    if (
      !result.rowCount ||
      !(await bcrypt.compare(
        password,
        result.rows[0].password_hash
      ))
    ) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: result.rows[0].id,
        email: result.rows[0].email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    res.json({
      token,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

/* =========================
   SUBMIT COMPLAINT
========================= */

app.post("/api/complaints", async (req, res) => {
  try {
    const {
      category,
      subject,
      description,
    } = req.body;

    if (
      !category ||
      !subject?.trim() ||
      !description?.trim()
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    let complaintId;

    for (let i = 0; i < 10; i++) {
      const candidate = id();

      const exists = await pool.query(
        "SELECT 1 FROM complaints WHERE id=$1",
        [candidate]
      );

      if (!exists.rowCount) {
        complaintId = candidate;
        break;
      }
    }

    if (!complaintId) {
      return res.status(500).json({
        message: "Could not generate complaint ID",
      });
    }

    const result = await pool.query(
      `
        INSERT INTO complaints(
          id,
          category,
          subject,
          description
        )
        VALUES($1, $2, $3, $4)
        RETURNING
          id,
          category,
          subject,
          description,
          status,
          response,
          created_at
      `,
      [
        complaintId,
        category,
        subject.trim(),
        description.trim(),
      ]
    );

    res.status(201).json({
      complaint: result.rows[0],
    });
  } catch (error) {
    console.error(
      "CREATE COMPLAINT ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
});

/* =========================
   TRACK COMPLAINT
========================= */

app.get("/api/complaints/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          id,
          category,
          subject,
          description,
          status,
          response,
          created_at
        FROM complaints
        WHERE id=$1
      `,
      [req.params.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(
      "TRACK COMPLAINT ERROR:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
});

/* =========================
   ADMIN - GET COMPLAINTS
========================= */

app.get(
  "/api/admin/complaints",
  auth,
  async (_, res) => {
    try {
      const result = await pool.query(
        `
          SELECT *
          FROM complaints
          ORDER BY created_at DESC
        `
      );

      res.json(result.rows);
    } catch (error) {
      console.error(
        "GET COMPLAINTS ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

/* =========================
   ADMIN - UPDATE COMPLAINT
========================= */

app.put(
  "/api/admin/complaints/:id",
  auth,
  async (req, res) => {
    try {
      const {
        status,
        response = "",
      } = req.body;

      const rawStatus = String(
        status || ""
      )
        .trim()
        .toLowerCase();

      const statusMap = {
        pending: "Pending",
        "in progress": "In Progress",
        in_progress: "In Progress",
        "in-progress": "In Progress",
        resolved: "Resolved",
      };

      const normalizedStatus =
        statusMap[rawStatus];

      if (!normalizedStatus) {
        return res.status(400).json({
          message: "Invalid status",
          received: rawStatus,
        });
      }

      const result = await pool.query(
        `
          UPDATE complaints
          SET
            status = $1,
            response = $2,
            updated_at = NOW()
          WHERE id = $3
          RETURNING *
        `,
        [
          normalizedStatus,
          String(response).slice(0, 5000),
          req.params.id,
        ]
      );

      if (!result.rows[0]) {
        return res.status(404).json({
          message: "Complaint not found",
        });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error(
        "UPDATE COMPLAINT ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

/* =========================
   ADMIN - DELETE COMPLAINT
========================= */

app.delete(
  "/api/admin/complaints/:id",
  auth,
  async (req, res) => {
    try {
      const result = await pool.query(
        "DELETE FROM complaints WHERE id=$1",
        [req.params.id]
      );

      if (!result.rowCount) {
        return res.status(404).json({
          message: "Complaint not found",
        });
      }

      res.json({
        ok: true,
      });
    } catch (error) {
      console.error(
        "DELETE COMPLAINT ERROR:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

/* =========================
   REACT FRONTEND
========================= */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDist = path.resolve(
  __dirname,
  "../dist"
);

console.log(
  "React dist path:",
  clientDist
);

/*
  Serve React static files
*/
app.use(express.static(clientDist));

/*
  Root page
*/
app.get("/", (req, res) => {
  res.sendFile(
    path.join(clientDist, "index.html")
  );
});

/*
  React fallback
*/
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      message: "API endpoint not found",
    });
  }

  res.sendFile(
    path.join(clientDist, "index.html")
  );
});

/* =========================
   START SERVER
========================= */

const port =
  process.env.PORT || 5000;

init()
  .then(() => {
    app.get("/", (req, res) => {
  res.json({
    server: "working",
    message: "Express server is running"
  });
});
    app.listen(
      port,
      "0.0.0.0",
      () => {
        console.log(
          `API running on ${port}`
        );
      }
    );
  })
  .catch((error) => {
    console.error(
      "SERVER START ERROR:",
      error
    );

    process.exit(1);
  });