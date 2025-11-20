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
  Home,
  UserPlus,
  Lock,
  KeyRound,
  Menu,
  List,
  Globe,
  Settings,
  Upload,
} from "lucide-react";
import io from "socket.io-client";

// --- Configuration ---
const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");
const SERVER_URL = isLocal ? "http://localhost:3000" : "";
const API_URL = `${SERVER_URL}/api`;

const socket = io(SERVER_URL, { autoConnect: true, reconnection: true });

// --- Localization (V4) ---
const TRANSLATIONS = {
  UK: {
    welcome: "Welcome!",
    start: "Get Started",
    createHouse: "Create Household",
    joinHouse: "Join Household",
    myHouseholds: "My Households",
    share: "Share",
    shareVia: "Share via App",
    chef: "AI Chef",
    newList: "New List",
    items: "items",
    category: "Category",
    itemName: "Item Name",
    add: "Add",
    total: "Total",
    loading: "Loading...",
    emptyList: "List is empty. Start adding!",
    accessDenied: "Access Denied",
    recipe: "Recipe",
    mealPlan: "Meal Plan",
    organize: "Organize",
    planBtn: "Plan ✨",
    dishPlace: "e.g. Tacos",
    planPlace: "e.g. Vegan, 3 days",
    settings: "Settings",
    selectRegion: "Select Region & Currency",
    sync: "Syncing",
    offline: "Not Syncing",
    householdSettings: "Household Settings",
    appSettings: "App Settings",
  },
  DE: {
    welcome: "Willkommen!",
    start: "Loslegen",
    createHouse: "Haushalt erstellen",
    joinHouse: "Haushalt beitreten",
    myHouseholds: "Meine Haushalte",
    share: "Teilen",
    shareVia: "Über App teilen",
    chef: "KI-Koch",
    newList: "Neue Liste",
    items: "Artikel",
    category: "Kategorie",
    itemName: "Artikelname",
    add: "Hinzufügen",
    total: "Gesamt",
    loading: "Lädt...",
    emptyList: "Liste ist leer. Füge etwas hinzu!",
    accessDenied: "Zugriff verweigert",
    recipe: "Rezept",
    mealPlan: "Essensplan",
    organize: "Organisieren",
    planBtn: "Planen ✨",
    dishPlace: "z.B. Tacos",
    planPlace: "z.B. Vegan, 3 Tage",
    settings: "Einstellungen",
    selectRegion: "Region & Währung wählen",
    sync: "Synchronisieren",
    offline: "Nicht synchron",
    householdSettings: "Haushaltseinstellungen",
    appSettings: "App-Einstellungen",
  },
  IR: {
    welcome: "خوش آمدید!",
    start: "شروع کنید",
    createHouse: "ساخت خانه",
    joinHouse: "پیوستن به خانه",
    myHouseholds: "خانه‌های من",
    share: "اشتراک‌گذاری",
    shareVia: "اشتراک‌گذاری با برنامه",
    chef: "سرآشپز هوشمند",
    newList: "لیست جدید",
    items: "مورد",
    category: "دسته‌بندی",
    itemName: "نام کالا",
    add: "افزودن",
    total: "جمع کل",
    loading: "در حال بارگذاری...",
    emptyList: "لیست خالی است. شروع کنید!",
    accessDenied: "دسترسی غیرمجاز",
    recipe: "دستور پخت",
    mealPlan: "برنامه غذایی",
    organize: "مرتب‌سازی",
    planBtn: "برنامه‌ریزی ✨",
    dishPlace: "مثلا: قرمه سبزی",
    planPlace: "مثلا: گیاهخواری، ۳ روز",
    settings: "تنظیمات",
    selectRegion: "انتخاب کشور و ارز",
    sync: "همگام‌سازی",
    offline: "قطع ارتباط",
    householdSettings: "تنظیمات خانه",
    appSettings: "تنظیمات برنامه",
  },
};

const formatCurrency = (amount, country) => {
  if (!amount) return "";
  if (country === "UK") return `£${amount.toFixed(2)}`;
  if (country === "DE") return `${amount.toFixed(2)} €`;
  if (country === "IR") return `${amount.toLocaleString()} ﷼`;
  return `${amount}`;
};

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
      "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30 hover:opacity-90",
    danger:
      "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400",
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

// --- Bottom Nav (Redesigned: Floating Rectangle) ---
const BottomNav = ({
  onOpenLists,
  onOpenHouseholds,
  onOpenChef,
  onOpenSettings,
}) => {
  return (
    <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 px-4">
      <div className="flex items-center justify-between w-full max-w-sm bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl shadow-xl shadow-slate-300/20 dark:shadow-black/40 p-2">
        <button
          onClick={onOpenHouseholds}
          className="flex-1 p-3 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-zinc-700 transition-all flex flex-col items-center gap-1"
        >
          <Home size={22} strokeWidth={2.5} />
        </button>

        <div className="w-px h-6 bg-slate-200 dark:bg-zinc-700"></div>

        <button
          onClick={onOpenLists}
          className="flex-1 p-3 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-zinc-700 transition-all flex flex-col items-center gap-1"
        >
          <List size={22} strokeWidth={2.5} />
        </button>

        <div className="w-px h-6 bg-slate-200 dark:bg-zinc-700"></div>

        <button
          onClick={onOpenChef}
          className="flex-1 p-3 rounded-xl text-fuchsia-600 hover:bg-fuchsia-50 dark:text-fuchsia-400 dark:hover:bg-fuchsia-900/20 transition-all flex flex-col items-center gap-1"
        >
          <ChefHat size={22} strokeWidth={2.5} />
        </button>

        <div className="w-px h-6 bg-slate-200 dark:bg-zinc-700"></div>

        <button
          onClick={onOpenSettings}
          className="flex-1 p-3 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-zinc-700 transition-all flex flex-col items-center gap-1"
        >
          <Settings size={22} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

// --- Modals ---

const SettingsModal = ({ country, onChangeCountry, onClose, t }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col border border-slate-200 dark:border-zinc-800">
        <div className="p-4 bg-slate-50 dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Settings size={18} className="text-emerald-500" /> {t("settings")}
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
            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3">
              {t("selectRegion")}
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {[
                { code: "UK", label: "🇬🇧 UK", currency: "GBP" },
                { code: "DE", label: "🇩🇪 DE", currency: "EUR" },
                { code: "IR", label: "🇮🇷 Iran", currency: "IRR" },
              ].map((c) => (
                <button
                  key={c.code}
                  onClick={() => onChangeCountry(c.code)}
                  className={`p-3 rounded-xl border transition-all ${
                    country === c.code
                      ? "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 dark:bg-emerald-900/20 dark:border-emerald-500"
                      : "border-slate-200 dark:border-zinc-700 hover:border-emerald-300 dark:hover:border-zinc-600"
                  }`}
                >
                  <div className="text-2xl mb-1">{c.label.split(" ")[0]}</div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {c.code}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

const ListsModal = ({
  lists,
  currentListId,
  onLoadList,
  onNewList,
  onDeleteList,
  onRenameList,
  onClose,
  t,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const startEditing = (l) => {
    setEditingId(l.id);
    setEditName(l.name);
  };
  const saveEdit = (id) => {
    onRenameList(id, editName);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[80vh] border border-slate-200 dark:border-zinc-800">
        <div className="p-4 bg-slate-50 dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FolderOpen size={18} className="text-emerald-500" />{" "}
            {t("myHouseholds")}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
          >
            ✕
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          <button
            onClick={() => {
              onNewList();
              onClose();
            }}
            className="w-full p-4 mb-4 flex items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-500 dark:text-slate-400 transition-all group"
          >
            <div className="bg-slate-100 dark:bg-zinc-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900 p-2 rounded-full">
              <FilePlus size={20} />
            </div>
            <span className="font-medium">{t("newList")}</span>
          </button>
          <div className="space-y-2">
            {lists.map((list) => (
              <div
                key={list.id}
                className={`w-full p-3 rounded-xl flex justify-between items-center border transition-colors group ${
                  list.id === currentListId
                    ? "bg-emerald-50 border-emerald-500 dark:bg-emerald-900/20"
                    : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800"
                }`}
              >
                {editingId === list.id ? (
                  <div className="flex flex-1 gap-2 items-center">
                    <input
                      autoFocus
                      className="flex-1 bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded px-2 py-1 text-sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(list.id)}
                    />
                    <button onClick={() => saveEdit(list.id)}>
                      <Check size={16} className="text-green-500" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onLoadList(list.id);
                      onClose();
                    }}
                    className="flex-1 text-left"
                  >
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
                  </button>
                )}
                <div className="flex items-center gap-1 pl-2">
                  {editingId !== list.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(list);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                  {editingId !== list.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete?")) onDeleteList(list.id);
                      }}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  {list.id === currentListId && editingId !== list.id && (
                    <Check size={16} className="text-emerald-500 ml-1" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const HouseholdModal = ({
  userId,
  currentHousehold,
  onSwitchHousehold,
  onCreateHousehold,
  onJoinHousehold,
  onDeleteHousehold,
  onRenameHousehold,
  onClose,
  t,
}) => {
  const [households, setHouseholds] = useState([]);
  const [newHouseName, setNewHouseName] = useState("");
  const [joinId, setJoinId] = useState("");
  const [view, setView] = useState("list");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const fetchHouseholds = () => {
    fetch(`${API_URL}/users/${userId}/households`)
      .then((res) => res.json())
      .then(setHouseholds)
      .catch(console.error);
  };
  useEffect(() => {
    fetchHouseholds();
  }, [userId]);
  const handleDelete = async (hId) => {
    await onDeleteHousehold(hId);
    fetchHouseholds();
  };
  const startEditing = (h) => {
    setEditingId(h.id);
    setEditName(h.name);
  };
  const saveEdit = async (hId) => {
    await onRenameHousehold(hId, editName);
    setEditingId(null);
    fetchHouseholds();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[80vh] border border-slate-200 dark:border-zinc-800">
        <div className="p-4 bg-slate-50 dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Home size={18} className="text-emerald-500" /> {t("myHouseholds")}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
          >
            ✕
          </button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto">
          {view === "list" && (
            <>
              <div className="space-y-2">
                {households.map((h) => (
                  <div
                    key={h.id}
                    className={`w-full p-3 rounded-xl flex justify-between items-center border group ${
                      currentHousehold?.id === h.id
                        ? "bg-emerald-50 border-emerald-500 dark:bg-emerald-900/20"
                        : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {editingId === h.id ? (
                      <div className="flex flex-1 gap-2 items-center">
                        <input
                          autoFocus
                          className="flex-1 bg-white dark:bg-zinc-950 border border-slate-300 dark:border-zinc-700 rounded px-2 py-1 text-sm"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit(h.id)}
                        />
                        <button onClick={() => saveEdit(h.id)}>
                          <Check size={16} className="text-green-500" />
                        </button>
                      </div>
                    ) : (
                      <button
                        className="flex-1 text-left"
                        onClick={() => {
                          onSwitchHousehold(h);
                          onClose();
                        }}
                      >
                        <div className="font-bold text-slate-800 dark:text-slate-100">
                          {h.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {h.memberCount} members
                        </div>
                      </button>
                    )}
                    <div className="flex items-center gap-1 pl-2">
                      {editingId !== h.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(h);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {h.ownerId === userId && editingId !== h.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Delete?")) handleDelete(h.id);
                          }}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="secondary"
                  className="flex-1 text-xs"
                  onClick={() => setView("create")}
                >
                  {t("createHouse")}
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 text-xs"
                  onClick={() => setView("join")}
                >
                  {t("joinHouse")}
                </Button>
              </div>
            </>
          )}
          {view === "create" && (
            <div className="space-y-3">
              <input
                value={newHouseName}
                onChange={(e) => setNewHouseName(e.target.value)}
                placeholder="Name"
                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-transparent dark:text-white"
              />
              <Button
                variant="primary"
                className="w-full"
                disabled={!newHouseName.trim()}
                onClick={() => {
                  onCreateHousehold(newHouseName);
                  onClose();
                }}
              >
                Create
              </Button>
              <Button
                variant="ghost"
                onClick={() => setView("list")}
                className="w-full"
              >
                Back
              </Button>
            </div>
          )}
          {view === "join" && (
            <div className="space-y-3">
              <input
                value={joinId}
                onChange={(e) => setJoinId(e.target.value)}
                placeholder="UUID"
                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-zinc-700 bg-transparent dark:text-white"
              />
              <Button
                variant="primary"
                className="w-full"
                disabled={joinId.length < 5}
                onClick={() => {
                  onJoinHousehold(joinId);
                  onClose();
                }}
              >
                Join
              </Button>
              <Button
                variant="ghost"
                onClick={() => setView("list")}
                className="w-full"
              >
                Back
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ShareModal = ({ currentHousehold, onClose, t }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const shareUrl = currentHousehold
    ? `${window.location.origin}${window.location.pathname}?join_household=${currentHousehold.id}`
    : "";
  const houseId = currentHousehold ? currentHousehold.id : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };
  const handleCopyId = () => {
    navigator.clipboard.writeText(houseId).then(() => {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    });
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${currentHousehold?.name}`,
          url: shareUrl,
        });
      } catch (err) {}
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-6 border border-slate-200 dark:border-zinc-800">
        <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
          <Users size={20} className="text-emerald-500" /> {t("share")}
        </h3>
        <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800 text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <LinkIcon size={32} />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-1 font-medium">
            {currentHousehold?.name}
          </p>
        </div>

        {/* Updated Share Section: Native Share Button */}
        <Button
          variant="primary"
          onClick={handleNativeShare}
          className="w-full py-3 shadow-emerald-500/20 text-base"
        >
          <Upload size={18} /> {t("shareVia")}
        </Button>

        <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-zinc-800">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              Link
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs text-slate-500 truncate focus:outline-none"
              />
              <Button variant="secondary" onClick={handleCopyLink}>
                {copiedLink ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
              ID
            </label>
            <div className="flex gap-2">
              <code className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs text-slate-500 truncate font-mono flex items-center">
                <KeyRound size={12} className="mr-2 opacity-50" />
                {houseId}
              </code>
              <Button variant="secondary" onClick={handleCopyId}>
                {copiedId ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
          </div>
        </div>
        <Button variant="ghost" onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    </div>
  );
};

const ChefModal = ({
  groceries,
  onAddDish,
  onGroupIngredients,
  onClose,
  country,
  t,
}) => {
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
        body: JSON.stringify({ mode, inputData, country }),
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

  const handleAddAndRemove = (itemToAdd) => {
    onAddDish(input, [itemToAdd]);
    setResults((prev) => prev.filter((i) => i.name !== itemToAdd.name));
  };
  const handleAddPlan = (plan) => {
    onAddDish(plan.dish, plan.ingredients);
    setResults((prev) => prev.filter((p) => p.dish !== plan.dish));
  };
  const handleOrganize = (res) => {
    onGroupIngredients(res.dish, res.matchedIngredients);
    setResults((prev) => prev.filter((r) => r.dish !== res.dish));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh] overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2">
            <Sparkles size={18} /> {t("chef")}
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
                {t(
                  m === "dish-to-ingredients"
                    ? "recipe"
                    : m === "meal-planner"
                    ? "mealPlan"
                    : "organize"
                )}
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
                  placeholder={t("dishPlace")}
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
                      {t("total")}:{" "}
                      {formatCurrency(
                        results.reduce((acc, i) => acc + (i.price || 0), 0),
                        country
                      )}
                    </span>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {results.map((item, i) => (
                      <li
                        key={i}
                        className="text-sm flex justify-between items-center text-slate-600 dark:text-slate-400"
                      >
                        <span>
                          {item.name}{" "}
                          {item.quantity > 1 && `(x${item.quantity})`}
                        </span>
                        <div className="flex items-center gap-2">
                          <span>{formatCurrency(item.price, country)}</span>
                          <button
                            onClick={() => handleAddAndRemove(item)}
                            className="text-emerald-500 hover:bg-emerald-100 p-1 rounded"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => {
                      onAddDish(input, results);
                      setResults([]);
                      onClose();
                    }}
                  >
                    {t("add")} All
                  </Button>
                </div>
              )}
            </>
          )}
          {mode === "meal-planner" && (
            <>
              <p className="text-sm text-slate-500">Describe your plan.</p>
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  placeholder={t("planPlace")}
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
                    t("planBtn")
                  )}
                </Button>
              </div>
              {results.length > 0 && (
                <div className="space-y-4">
                  {results.map((plan, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 dark:bg-zinc-950 rounded-xl p-4 border border-slate-100 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-2"
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
                        onClick={() => handleAddPlan(plan)}
                      >
                        {t("add")}
                      </Button>
                    </div>
                  ))}
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
                {loading ? t("loading") : t("organize")}
              </Button>
              <div className="space-y-3 mt-4">
                {results.map((res, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOrganize(res)}
                    className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-fuchsia-500 transition-all group bg-white dark:bg-zinc-950"
                  >
                    <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-fuchsia-500 flex items-center gap-2">
                      <Utensils size={16} /> {res.dish}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {t("items")}: {res.matchedIngredients.join(", ")}
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

// --- MAIN APP ---
export default function App() {
  const [userId] = useState(() => {
    let stored = localStorage.getItem("grocery_user_id");
    if (!stored) {
      stored = generateUUID();
      localStorage.setItem("grocery_user_id", stored);
    }
    return stored;
  });

  const [household, setHousehold] = useState(null);
  const [lists, setLists] = useState([]);
  const [currentListId, setCurrentListId] = useState(null);
  const [groceries, setGroceries] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [country, setCountry] = useState("UK");

  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("grocery_theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isConnected, setIsConnected] = useState(socket.connected);

  const [showShare, setShowShare] = useState(false);
  const [showChef, setShowChef] = useState(false);
  const [showHouseholds, setShowHouseholds] = useState(false);
  const [showLists, setShowLists] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const t = (key) => TRANSLATIONS[country][key] || TRANSLATIONS["UK"][key];

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("grocery_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    if (socket.connected) setIsConnected(true);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dir = country === "IR" ? "rtl" : "ltr";
    fetch(`${API_URL}/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.country) setCountry(data.country);
        else {
          fetch(`${API_URL}/users/init`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: userId, name: "Chef", country: "UK" }),
          });
        }
      });

    const params = new URLSearchParams(window.location.search);
    const joinId = params.get("join_household");
    if (joinId) {
      handleJoinHousehold(joinId).then(() => {
        window.history.replaceState({}, "", window.location.pathname);
      });
    } else {
      const lastHouse = JSON.parse(
        localStorage.getItem("grocery_last_household")
      );
      if (lastHouse) setHousehold(lastHouse);
    }
  }, []);

  const changeCountry = (code) => {
    setCountry(code);
    fetch(`${API_URL}/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: code }),
    });
  };

  useEffect(() => {
    if (!household) return;
    localStorage.setItem("grocery_last_household", JSON.stringify(household));
    fetch(`${API_URL}/households/${household.id}/lists`, {
      headers: { "x-user-id": userId },
    })
      .then((res) => {
        if (res.status === 403) {
          setAccessDenied(true);
          return [];
        }
        return res.json();
      })
      .then((data) => {
        setLists(data);
        if (
          data.length > 0 &&
          (!currentListId || !data.find((l) => l.id === currentListId))
        ) {
          setCurrentListId(data[0].id);
        } else if (data.length === 0) {
          handleCreateList(t("newList"), household.id);
        }
      });
    socket.emit("join-household", household.id);
    socket.on("household-updated", () => {
      fetch(`${API_URL}/households/${household.id}/lists`, {
        headers: { "x-user-id": userId },
      })
        .then((r) => r.json())
        .then(setLists);
      fetch(`${API_URL}/users/${userId}/households`)
        .then((r) => r.json())
        .then((h) => {
          const current = h.find((x) => x.id === household.id);
          if (current) setHousehold(current);
        });
    });
    return () => socket.off("household-updated");
  }, [household, country]);

  useEffect(() => {
    if (!currentListId) return;
    setLoading(true);
    const fetchItems = async () => {
      try {
        const res = await fetch(`${API_URL}/lists/${currentListId}/items`, {
          headers: { "x-user-id": userId },
        });
        if (res.ok) setGroceries(await res.json());
        else if (res.status === 403) setAccessDenied(true);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
    socket.emit("join-list", currentListId);
    socket.on("list-updated", fetchItems);
    return () => {
      socket.off("list-updated");
    };
  }, [currentListId]);

  const handleCreateHousehold = async (name) => {
    const id = generateUUID();
    await fetch(`${API_URL}/households`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ id, name, ownerId: userId }),
    });
    setHousehold({ id, name, memberCount: 1, ownerId: userId });
    handleCreateList(t("newList"), id);
  };

  const handleDeleteHousehold = async (hId) => {
    await fetch(`${API_URL}/households/${hId}`, {
      method: "DELETE",
      headers: { "x-user-id": userId },
    });
    if (household && household.id === hId) {
      setHousehold(null);
      setLists([]);
      setGroceries([]);
      localStorage.removeItem("grocery_last_household");
    }
  };

  const handleRenameHousehold = async (hId, newName) => {
    await fetch(`${API_URL}/households/${hId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ name: newName }),
    });
    if (household && household.id === hId)
      setHousehold({ ...household, name: newName });
  };

  const handleJoinHousehold = async (houseId) => {
    const res = await fetch(`${API_URL}/households/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ householdId: houseId, userId }),
    });
    if (res.ok) {
      const houseData = await res.json();
      setHousehold(houseData);
      setAccessDenied(false);
      return houseData;
    }
  };

  const handleCreateList = async (name, houseId = household?.id) => {
    const id = generateUUID();
    setLists((prev) => [...prev, { id, name, householdId: houseId }]);
    await fetch(`${API_URL}/lists`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ id, name, householdId: houseId }),
    });
    setCurrentListId(id);
  };

  const handleRenameList = async (listId, newName) => {
    setLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, name: newName } : l))
    );
    await fetch(`${API_URL}/lists/${listId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ name: newName }),
    });
  };

  const handleDeleteList = async (listIdToDelete) => {
    setLists((prev) => prev.filter((l) => l.id !== listIdToDelete));
    await fetch(`${API_URL}/lists/${listIdToDelete}`, {
      method: "DELETE",
      headers: { "x-user-id": userId },
    });
    if (listIdToDelete === currentListId) {
      const remaining = lists.filter((l) => l.id !== listIdToDelete);
      if (remaining.length > 0) setCurrentListId(remaining[0].id);
      else setCurrentListId(null);
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    const payload = {
      id: generateUUID(),
      listId: currentListId,
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
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify(payload),
    });
  };

  const addDishIngredients = async (dishName, ingredients) => {
    const items = ingredients.map((i) => ({
      id: generateUUID(),
      listId: currentListId,
      name: i.name,
      quantity: parseInt(i.quantity) || 1,
      category: dishName,
      price: i.price || 0,
      createdAt: Date.now(),
    }));
    setGroceries((prev) => [...items, ...prev]);
    for (const item of items) {
      await fetch(`${API_URL}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
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
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify(updates),
    });
  };

  const deleteItem = async (id) => {
    setGroceries((prev) => prev.filter((i) => i.id !== id));
    await fetch(`${API_URL}/items/${id}`, {
      method: "DELETE",
      headers: { "x-user-id": userId },
    });
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

  if (!household && !accessDenied) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white dark:bg-black p-8 rounded-2xl shadow-xl text-center">
          <Home size={48} className="mx-auto mb-4 text-emerald-500" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            {t("welcome")}
          </h2>
          <p className="text-slate-500 mb-6">{t("createHouse")}</p>
          <Button onClick={() => setShowHouseholds(true)}>{t("start")}</Button>
        </div>
        {showHouseholds && (
          <HouseholdModal
            userId={userId}
            onClose={() => setShowHouseholds(false)}
            onSwitchHousehold={setHousehold}
            onCreateHousehold={handleCreateHousehold}
            onJoinHousehold={handleJoinHousehold}
            t={t}
          />
        )}
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white dark:bg-black p-8 rounded-2xl shadow-xl text-center">
          <Lock size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            {t("accessDenied")}
          </h2>
          <Button onClick={() => setShowHouseholds(true)}>
            {t("myHouseholds")}
          </Button>
        </div>
        {showHouseholds && (
          <HouseholdModal
            userId={userId}
            onClose={() => setShowHouseholds(false)}
            onSwitchHousehold={setHousehold}
            onCreateHousehold={handleCreateHousehold}
            onJoinHousehold={handleJoinHousehold}
            onDeleteHousehold={handleDeleteHousehold}
            onRenameHousehold={handleRenameHousehold}
            t={t}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-zinc-950 text-slate-800 dark:text-slate-100 font-sans transition-colors">
      <div className="max-w-md mx-auto bg-white dark:bg-black shadow-xl min-h-screen sm:min-h-0 flex flex-col sm:border-x sm:border-slate-200 dark:sm:border-zinc-800">
        {/* Header - Restored Share & Theme */}
        <div className="bg-emerald-600 dark:bg-emerald-900/90 text-white sticky top-0 z-20 backdrop-blur-md shadow-sm p-4 pb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-medium text-emerald-100 flex items-center gap-1 mb-1 opacity-80">
                <Home size={12} /> {household.name}
              </div>
              <h1 className="text-2xl font-bold truncate">
                {lists.find((l) => l.id === currentListId)?.name ||
                  "Select List"}
              </h1>
              <div className="flex gap-3 mt-1">
                <p className="text-xs text-emerald-100 opacity-80">
                  {groceries.filter((g) => !g.completed).length} {t("items")} •
                  <span
                    className={`flex items-center gap-1 ml-1 inline-flex ${
                      isConnected ? "text-emerald-100" : "text-red-300"
                    }`}
                  >
                    {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}{" "}
                    {isConnected ? t("sync") : t("offline")}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowShare(true)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <Share2 size={18} />
              </button>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-zinc-900/80 border-b border-slate-200 dark:border-zinc-800 sticky top-[108px] z-10 backdrop-blur">
          <form onSubmit={addItem} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag
                  size={14}
                  className="absolute top-3.5 left-3 rtl:right-3 rtl:left-auto text-slate-400"
                />
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder={t("category")}
                  className="w-full pl-9 pr-4 rtl:pr-9 rtl:pl-4 py-3 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="relative flex-[2]">
                <input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder={t("itemName")}
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

        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
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
                    {formatCurrency(grouped[cat].total, country)}
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
                            {formatCurrency(item.price, country)}
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

      <BottomNav
        onOpenHouseholds={() => setShowHouseholds(true)}
        onOpenLists={() => setShowLists(true)}
        onOpenChef={() => setShowChef(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {showHouseholds && (
        <HouseholdModal
          userId={userId}
          currentHousehold={household}
          onSwitchHousehold={setHousehold}
          onCreateHousehold={handleCreateHousehold}
          onJoinHousehold={handleJoinHousehold}
          onDeleteHousehold={handleDeleteHousehold}
          onRenameHousehold={handleRenameHousehold}
          onClose={() => setShowHouseholds(false)}
          t={t}
        />
      )}
      {showShare && (
        <ShareModal
          currentHousehold={household}
          onClose={() => setShowShare(false)}
          t={t}
        />
      )}
      {showSettings && (
        <SettingsModal
          country={country}
          onChangeCountry={changeCountry}
          onClose={() => setShowSettings(false)}
          t={t}
        />
      )}
      {showChef && (
        <ChefModal
          groceries={groceries}
          onAddDish={addDishIngredients}
          onGroupIngredients={groupExistingIngredients}
          onClose={() => setShowChef(false)}
          country={country}
          t={t}
        />
      )}
      {showLists && (
        <ListsModal
          lists={lists}
          currentListId={currentListId}
          onLoadList={setCurrentListId}
          onNewList={() => handleCreateList(t("newList"))}
          onDeleteList={handleDeleteList}
          onRenameList={handleRenameList}
          onClose={() => setShowLists(false)}
          t={t}
        />
      )}
    </div>
  );
}
