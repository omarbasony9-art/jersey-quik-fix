import React, { useState } from 'react';
import { Wrench, MapPin, Mail, CheckCircle } from 'lucide-react';
import jerseyLogo from '../assets/jersey-quik-fix-logo.png';

const API_BASE = '/api';

export default function Footer() {
  const [signupEmail, setSignupEmail] = useState('');
  const [signupStatus, setSignupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail) return;
    setSignupStatus('loading');
    try {
      const res = await fetch(`${API_BASE}/emails/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signupEmail, source: 'footer' }),
      });
      setSignupStatus(res.ok ? 'success' : 'error');
    } catch {
      setSignupStatus('error');
    }
  };

  return (
    <footer className="bg-black border-t border-border pt-16 pb-8 px-6 mt-auto">
      {/* Newsletter bar */}
      <div className="max-w-7xl mx-auto mb-12 bg-card border border-primary/20 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="flex items-center gap-3 flex-shrink-0">
          <Mail size={28} className="text-primary" />
          <div>
            <div className="font-black uppercase tracking-wider text-foreground">Stay in the loop</div>
            <div className="text-xs text-muted-foreground">Deals, repair tips &amp; store news</div>
          </div>
        </div>
        {signupStatus === 'success' ? (
          <div className="flex items-center gap-2 text-green-400 font-bold text-sm">
            <CheckCircle size={18} /> You're on the list — thanks!
          </div>
        ) : (
          <form onSubmit={handleSignup} className="flex gap-3 w-full md:max-w-md ml-auto">
            <input
              type="email"
              value={signupEmail}
              onChange={e => setSignupEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              disabled={signupStatus === 'loading'}
              className="px-5 py-2.5 bg-primary text-primary-foreground font-black text-sm uppercase rounded-xl hover:brightness-110 transition-all disabled:opacity-60"
            >
              {signupStatus === 'loading' ? '...' : 'Subscribe'}
            </button>
          </form>
        )}
        {signupStatus === 'error' && (
          <p className="text-red-400 text-xs font-medium">Something went wrong — try again.</p>
        )}
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="col-span-1 md:col-span-2">
          <a href="/" className="flex items-center gap-3 mb-6 group inline-flex">
            <img src={jerseyLogo} alt="Jersey Quik Fix" className="w-10 h-10 object-contain" />
            <span className="text-xl font-black tracking-tight uppercase italic text-foreground group-hover:text-primary transition-colors">
              Jersey Quik Fix
            </span>
          </a>
          <p className="text-muted-foreground font-medium max-w-sm mb-6 leading-relaxed">
            Fast, professional repairs for phones, tablets, laptops, and gaming consoles. Your neighborhood tech fix shop.
          </p>
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <MapPin size={18} className="text-primary" />
            Find a store near you
          </div>
        </div>

        <div>
          <h4 className="font-black uppercase tracking-wider mb-6">Repair</h4>
          <ul className="space-y-4 text-muted-foreground font-medium">
            <li><a href="/" className="hover:text-primary transition-colors">Phone Repair</a></li>
            <li><a href="/" className="hover:text-primary transition-colors">Tablet Repair</a></li>
            <li><a href="/" className="hover:text-primary transition-colors">Laptop Repair</a></li>
            <li><a href="/" className="hover:text-primary transition-colors">Console Repair</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-black uppercase tracking-wider mb-6">Support</h4>
          <ul className="space-y-4 text-muted-foreground font-medium">
            <li><a href="/" className="hover:text-primary transition-colors">Repair Status</a></li>
            <li><a href="/" className="hover:text-primary transition-colors">Warranty Policy</a></li>
            <li><a href="/" className="hover:text-primary transition-colors">Trade-In Guidelines</a></li>
            <li><a href="/" className="hover:text-primary transition-colors">Contact Us</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-medium">
        <p>&copy; {new Date().getFullYear()} Jersey Quik Fix. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Accessibility</a>
        </div>
      </div>
    </footer>
  );
}
