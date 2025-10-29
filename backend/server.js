// ------------------------------
// 🌐 NEXTRA - Smart Security Server
// ------------------------------

import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import multer from "multer"; // for file uploads

// Initialize express app
const app = express();
app.use(cors());
app.use(express.json());

// ------------------------------
// 📁 PATH CONFIGURATION
// ------------------------------
const __dirname = path.resolve();
const frontendPath = path.join(__dirname, "..", "frontend");
const dataDir = path.join(__dirname, "data");
const uploadsDir = path.join(__dirname, "uploads");
const logsFile = path.join(dataDir, "logs.json");
const verifiedFile = path.join(dataDir, "verified.json");

// Ensure directories and files exist
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(logsFile)) fs.writeFileSync(logsFile, "[]");
if (!fs.existsSync(verifiedFile)) fs.writeFileSync(verifiedFile, "[]");

// ------------------------------
// ⚙️ MULTER (file upload setup)
// ------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ------------------------------
// 🌍 SERVE FRONTEND + UPLOADS
// ------------------------------
app.use(express.static(frontendPath));
app.use("/uploads", express.static(uploadsDir)); // serve uploaded images

// Default route → homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ------------------------------
// 🧠 API ROUTES
// ------------------------------

/* ---------- 🧾 LOGS API ---------- */
app.get("/api/logs", (req, res) => {
  fs.readFile(logsFile, "utf-8", (err, data) => {
    if (err) return res.status(500).send("Error reading logs");
    res.send(JSON.parse(data || "[]"));
  });
});

app.post("/api/logs", (req, res) => {
  const newLog = req.body;
  if (!newLog.name || !newLog.time)
    return res.status(400).json({ message: "Invalid log data" });

  fs.readFile(logsFile, "utf-8", (err, data) => {
    const logs = err ? [] : JSON.parse(data || "[]");
    logs.push(newLog);
    fs.writeFile(logsFile, JSON.stringify(logs, null, 2), (err2) => {
      if (err2) return res.status(500).send("Error saving log");
      res.send({ message: "Log saved successfully!", log: newLog });
    });
  });
});

/* ---------- 👥 VERIFIED USERS API ---------- */
app.get("/api/users", (req, res) => {
  fs.readFile(verifiedFile, "utf-8", (err, data) => {
    if (err) return res.status(500).send("Error reading users");
    res.send(JSON.parse(data || "[]"));
  });
});

// POST new verified user (with file upload)
app.post("/api/users", upload.single("photo"), (req, res) => {
  const { name, role } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  if (!name || !role || !photo)
    return res.status(400).json({ message: "Invalid user data" });

  fs.readFile(verifiedFile, "utf-8", (err, data) => {
    const users = err ? [] : JSON.parse(data || "[]");
    users.push({ name, role, photo });
    fs.writeFile(verifiedFile, JSON.stringify(users, null, 2), (err2) => {
      if (err2) return res.status(500).send("Error saving user");
      console.log("✅ Verified user added:", name);
      res.send({ message: "User saved successfully!", user: { name, role, photo } });
    });
  });
});

// DELETE a verified user
app.delete("/api/users/:name", (req, res) => {
  const name = decodeURIComponent(req.params.name);
  fs.readFile(verifiedFile, "utf-8", (err, data) => {
    if (err) return res.status(500).send("Error reading users");
    let users = JSON.parse(data || "[]");
    users = users.filter((u) => u.name.toLowerCase() !== name.toLowerCase());
    fs.writeFile(verifiedFile, JSON.stringify(users, null, 2), (err2) => {
      if (err2) return res.status(500).send("Error deleting user");
      console.log(`🗑️ User removed: ${name}`);
      res.send({ message: `${name} removed successfully.` });
    });
  });
});

/* ---------- 🔍 USER MATCH CHECK ---------- */
app.post("/api/checkUser", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).send("Name required");

  fs.readFile(verifiedFile, "utf-8", (err, data) => {
    if (err) return res.status(500).send("Error reading users");
    const users = JSON.parse(data || "[]");
    const match = users.find((u) => u.name.toLowerCase() === name.toLowerCase());
    res.send({ verified: !!match, user: match || null });
  });
});

// ------------------------------
// 🚫 404 Fallback
// ------------------------------
app.use((req, res) => {
  res.status(404).sendFile(path.join(frontendPath, "index.html"));
});

// ------------------------------
// 🚀 START SERVER
// ------------------------------
const PORT = 3000;
app.listen(PORT, () =>
  console.log(`🚀 NEXTRA running successfully at http://localhost:${PORT}`)
);
