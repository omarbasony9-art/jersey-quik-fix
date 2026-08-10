import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gamepad2, Settings, Home, Megaphone, Calendar, 
  Flame, BarChart, LogOut, Download, Upload, 
  Plus, Edit2, Trash2, X, RefreshCcw, Save, LayoutDashboard, Wrench,
  ShoppingBag, Users, ClipboardList, Package, Receipt, UserCheck, RefreshCcw as RefreshCcw2, Briefcase, Image as ImageIcon,
  Check, Mail, BadgePercent, Search, AlertTriangle, ShieldCheck, Clock
} from 'lucide-react';
import { useSiteData, DEFAULT_CONTENT, type SiteContent } from '../context/SiteDataContext';
import jerseyLogo from '../assets/jersey-quik-fix-logo.png';

const API_BASE = "/api";
const SESSION_KEY = "gv_admin_token";

type EmailSubscriber = {
  id: string; email: string; name: string; source: string; createdAt: string;
};

type RepairTicket = {
  id: string; ticket: string; category: string; brand: string; model: string;
  issue: string; name: string; phone: string; email: string; date: string;
  status: string; createdAt: string;
};

type TradeInquiry = {
  id: number; name: string; email: string; phone: string;
  deviceType: string; deviceDescription: string; condition: string;
  notes: string | null; status: string; createdAt: string;
};

type MembershipCode = {
  id: string; email: string; userId: string | null; code: string;
  stripeSessionId: string | null; discountPercent: number;
  isActive: boolean; createdAt: string; expiresAt: string;
};

// Field helper component
function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Paste image URL..."
        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:border-primary transition-colors font-medium mb-2"
      />
      {value && (
        <img src={value} alt={label} className="w-full h-28 object-cover rounded-xl border border-border" onError={e => (e.currentTarget.style.display='none')} />
      )}
    </div>
  );
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [activePanel, setActivePanel] = useState('Dashboard');
  
  const { content, saveContent } = useSiteData();
  const [draft, setDraft] = useState<SiteContent>(content);
  const [repairs, setRepairs] = useState<RepairTicket[]>([]);
  const [emails, setEmails] = useState<EmailSubscriber[]>([]);
  const [tradeInquiries, setTradeInquiries] = useState<TradeInquiry[]>([]);
  
  const [membershipCodes, setMembershipCodes] = useState<MembershipCode[]>([]);
  const [membershipCheckCode, setMembershipCheckCode] = useState('');
  const [membershipCheckResult, setMembershipCheckResult] = useState<{ valid: boolean; message: string; discountPercent?: number; expiresAt?: string; daysLeft?: number } | null>(null);
  const [membershipCheckLoading, setMembershipCheckLoading] = useState(false);

  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Restore session from sessionStorage on mount
  useEffect(() => {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (token) {
      setAdminToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  // Sync draft with content changes
  useEffect(() => {
    setDraft(content);
  }, [content]);

  // Load repairs, emails, trade inquiries, and membership codes when token is available
  useEffect(() => {
    if (adminToken) { loadRepairs(); loadEmails(); loadTradeInquiries(); loadMembershipCodes(); }
  }, [adminToken]);

  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 2200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [toastMsg]);

  const showToast = (msg: string) => setToastMsg(msg);

  const loadRepairs = () => {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) return;
    fetch(`${API_BASE}/repairs`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setRepairs(Array.isArray(data) ? data : []))
      .catch(() => setRepairs([]));
  };

  const loadEmails = () => {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) return;
    fetch(`${API_BASE}/emails`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setEmails(Array.isArray(data) ? data : []))
      .catch(() => setEmails([]));
  };

  const loadTradeInquiries = () => {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) return;
    fetch(`${API_BASE}/trade-inquiries`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setTradeInquiries(Array.isArray(data) ? data : []))
      .catch(() => setTradeInquiries([]));
  };

  const loadMembershipCodes = () => {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) return;
    fetch(`${API_BASE}/admin/membership-codes`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => setMembershipCodes(Array.isArray(data) ? data : []))
      .catch(() => setMembershipCodes([]));
  };

  const handleCheckMembershipCode = async () => {
    const code = membershipCheckCode.trim().toUpperCase();
    if (!code) return;
    setMembershipCheckLoading(true);
    setMembershipCheckResult(null);
    try {
      const res = await fetch(`${API_BASE}/membership/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      setMembershipCheckResult(data);
    } catch {
      setMembershipCheckResult({ valid: false, message: 'Network error — please try again.' });
    } finally {
      setMembershipCheckLoading(false);
    }
  };

  const handleToggleMembershipCode = async (id: string, currentActive: boolean) => {
    const token = sessionStorage.getItem(SESSION_KEY);
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/membership-codes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (res.ok) {
        setMembershipCodes(prev => prev.map(c => c.id === id ? { ...c, isActive: !currentActive } : c));
        showToast(currentActive ? 'Code deactivated.' : 'Code reactivated.');
      }
    } catch {
      showToast('Failed to update code.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const { token } = await res.json() as { token: string };
        sessionStorage.setItem(SESSION_KEY, token);
        setAdminToken(token);
        setIsAuthenticated(true);
        setError(false);
      } else {
        setError(true);
        setPassword('');
      }
    } catch {
      setError(true);
      setPassword('');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAdminToken(null);
    setIsAuthenticated(false);
  };

  const handleSaveChanges = () => {
    saveContent(draft, adminToken ?? undefined);
    showToast("Live site updated.");
  };

  // Helper Setters
  const setRepairField = (field: string, value: any) =>
    setDraft(p => ({ ...p, repair: { ...p.repair, [field]: value } }));

  const setShopField = (field: string, value: any) =>
    setDraft(p => ({ ...p, shop: { ...p.shop, [field]: value } }));

  const setCommunityField = (field: string, value: any) =>
    setDraft(p => ({ ...p, community: { ...p.community, [field]: value } }));

  const setSettingsField = (field: string, value: any) =>
    setDraft(p => ({ ...p, settings: { ...p.settings, [field]: value } }));

  const updateArrayItem = (section: keyof SiteContent, id: string, field: string, value: any) =>
    setDraft(p => ({
      ...p,
      [section]: (p[section] as any[]).map((item: any) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));

  const deleteArrayItem = (section: keyof SiteContent, id: string) =>
    setDraft(p => ({
      ...p,
      [section]: (p[section] as any[]).filter((item: any) => item.id !== id)
    }));

  const updateRepairArray = (field: string, id: string, key: string, value: any) =>
    setDraft(p => ({
      ...p,
      repair: {
        ...p.repair,
        [field]: (p.repair as any)[field].map((item: any) =>
          item.id === id ? { ...item, [key]: value } : item
        )
      }
    }));

  const deleteRepairArrayItem = (field: string, id: string) =>
    setDraft(p => ({
      ...p,
      repair: {
        ...p.repair,
        [field]: (p.repair as any)[field].filter((item: any) => item.id !== id)
      }
    }));

  const addRepairArrayItem = (field: string, item: any) =>
    setDraft(p => ({
      ...p,
      repair: { ...p.repair, [field]: [...(p.repair as any)[field], item] }
    }));

  const updateCommunityArray = (field: string, id: string, key: string, value: any) =>
    setDraft(p => ({
      ...p,
      community: {
        ...p.community,
        [field]: (p.community as any)[field].map((item: any) =>
          item.id === id ? { ...item, [key]: value } : item
        )
      }
    }));

  const deleteCommunityArrayItem = (field: string, id: string) =>
    setDraft(p => ({
      ...p,
      community: {
        ...p.community,
        [field]: (p.community as any)[field].filter((item: any) => item.id !== id)
      }
    }));

  const addCommunityArrayItem = (field: string, item: any) =>
    setDraft(p => ({
      ...p,
      community: { ...p.community, [field]: [...(p.community as any)[field], item] }
    }));

  // Styles
  const inputCls = "w-full bg-background border border-border rounded-xl px-4 py-2.5 text-foreground text-sm outline-none focus:border-primary transition-colors font-medium";
  const textareaCls = inputCls + " resize-none min-h-[80px]";
  const labelCls = "block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5";
  const sectionHeadCls = "text-xs font-black uppercase tracking-widest text-primary mb-4 border-b border-border pb-3";
  const cardCls = "bg-card border border-border rounded-2xl p-5 mb-4";
  const addBtnCls = "flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 rounded-xl font-black text-xs uppercase tracking-wider transition-colors w-max";
  const deleteBtnCls = "text-destructive hover:bg-destructive/10 rounded-lg p-2 transition-colors flex-shrink-0";

  const panels = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Repair Page', icon: <Wrench size={18} /> },
    { name: 'Shop Page', icon: <ShoppingBag size={18} /> },
    { name: 'Community', icon: <Users size={18} /> },
    { name: 'Repair Tickets', icon: <ClipboardList size={18} /> },
    { name: 'Inventory', icon: <Package size={18} /> },
    { name: 'Orders', icon: <Receipt size={18} /> },
    { name: 'Customers', icon: <UserCheck size={18} /> },
    { name: 'Trade-Ins', icon: <RefreshCcw2 size={18} /> },
    { name: 'Employees', icon: <Briefcase size={18} /> },
    { name: 'Email List', icon: <Mail size={18} /> },
    { name: 'Memberships', icon: <BadgePercent size={18} /> },
    { name: 'Settings', icon: <Settings size={18} /> }
  ];

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

          <Link href="/" className="mt-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors">
            <Home size={13} /> Back to Homepage
          </Link>
        </motion.div>
      </div>
    );
  }

  const membershipNow = new Date();
  const membershipActive = membershipCodes.filter(c => c.isActive && new Date(c.expiresAt) > membershipNow);
  const membershipExpired = membershipCodes.filter(c => new Date(c.expiresAt) <= membershipNow);
  const membershipDeactivated = membershipCodes.filter(c => !c.isActive && new Date(c.expiresAt) > membershipNow);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Sidebar */}
      <aside className="w-64 bg-secondary flex-shrink-0 border-r border-border flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
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

        <div className="p-4 border-t border-border space-y-2 shrink-0">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
          >
            <Home size={14} /> Back to Site
          </Link>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-destructive hover:bg-destructive/10 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors mt-2"
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
            {toastMsg && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold uppercase tracking-wider shadow-2xl z-50 flex items-center gap-3">
                <Check size={18} /> {toastMsg}
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={activePanel}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                
                {/* Dashboard */}
                {activePanel === 'Dashboard' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-card border border-primary/40 rounded-2xl p-6 col-span-2 md:col-span-1 cursor-pointer hover:border-primary transition-colors" onClick={() => setActivePanel('Repair Tickets')}>
                        <div className="text-3xl font-black text-primary mb-1">{repairs.length}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Repair Tickets</div>
                      </div>
                      <div className="bg-card border border-border rounded-2xl p-6">
                        <div className="text-3xl font-black text-primary mb-1">{draft.shop.products.length}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Products</div>
                      </div>
                      <div className="bg-card border border-border rounded-2xl p-6">
                        <div className="text-3xl font-black text-primary mb-1">{draft.inventory.length}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Inventory</div>
                      </div>
                      <div className="bg-card border border-border rounded-2xl p-6">
                        <div className="text-3xl font-black text-primary mb-1">{draft.customers.length}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Customers</div>
                      </div>
                      <div className="bg-card border border-border rounded-2xl p-6">
                        <div className="text-3xl font-black text-primary mb-1">{draft.employees.length}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Employees</div>
                      </div>
                      <div className="bg-card border border-border rounded-2xl p-6 cursor-pointer hover:border-primary transition-colors" onClick={() => setActivePanel('Email List')}>
                        <div className="text-3xl font-black text-primary mb-1">{emails.length}</div>
                        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Subscribers</div>
                      </div>
                    </div>
                    <div className="bg-secondary border border-border rounded-3xl p-6 text-center text-secondary-foreground flex flex-col items-center gap-4">
                      <p className="font-bold text-sm tracking-wide">
                        Every change saved here updates the live website instantly.
                      </p>
                      <button 
                        onClick={handleSaveChanges}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-xl font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                      >
                        <Save size={16} /> Save All Changes
                      </button>
                    </div>
                  </div>
                )}

                {/* Repair Page */}
                {activePanel === 'Repair Page' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className={sectionHeadCls}>Hero Content</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Eyebrow Text</label>
                          <input value={draft.repair.heroEyebrow} onChange={e => setRepairField('heroEyebrow', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Headline</label>
                          <input value={draft.repair.heroHeadline} onChange={e => setRepairField('heroHeadline', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Accent Word</label>
                          <input value={draft.repair.heroAccent} onChange={e => setRepairField('heroAccent', e.target.value)} className={inputCls} />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelCls}>Subtitle</label>
                          <textarea value={draft.repair.heroSubtitle} onChange={e => setRepairField('heroSubtitle', e.target.value)} className={textareaCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Primary Button</label>
                          <input value={draft.repair.primaryBtn} onChange={e => setRepairField('primaryBtn', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Secondary Button</label>
                          <input value={draft.repair.secondaryBtn} onChange={e => setRepairField('secondaryBtn', e.target.value)} className={inputCls} />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelCls}>Promo Banner</label>
                          <input value={draft.repair.promoBanner} onChange={e => setRepairField('promoBanner', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Hero Card Title</label>
                          <input value={draft.repair.heroCardTitle} onChange={e => setRepairField('heroCardTitle', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Hero Card Description</label>
                          <input value={draft.repair.heroCardDesc} onChange={e => setRepairField('heroCardDesc', e.target.value)} className={inputCls} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Booking Form</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Form Headline</label>
                          <input value={draft.repair.formHeadline} onChange={e => setRepairField('formHeadline', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Form Subtitle</label>
                          <input value={draft.repair.formSubtitle} onChange={e => setRepairField('formSubtitle', e.target.value)} className={inputCls} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Hero Images</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <ImageField label="Hero Background Photo" value={draft.repair.heroBgImage} onChange={v => setRepairField('heroBgImage', v)} />
                        <ImageField label="Hero Side Photo (Leave empty for fallback)" value={draft.repair.heroSideImage} onChange={v => setRepairField('heroSideImage', v)} />
                      </div>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Checklist Items</h3>
                      {draft.repair.checklistItems.map((item, i) => (
                        <div key={i} className="flex gap-2 mb-2">
                          <input value={item} onChange={e => {
                            const newArr = [...draft.repair.checklistItems];
                            newArr[i] = e.target.value;
                            setRepairField('checklistItems', newArr);
                          }} className={inputCls} />
                          <button onClick={() => {
                            setRepairField('checklistItems', draft.repair.checklistItems.filter((_, idx) => idx !== i));
                          }} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => setRepairField('checklistItems', [...draft.repair.checklistItems, 'New Item'])} className={addBtnCls}><Plus size={14} /> Add Item</button>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Why Us Section</h3>
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div><label className={labelCls}>Headline</label><input value={draft.repair.whyUsHeadline} onChange={e => setRepairField('whyUsHeadline', e.target.value)} className={inputCls} /></div>
                        <div><label className={labelCls}>Accent Word</label><input value={draft.repair.whyUsAccent} onChange={e => setRepairField('whyUsAccent', e.target.value)} className={inputCls} /></div>
                        <div className="md:col-span-2"><label className={labelCls}>Subtitle</label><textarea value={draft.repair.whyUsSubtitle} onChange={e => setRepairField('whyUsSubtitle', e.target.value)} className={textareaCls} /></div>
                        <div className="md:col-span-2"><ImageField label="Why Us Background Photo" value={draft.repair.whyUsBgImage} onChange={v => setRepairField('whyUsBgImage', v)} /></div>
                      </div>
                      
                      <h4 className="text-sm font-bold uppercase mb-2">Why Us Points</h4>
                      {draft.repair.whyUsPoints.map(point => (
                        <div key={point.id} className={cardCls + " flex gap-4"}>
                          <div className="flex-1 space-y-2">
                            <input value={point.title} onChange={e => updateRepairArray('whyUsPoints', point.id, 'title', e.target.value)} className={inputCls} placeholder="Title" />
                            <textarea value={point.desc} onChange={e => updateRepairArray('whyUsPoints', point.id, 'desc', e.target.value)} className={textareaCls} placeholder="Description" />
                          </div>
                          <button onClick={() => deleteRepairArrayItem('whyUsPoints', point.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => addRepairArrayItem('whyUsPoints', { id: crypto.randomUUID(), title: 'New Point', desc: '' })} className={addBtnCls}><Plus size={14} /> Add Point</button>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Device Categories</h3>
                      {draft.repair.devices.map(dev => (
                        <div key={dev.id} className={cardCls + " flex gap-4"}>
                          <div className="flex-1 space-y-2">
                            <div className="grid md:grid-cols-2 gap-2">
                              <input value={dev.title} onChange={e => updateRepairArray('devices', dev.id, 'title', e.target.value)} className={inputCls} placeholder="Title" />
                              <input value={dev.desc} onChange={e => updateRepairArray('devices', dev.id, 'desc', e.target.value)} className={inputCls} placeholder="Description" />
                            </div>
                            <ImageField label="Image" value={dev.image} onChange={v => updateRepairArray('devices', dev.id, 'image', v)} />
                          </div>
                          <button onClick={() => deleteRepairArrayItem('devices', dev.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => addRepairArrayItem('devices', { id: crypto.randomUUID(), title: 'New Device', desc: '', image: '' })} className={addBtnCls}><Plus size={14} /> Add Device</button>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Customer Reviews</h3>
                      {draft.repair.reviews.map(rev => (
                        <div key={rev.id} className={cardCls + " flex gap-4"}>
                          <div className="flex-1 space-y-2">
                            <div className="grid md:grid-cols-2 gap-2">
                              <input value={rev.name} onChange={e => updateRepairArray('reviews', rev.id, 'name', e.target.value)} className={inputCls} placeholder="Name" />
                              <input value={rev.device} onChange={e => updateRepairArray('reviews', rev.id, 'device', e.target.value)} className={inputCls} placeholder="Repair Type" />
                            </div>
                            <textarea value={rev.text} onChange={e => updateRepairArray('reviews', rev.id, 'text', e.target.value)} className={textareaCls} placeholder="Review Text" />
                            <ImageField label="Avatar" value={rev.avatar} onChange={v => updateRepairArray('reviews', rev.id, 'avatar', v)} />
                          </div>
                          <button onClick={() => deleteRepairArrayItem('reviews', rev.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => addRepairArrayItem('reviews', { id: crypto.randomUUID(), name: 'New User', device: '', text: '', avatar: '' })} className={addBtnCls}><Plus size={14} /> Add Review</button>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>FAQs</h3>
                      {draft.repair.faqs.map(faq => (
                        <div key={faq.id} className={cardCls + " flex gap-4"}>
                          <div className="flex-1 space-y-2">
                            <input value={faq.q} onChange={e => updateRepairArray('faqs', faq.id, 'q', e.target.value)} className={inputCls} placeholder="Question" />
                            <textarea value={faq.a} onChange={e => updateRepairArray('faqs', faq.id, 'a', e.target.value)} className={textareaCls} placeholder="Answer" />
                          </div>
                          <button onClick={() => deleteRepairArrayItem('faqs', faq.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => addRepairArrayItem('faqs', { id: crypto.randomUUID(), q: 'New FAQ', a: '' })} className={addBtnCls}><Plus size={14} /> Add FAQ</button>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Services Grid</h3>
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div><label className={labelCls}>Section Headline</label><input value={(draft.repair as any).servicesHeadline ?? 'We fix what'} onChange={e => setRepairField('servicesHeadline' as any, e.target.value)} className={inputCls} /></div>
                        <div><label className={labelCls}>Accent (colored) Word</label><input value={(draft.repair as any).servicesAccent ?? 'matters most.'} onChange={e => setRepairField('servicesAccent' as any, e.target.value)} className={inputCls} /></div>
                      </div>
                      {((draft.repair as any).services ?? []).map((svc: any) => (
                        <div key={svc.id} className={cardCls + " flex gap-4"}>
                          <div className="flex-1 grid md:grid-cols-2 gap-2">
                            <input value={svc.title} onChange={e => updateRepairArray('services' as any, svc.id, 'title', e.target.value)} className={inputCls} placeholder="Service Name" />
                            <input value={svc.desc} onChange={e => updateRepairArray('services' as any, svc.id, 'desc', e.target.value)} className={inputCls} placeholder="Short Description" />
                          </div>
                          <button onClick={() => deleteRepairArrayItem('services' as any, svc.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => addRepairArrayItem('services' as any, { id: crypto.randomUUID(), title: 'New Service', desc: '' })} className={addBtnCls}><Plus size={14} /> Add Service</button>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Locations</h3>
                      <div className="mb-4">
                        <ImageField label="Locations Background" value={draft.repair.locationsBgImage} onChange={v => setRepairField('locationsBgImage', v)} />
                      </div>
                      {draft.repair.locations.map(loc => (
                        <div key={loc.id} className={cardCls + " flex gap-4"}>
                          <div className="flex-1 grid md:grid-cols-2 gap-2">
                            <input value={loc.city} onChange={e => updateRepairArray('locations', loc.id, 'city', e.target.value)} className={inputCls} placeholder="City" />
                            <input value={loc.address} onChange={e => updateRepairArray('locations', loc.id, 'address', e.target.value)} className={inputCls} placeholder="Address" />
                            <input value={loc.distance} onChange={e => updateRepairArray('locations', loc.id, 'distance', e.target.value)} className={inputCls} placeholder="Distance" />
                            <input value={loc.open} onChange={e => updateRepairArray('locations', loc.id, 'open', e.target.value)} className={inputCls} placeholder="Hours" />
                          </div>
                          <button onClick={() => deleteRepairArrayItem('locations', loc.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => addRepairArrayItem('locations', { id: crypto.randomUUID(), city: 'New City', address: '', distance: '', open: '' })} className={addBtnCls}><Plus size={14} /> Add Location</button>
                    </div>
                  </div>
                )}

                {/* Shop Page */}
                {activePanel === 'Shop Page' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className={sectionHeadCls}>Hero Section</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div><label className={labelCls}>Headline</label><input value={draft.shop.heroHeadline} onChange={e => setShopField('heroHeadline', e.target.value)} className={inputCls} /></div>
                        <div><label className={labelCls}>Accent</label><input value={draft.shop.heroAccent} onChange={e => setShopField('heroAccent', e.target.value)} className={inputCls} /></div>
                        <div className="md:col-span-2"><label className={labelCls}>Subtitle</label><textarea value={draft.shop.heroSubtitle} onChange={e => setShopField('heroSubtitle', e.target.value)} className={textareaCls} /></div>
                        <div className="md:col-span-2"><label className={labelCls}>Promo Banner</label><input value={draft.shop.promoBanner} onChange={e => setShopField('promoBanner', e.target.value)} className={inputCls} /></div>
                        <div className="md:col-span-2"><ImageField label="Hero Background" value={draft.shop.heroImage} onChange={v => setShopField('heroImage', v)} /></div>
                      </div>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Products</h3>
                      {draft.shop.products.map(p => (
                        <div key={p.id} className={cardCls + " flex gap-4"}>
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <input value={p.name} onChange={e => updateArrayItem('shop', p.id, 'name', e.target.value)} className={inputCls} placeholder="Name" />
                              <input value={p.category} onChange={e => updateArrayItem('shop', p.id, 'category', e.target.value)} className={inputCls} placeholder="Category" />
                              <input value={p.sku} onChange={e => updateArrayItem('shop', p.id, 'sku', e.target.value)} className={inputCls} placeholder="SKU" />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <input type="number" value={p.price} onChange={e => updateArrayItem('shop', p.id, 'price', Number(e.target.value))} className={inputCls} placeholder="Price" />
                              <input type="number" value={p.oldPrice || ''} onChange={e => updateArrayItem('shop', p.id, 'oldPrice', Number(e.target.value))} className={inputCls} placeholder="Old Price" />
                              <input type="number" value={p.stock} onChange={e => updateArrayItem('shop', p.id, 'stock', Number(e.target.value))} className={inputCls} placeholder="Stock" />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <input value={p.badge || ''} onChange={e => updateArrayItem('shop', p.id, 'badge', e.target.value)} className={inputCls} placeholder="Badge" />
                              <input type="number" step="0.1" value={p.rating} onChange={e => updateArrayItem('shop', p.id, 'rating', Number(e.target.value))} className={inputCls} placeholder="Rating" />
                              <select value={p.active ? 'Yes' : 'No'} onChange={e => updateArrayItem('shop', p.id, 'active', e.target.value === 'Yes')} className={inputCls}>
                                <option>Yes</option><option>No</option>
                              </select>
                            </div>
                            <ImageField label="Image" value={p.image} onChange={v => updateArrayItem('shop', p.id, 'image', v)} />
                          </div>
                          <button onClick={() => setDraft(d => ({...d, shop: {...d.shop, products: d.shop.products.filter(x => x.id !== p.id)}}))} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => setDraft(d => ({...d, shop: {...d.shop, products: [...d.shop.products, { id: crypto.randomUUID(), name: 'New Product', category: 'Accessories', price: 0, rating: 4.5, badge: '', image: '', stock: 0, sku: '', active: true }]}}))} className={addBtnCls}><Plus size={14} /> Add Product</button>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Promo Cards</h3>
                      {(draft.shop.promoCards ?? []).map((card: any) => (
                        <div key={card.id} className={cardCls + " flex gap-4"}>
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div><label className={labelCls}>Eyebrow</label><input value={card.eyebrow} onChange={e => setDraft(d => ({...d, shop: {...d.shop, promoCards: d.shop.promoCards.map((c: any) => c.id === card.id ? {...c, eyebrow: e.target.value} : c)}}))} className={inputCls} /></div>
                              <div><label className={labelCls}>Button Text</label><input value={card.buttonText} onChange={e => setDraft(d => ({...d, shop: {...d.shop, promoCards: d.shop.promoCards.map((c: any) => c.id === card.id ? {...c, buttonText: e.target.value} : c)}}))} className={inputCls} /></div>
                            </div>
                            <div><label className={labelCls}>Headline</label><input value={card.headline} onChange={e => setDraft(d => ({...d, shop: {...d.shop, promoCards: d.shop.promoCards.map((c: any) => c.id === card.id ? {...c, headline: e.target.value} : c)}}))} className={inputCls} /></div>
                            <ImageField label="Background Image" value={card.image} onChange={(v: string) => setDraft(d => ({...d, shop: {...d.shop, promoCards: d.shop.promoCards.map((c: any) => c.id === card.id ? {...c, image: v} : c)}}))} />
                          </div>
                          <button onClick={() => setDraft(d => ({...d, shop: {...d.shop, promoCards: d.shop.promoCards.filter((c: any) => c.id !== card.id)}}))} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => setDraft(d => ({...d, shop: {...d.shop, promoCards: [...(d.shop.promoCards ?? []), { id: crypto.randomUUID(), eyebrow: 'New Section', headline: 'Promo Title', buttonText: 'Shop Now', image: '' }]}}))} className={addBtnCls}><Plus size={14} /> Add Promo Card</button>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>JQF+ Membership</h3>
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className={labelCls}>Badge Name (e.g. JQF+)</label>
                          <input value={(draft.shop as any).membership?.headline ?? 'JQF+'} onChange={e => setDraft(d => ({...d, shop: {...d.shop, membership: {...(d.shop as any).membership, headline: e.target.value}}}))} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Price ($/year)</label>
                          <input type="number" step="0.01" value={(draft.shop as any).membership?.price ?? 14.99} onChange={e => setDraft(d => ({...d, shop: {...d.shop, membership: {...(d.shop as any).membership, price: Number(e.target.value)}}}))} className={inputCls} />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelCls}>Subtitle / Tagline</label>
                          <input value={(draft.shop as any).membership?.subtitle ?? ''} onChange={e => setDraft(d => ({...d, shop: {...d.shop, membership: {...(d.shop as any).membership, subtitle: e.target.value}}}))} className={inputCls} />
                        </div>
                      </div>
                      <h4 className="text-sm font-bold uppercase mb-2">Member Perks</h4>
                      {((draft.shop as any).membership?.perks ?? []).map((perk: string, i: number) => (
                        <div key={i} className="flex gap-2 mb-2">
                          <input value={perk} onChange={e => {
                            const perks = [...((draft.shop as any).membership?.perks ?? [])];
                            perks[i] = e.target.value;
                            setDraft(d => ({...d, shop: {...d.shop, membership: {...(d.shop as any).membership, perks}}}));
                          }} className={inputCls} placeholder="Perk description" />
                          <button onClick={() => {
                            const perks = ((draft.shop as any).membership?.perks ?? []).filter((_: any, idx: number) => idx !== i);
                            setDraft(d => ({...d, shop: {...d.shop, membership: {...(d.shop as any).membership, perks}}}));
                          }} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => {
                        const perks = [...((draft.shop as any).membership?.perks ?? []), 'New perk'];
                        setDraft(d => ({...d, shop: {...d.shop, membership: {...(d.shop as any).membership, perks}}}));
                      }} className={addBtnCls}><Plus size={14} /> Add Perk</button>
                    </div>
                  </div>
                )}

                {/* Community Page */}
                {activePanel === 'Community' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className={sectionHeadCls}>Hero Section</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2"><label className={labelCls}>Headline</label><textarea value={draft.community.heroHeadline} onChange={e => setCommunityField('heroHeadline', e.target.value)} className={textareaCls} /></div>
                        <div className="md:col-span-2"><label className={labelCls}>Subtitle</label><textarea value={draft.community.heroSubtitle} onChange={e => setCommunityField('heroSubtitle', e.target.value)} className={textareaCls} /></div>
                        <div><label className={labelCls}>Promo Banner</label><input value={draft.community.promoBanner} onChange={e => setCommunityField('promoBanner', e.target.value)} className={inputCls} /></div>
                        <div><label className={labelCls}>Countdown Target</label><input type="datetime-local" value={draft.community.countdownTarget} onChange={e => setCommunityField('countdownTarget', e.target.value)} className={inputCls} /></div>
                        <div className="md:col-span-2"><ImageField label="Hero Background" value={draft.community.heroBgImage} onChange={v => setCommunityField('heroBgImage', v)} /></div>
                      </div>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Announcements</h3>
                      {draft.community.announcements.map(ann => (
                        <div key={ann.id} className={cardCls + " flex gap-4"}>
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input value={ann.title} onChange={e => updateCommunityArray('announcements', ann.id, 'title', e.target.value)} className={inputCls} placeholder="Title" />
                              <input value={ann.badge} onChange={e => updateCommunityArray('announcements', ann.id, 'badge', e.target.value)} className={inputCls} placeholder="Badge" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input value={ann.date} onChange={e => updateCommunityArray('announcements', ann.id, 'date', e.target.value)} className={inputCls} placeholder="Date" />
                              <select value={ann.featured ? 'Yes' : 'No'} onChange={e => updateCommunityArray('announcements', ann.id, 'featured', e.target.value === 'Yes')} className={inputCls}>
                                <option>Yes</option><option>No</option>
                              </select>
                            </div>
                            <textarea value={ann.desc} onChange={e => updateCommunityArray('announcements', ann.id, 'desc', e.target.value)} className={textareaCls} placeholder="Description" />
                            <ImageField label="Image" value={ann.image} onChange={v => updateCommunityArray('announcements', ann.id, 'image', v)} />
                          </div>
                          <button onClick={() => deleteCommunityArrayItem('announcements', ann.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => addCommunityArrayItem('announcements', { id: crypto.randomUUID(), badge: 'New', date: new Date().toLocaleDateString('en-US',{month:'long',day:'numeric'}), title: 'New Announcement', desc: '', featured: false, image: '' })} className={addBtnCls}><Plus size={14} /> Add Announcement</button>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Events</h3>
                      {draft.community.events.map(ev => (
                        <div key={ev.id} className={cardCls + " flex gap-4"}>
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input value={ev.title} onChange={e => updateCommunityArray('events', ev.id, 'title', e.target.value)} className={inputCls} placeholder="Title" />
                              <input value={ev.badge} onChange={e => updateCommunityArray('events', ev.id, 'badge', e.target.value)} className={inputCls} placeholder="Badge" />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <input type="date" value={ev.date} onChange={e => updateCommunityArray('events', ev.id, 'date', e.target.value)} className={inputCls} />
                              <input type="time" value={ev.time} onChange={e => updateCommunityArray('events', ev.id, 'time', e.target.value)} className={inputCls} />
                              <input value={ev.location} onChange={e => updateCommunityArray('events', ev.id, 'location', e.target.value)} className={inputCls} placeholder="Location" />
                            </div>
                            <textarea value={ev.desc} onChange={e => updateCommunityArray('events', ev.id, 'desc', e.target.value)} className={textareaCls} placeholder="Description" />
                          </div>
                          <button onClick={() => deleteCommunityArrayItem('events', ev.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => addCommunityArrayItem('events', { id: crypto.randomUUID(), date: '', badge: 'Event', time: '', endTime: '', title: 'New Event', location: '', desc: '' })} className={addBtnCls}><Plus size={14} /> Add Event</button>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Actions</h3>
                      {draft.community.actions.map(act => (
                        <div key={act.id} className={cardCls + " flex gap-4"}>
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <input value={act.icon} onChange={e => updateCommunityArray('actions', act.id, 'icon', e.target.value)} className={inputCls} placeholder="Icon (emoji)" />
                              <input value={act.title} onChange={e => updateCommunityArray('actions', act.id, 'title', e.target.value)} className={inputCls} placeholder="Title" />
                              <input value={act.badge} onChange={e => updateCommunityArray('actions', act.id, 'badge', e.target.value)} className={inputCls} placeholder="Badge" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input type="number" value={act.progress} onChange={e => updateCommunityArray('actions', act.id, 'progress', Number(e.target.value))} className={inputCls} placeholder="Progress %" />
                              <input type="number" value={act.volunteers} onChange={e => updateCommunityArray('actions', act.id, 'volunteers', Number(e.target.value))} className={inputCls} placeholder="Volunteers" />
                            </div>
                            <textarea value={act.desc} onChange={e => updateCommunityArray('actions', act.id, 'desc', e.target.value)} className={textareaCls} placeholder="Description" />
                            <ImageField label="Image" value={act.image} onChange={v => updateCommunityArray('actions', act.id, 'image', v)} />
                          </div>
                          <button onClick={() => deleteCommunityArrayItem('actions', act.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => addCommunityArrayItem('actions', { id: crypto.randomUUID(), icon: '⭐', badge: 'Planning', title: 'New Action', desc: '', progress: 0, volunteers: 0, image: '' })} className={addBtnCls}><Plus size={14} /> Add Action</button>
                    </div>
                  </div>
                )}

                {/* Repair Tickets Panel */}
                {activePanel === 'Repair Tickets' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={sectionHeadCls}>Repair Requests</h3>
                      <button onClick={() => { loadRepairs(); showToast('Refreshed.'); }} className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-xl font-bold text-xs uppercase hover:bg-card/80 transition-colors">
                        <RefreshCcw size={14} /> Refresh
                      </button>
                    </div>

                    {repairs.length === 0 ? (
                      <div className="bg-card border border-border rounded-3xl p-16 text-center">
                        <p className="text-muted-foreground font-medium">No requests yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {[...repairs].reverse().map(r => (
                          <div key={r.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex-shrink-0">
                              <div className="bg-primary/10 text-primary font-black text-xs tracking-wider px-3 py-1.5 rounded-lg">{r.ticket}</div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-black mb-1">{r.name} · {r.phone}</div>
                              <div className="flex gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                <span>{r.category}</span>
                                <span>{r.brand} {r.model}</span>
                                <span>{r.issue}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {(() => {
                                const statusColors: Record<string, string> = {
                                  'Checked In':       'text-blue-400',
                                  'Diagnosing':       'text-yellow-400',
                                  'Parts Ordered':    'text-orange-400',
                                  'In Repair':        'text-primary',
                                  'Quality Check':    'text-purple-400',
                                  'Ready for Pickup': 'text-green-400',
                                  'Completed':        'text-green-400',
                                  'On Hold':          'text-yellow-400',
                                  'Cancelled':        'text-red-400',
                                };
                                return (
                                  <select
                                    value={r.status}
                                    onChange={e => {
                                      const newStatus = e.target.value;
                                      if (!adminToken) return;
                                      fetch(`${API_BASE}/repairs/${r.id}/status`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
                                        body: JSON.stringify({ status: newStatus }),
                                      }).then(res => {
                                        if (res.ok) {
                                          setRepairs(prev => prev.map(x => x.id === r.id ? { ...x, status: newStatus } : x));
                                          showToast('Status updated.');
                                        } else showToast('Failed to update.');
                                      }).catch(() => showToast('Failed.'));
                                    }}
                                    className={`bg-background border border-border rounded-xl px-3 py-2 text-xs font-black outline-none focus:border-primary transition-colors cursor-pointer ${statusColors[r.status] || 'text-foreground'}`}
                                  >
                                    <option>Checked In</option>
                                    <option>Diagnosing</option>
                                    <option>Parts Ordered</option>
                                    <option>In Repair</option>
                                    <option>Quality Check</option>
                                    <option>Ready for Pickup</option>
                                    <option>Completed</option>
                                    <option>On Hold</option>
                                    <option>Cancelled</option>
                                  </select>
                                );
                              })()}
                              <button onClick={() => {
                                if (!adminToken) return;
                                if (window.confirm(`Delete ticket ${r.ticket}?`)) {
                                  fetch(`${API_BASE}/repairs/${r.id}`, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${adminToken}` },
                                  }).then(res => {
                                    if (res.ok) setRepairs(prev => prev.filter(x => x.id !== r.id));
                                    else showToast('Failed to delete ticket.');
                                  }).catch(() => showToast('Failed to delete ticket.'));
                                }
                              }} className={deleteBtnCls}><Trash2 size={16} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Inventory Panel */}
                {activePanel === 'Inventory' && (
                  <div className="space-y-4">
                    <h3 className={sectionHeadCls}>Inventory</h3>
                    {draft.inventory.map(inv => (
                      <div key={inv.id} className={cardCls + ` flex gap-4 ${inv.quantity <= inv.threshold ? 'border-l-4 border-l-primary' : ''}`}>
                        <div className="flex-1 grid md:grid-cols-5 gap-2">
                          <input value={inv.item} onChange={e => updateArrayItem('inventory', inv.id, 'item', e.target.value)} className={inputCls} placeholder="Item Name" />
                          <input type="number" value={inv.quantity} onChange={e => updateArrayItem('inventory', inv.id, 'quantity', Number(e.target.value))} className={inputCls} placeholder="Qty" />
                          <input type="number" value={inv.reserved} onChange={e => updateArrayItem('inventory', inv.id, 'reserved', Number(e.target.value))} className={inputCls} placeholder="Reserved" />
                          <input type="number" value={inv.threshold} onChange={e => updateArrayItem('inventory', inv.id, 'threshold', Number(e.target.value))} className={inputCls} placeholder="Threshold" />
                          <input value={inv.reason} onChange={e => updateArrayItem('inventory', inv.id, 'reason', e.target.value)} className={inputCls} placeholder="Reason" />
                        </div>
                        <button onClick={() => deleteArrayItem('inventory', inv.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                      </div>
                    ))}
                    <button onClick={() => setDraft(d => ({...d, inventory: [...d.inventory, { id: crypto.randomUUID(), item: '', quantity: 0, reserved: 0, threshold: 5, reason: 'Manual add' }]}))} className={addBtnCls}><Plus size={14} /> Add Item</button>
                  </div>
                )}

                {/* Orders Panel */}
                {activePanel === 'Orders' && (
                  <div className="space-y-4">
                    <h3 className={sectionHeadCls}>Orders</h3>
                    {draft.orders.map(ord => (
                      <div key={ord.id} className={cardCls + " flex gap-4"}>
                        <div className="flex-1 grid md:grid-cols-4 gap-2">
                          <input value={ord.order} onChange={e => updateArrayItem('orders', ord.id, 'order', e.target.value)} className={inputCls} placeholder="Order #" />
                          <input value={ord.customer} onChange={e => updateArrayItem('orders', ord.id, 'customer', e.target.value)} className={inputCls} placeholder="Customer" />
                          <input value={ord.total} onChange={e => updateArrayItem('orders', ord.id, 'total', e.target.value)} className={inputCls} placeholder="Total" />
                          <select value={ord.status} onChange={e => updateArrayItem('orders', ord.id, 'status', e.target.value)} className={inputCls}>
                            <option>Pending</option><option>Processing</option><option>Shipped</option><option>Completed</option><option>Cancelled</option>
                          </select>
                        </div>
                        <button onClick={() => deleteArrayItem('orders', ord.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                      </div>
                    ))}
                    <button onClick={() => setDraft(d => ({...d, orders: [...d.orders, { id: crypto.randomUUID(), order: 'ORD-'+Math.floor(Math.random()*99999), customer: '', total: '0', status: 'Pending' }]}))} className={addBtnCls}><Plus size={14} /> Add Order</button>
                  </div>
                )}

                {/* Customers Panel */}
                {activePanel === 'Customers' && (
                  <div className="space-y-4">
                    <h3 className={sectionHeadCls}>Customers</h3>
                    {draft.customers.map(cust => (
                      <div key={cust.id} className={cardCls + " flex gap-4"}>
                        <div className="flex-1 grid md:grid-cols-4 gap-2">
                          <input value={cust.name} onChange={e => updateArrayItem('customers', cust.id, 'name', e.target.value)} className={inputCls} placeholder="Name" />
                          <input value={cust.phone} onChange={e => updateArrayItem('customers', cust.id, 'phone', e.target.value)} className={inputCls} placeholder="Phone" />
                          <input value={cust.email} onChange={e => updateArrayItem('customers', cust.id, 'email', e.target.value)} className={inputCls} placeholder="Email" />
                          <input value={cust.lifetimeSpend} onChange={e => updateArrayItem('customers', cust.id, 'lifetimeSpend', e.target.value)} className={inputCls} placeholder="Lifetime Spend" />
                        </div>
                        <button onClick={() => deleteArrayItem('customers', cust.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                      </div>
                    ))}
                    <button onClick={() => setDraft(d => ({...d, customers: [...d.customers, { id: crypto.randomUUID(), name: '', phone: '', email: '', lifetimeSpend: '0' }]}))} className={addBtnCls}><Plus size={14} /> Add Customer</button>
                  </div>
                )}

                {/* Trade Inquiries Panel */}
                {activePanel === 'Trade-Ins' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={sectionHeadCls}>Trade Inquiries ({tradeInquiries.length})</h3>
                      <button
                        onClick={() => { loadTradeInquiries(); showToast('Refreshed.'); }}
                        className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-xl font-bold text-xs uppercase hover:bg-card/80 transition-colors"
                      >
                        <RefreshCcw2 size={14} /> Refresh
                      </button>
                    </div>

                    {tradeInquiries.length === 0 ? (
                      <div className="bg-card border border-dashed border-border rounded-3xl p-16 text-center">
                        <RefreshCcw2 size={40} className="mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground font-medium">No trade inquiries yet.</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">When customers submit a trade inquiry on the shop page, it will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tradeInquiries.map(inq => {
                          const statusColors: Record<string, string> = {
                            'New': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
                            'Reviewing': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
                            'Offer Sent': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
                            'Completed': 'bg-green-500/15 text-green-400 border-green-500/30',
                            'Declined': 'bg-red-500/15 text-red-400 border-red-500/30',
                          };
                          return (
                            <div key={inq.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col md:flex-row gap-4">
                              {/* Customer info */}
                              <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="font-black text-foreground">{inq.name}</span>
                                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColors[inq.status] || 'bg-card border-border text-muted-foreground'}`}>
                                    {inq.status}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(inq.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-medium">
                                  <a href={`mailto:${inq.email}`} className="hover:text-primary transition-colors">{inq.email}</a>
                                  <a href={`tel:${inq.phone}`} className="hover:text-primary transition-colors">{inq.phone}</a>
                                </div>
                                <div className="bg-background rounded-xl px-4 py-2.5 text-sm">
                                  <span className="text-xs font-black uppercase tracking-wider text-muted-foreground mr-2">{inq.deviceType} · {inq.condition}</span>
                                  <span className="text-foreground">{inq.deviceDescription}</span>
                                </div>
                                {inq.notes && (
                                  <div className="text-xs text-muted-foreground italic px-1">Notes: {inq.notes}</div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex md:flex-col gap-2 items-start md:items-end justify-end flex-shrink-0">
                                <select
                                  value={inq.status}
                                  onChange={e => {
                                    const newStatus = e.target.value;
                                    fetch(`${API_BASE}/trade-inquiries/${inq.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
                                      body: JSON.stringify({ status: newStatus }),
                                    }).then(r => r.ok ? (setTradeInquiries(prev => prev.map(i => i.id === inq.id ? { ...i, status: newStatus } : i)), showToast('Status updated.')) : showToast('Failed.'))
                                    .catch(() => showToast('Failed.'));
                                  }}
                                  className="bg-background border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-primary transition-colors cursor-pointer"
                                >
                                  <option>New</option>
                                  <option>Reviewing</option>
                                  <option>Offer Sent</option>
                                  <option>Completed</option>
                                  <option>Declined</option>
                                </select>
                                <button
                                  onClick={() => {
                                    if (!window.confirm(`Delete inquiry from ${inq.name}?`)) return;
                                    fetch(`${API_BASE}/trade-inquiries/${inq.id}`, {
                                      method: 'DELETE',
                                      headers: { 'Authorization': `Bearer ${adminToken}` },
                                    }).then(r => r.ok ? (setTradeInquiries(prev => prev.filter(i => i.id !== inq.id)), showToast('Deleted.')) : showToast('Failed.'))
                                    .catch(() => showToast('Failed.'));
                                  }}
                                  className={deleteBtnCls}
                                ><Trash2 size={16} /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Employees Panel */}
                {activePanel === 'Employees' && (
                  <div className="space-y-4">
                    <h3 className={sectionHeadCls}>Employees</h3>
                    {draft.employees.map(emp => (
                      <div key={emp.id} className={cardCls + " flex gap-4"}>
                        <div className="flex-1 grid md:grid-cols-4 gap-2">
                          <input value={emp.name} onChange={e => updateArrayItem('employees', emp.id, 'name', e.target.value)} className={inputCls} placeholder="Name" />
                          <input value={emp.email} onChange={e => updateArrayItem('employees', emp.id, 'email', e.target.value)} className={inputCls} placeholder="Email" />
                          <select value={emp.role} onChange={e => updateArrayItem('employees', emp.id, 'role', e.target.value)} className={inputCls}>
                            <option>Owner</option><option>Manager</option><option>Technician</option><option>Sales</option><option>Front Desk</option>
                          </select>
                          <select value={emp.status} onChange={e => updateArrayItem('employees', emp.id, 'status', e.target.value)} className={inputCls}>
                            <option>Active</option><option>Inactive</option>
                          </select>
                        </div>
                        <button onClick={() => deleteArrayItem('employees', emp.id)} className={deleteBtnCls}><Trash2 size={16} /></button>
                      </div>
                    ))}
                    <button onClick={() => setDraft(d => ({...d, employees: [...d.employees, { id: crypto.randomUUID(), name: '', email: '', role: 'Technician', status: 'Active' }]}))} className={addBtnCls}><Plus size={14} /> Add Employee</button>
                  </div>
                )}

                {/* Settings Panel */}
                {/* Email List */}
                {activePanel === 'Email List' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={sectionHeadCls}>Email Subscribers ({emails.length})</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const csv = ['Email,Name,Source,Date', ...emails.map(e =>
                              `${e.email},${e.name},${e.source},${new Date(e.createdAt).toLocaleDateString()}`
                            )].join('\n');
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url; a.download = 'subscribers.csv'; a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-xl font-bold text-xs uppercase hover:bg-card/80 transition-colors"
                        >
                          <Download size={14} /> Export CSV
                        </button>
                        <button onClick={() => { loadEmails(); showToast('Refreshed.'); }} className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-xl font-bold text-xs uppercase hover:bg-card/80 transition-colors">
                          <RefreshCcw size={14} /> Refresh
                        </button>
                      </div>
                    </div>

                    {emails.length === 0 ? (
                      <div className="bg-card border border-dashed border-border rounded-3xl p-16 text-center">
                        <Mail size={40} className="mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground font-medium">No subscribers yet.</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Emails collected from the website signup form will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {[...emails].reverse().map(e => (
                          <div key={e.id} className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-4">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Mail size={16} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-black truncate">{e.email}</div>
                              <div className="text-xs text-muted-foreground font-medium mt-0.5">
                                {e.name && <span className="mr-3">{e.name}</span>}
                                <span className="uppercase tracking-wider opacity-60">{e.source}</span>
                                <span className="mx-2 opacity-30">·</span>
                                <span>{new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (!adminToken) return;
                                if (!window.confirm(`Remove ${e.email}?`)) return;
                                fetch(`${API_BASE}/emails/${e.id}`, {
                                  method: 'DELETE',
                                  headers: { 'Authorization': `Bearer ${adminToken}` },
                                }).then(res => {
                                  if (res.ok) { setEmails(prev => prev.filter(x => x.id !== e.id)); showToast('Removed.'); }
                                  else showToast('Failed to remove.');
                                }).catch(() => showToast('Failed to remove.'));
                              }}
                              className={deleteBtnCls}
                            ><Trash2 size={16} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Memberships Panel ── */}
                {activePanel === 'Memberships' && (
                    <div className="space-y-6">
                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: 'Active Codes', value: membershipActive.length, color: 'text-green-400', icon: <ShieldCheck size={18} /> },
                          { label: 'Expired', value: membershipExpired.length, color: 'text-yellow-400', icon: <Clock size={18} /> },
                          { label: 'Deactivated', value: membershipDeactivated.length, color: 'text-red-400', icon: <AlertTriangle size={18} /> },
                        ].map(s => (
                          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                            <div className={s.color}>{s.icon}</div>
                            <div>
                              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                              <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Discount Code Checker */}
                      <div className="bg-card border border-border rounded-2xl p-6">
                        <h3 className={sectionHeadCls}>Discount Code Checker</h3>
                        <p className="text-xs text-muted-foreground mb-4">Enter any JQF+ code to instantly verify its status, discount %, and expiry date.</p>
                        <div className="flex gap-3">
                          <div className="relative flex-1">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="text"
                              value={membershipCheckCode}
                              onChange={e => { setMembershipCheckCode(e.target.value.toUpperCase()); setMembershipCheckResult(null); }}
                              onKeyDown={e => e.key === 'Enter' && handleCheckMembershipCode()}
                              placeholder="JQF-XXXX-XXXX"
                              className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2.5 font-mono text-sm outline-none focus:border-primary transition-colors"
                            />
                          </div>
                          <button
                            onClick={handleCheckMembershipCode}
                            disabled={!membershipCheckCode.trim() || membershipCheckLoading}
                            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:brightness-110 transition-all disabled:opacity-50"
                          >
                            {membershipCheckLoading ? 'Checking…' : 'Check'}
                          </button>
                        </div>

                        {/* Result card */}
                        {membershipCheckResult && (
                          <div className={`mt-4 rounded-xl border p-4 ${membershipCheckResult.valid ? 'border-green-500/40 bg-green-500/5' : 'border-red-500/40 bg-red-500/5'}`}>
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 ${membershipCheckResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                                {membershipCheckResult.valid ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
                              </div>
                              <div className="flex-1">
                                <div className={`font-black text-sm ${membershipCheckResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                                  {membershipCheckResult.valid ? '✓ VALID CODE' : '✗ INVALID CODE'}
                                </div>
                                <div className="text-sm text-foreground mt-1">{membershipCheckResult.message}</div>
                                {membershipCheckResult.valid && membershipCheckResult.expiresAt && (
                                  <div className="grid grid-cols-3 gap-3 mt-3">
                                    <div className="bg-background/60 rounded-lg p-2 text-center">
                                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Discount</div>
                                      <div className="font-black text-primary">{membershipCheckResult.discountPercent}% OFF</div>
                                    </div>
                                    <div className="bg-background/60 rounded-lg p-2 text-center">
                                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Expires</div>
                                      <div className="font-black text-sm">{new Date(membershipCheckResult.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                    </div>
                                    <div className="bg-background/60 rounded-lg p-2 text-center">
                                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Days Left</div>
                                      <div className={`font-black text-sm ${(membershipCheckResult.daysLeft ?? 0) < 30 ? 'text-yellow-400' : 'text-green-400'}`}>
                                        {membershipCheckResult.daysLeft}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* All Codes Table */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className={sectionHeadCls}>All Membership Codes ({membershipCodes.length})</h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const csv = ['Code,Email,Discount,Issued,Expires,Status',
                                  ...membershipCodes.map(c => {
                                    const exp = new Date(c.expiresAt);
                                    const status = !c.isActive ? 'Deactivated' : exp <= now ? 'Expired' : 'Active';
                                    return `${c.code},${c.email},${c.discountPercent}%,${new Date(c.createdAt).toLocaleDateString()},${exp.toLocaleDateString()},${status}`;
                                  })
                                ].join('\n');
                                const blob = new Blob([csv], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a'); a.href = url; a.download = 'jqf-membership-codes.csv'; a.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="flex items-center gap-2 px-3 py-2 bg-card border border-border text-foreground rounded-xl font-bold text-xs uppercase hover:bg-card/80 transition-colors"
                            >
                              <Download size={13} /> Export CSV
                            </button>
                            <button onClick={() => { loadMembershipCodes(); showToast('Refreshed.'); }} className="flex items-center gap-2 px-3 py-2 bg-card border border-border text-foreground rounded-xl font-bold text-xs uppercase hover:bg-card/80 transition-colors">
                              <RefreshCcw size={13} /> Refresh
                            </button>
                          </div>
                        </div>

                        {membershipCodes.length === 0 ? (
                          <div className="bg-card border border-dashed border-border rounded-3xl p-16 text-center">
                            <BadgePercent size={40} className="mx-auto text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground font-medium">No membership codes issued yet.</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">Codes are generated automatically when customers purchase JQF+.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {membershipCodes.map(c => {
                              const exp = new Date(c.expiresAt);
                              const isExpired = exp <= now;
                              const daysLeft = isExpired ? 0 : Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                              const statusLabel = !c.isActive ? 'Deactivated' : isExpired ? 'Expired' : 'Active';
                              const statusColor = !c.isActive ? 'text-red-400' : isExpired ? 'text-yellow-400' : 'text-green-400';
                              return (
                                <div key={c.id} className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-4">
                                  {/* Status dot */}
                                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${!c.isActive ? 'bg-red-400' : isExpired ? 'bg-yellow-400' : 'bg-green-400'}`} />
                                  {/* Code */}
                                  <div className="font-mono font-black text-sm tracking-widest min-w-[130px]">{c.code}</div>
                                  {/* Email */}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{c.email}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">
                                      Issued {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                  </div>
                                  {/* Discount */}
                                  <div className="text-center min-w-[56px]">
                                    <div className="text-primary font-black">{c.discountPercent}%</div>
                                    <div className="text-xs text-muted-foreground">off</div>
                                  </div>
                                  {/* Expiry */}
                                  <div className="text-center min-w-[90px]">
                                    <div className={`text-xs font-bold ${!c.isActive ? 'text-muted-foreground' : isExpired ? 'text-yellow-400' : daysLeft < 30 ? 'text-yellow-400' : 'text-foreground'}`}>
                                      {exp.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <div className={`text-xs ${statusColor} font-bold`}>{statusLabel}{c.isActive && !isExpired ? ` · ${daysLeft}d` : ''}</div>
                                  </div>
                                  {/* Toggle */}
                                  <button
                                    onClick={() => handleToggleMembershipCode(c.id, c.isActive)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex-shrink-0 ${c.isActive ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'}`}
                                  >
                                    {c.isActive ? 'Deactivate' : 'Reactivate'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                )}

                {activePanel === 'Settings' && (
                  <div className="space-y-8">
                    <div>
                      <h3 className={sectionHeadCls}>Global Settings</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Site Name</label>
                          <input value={draft.site.name} onChange={e => setDraft(p => ({ ...p, site: { ...p.site, name: e.target.value } }))} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Site Tagline</label>
                          <input value={draft.site.tagline} onChange={e => setDraft(p => ({ ...p, site: { ...p.site, tagline: e.target.value } }))} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Store Name</label>
                          <input value={draft.settings.storeName} onChange={e => setSettingsField('storeName', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Contact Email</label>
                          <input value={draft.settings.contactEmail} onChange={e => setSettingsField('contactEmail', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Phone</label>
                          <input value={draft.settings.phone} onChange={e => setSettingsField('phone', e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Visibility</label>
                          <select value={draft.settings.visibility} onChange={e => setSettingsField('visibility', e.target.value)} className={inputCls}>
                            <option>Public</option><option>Private</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelCls}>Footer Text</label>
                          <textarea value={draft.settings.footer} onChange={e => setSettingsField('footer', e.target.value)} className={textareaCls} />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelCls}>Footer Tagline (under logo)</label>
                          <textarea value={(draft.settings as any).footerTagline ?? ''} onChange={e => setSettingsField('footerTagline' as any, e.target.value)} className={textareaCls} />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelCls}>Store Hours</label>
                          <textarea value={(draft.settings as any).hours ?? ''} onChange={e => setSettingsField('hours' as any, e.target.value)} className={textareaCls} placeholder="Mon – Sat: 9am – 7pm&#10;Sun: 11am – 5pm" />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelCls}>Store Address (optional)</label>
                          <input value={(draft.settings as any).address ?? ''} onChange={e => setSettingsField('address' as any, e.target.value)} className={inputCls} placeholder="123 Main Street, City, State" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className={sectionHeadCls}>Warranty Policy</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className={labelCls}>Warranty Title</label>
                          <input value={(draft.settings as any).warrantyTitle ?? ''} onChange={e => setSettingsField('warrantyTitle' as any, e.target.value)} className={inputCls} />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelCls}>Warranty Body Text</label>
                          <textarea value={(draft.settings as any).warrantyBody ?? ''} onChange={e => setSettingsField('warrantyBody' as any, e.target.value)} className={textareaCls} rows={4} />
                        </div>
                      </div>
                      <h4 className="text-sm font-bold uppercase mt-4 mb-2">Warranty Bullets</h4>
                      {((draft.settings as any).warrantyBullets ?? []).map((bullet: string, i: number) => (
                        <div key={i} className="flex gap-2 mb-2">
                          <input value={bullet} onChange={e => {
                            const bullets = [...((draft.settings as any).warrantyBullets ?? [])];
                            bullets[i] = e.target.value;
                            setSettingsField('warrantyBullets' as any, bullets);
                          }} className={inputCls} />
                          <button onClick={() => {
                            const bullets = ((draft.settings as any).warrantyBullets ?? []).filter((_: any, idx: number) => idx !== i);
                            setSettingsField('warrantyBullets' as any, bullets);
                          }} className={deleteBtnCls}><Trash2 size={16} /></button>
                        </div>
                      ))}
                      <button onClick={() => {
                        const bullets = [...((draft.settings as any).warrantyBullets ?? []), 'New bullet point'];
                        setSettingsField('warrantyBullets' as any, bullets);
                      }} className={addBtnCls}><Plus size={14} /> Add Bullet</button>
                    </div>

                    <div className="pt-6 border-t border-border">
                      <button onClick={() => {
                        if (window.confirm("Reset all settings to default demo data?")) {
                          saveContent(DEFAULT_CONTENT);
                          showToast('Reset to defaults.');
                        }
                      }} className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 rounded-xl font-black text-xs uppercase tracking-wider transition-colors">
                        <RefreshCcw size={14} /> Reset to Defaults
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
