import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gamepad2, Settings, Home, Megaphone, Calendar, 
  Flame, BarChart, LogOut, Download, Upload, 
  Plus, Edit2, Trash2, X, RefreshCcw, Save, LayoutDashboard, Wrench,
  ShoppingBag, Users, ClipboardList, Package, Receipt, UserCheck, RefreshCcw as RefreshCcw2, Briefcase, Image as ImageIcon
} from 'lucide-react';
import { useSiteData, DEFAULT_CONTENT, type SiteContent, type Product, type InventoryItem, type Order, type Customer, type TradeIn, type Employee } from '../context/SiteDataContext';
import jerseyLogo from '../assets/jersey-quik-fix-logo.png';

const ADMIN_PASSWORD = "1964";
const REPAIRS_KEY = "gv_repairs_v1";

type RepairTicket = {
  id: string;
  ticket: string;
  category: string;
  brand: string;
  model: string;
  issue: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  status: string;
  createdAt: string;
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [activePanel, setActivePanel] = useState('Dashboard');
  
  const { content, saveContent } = useSiteData();
  const [draft, setDraft] = useState<SiteContent>(content);
  const [repairs, setRepairs] = useState<RepairTicket[]>([]);
  
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'ANNOUNCEMENT' | 'EVENT' | 'ACTION'>('ANNOUNCEMENT');
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [modalItem, setModalItem] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadRepairs = () => {
    try {
      const r = JSON.parse(localStorage.getItem(REPAIRS_KEY) || '[]');
      setRepairs(Array.isArray(r) ? r : []);
    } catch { setRepairs([]); }
  };

  useEffect(() => {
    const session = localStorage.getItem("gv_admin_session");
    if (session === "true") {
      setIsAuthenticated(true);
    }
    setDraft(content);
    loadRepairs();
  }, [content]);

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 2200);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  const showToast = (msg: string) => setToastMsg(msg);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("gv_admin_session", "true");
      setIsAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("gv_admin_session");
    setIsAuthenticated(false);
  };

  const handleSaveChanges = () => {
    saveContent(draft);
    showToast("Live site updated.");
  };

  const handleResetDemo = () => {
    if (window.confirm("Are you sure you want to restore demo content? This will overwrite all changes.")) {
      saveContent(DEFAULT_CONTENT);
      showToast("Demo content restored.");
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jqf-site-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        saveContent(importedData);
        showToast("Data imported successfully.");
      } catch (err) {
        showToast("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const panels = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Repair Page', icon: <Wrench size={18} /> },
    { name: 'Shop Page', icon: <ShoppingBag size={18} /> },
    { name: 'Community', icon: <Users size={18} /> },
    { name: 'Repair Requests', icon: <ClipboardList size={18} /> },
    { name: 'Inventory', icon: <Package size={18} /> },
    { name: 'Orders', icon: <Receipt size={18} /> },
    { name: 'Customers', icon: <UserCheck size={18} /> },
    { name: 'Trade-Ins', icon: <RefreshCcw2 size={18} /> },
    { name: 'Employees', icon: <Briefcase size={18} /> },
    { name: 'Photos', icon: <ImageIcon size={18} /> },
    { name: 'Settings', icon: <Settings size={18} /> }
  ];

  const updateDraftText = (section: keyof SiteContent, field: string, value: any) => {
    setDraft(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));
  };

  const updateDraftArray = <K extends keyof SiteContent>(
    section: K, 
    id: string, 
    updater: (item: any) => any
  ) => {
    setDraft(prev => {
      const arr = prev[section] as any[];
      return {
        ...prev,
        [section]: arr.map(item => item.id === id ? updater(item) : item)
      };
    });
  };

  const addDraftArrayItem = <K extends keyof SiteContent>(section: K, newItem: any) => {
    setDraft(prev => ({ ...prev, [section]: [...(prev[section] as any[]), { ...newItem, id: crypto.randomUUID() }] }));
  };

  const deleteDraftArrayItem = <K extends keyof SiteContent>(section: K, id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      setDraft(prev => ({ ...prev, [section]: (prev[section] as any[]).filter(item => item.id !== id) }));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4 selection:bg-primary selection:text-primary-foreground">
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-card border border-border p-8 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-primary" />
          <div className="flex flex-col items-center text-center mb-8">
            <div className="p-3 mb-4 flex items-center justify-center">
              <img src={jerseyLogo} alt="Logo" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="text-3xl font-black uppercase italic tracking-tight text-foreground">Admin Portal</h1>
            <p className="text-primary font-bold text-sm tracking-widest uppercase mt-1">Jersey Quik Fix</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full bg-background border-2 border-border focus:border-primary text-foreground rounded-xl py-3 px-4 outline-none transition-all font-bold text-center"
                autoFocus
              />
              {error && (
                <p className="text-destructive font-bold text-sm text-center mt-2">Incorrect password.</p>
              )}
            </div>
            <button 
              type="submit"
              className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-black uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all"
            >
              Enter Control Center
            </button>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest text-center">
              Authorized staff only
            </p>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Sidebar */}
      <aside className="w-64 bg-secondary flex-shrink-0 border-r border-border flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <img src={jerseyLogo} alt="JQF" className="h-8 w-8 object-contain bg-primary text-primary-foreground p-1 rounded-lg" />
            <span className="text-xl font-black tracking-tight uppercase italic text-secondary-foreground">
              JQF Admin
            </span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {panels.map(panel => (
            <button
              key={panel.name}
              onClick={() => setActivePanel(panel.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                activePanel === panel.name 
                  ? 'bg-primary/20 text-primary border-l-2 border-primary' 
                  : 'text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-card/50 border-l-2 border-transparent'
              }`}
            >
              {panel.icon} {panel.name}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-border space-y-2">
          <button 
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-card text-foreground rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-card/80 transition-colors border border-border"
          >
            <Download size={14} /> Export Data
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            accept=".json" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-card text-foreground rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-card/80 transition-colors border border-border"
          >
            <Upload size={14} /> Import Data
          </button>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-destructive hover:bg-destructive/10 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors mt-4"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6 shrink-0">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary leading-none mb-1">
              ADMIN CONTROL PANEL
            </div>
            <h2 className="text-xl font-black uppercase italic tracking-tight leading-none">
              {activePanel}
            </h2>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleResetDemo}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-card/80 transition-colors"
            >
              <RefreshCcw size={14} /> Reset Demo
            </button>
            <button 
              onClick={handleSaveChanges}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-xl font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            >
              <Save size={16} /> Save Changes
            </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePanel}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* OVERVIEW PANEL */}
                {activePanel === 'Overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-card border border-primary/40 rounded-2xl p-6 col-span-2 md:col-span-1 cursor-pointer hover:border-primary transition-colors" onClick={() => setActivePanel('Repair Requests')}>
                        <div className="text-3xl font-black text-primary mb-1">{repairs.length}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Repair Requests</div>
                      </div>
                      <div className="bg-card border border-border rounded-2xl p-6">
                        <div className="text-3xl font-black text-primary mb-1">{data.announcements.length}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Announcements</div>
                      </div>
                      <div className="bg-card border border-border rounded-2xl p-6">
                        <div className="text-3xl font-black text-primary mb-1">{data.events.length}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Events</div>
                      </div>
                      <div className="bg-card border border-border rounded-2xl p-6">
                        <div className="text-3xl font-black text-primary mb-1">{data.actions.length}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Big Actions</div>
                      </div>
                      <div className="bg-card border border-border rounded-2xl p-6">
                        <div className="text-3xl font-black text-primary mb-1">{data.stats.membersConnected}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Members</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-card border border-border rounded-3xl p-6">
                        <div className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Next Event</div>
                        {data.events[0] ? (
                          <>
                            <h3 className="text-xl font-black uppercase italic tracking-tight mb-2">{data.events[0].title}</h3>
                            <p className="text-muted-foreground font-medium text-sm">{data.events[0].date} at {data.events[0].time}</p>
                          </>
                        ) : (
                          <p className="text-muted-foreground font-medium text-sm">No events scheduled.</p>
                        )}
                      </div>
                      <div className="bg-card border border-border rounded-3xl p-6">
                        <div className="text-xs font-bold uppercase tracking-widest text-primary mb-4">Latest Announcement</div>
                        {data.announcements[0] ? (
                          <>
                            <h3 className="text-xl font-black uppercase italic tracking-tight mb-2">{data.announcements[0].title}</h3>
                            <p className="text-muted-foreground font-medium text-sm line-clamp-2">{data.announcements[0].summary}</p>
                          </>
                        ) : (
                          <p className="text-muted-foreground font-medium text-sm">No announcements.</p>
                        )}
                      </div>
                    </div>

                    <div className="bg-secondary border border-border rounded-3xl p-6 text-center text-secondary-foreground">
                      <p className="font-bold text-sm tracking-wide">
                        Everything is editable here — saves to localStorage. Export JSON anytime.
                      </p>
                    </div>
                  </div>
                )}

                {/* REPAIR REQUESTS PANEL */}
                {activePanel === 'Repair Requests' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Incoming</div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tight">{repairs.length} Repair {repairs.length === 1 ? 'Request' : 'Requests'}</h3>
                      </div>
                      <button
                        onClick={() => { loadRepairs(); showToast('Refreshed.'); }}
                        className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-card/80 transition-colors"
                      >
                        <RefreshCcw size={14} /> Refresh
                      </button>
                    </div>

                    {repairs.length === 0 ? (
                      <div className="bg-card border border-border rounded-3xl p-16 text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Wrench size={28} className="text-primary" />
                        </div>
                        <h4 className="text-xl font-black uppercase italic tracking-tight mb-2">No requests yet</h4>
                        <p className="text-muted-foreground font-medium text-sm">Repair requests submitted on the Repair page will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {[...repairs].reverse().map((r) => (
                          <div key={r.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex-shrink-0">
                              <div className="bg-primary/10 text-primary font-black text-xs tracking-wider px-3 py-1.5 rounded-lg inline-block">{r.ticket}</div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="font-black text-foreground">{r.name}</span>
                                <span className="text-muted-foreground text-sm">·</span>
                                <span className="text-muted-foreground text-sm font-medium">{r.phone}</span>
                                {r.email && <>
                                  <span className="text-muted-foreground text-sm">·</span>
                                  <span className="text-muted-foreground text-sm font-medium">{r.email}</span>
                                </>}
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider">
                                <span className="bg-background border border-border px-2 py-1 rounded-lg">{r.category}</span>
                                <span className="bg-background border border-border px-2 py-1 rounded-lg">{r.brand} {r.model}</span>
                                <span className="bg-background border border-border px-2 py-1 rounded-lg">{r.issue}</span>
                                {r.date && <span className="bg-background border border-border px-2 py-1 rounded-lg">{r.date}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-lg whitespace-nowrap">{r.status}</span>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete ticket ${r.ticket}?`)) {
                                    const updated = repairs.filter(x => x.id !== r.id);
                                    localStorage.setItem(REPAIRS_KEY, JSON.stringify(updated));
                                    setRepairs(updated);
                                    showToast('Ticket deleted.');
                                  }
                                }}
                                className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* HOMEPAGE PANEL */}
                {activePanel === 'Homepage' && (
                  <div className="bg-card border border-border rounded-3xl p-6 space-y-6">
                    <h3 className="text-lg font-black uppercase italic tracking-tight mb-4 border-b border-border pb-4">Hero Section Content</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Eyebrow</label>
                        <input 
                          type="text" 
                          value={draftData.homepage.heroEyebrow}
                          onChange={e => updateDraft('homepage', 'heroEyebrow', e.target.value)}
                          className="w-full bg-background border border-border focus:border-primary text-foreground rounded-xl py-3 px-4 outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Community Name</label>
                        <input 
                          type="text" 
                          value={draftData.homepage.communityName}
                          onChange={e => updateDraft('homepage', 'communityName', e.target.value)}
                          className="w-full bg-background border border-border focus:border-primary text-foreground rounded-xl py-3 px-4 outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Headline</label>
                        <input 
                          type="text" 
                          value={draftData.homepage.heroHeadline}
                          onChange={e => updateDraft('homepage', 'heroHeadline', e.target.value)}
                          className="w-full bg-background border border-border focus:border-primary text-foreground rounded-xl py-3 px-4 outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</label>
                        <textarea 
                          value={draftData.homepage.heroDescription}
                          onChange={e => updateDraft('homepage', 'heroDescription', e.target.value)}
                          rows={3}
                          className="w-full bg-background border border-border focus:border-primary text-foreground rounded-xl py-3 px-4 outline-none font-medium resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Primary Button Text</label>
                        <input 
                          type="text" 
                          value={draftData.homepage.heroPrimaryButton}
                          onChange={e => updateDraft('homepage', 'heroPrimaryButton', e.target.value)}
                          className="w-full bg-background border border-border focus:border-primary text-foreground rounded-xl py-3 px-4 outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Secondary Button Text</label>
                        <input 
                          type="text" 
                          value={draftData.homepage.heroSecondaryButton}
                          onChange={e => updateDraft('homepage', 'heroSecondaryButton', e.target.value)}
                          className="w-full bg-background border border-border focus:border-primary text-foreground rounded-xl py-3 px-4 outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Next Event Card Label</label>
                        <input 
                          type="text" 
                          value={draftData.homepage.nextEventLabel}
                          onChange={e => updateDraft('homepage', 'nextEventLabel', e.target.value)}
                          className="w-full bg-background border border-border focus:border-primary text-foreground rounded-xl py-3 px-4 outline-none font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ANNOUNCEMENTS PANEL */}
                {activePanel === 'Announcements' && (
                  <div className="space-y-6">
                    <div className="flex justify-end">
                      <button 
                        onClick={() => openModal('ANNOUNCEMENT', 'ADD')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all"
                      >
                        <Plus size={16} /> Add Announcement
                      </button>
                    </div>
                    <div className="space-y-4">
                      {data.announcements.map((ann) => (
                        <div key={ann.id} className="bg-card border border-border rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex-1 space-y-2">
                            <div className="flex gap-2 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-widest bg-secondary/50 text-secondary-foreground px-2 py-0.5 rounded text-primary">
                                {ann.category}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-widest bg-background px-2 py-0.5 rounded text-muted-foreground">
                                {ann.date}
                              </span>
                              {ann.featured && (
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/20 text-primary px-2 py-0.5 rounded">
                                  Featured
                                </span>
                              )}
                            </div>
                            <h4 className="text-lg font-black uppercase italic tracking-tight">{ann.title}</h4>
                            <p className="text-muted-foreground text-sm line-clamp-2">{ann.summary}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button 
                              onClick={() => openModal('ANNOUNCEMENT', 'EDIT', ann)}
                              className="p-3 bg-background border border-border text-foreground rounded-xl hover:border-primary transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteItem('announcements', ann.id)}
                              className="p-3 bg-background border border-border text-destructive rounded-xl hover:bg-destructive/10 hover:border-destructive transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* EVENTS PANEL */}
                {activePanel === 'Events' && (
                  <div className="space-y-6">
                    <div className="flex justify-end">
                      <button 
                        onClick={() => openModal('EVENT', 'ADD')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all"
                      >
                        <Plus size={16} /> Add Event
                      </button>
                    </div>
                    <div className="space-y-4">
                      {data.events.map((ev) => (
                        <div key={ev.id} className="bg-card border border-border rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex-1 space-y-2">
                            <div className="flex gap-2 mb-1">
                              <span className="text-[10px] font-bold uppercase tracking-widest bg-secondary/50 text-secondary-foreground px-2 py-0.5 rounded text-primary">
                                {ev.date}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-widest bg-background px-2 py-0.5 rounded text-muted-foreground">
                                {ev.time} {ev.endTime ? `- ${ev.endTime}` : ''}
                              </span>
                              {ev.featured && (
                                <span className="text-[10px] font-bold uppercase tracking-widest bg-primary/20 text-primary px-2 py-0.5 rounded">
                                  Featured
                                </span>
                              )}
                            </div>
                            <h4 className="text-lg font-black uppercase italic tracking-tight">{ev.title}</h4>
                            <p className="text-muted-foreground text-sm">📍 {ev.location}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button 
                              onClick={() => openModal('EVENT', 'EDIT', ev)}
                              className="p-3 bg-background border border-border text-foreground rounded-xl hover:border-primary transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteItem('events', ev.id)}
                              className="p-3 bg-background border border-border text-destructive rounded-xl hover:bg-destructive/10 hover:border-destructive transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ACTIONS PANEL */}
                {activePanel === 'Big Actions' && (
                  <div className="space-y-6">
                    <div className="flex justify-end">
                      <button 
                        onClick={() => openModal('ACTION', 'ADD')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all"
                      >
                        <Plus size={16} /> Add Action
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {data.actions.map((act) => (
                        <div key={act.id} className="bg-card border border-border rounded-3xl p-6 flex flex-col">
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-3xl bg-background border border-border w-12 h-12 flex items-center justify-center rounded-2xl">{act.icon}</div>
                            <div className="flex gap-2">
                               <button 
                                onClick={() => openModal('ACTION', 'EDIT', act)}
                                className="p-2 bg-background border border-border text-foreground rounded-lg hover:border-primary transition-colors"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteItem('actions', act.id)}
                                className="p-2 bg-background border border-border text-destructive rounded-lg hover:bg-destructive/10 hover:border-destructive transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-secondary/50 text-secondary-foreground px-2 py-0.5 rounded text-primary">
                              {act.status}
                            </span>
                          </div>
                          <h4 className="text-lg font-black uppercase italic tracking-tight mb-2">{act.title}</h4>
                          <p className="text-muted-foreground text-sm mb-4 flex-1">{act.description}</p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold text-muted-foreground">
                              <span>{act.participants} participants</span>
                              <span>{act.progress}%</span>
                            </div>
                            <div className="h-2 bg-background border border-border rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${act.progress}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STATS PANEL */}
                {activePanel === 'Stats' && (
                  <div className="bg-card border border-border rounded-3xl p-6 space-y-6">
                    <h3 className="text-lg font-black uppercase italic tracking-tight mb-4 border-b border-border pb-4">Stats Section Content</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Members Connected (Number)</label>
                        <input 
                          type="number" 
                          value={draftData.stats.membersConnected}
                          onChange={e => updateDraft('stats', 'membersConnected', parseInt(e.target.value) || 0)}
                          className="w-full bg-background border border-border focus:border-primary text-foreground rounded-xl py-3 px-4 outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Member Label</label>
                        <input 
                          type="text" 
                          value={draftData.stats.memberStatLabel}
                          onChange={e => updateDraft('stats', 'memberStatLabel', e.target.value)}
                          className="w-full bg-background border border-border focus:border-primary text-foreground rounded-xl py-3 px-4 outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Announcement Label</label>
                        <input 
                          type="text" 
                          value={draftData.stats.announcementStatLabel}
                          onChange={e => updateDraft('stats', 'announcementStatLabel', e.target.value)}
                          className="w-full bg-background border border-border focus:border-primary text-foreground rounded-xl py-3 px-4 outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Event Label</label>
                        <input 
                          type="text" 
                          value={draftData.stats.eventStatLabel}
                          onChange={e => updateDraft('stats', 'eventStatLabel', e.target.value)}
                          className="w-full bg-background border border-border focus:border-primary text-foreground rounded-xl py-3 px-4 outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Action Label</label>
                        <input 
                          type="text" 
                          value={draftData.stats.actionStatLabel}
                          onChange={e => updateDraft('stats', 'actionStatLabel', e.target.value)}
                          className="w-full bg-background border border-border focus:border-primary text-foreground rounded-xl py-3 px-4 outline-none font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* SETTINGS PANEL */}
                {activePanel === 'Settings' && (
                  <div className="bg-card border border-border rounded-3xl p-6 space-y-6">
                    <h3 className="text-lg font-black uppercase italic tracking-tight mb-4 border-b border-border pb-4">Global Settings</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Contact Email</label>
                        <input 
                          type="email" 
                          value={draftData.settings.contactEmail}
                          onChange={e => updateDraft('settings', 'contactEmail', e.target.value)}
                          className="w-full bg-background border border-border focus:border-primary text-foreground rounded-xl py-3 px-4 outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">RSVP Deadline Text</label>
                        <input 
                          type="text" 
                          value={draftData.settings.rsvpDeadlineText}
                          onChange={e => updateDraft('settings', 'rsvpDeadlineText', e.target.value)}
                          className="w-full bg-background border border-border focus:border-primary text-foreground rounded-xl py-3 px-4 outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Footer Message</label>
                        <input 
                          type="text" 
                          value={draftData.settings.footerMessage}
                          onChange={e => updateDraft('settings', 'footerMessage', e.target.value)}
                          className="w-full bg-background border border-border focus:border-primary text-foreground rounded-xl py-3 px-4 outline-none font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Signup Enabled</label>
                        <select 
                          value={draftData.settings.signupEnabled ? 'yes' : 'no'}
                          onChange={e => updateDraft('settings', 'signupEnabled', e.target.value === 'yes')}
                          className="w-full bg-background border border-border focus:border-primary text-foreground rounded-xl py-3 px-4 outline-none font-bold appearance-none"
                        >
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Site Visibility</label>
                        <select 
                          value={draftData.settings.siteVisibility}
                          onChange={e => updateDraft('settings', 'siteVisibility', e.target.value)}
                          className="w-full bg-background border border-border focus:border-primary text-foreground rounded-xl py-3 px-4 outline-none font-bold appearance-none"
                        >
                          <option value="public">Public</option>
                          <option value="private">Private (Password Protected)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Editor Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl z-10 flex flex-col max-h-[90dvh]"
            >
              <div className="p-6 border-b border-border flex justify-between items-center bg-background/50 shrink-0">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-primary leading-none mb-1">
                    {modalType}
                  </div>
                  <h3 className="font-black text-2xl uppercase tracking-tight italic leading-none">
                    {modalMode === 'ADD' ? 'Add Item' : 'Edit Item'}
                  </h3>
                </div>
                <button 
                  onClick={() => setModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground bg-card p-2 rounded-full border border-transparent hover:border-border transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="overflow-y-auto p-6">
                <form id="modal-form" onSubmit={handleModalSave} className="space-y-4">
                  {modalType === 'ANNOUNCEMENT' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Title *</label>
                        <input required type="text" value={modalItem.title} onChange={e => setModalItem({...modalItem, title: e.target.value})} className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 font-bold outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category</label>
                          <input type="text" value={modalItem.category} onChange={e => setModalItem({...modalItem, category: e.target.value})} className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 font-bold outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Date</label>
                          <input type="date" value={modalItem.date} onChange={e => setModalItem({...modalItem, date: e.target.value})} className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 font-bold outline-none" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Summary *</label>
                        <textarea required rows={4} value={modalItem.summary} onChange={e => setModalItem({...modalItem, summary: e.target.value})} className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 font-medium outline-none resize-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Featured</label>
                        <select value={modalItem.featured ? 'yes' : 'no'} onChange={e => setModalItem({...modalItem, featured: e.target.value === 'yes'})} className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 font-bold outline-none appearance-none">
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </select>
                      </div>
                    </>
                  )}

                  {modalType === 'EVENT' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Event Name *</label>
                        <input required type="text" value={modalItem.title} onChange={e => setModalItem({...modalItem, title: e.target.value})} className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 font-bold outline-none" />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1 col-span-3 sm:col-span-1">
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Date</label>
                          <input type="date" value={modalItem.date} onChange={e => setModalItem({...modalItem, date: e.target.value})} className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 font-bold outline-none" />
                        </div>
                        <div className="space-y-1 col-span-3 sm:col-span-1">
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Start Time</label>
                          <input type="time" value={modalItem.time} onChange={e => setModalItem({...modalItem, time: e.target.value})} className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 font-bold outline-none" />
                        </div>
                        <div className="space-y-1 col-span-3 sm:col-span-1">
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">End Time</label>
                          <input type="time" value={modalItem.endTime} onChange={e => setModalItem({...modalItem, endTime: e.target.value})} className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 font-bold outline-none" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Location *</label>
                        <input required type="text" value={modalItem.location} onChange={e => setModalItem({...modalItem, location: e.target.value})} className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 font-bold outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description *</label>
                        <textarea required rows={3} value={modalItem.description} onChange={e => setModalItem({...modalItem, description: e.target.value})} className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 font-medium outline-none resize-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Featured</label>
                        <select value={modalItem.featured ? 'yes' : 'no'} onChange={e => setModalItem({...modalItem, featured: e.target.value === 'yes'})} className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 font-bold outline-none appearance-none">
                          <option value="no">No</option>
                          <option value="yes">Yes</option>
                        </select>
                      </div>
                    </>
                  )}

                  {modalType === 'ACTION' && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Title *</label>
                        <input required type="text" value={modalItem.title} onChange={e => setModalItem({...modalItem, title: e.target.value})} className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 font-bold outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</label>
                          <input type="text" value={modalItem.status} onChange={e => setModalItem({...modalItem, status: e.target.value})} placeholder="e.g. In Progress" className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 font-bold outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Icon (Emoji)</label>
                          <input type="text" value={modalItem.icon} onChange={e => setModalItem({...modalItem, icon: e.target.value})} className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 font-bold outline-none text-center" maxLength={2} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description *</label>
                        <textarea required rows={3} value={modalItem.description} onChange={e => setModalItem({...modalItem, description: e.target.value})} className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 font-medium outline-none resize-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Progress (0-100)</label>
                          <input type="number" min="0" max="100" value={modalItem.progress} onChange={e => setModalItem({...modalItem, progress: parseInt(e.target.value) || 0})} className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 font-bold outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Participants</label>
                          <input type="number" min="0" value={modalItem.participants} onChange={e => setModalItem({...modalItem, participants: parseInt(e.target.value) || 0})} className="w-full bg-background border border-border focus:border-primary rounded-xl py-3 px-4 font-bold outline-none" />
                        </div>
                      </div>
                    </>
                  )}
                </form>
              </div>

              <div className="p-6 border-t border-border bg-background/50 shrink-0 flex gap-4">
                <button 
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-background border-2 border-border text-foreground py-3 rounded-xl font-black uppercase tracking-wider hover:border-primary transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  form="modal-form"
                  className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-black uppercase tracking-wider hover:brightness-110 transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                >
                  Save Item
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-foreground text-background px-6 py-4 rounded-2xl font-black uppercase tracking-widest shadow-2xl flex items-center gap-3 text-sm"
          >
            <div className="w-2 h-2 bg-background rounded-full animate-pulse" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}