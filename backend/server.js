const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const PORT = 3000;
// In production with Nginx, we can allow the origin dynamically or set specific domain
const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// --- Database ---
const db = new sqlite3.Database(path.join(__dirname, "groceries.db"), (err) => {
  if (err) console.error("DB Error:", err.message);
  else console.log("Connected to SQLite.");
});

db.run(`CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  listId TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  completed INTEGER DEFAULT 0,
  createdAt INTEGER
)`);

// --- Socket.io ---
const io = new Server(server, {
  cors: { origin: "*" }, // Nginx handles security, so * is acceptable here internally
});

io.on("connection", (socket) => {
  socket.on("join-list", (listId) => {
    socket.join(listId);
  });
});

const notifyListUpdate = (listId) => io.to(listId).emit("list-updated");

// --- Routes ---
app.get("/api/lists/:listId/items", (req, res) => {
  db.all(
    "SELECT * FROM items WHERE listId = ? ORDER BY createdAt DESC",
    [req.params.listId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows.map((r) => ({ ...r, completed: !!r.completed })));
    }
  );
});

app.post("/api/items", (req, res) => {
  const { id, listId, name, quantity, createdAt } = req.body;
  db.run(
    "INSERT INTO items VALUES (?, ?, ?, ?, 0, ?)",
    [id, listId, name, quantity, createdAt],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      notifyListUpdate(listId);
      res.json({ success: true });
    }
  );
});

app.put("/api/items/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const fields = Object.keys(updates)
    .map((k) => `${k} = ?`)
    .join(", ");
  const values = Object.values(updates).map((v) =>
    typeof v === "boolean" ? (v ? 1 : 0) : v
  );

  db.get("SELECT listId FROM items WHERE id = ?", [id], (err, row) => {
    if (!row) return res.status(404).json({ error: "Not found" });
    db.run(
      `UPDATE items SET ${fields} WHERE id = ?`,
      [...values, id],
      (err) => {
        notifyListUpdate(row.listId);
        res.json({ success: true });
      }
    );
  });
});

app.delete("/api/items/:id", (req, res) => {
  const { id } = req.params;
  db.get("SELECT listId FROM items WHERE id = ?", [id], (err, row) => {
    if (!row) return res.status(404).json({ error: "Not found" });
    db.run("DELETE FROM items WHERE id = ?", [id], (err) => {
      notifyListUpdate(row.listId);
      res.json({ success: true });
    });
  });
});

server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
