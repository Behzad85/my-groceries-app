require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);

// --- CONFIGURATION ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn("Warning: GEMINI_API_KEY is missing in .env file");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

app.use(cors());
app.use(express.json());

// --- Database ---
const dbPath = path.join(__dirname, "groceries.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("DB Error:", err.message);
  else {
    console.log("Connected to SQLite.");
    initializeSchema();
  }
});

function initializeSchema() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      listId TEXT NOT NULL,
      name TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      completed INTEGER DEFAULT 0,
      createdAt INTEGER,
      category TEXT DEFAULT 'Uncategorized',
      price REAL DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS lists (
      id TEXT PRIMARY KEY,
      name TEXT DEFAULT 'Untitled List',
      createdAt INTEGER
    )`);

    // Migrations
    const columnsToAdd = [
      { name: "category", type: "TEXT DEFAULT 'Uncategorized'" },
      { name: "price", type: "REAL DEFAULT 0" },
    ];
    columnsToAdd.forEach((col) => {
      db.run(
        `ALTER TABLE items ADD COLUMN ${col.name} ${col.type}`,
        (err) => {}
      );
    });
  });
}

// --- Socket.io ---
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  socket.on("join-list", (listId) => {
    socket.join(listId);
  });
});

const notifyListUpdate = (listId) => io.to(listId).emit("list-updated");

// --- AI Helper ---
async function askAI(prompt) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    let text = response.text || "";
    text = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Error:", error);
    return [];
  }
}

// --- Routes ---

// List Metadata
app.post("/api/lists", (req, res) => {
  const { id, name } = req.body;
  db.run(
    `INSERT OR REPLACE INTO lists (id, name, createdAt) VALUES (?, ?, COALESCE((SELECT createdAt FROM lists WHERE id=?), ?))`,
    [id, name, id, Date.now()],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      notifyListUpdate(id);
      res.json({ success: true });
    }
  );
});

app.get("/api/lists/:id", (req, res) => {
  db.get("SELECT * FROM lists WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || { id: req.params.id, name: "Untitled List" });
  });
});

app.post("/api/lists/batch", (req, res) => {
  const { ids } = req.body;
  if (!ids || ids.length === 0) return res.json([]);
  const placeholders = ids.map(() => "?").join(",");
  db.all(
    `SELECT * FROM lists WHERE id IN (${placeholders})`,
    ids,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Items
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
  const { id, listId, name, quantity, createdAt, category, price } = req.body;
  db.run(
    "INSERT INTO items (id, listId, name, quantity, completed, createdAt, category, price) VALUES (?, ?, ?, ?, 0, ?, ?, ?)",
    [
      id,
      listId,
      name,
      quantity,
      createdAt,
      category || "Uncategorized",
      price || 0,
    ],
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

// --- AI GEN ENDPOINT ---
app.post("/api/ai/generate", async (req, res) => {
  const { mode, inputData } = req.body;
  let prompt = "";

  if (mode === "dish-to-ingredients") {
    prompt = `Break down the dish "${inputData}" into grocery ingredients. 
    Estimate the price in GBP (£) for the required quantity of each ingredient in the UK.
    CRITICAL: 'quantity' must be PACK COUNT (integer), not weight. Put weight in 'name'.
    Response Format (JSON Array): [{"name": "Ground Beef (500g)", "price": 4.50, "quantity": 1}, ...]`;
  } else if (mode === "ingredients-to-dish") {
    const ingredients = inputData.join(", ");
    prompt = `I have these groceries: ${ingredients}. 
    Suggest 3 distinct dishes I could make.
    Response Format (JSON Array): [{"dish": "Spaghetti Bolognese", "matchedIngredients": ["Pasta", "Beef"]}]`;
  } else if (mode === "meal-planner") {
    prompt = `Create a meal plan based on these requirements: "${inputData}".
    For each meal, provide the dish name and a full shopping list of ingredients with UK prices.
    CRITICAL: 'quantity' must be PACK COUNT (integer).
    Response Format (JSON Array): [
      {
        "dish": "Monday Dinner: Tacos",
        "ingredients": [{"name": "Taco Shells", "price": 2.00, "quantity": 1}, {"name": "Salsa", "price": 1.50, "quantity": 1}]
      }
    ]`;
  } else {
    return res.status(400).json({ error: "Invalid mode" });
  }

  const suggestions = await askAI(prompt);
  res.json({ suggestions });
});

server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
