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
  Link as LinkIcon,
} from "lucide-react";
import io from "socket.io-client";

// --- Configuration ---

// 1. Backend URL
// CHANGE THIS:
// - Use 'http://localhost:3000' for local development or when running this preview.
// - Use '' (empty string) for production deployment (Apache/Nginx) to use relative paths.
const SERVER_URL = "";

// 2. API & Socket
const API_URL = `${SERVER_URL}/api`;
const socket = io(SERVER_URL);

// --- Utilities ---

/**
 * Generates a UUID v4.
 * Fallback for HTTP contexts where crypto.randomUUID is unavailable.
 */
const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Get initial List ID from URL param or LocalStorage
 */
const getInitialListId = () => {
  // 1. Check URL for ?listId=xyz
  const params = new URLSearchParams(window.location.search);
  const urlListId = params.get("listId");

  if (urlListId) {
    // Clean the URL so the user doesn't get stuck on this query param if they refresh
    window.history.replaceState({}, document.title, window.location.pathname);
    return urlListId;
  }

  // 2. Fallback to storage or new ID
  return localStorage.getItem("grocery_list_id") || generateUUID();
};

// --- Components ---

const Button = ({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
  type = "button",
}) => {
  const variants = {
    primary:
      "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary:
      "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 hover:bg-slate-200 dark:hover:bg-zinc-700",
    danger:
      "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 active:scale-95 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const ShareModal = ({ listId, onClose, onJoin }) => {
  const [code, setCode] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const shareUrl = `${window.location.origin}?listId=${listId}`;

  const handleCopyLink = () => {
    const textArea = document.createElement("textarea");
    textArea.value = shareUrl;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-zinc-800">
        <div className="p-4 bg-slate-50 dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Users size={18} className="text-emerald-500" /> Family Sync
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Share Invite Link
            </label>
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                <p className="text-xs text-emerald-800 dark:text-emerald-200 break-all font-mono mb-2">
                  {shareUrl}
                </p>
              </div>
              <Button
                variant="primary"
                onClick={handleCopyLink}
                className="w-full"
              >
                {copiedLink ? <Check size={18} /> : <LinkIcon size={18} />}
                {copiedLink ? "Link Copied!" : "Copy Link"}
              </Button>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-500 mt-2">
              Anyone with this link can view and edit this list.
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-zinc-800"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-zinc-900 px-2 text-xs text-slate-400 uppercase">
                Or
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Join Manually
            </label>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onJoin(code);
              }}
              className="flex gap-2"
            >
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter code..."
                className="flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Button
                variant="secondary"
                type="submit"
                disabled={code.length < 3}
              >
                Join
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Application ---

export default function App() {
  const [groceries, setGroceries] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(socket.connected);

  // Initialize List ID from URL (if shared link used) or LocalStorage
  const [listId, setListId] = useState(() => getInitialListId());

  const [showShare, setShowShare] = useState(false);
  const inputRef = useRef(null);

  // 1. Theme Management
  useEffect(() => {
    const isSystemDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    if (darkMode || isSystemDark)
      document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [darkMode]);

  // 2. Connection & Data Sync
  useEffect(() => {
    localStorage.setItem("grocery_list_id", listId);
    setLoading(true);
    setError(null);

    // Fetch initial data
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/lists/${listId}/items`);
        if (!res.ok) throw new Error("Server unavailable");
        const data = await res.json();
        setGroceries(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch items:", err);
        setError("Could not connect to backend server.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Socket Event Listeners
    const onConnect = () => {
      setIsConnected(true);
      setError(null);
    };
    const onDisconnect = () => setIsConnected(false);
    const onConnectError = () => {
      setIsConnected(false);
    };
    const onUpdate = () => {
      console.log("List updated remotely, refreshing...");
      fetchData();
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("list-updated", onUpdate);

    // Join the specific room for this list
    socket.emit("join-list", listId);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("list-updated", onUpdate);
    };
  }, [listId]);

  // 3. Actions (API Calls)

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    const itemPayload = {
      id: generateUUID(),
      listId,
      name: newItem.trim(),
      quantity: parseInt(newQty) || 1,
      createdAt: Date.now(),
    };

    // Optimistic Update
    setGroceries((prev) => [itemPayload, ...prev]);
    setNewItem("");
    setNewQty(1);
    inputRef.current?.focus();

    try {
      await fetch(`${API_URL}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemPayload),
      });
    } catch (err) {
      console.error("Add failed", err);
      setError("Failed to save item. Is backend running?");
    }
  };

  const updateItem = async (id, updates) => {
    // Optimistic Update
    setGroceries((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );

    try {
      await fetch(`${API_URL}/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const deleteItem = async (id) => {
    // Optimistic Update
    setGroceries((prev) => prev.filter((i) => i.id !== id));

    try {
      await fetch(`${API_URL}/items/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  // 4. Sorting Logic (Uncompleted first, then newest)
  const sortedGroceries = [...groceries].sort((a, b) => {
    if (a.completed === b.completed) return b.createdAt - a.createdAt;
    return a.completed ? 1 : -1;
  });

  // --- Render ---

  return (
    <div className="h-full min-h-screen bg-slate-100 dark:bg-zinc-950 text-slate-800 dark:text-slate-100 transition-colors font-sans">
      <div className="max-w-md mx-auto bg-white dark:bg-black shadow-2xl min-h-screen sm:min-h-0 flex flex-col sm:border-x sm:border-slate-200 dark:sm:border-zinc-800">
        {/* Header */}
        <div className="bg-emerald-600 dark:bg-emerald-900/80 p-6 text-white flex justify-between items-center transition-colors sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm shadow-sm">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">OurGroceries</h1>
              <div className="flex items-center gap-1.5 text-xs text-emerald-100 opacity-90">
                {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                <span>{isConnected ? "Synced" : "Connecting..."}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowShare(true)}
              className="p-2.5 hover:bg-white/20 rounded-full transition-colors active:scale-95"
            >
              <Share2 size={20} />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 hover:bg-white/20 rounded-full transition-colors active:scale-95"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 p-3 flex items-center justify-center gap-2 text-sm text-red-600 dark:text-red-400 border-b border-red-100 dark:border-red-900/50">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-900/80 border-b border-slate-200 dark:border-zinc-800 sticky top-[88px] sm:top-0 z-10 backdrop-blur-md">
          <form onSubmit={handleAddItem} className="flex gap-2">
            <div className="relative w-16">
              <input
                type="number"
                min="1"
                value={newQty}
                onChange={(e) => setNewQty(e.target.value)}
                className="w-full px-2 py-3.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-center font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all"
              />
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-slate-50 dark:bg-zinc-900 px-1 text-slate-400 uppercase">
                Qty
              </span>
            </div>
            <input
              ref={inputRef}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add item to the list..."
              className="flex-1 px-4 py-3.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all"
            />
            <Button
              type="submit"
              disabled={!newItem.trim()}
              className="aspect-square !p-0 w-[52px]"
            >
              <Plus size={26} strokeWidth={2.5} />
            </Button>
          </form>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-0 bg-white dark:bg-black">
          {loading && groceries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-emerald-600 dark:text-emerald-500">
              <Loader2 className="animate-spin w-8 h-8" />
              <span className="text-sm font-medium">Loading List...</span>
            </div>
          ) : groceries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-zinc-600 text-center p-8">
              <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-lg font-medium">List is empty</p>
              <p className="text-sm mt-1">
                Add items above or share your code to sync.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-zinc-800 pb-20">
              {sortedGroceries.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-center gap-3 p-4 transition-all duration-300 ${
                    item.completed
                      ? "bg-slate-50/80 dark:bg-zinc-900/40 opacity-60"
                      : "hover:bg-slate-50 dark:hover:bg-zinc-900/30"
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() =>
                      updateItem(item.id, { completed: !item.completed })
                    }
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors shadow-sm ${
                      item.completed
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-slate-300 dark:border-zinc-600 hover:border-emerald-400"
                    }`}
                  >
                    <Check
                      size={14}
                      className={`text-white transition-transform ${
                        item.completed ? "scale-100" : "scale-0"
                      }`}
                      strokeWidth={3}
                    />
                  </button>

                  {/* Text */}
                  <div
                    className="flex-1 cursor-pointer min-w-0"
                    onClick={() =>
                      updateItem(item.id, { completed: !item.completed })
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg font-medium truncate ${
                          item.completed
                            ? "line-through text-slate-400 dark:text-zinc-500"
                            : "text-slate-700 dark:text-zinc-200"
                        }`}
                      >
                        {item.name}
                      </span>
                      {item.quantity > 1 && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                            item.completed
                              ? "bg-slate-200 dark:bg-zinc-800 text-slate-500"
                              : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          x{item.quantity}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <div className="flex bg-slate-100 dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800">
                      <button
                        onClick={() =>
                          updateItem(item.id, {
                            quantity: Math.max(1, (item.quantity || 1) - 1),
                          })
                        }
                        className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <button
                        onClick={() =>
                          updateItem(item.id, {
                            quantity: (item.quantity || 1) + 1,
                          })
                        }
                        className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 text-slate-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 transition-colors ml-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showShare && (
        <ShareModal
          listId={listId}
          onClose={() => setShowShare(false)}
          onJoin={(code) => {
            setListId(code);
            setShowShare(false);
          }}
        />
      )}
    </div>
  );
}
