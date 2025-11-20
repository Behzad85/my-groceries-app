import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  Check,
  ShoppingCart,
  Minus,
  Moon,
  Sun,
  Share2,
  LogOut,
  Loader2,
  Users,
  Copy,
  Wifi,
  WifiOff,
  AlertCircle,
  Sparkles,
  ChefHat,
  ArrowRight,
  Utensils,
  Tag,
  History,
  Edit2,
  Save,
  FolderOpen,
  FilePlus,
  Calendar,
  Link as LinkIcon,
} from "lucide-react";
import io from "socket.io-client";

// --- Configuration ---
const SERVER_URL = "http://localhost:3000"; // Change to '' for production
const API_URL = `${SERVER_URL}/api`;
const socket = io(SERVER_URL);

// --- Utilities ---
const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// --- Components ---

const Button = ({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
}) => {
  const variants = {
    primary:
      "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 disabled:opacity-50",
    secondary:
      "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 hover:bg-slate-200 dark:hover:bg-zinc-700",
    ghost:
      "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-zinc-800",
    magic:
      "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30 hover:opacity-90",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2 active:scale-95 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

// --- MODALS ---

const HistoryModal = ({ currentListId, onClose, onLoadList, onNewList }) => {
  const [savedLists, setSavedLists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const localIds = JSON.parse(
          localStorage.getItem("grocery_history_ids") || "[]"
        );
        if (!localIds.includes(currentListId)) localIds.unshift(currentListId);

        const res = await fetch(`${API_URL}/lists/batch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: localIds }),
        });

        const data = await res.json();
        const merged = localIds.map((id) => {
          const found = data.find((d) => d.id === id);
          return found || { id, name: "Untitled List", createdAt: Date.now() };
        });
        setSavedLists(merged);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, [currentListId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[80vh] border border-slate-200 dark:border-zinc-800">
        <div className="p-4 bg-slate-50 dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FolderOpen size={18} className="text-emerald-500" /> My Lists
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
          >
            ✕
          </button>
        </div>
        <div className="p-2 overflow-y-auto flex-1">
          <button
            onClick={() => {
              onNewList();
              onClose();
            }}
            className="w-full p-4 mb-2 flex items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-500 dark:text-slate-400 transition-all group"
          >
            <div className="bg-slate-100 dark:bg-zinc-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900 p-2 rounded-full">
              <FilePlus size={20} />
            </div>
            <span className="font-medium">Create New List</span>
          </button>
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-1">
              {savedLists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => {
                    onLoadList(list.id);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-xl text-left transition-colors flex justify-between items-center ${
                    list.id === currentListId
                      ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                      : "hover:bg-slate-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div>
                    <div
                      className={`font-medium ${
                        list.id === currentListId
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {list.name || "Untitled List"}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate w-32">
                      {list.id.slice(0, 8)}...
                    </div>
                  </div>
                  {list.id === currentListId && (
                    <Check size={16} className="text-emerald-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ShareModal = ({ listId, onClose }) => {
  const [copied, setCopied] = useState(false);

  // Construct the full shareable URL
  const shareUrl = `${window.location.origin}${window.location.pathname}?list=${listId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join my Grocery List",
          text: "Here is the link to our shared grocery list:",
          url: shareUrl,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-6 border border-slate-200 dark:border-zinc-800">
        <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
          <Users size={20} className="text-emerald-500" /> Share List
        </h3>

        <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800 text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <LinkIcon size={32} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-1 font-medium">
            Send link to family
          </p>
          <p className="text-xs text-slate-400">
            Anyone with this link can view and edit this list.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            onClick={handleNativeShare}
            className="w-full py-3 text-base shadow-emerald-500/20"
          >
            <Share2 size={18} /> Share via App
          </Button>

          <div className="flex gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs text-slate-500 truncate focus:outline-none"
            />
            <Button variant="secondary" onClick={handleCopy}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </Button>
          </div>
        </div>

        <Button variant="ghost" onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    </div>
  );
};

const ChefModal = ({ groceries, onAddDish, onGroupIngredients, onClose }) => {
  const [mode, setMode] = useState("dish-to-ingredients");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleGenerate = async () => {
    if (mode !== "ingredients-to-dish" && !input.trim()) return;
    setLoading(true);

    let inputData = input;
    if (mode === "ingredients-to-dish") {
      inputData = groceries.filter((g) => !g.completed).map((g) => g.name);
      if (inputData.length === 0) {
        alert("Add items first!");
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(`${API_URL}/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, inputData }),
      });
      const data = await res.json();
      setResults(data.suggestions || []);
    } catch (e) {
      console.error(e);
      alert("Chef Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh] overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <Sparkles size={18} /> AI Chef
          </h3>
          <button onClick={onClose} className="hover:text-white/80">
            ✕
          </button>
        </div>
        <div className="flex border-b border-slate-200 dark:border-zinc-800 overflow-x-auto no-scrollbar">
          {["dish-to-ingredients", "meal-planner", "ingredients-to-dish"].map(
            (m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setResults([]);
                }}
                className={`flex-1 py-3 px-4 text-sm font-medium whitespace-nowrap transition-colors ${
                  mode === m
                    ? "text-fuchsia-600 border-b-2 border-fuchsia-600 dark:text-fuchsia-400"
                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800"
                }`}
              >
                {m === "dish-to-ingredients"
                  ? "Recipe"
                  : m === "meal-planner"
                  ? "Meal Plan"
                  : "Organize"}
              </button>
            )
          )}
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {mode === "dish-to-ingredients" && (
            <>
              <p className="text-sm text-slate-500">
                Enter a dish name to get ingredients.
              </p>
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  placeholder="e.g. Tacos"
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent dark:text-white"
                />
                <Button
                  variant="magic"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <ArrowRight />
                  )}
                </Button>
              </div>
              {results.length > 0 && (
                <div className="bg-slate-50 dark:bg-zinc-950 rounded-xl p-4 border border-slate-100 dark:border-zinc-800">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-slate-700 dark:text-white">
                      {input}
                    </h4>
                    <span className="text-xs font-mono bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                      Total: £
                      {results
                        .reduce((acc, i) => acc + (i.price || 0), 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {results.map((item, i) => (
                      <li
                        key={i}
                        className="text-sm flex justify-between text-slate-600 dark:text-slate-400"
                      >
                        <span>
                          {item.name}{" "}
                          {item.quantity > 1 && `(x${item.quantity})`}
                        </span>
                        <span>£{item.price?.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => {
                      onAddDish(input, results);
                      onClose();
                    }}
                  >
                    Add All
                  </Button>
                </div>
              )}
            </>
          )}

          {mode === "meal-planner" && (
            <>
              <p className="text-sm text-slate-500">
                Describe your plan (e.g., "Vegan meals for 3 days").
              </p>
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  placeholder="e.g. High protein, 2 days"
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-transparent dark:text-white"
                />
                <Button
                  variant="magic"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Plan ✨"}
                </Button>
              </div>
              {results.length > 0 && (
                <div className="space-y-4">
                  {results.map((plan, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 dark:bg-zinc-950 rounded-xl p-4 border border-slate-100 dark:border-zinc-800"
                    >
                      <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
                        <Calendar size={16} className="text-fuchsia-500" />{" "}
                        {plan.dish}
                      </h4>
                      <ul className="space-y-1 mb-3 pl-6 list-disc text-sm text-slate-600 dark:text-slate-400">
                        {plan.ingredients.map((ing, i) => (
                          <li key={i}>{ing.name}</li>
                        ))}
                      </ul>
                      <Button
                        variant="secondary"
                        className="w-full text-xs"
                        onClick={() => onAddDish(plan.dish, plan.ingredients)}
                      >
                        Add to List
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => {
                      results.forEach((r) => onAddDish(r.dish, r.ingredients));
                      onClose();
                    }}
                  >
                    Add All Plans
                  </Button>
                </div>
              )}
            </>
          )}

          {mode === "ingredients-to-dish" && (
            <>
              <p className="text-sm text-slate-500">
                I'll organize your current list into dishes.
              </p>
              <Button
                variant="magic"
                onClick={handleGenerate}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Analyzing..." : "Organize List"}
              </Button>
              <div className="space-y-3 mt-4">
                {results.map((res, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onGroupIngredients(res.dish, res.matchedIngredients);
                      onClose();
                    }}
                    className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-fuchsia-500 transition-all group bg-white dark:bg-zinc-950"
                  >
                    <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-fuchsia-500 flex items-center gap-2">
                      <Utensils size={16} /> {res.dish}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Items: {res.matchedIngredients.join(", ")}
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [groceries, setGroceries] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [newCategory, setNewCategory] = useState("");

  // Initialize darkMode with system preference check + localStorage
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("grocery_theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const [loading, setLoading] = useState(true);
  const [listId, setListId] = useState(() => {
    // 1. Check URL params first
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlListId = params.get("list");
      if (urlListId) return urlListId;
    }
    // 2. Fallback to local storage or generate new
    return localStorage.getItem("grocery_list_id") || generateUUID();
  });

  const [listName, setListName] = useState("Untitled List");
  const [isEditingName, setIsEditingName] = useState(false);

  const [showShare, setShowShare] = useState(false);
  const [showChef, setShowChef] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // URL param cleanup - Auto-joins list from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("list")) {
      const newListId = params.get("list");
      setListId(newListId); // Force switch to URL list
      // Clean the URL without refreshing
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Apply Dark Mode Class
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("grocery_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("grocery_theme", "light");
    }
  }, [darkMode]);

  // Save accessed list to history
  useEffect(() => {
    const history = JSON.parse(
      localStorage.getItem("grocery_history_ids") || "[]"
    );
    if (!history.includes(listId)) {
      const newHistory = [listId, ...history].slice(0, 10);
      localStorage.setItem("grocery_history_ids", JSON.stringify(newHistory));
    }
    localStorage.setItem("grocery_list_id", listId);
  }, [listId]);

  // Fetch Data & Socket Listeners
  useEffect(() => {
    setLoading(true);
    const fetchAll = async () => {
      try {
        const itemsRes = await fetch(`${API_URL}/lists/${listId}/items`);
        if (itemsRes.ok) setGroceries(await itemsRes.json());
        const metaRes = await fetch(`${API_URL}/lists/${listId}`);
        if (metaRes.ok) {
          const meta = await metaRes.json();
          setListName(meta.name || "Untitled List");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
    socket.emit("join-list", listId);
    socket.on("list-updated", fetchAll);
    return () => socket.off("list-updated");
  }, [listId]);

  const handleSaveName = async () => {
    setIsEditingName(false);
    try {
      await fetch(`${API_URL}/lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: listId, name: listName }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const switchList = (id) => setListId(id);
  const createNewList = () => switchList(generateUUID());

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    const payload = {
      id: generateUUID(),
      listId,
      name: newItem.trim(),
      quantity: 1,
      category: newCategory.trim() || "Uncategorized",
      price: 0,
      createdAt: Date.now(),
    };
    setGroceries((prev) => [payload, ...prev]);
    setNewItem("");
    await fetch(`${API_URL}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  };

  const addDishIngredients = async (dishName, ingredients) => {
    const items = ingredients.map((i) => {
      let qty = parseInt(i.quantity) || 1;
      if (qty > 50) qty = 1;
      return {
        id: generateUUID(),
        listId,
        name: i.name,
        quantity: qty,
        category: dishName,
        price: i.price || 0,
        createdAt: Date.now(),
      };
    });
    setGroceries((prev) => [...items, ...prev]);
    for (const item of items) {
      await fetch(`${API_URL}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    }
  };

  const groupExistingIngredients = async (dishName, itemNames) => {
    const updates = groceries
      .filter((g) =>
        itemNames.some((n) => n.toLowerCase() === g.name.toLowerCase())
      )
      .map((g) => updateItem(g.id, { category: dishName }));
    await Promise.all(updates);
  };

  const updateItem = async (id, updates) => {
    setGroceries((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
    await fetch(`${API_URL}/items/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  };

  const deleteItem = async (id) => {
    setGroceries((prev) => prev.filter((i) => i.id !== id));
    await fetch(`${API_URL}/items/${id}`, { method: "DELETE" });
  };

  const grouped = groceries.reduce((acc, item) => {
    const cat = item.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = { items: [], total: 0 };
    acc[cat].items.push(item);
    acc[cat].total += (item.price || 0) * (item.quantity || 1);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort((a, b) =>
    a === "Uncategorized" ? 1 : b === "Uncategorized" ? -1 : a.localeCompare(b)
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 text-slate-800 dark:text-slate-100 font-sans transition-colors">
      <div className="max-w-md mx-auto bg-white dark:bg-black shadow-xl min-h-screen sm:min-h-0 flex flex-col sm:border-x sm:border-slate-200 dark:sm:border-zinc-800">
        <div className="bg-emerald-600 dark:bg-emerald-900/90 text-white sticky top-0 z-20 backdrop-blur-md shadow-sm">
          <div className="p-4 flex justify-between items-center pb-2">
            <div className="flex-1 min-w-0 mr-4">
              {isEditingName ? (
                <input
                  autoFocus
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                  className="bg-transparent border-b border-white/50 text-xl font-bold w-full focus:outline-none focus:border-white"
                />
              ) : (
                <div
                  className="flex items-center gap-2 group cursor-pointer"
                  onClick={() => setIsEditingName(true)}
                >
                  <h1 className="text-xl font-bold truncate">{listName}</h1>
                  <Edit2
                    size={14}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
              )}
              <p className="text-xs text-emerald-100 opacity-80">
                {groceries.filter((g) => !g.completed).length} items •{" "}
                {Object.keys(grouped).length} categories
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowHistory(true)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <History size={20} />
              </button>
              <button
                onClick={() => setShowShare(true)}
                className="p-2 hover:bg-white/20 rounded-full"
              >
                <Share2 size={20} />
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
          <div className="px-4 pb-3 flex gap-3">
            <button
              onClick={() => setShowChef(true)}
              className="flex-1 py-2 bg-gradient-to-r from-violet-600/90 to-fuchsia-600/90 hover:from-violet-600 hover:to-fuchsia-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50 border border-white/10"
            >
              <ChefHat size={14} /> AI Chef
            </button>
            <button
              onClick={createNewList}
              className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors text-emerald-50"
            >
              <Plus size={14} /> New List
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-zinc-900/80 border-b border-slate-200 dark:border-zinc-800 sticky top-[118px] z-10 backdrop-blur">
          <form onSubmit={addItem} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag
                  size={14}
                  className="absolute top-3.5 left-3 text-slate-400"
                />
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Category"
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="relative flex-[2]">
                <input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Item Name"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <Button
                type="submit"
                disabled={!newItem.trim()}
                className="aspect-square !p-0 w-[46px]"
              >
                <Plus />
              </Button>
            </div>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {loading && groceries.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              <Loader2 className="animate-spin mx-auto mb-2" />
              Loading...
            </div>
          )}
          {!loading && groceries.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              List is empty. Start adding!
            </div>
          )}
          {categories.map((cat) => (
            <div
              key={cat}
              className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden"
            >
              <div className="bg-slate-50 dark:bg-zinc-950 p-3 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 dark:text-slate-200">
                  {cat}
                </h3>
                {grouped[cat].total > 0 && (
                  <span className="text-xs font-mono font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded">
                    £{grouped[cat].total.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                {grouped[cat].items
                  .sort((a, b) => a.completed - b.completed)
                  .map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 transition-opacity ${
                        item.completed ? "opacity-50" : ""
                      }`}
                    >
                      <button
                        onClick={() =>
                          updateItem(item.id, { completed: !item.completed })
                        }
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          item.completed
                            ? "bg-emerald-500 border-emerald-500"
                            : "border-slate-300 dark:border-zinc-600"
                        }`}
                      >
                        {item.completed && (
                          <Check size={12} className="text-white" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-medium break-words ${
                            item.completed
                              ? "line-through text-slate-400"
                              : "dark:text-slate-200"
                          }`}
                        >
                          {item.name}
                        </p>
                        {item.price > 0 && (
                          <p className="text-[10px] text-slate-400">
                            £{item.price.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-lg">
                          <button
                            onClick={() =>
                              updateItem(item.id, {
                                quantity: Math.max(
                                  1,
                                  (parseInt(item.quantity) || 1) - 1
                                ),
                              })
                            }
                            className="p-1 hover:text-emerald-500"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-bold w-6 text-center truncate">
                            {parseInt(item.quantity) || 1}
                          </span>
                          <button
                            onClick={() =>
                              updateItem(item.id, {
                                quantity: (parseInt(item.quantity) || 1) + 1,
                              })
                            }
                            className="p-1 hover:text-emerald-500"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="text-slate-300 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showShare && (
        <ShareModal listId={listId} onClose={() => setShowShare(false)} />
      )}
      {showChef && (
        <ChefModal
          groceries={groceries}
          onAddDish={addDishIngredients}
          onGroupIngredients={groupExistingIngredients}
          onClose={() => setShowChef(false)}
        />
      )}
      {showHistory && (
        <HistoryModal
          currentListId={listId}
          onClose={() => setShowHistory(false)}
          onLoadList={switchList}
          onNewList={createNewList}
        />
      )}
    </div>
  );
}
