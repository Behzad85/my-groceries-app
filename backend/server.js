require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
// FIX: Switch to Groq SDK
const Groq = require("groq-sdk");

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);

// --- CONFIGURATION ---
const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) console.warn("Warning: GROQ_API_KEY is missing in .env");

const groq = new Groq({ apiKey: GROQ_API_KEY });

// --- SECURITY ---
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "10kb" }));

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // Increased limit slightly as Groq is generous
  message: { error: "Too many AI requests, please try again later." },
});

// --- DATABASE ---
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
    db.run(
      `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT DEFAULT 'Chef', country TEXT DEFAULT 'UK')`
    );
    db.run(
      `CREATE TABLE IF NOT EXISTS households (id TEXT PRIMARY KEY, name TEXT NOT NULL, ownerId TEXT NOT NULL)`
    );
    db.run(
      `CREATE TABLE IF NOT EXISTS household_members (householdId TEXT NOT NULL, userId TEXT NOT NULL, role TEXT DEFAULT 'member', PRIMARY KEY (householdId, userId))`
    );
    db.run(
      `CREATE TABLE IF NOT EXISTS lists (id TEXT PRIMARY KEY, name TEXT DEFAULT 'Untitled List', householdId TEXT, createdAt INTEGER)`
    );
    db.run(
      `CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, listId TEXT NOT NULL, name TEXT NOT NULL, quantity INTEGER DEFAULT 1, completed INTEGER DEFAULT 0, createdAt INTEGER, category TEXT DEFAULT 'Uncategorized', price REAL DEFAULT 0)`
    );

    try {
      db.run(`ALTER TABLE lists ADD COLUMN householdId TEXT`, () => {});
    } catch (e) {}
    try {
      db.run(
        `ALTER TABLE items ADD COLUMN category TEXT DEFAULT 'Uncategorized'`,
        () => {}
      );
    } catch (e) {}
    try {
      db.run(`ALTER TABLE items ADD COLUMN price REAL DEFAULT 0`, () => {});
    } catch (e) {}
    try {
      db.run(
        `ALTER TABLE users ADD COLUMN country TEXT DEFAULT 'UK'`,
        () => {}
      );
    } catch (e) {}
  });
}

// --- SOCKET.IO ---
const io = new Server(server, { cors: { origin: "*" } });
io.on("connection", (socket) => {
  socket.on("join-list", (listId) => socket.join(listId));
  socket.on("join-household", (householdId) => socket.join(householdId));
});

const notifyListUpdate = (listId) => io.to(listId).emit("list-updated");
const notifyHouseholdUpdate = (householdId) =>
  io.to(householdId).emit("household-updated");

// --- AI HELPER (Groq Implementation) ---
async function askAI(systemPrompt, userPrompt) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      // UPDATED MODEL HERE
      model: "llama-3.1-8b-instant",
      temperature: 0.3, // Lower temperature for more deterministic/structured output
      response_format: { type: "json_object" }, // Force JSON mode (Llama 3 supports this well)
    });

    const text = completion.choices[0]?.message?.content || "";

    // Parse the response
    // Llama 3 with json_object mode usually returns clean JSON, but we still wrap in try/catch
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Generation Failed:", error.message);
    return []; // Fallback
  }
}

// --- MIDDLEWARE ---
const requireListAccess = (req, res, next) => {
  const userId = req.headers["x-user-id"];
  const listId = req.params.listId || req.params.id || req.body.listId;

  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  db.get(
    "SELECT householdId FROM lists WHERE id = ?",
    [listId],
    (err, list) => {
      if (err || !list)
        return res.status(404).json({ error: "List not found" });
      if (!list.householdId) return next();

      db.get(
        "SELECT 1 FROM household_members WHERE householdId = ? AND userId = ?",
        [list.householdId, userId],
        (err, member) => {
          if (!member) return res.status(403).json({ error: "Access Denied" });
          req.householdId = list.householdId;
          next();
        }
      );
    }
  );
};

// --- ROUTES ---

// User & Household
app.post("/api/users/init", (req, res) => {
  const { id, name, country } = req.body;
  db.run(
    `INSERT INTO users (id, name, country) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET country=excluded.country`,
    [id, name || "Chef", country || "UK"],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.put("/api/users/:id", (req, res) => {
  const { country } = req.body;
  db.run(
    "UPDATE users SET country = ? WHERE id = ?",
    [country, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.get("/api/users/:id", (req, res) => {
  db.get("SELECT * FROM users WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || { id: req.params.id, country: "UK" });
  });
});

app.post("/api/households", (req, res) => {
  const { id, name, ownerId } = req.body;
  db.serialize(() => {
    db.run("INSERT INTO households (id, name, ownerId) VALUES (?, ?, ?)", [
      id,
      name,
      ownerId,
    ]);
    db.run(
      "INSERT INTO household_members (householdId, userId, role) VALUES (?, ?, 'admin')",
      [id, ownerId]
    );
  });
  res.json({ success: true });
});

app.put("/api/households/:id", (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.headers["x-user-id"];
  db.get(
    "SELECT 1 FROM household_members WHERE householdId = ? AND userId = ?",
    [id, userId],
    (err, member) => {
      if (!member) return res.status(403).json({ error: "Access Denied" });
      db.run(
        "UPDATE households SET name = ? WHERE id = ?",
        [name, id],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          notifyHouseholdUpdate(id);
          res.json({ success: true });
        }
      );
    }
  );
});

app.post("/api/households/join", (req, res) => {
  const { householdId, userId } = req.body;
  db.serialize(() => {
    db.run(
      "INSERT OR IGNORE INTO household_members (householdId, userId) VALUES (?, ?)",
      [householdId, userId]
    );
    db.get(
      `SELECT h.*, (SELECT COUNT(*) FROM household_members WHERE householdId = h.id) as memberCount 
            FROM households h WHERE h.id = ?`,
      [householdId],
      (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Household not found" });
        res.json(row);
      }
    );
  });
});

app.delete("/api/households/:id", (req, res) => {
  const householdId = req.params.id;
  const userId = req.headers["x-user-id"];
  db.get(
    "SELECT ownerId FROM households WHERE id = ?",
    [householdId],
    (err, house) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!house) return res.status(404).json({ error: "Household not found" });
      if (house.ownerId !== userId)
        return res
          .status(403)
          .json({ error: "Only the owner can delete this household" });
      db.serialize(() => {
        db.all(
          "SELECT id FROM lists WHERE householdId = ?",
          [householdId],
          (err, lists) => {
            if (lists.length > 0) {
              const listIds = lists
                .map((l) => l.id)
                .map((id) => `'${id}'`)
                .join(",");
              db.run(`DELETE FROM items WHERE listId IN (${listIds})`);
            }
            db.run("DELETE FROM lists WHERE householdId = ?", [householdId]);
            db.run("DELETE FROM household_members WHERE householdId = ?", [
              householdId,
            ]);
            db.run(
              "DELETE FROM households WHERE id = ?",
              [householdId],
              (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
              }
            );
          }
        );
      });
    }
  );
});

app.get("/api/users/:userId/households", (req, res) => {
  const query = `SELECT h.*, (SELECT COUNT(*) FROM household_members WHERE householdId = h.id) as memberCount FROM households h JOIN household_members hm ON h.id = hm.householdId WHERE hm.userId = ?`;
  db.all(query, [req.params.userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// List Management
app.get("/api/households/:householdId/lists", (req, res) => {
  const userId = req.headers["x-user-id"];
  db.get(
    "SELECT 1 FROM household_members WHERE householdId = ? AND userId = ?",
    [req.params.householdId, userId],
    (err, member) => {
      if (!member) return res.status(403).json({ error: "Access Denied" });
      db.all(
        "SELECT * FROM lists WHERE householdId = ? ORDER BY createdAt DESC",
        [req.params.householdId],
        (err, rows) => {
          res.json(rows);
        }
      );
    }
  );
});

app.post("/api/lists", (req, res) => {
  const { id, name, householdId } = req.body;
  db.run(
    `INSERT OR REPLACE INTO lists (id, name, householdId, createdAt) VALUES (?, ?, ?, COALESCE((SELECT createdAt FROM lists WHERE id=?), ?))`,
    [id, name, householdId, id, Date.now()],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      notifyListUpdate(id);
      if (householdId) notifyHouseholdUpdate(householdId);
      res.json({ success: true });
    }
  );
});

app.put("/api/lists/:id", requireListAccess, (req, res) => {
  const { name } = req.body;
  const { id } = req.params;
  db.run("UPDATE lists SET name = ? WHERE id = ?", [name, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    notifyListUpdate(id);
    if (req.householdId) notifyHouseholdUpdate(req.householdId);
    res.json({ success: true });
  });
});

app.delete("/api/lists/:id", requireListAccess, (req, res) => {
  const listId = req.params.id;
  db.serialize(() => {
    db.run("DELETE FROM items WHERE listId = ?", [listId]);
    db.run("DELETE FROM lists WHERE id = ?", [listId], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      if (req.householdId) notifyHouseholdUpdate(req.householdId);
      res.json({ success: true });
    });
  });
});

// Items (Secured)
app.get("/api/lists/:listId/items", requireListAccess, (req, res) => {
  db.all(
    "SELECT * FROM items WHERE listId = ? ORDER BY createdAt DESC",
    [req.params.listId],
    (err, rows) => {
      res.json(rows.map((r) => ({ ...r, completed: !!r.completed })));
    }
  );
});

app.post("/api/items", (req, res) => {
  const { id, listId, name, quantity, createdAt, category, price } = req.body;
  db.run(
    "INSERT INTO items VALUES (?, ?, ?, ?, 0, ?, ?, ?)",
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
  db.get("SELECT listId FROM items WHERE id = ?", [id], (err, item) => {
    if (!item) return res.status(404).json({ error: "Not found" });
    const updates = req.body;
    const fields = Object.keys(updates)
      .map((k) => `${k} = ?`)
      .join(", ");
    const values = Object.values(updates).map((v) =>
      typeof v === "boolean" ? (v ? 1 : 0) : v
    );
    db.run(
      `UPDATE items SET ${fields} WHERE id = ?`,
      [...values, id],
      (err) => {
        notifyListUpdate(item.listId);
        res.json({ success: true });
      }
    );
  });
});

app.delete("/api/items/:id", (req, res) => {
  const { id } = req.params;
  db.get("SELECT listId FROM items WHERE id = ?", [id], (err, row) => {
    if (!row) return res.json({ success: true });
    db.run("DELETE FROM items WHERE id = ?", [id], (err) => {
      notifyListUpdate(row.listId);
      res.json({ success: true });
    });
  });
});

// AI Endpoint (Groq Powered)
app.post("/api/ai/generate", aiLimiter, async (req, res) => {
  const { mode, inputData, country } = req.body;

  const localeConfig = {
    UK: {
      currency: "GBP (£)",
      lang: "English",
      promptSuffix: "Use UK brands and terminology.",
    },
    DE: {
      currency: "EUR (€)",
      lang: "German",
      promptSuffix:
        "Antworten Sie auf Deutsch. Verwenden Sie deutsche Produkte.",
    },
    IR: {
      currency: "IRR (Rials)",
      lang: "Persian (Farsi)",
      promptSuffix: "Respond in Persian (Farsi). Use Iranian ingredients.",
    },
  };
  const locale = localeConfig[country] || localeConfig["UK"];

  // System Prompt: Sets the persona and strict rules
  const systemPrompt = `You are an expert chef and meal planner for the ${country} region. 
  Respond strictly in ${locale.lang}. 
  Prices must be in ${locale.currency}. 
  You MUST return a valid JSON object. Do not include markdown formatting or introductory text.
  ${locale.promptSuffix}`;

  let userPrompt = "";

  if (mode === "dish-to-ingredients") {
    userPrompt = `Break down the dish "${inputData}" into grocery ingredients. 
    CRITICAL: 'quantity' must be PACK COUNT (integer). Put weight/size in 'name'.
    JSON Schema: { "suggestions": [{"name": "Item Name (Weight)", "price": 4.50, "quantity": 1}, ...] }`;
  } else if (mode === "ingredients-to-dish") {
    const ingredients = inputData.join(", ");
    userPrompt = `I have these groceries: ${ingredients}. Suggest 3 distinct dishes.
    JSON Schema: { "suggestions": [{"dish": "Dish Name", "matchedIngredients": ["Ing1", "Ing2"]}] }`;
  } else if (mode === "meal-planner") {
    userPrompt = `Create a meal plan based on: "${inputData}".
    CRITICAL: 'quantity' must be PACK COUNT (integer).
    JSON Schema: { "suggestions": [{"dish": "Monday Dinner: Tacos", "ingredients": [{"name": "Taco Shells", "price": 2.00, "quantity": 1}]}] }`;
  }

  const result = await askAI(systemPrompt, userPrompt);

  // Handle case where AI returns object instead of array (due to schema prompt)
  // We normalize it to always send { suggestions: [] }
  if (Array.isArray(result)) {
    res.json({ suggestions: result });
  } else if (result.suggestions) {
    res.json(result);
  } else {
    // Fallback if structure is weird
    res.json({ suggestions: [] });
  }
});

server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
