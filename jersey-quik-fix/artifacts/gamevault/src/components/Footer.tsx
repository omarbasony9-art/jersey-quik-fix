import React, { useState } from 'react';
import { Mail, CheckCircle, Phone, MapPin, Clock, Search } from 'lucide-react';
import { Link } from 'wouter';
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
      <div className="max-w-7xl mx-auto mb-14 bg-card border border-primary/20 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="flex items-center gap-3 flex-shrink-0">
          <Mail size={28} className="text-primary" />
          <div>
            <div className="font-black uppercase tracking-wider text-foreground">Stay in the loop</div>
            <div className="text-xs text-muted-foreground">Deals, repair tips &amp; store news</div>
          </div>
        </div>
        {signupStatus === 'success' ? (
          <div className="flex items-center gap-2 text-green-400 font-bold text-sm ml-auto">
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
              {signupStatus === 'loading' ? '…' : 'Subscribe'}
            </button>
          </form>
        )}
        {signupStatus === 'error' && (
          <p className="text-red-400 text-xs font-medium">Something went wrong — try again.</p>
        )}
      </div>

      {/* Main grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-14">
        {/* Brand */}
        <div className="col-span-1 md:col-span-1">
          <Link href="/" className="flex items-center gap-3 mb-5 group inline-flex no-underline">
            <img src={jerseyLogo} alt="Jersey Quik Fix" className="w-10 h-10 object-contain" />
            <span className="text-lg font-black tracking-tight uppercase italic text-foreground group-hover:text-primary transition-colors leading-tight">
              Jersey<br/>Quik Fix
            </span>
          </Link>
          <p className="text-muted-foreground text-sm font-medium max-w-[220px] leading-relaxed mb-5">
            Fast, professional repairs for phones, tablets, laptops, and gaming consoles.
          </p>
          <div className="space-y-2 text-sm">
            <a href="tel:+19852282888" className="flex items-center gap-2 text-foreground font-bold hover:text-primary transition-colors group">
              <Phone size={15} className="text-primary flex-shrink-0" />
              1&nbsp;(985)&nbsp;228-2888
            </a>
            <div className="flex items-start gap-2 text-muted-foreground font-medium">
              <Clock size={15} className="text-primary flex-shrink-0 mt-0.5" />
              <span>Mon – Sat: 9am – 7pm<br/>Sun: 11am – 5pm</span>
            </div>
          </div>
        </div>

        {/* Repair */}
        <div>
          <h4 className="font-black uppercase tracking-wider mb-5 text-sm">Repair</h4>
          <ul className="space-y-3 text-muted-foreground text-sm font-medium">
            <li><Link href="/" className="hover:text-primary transition-colors">Phone Repair</Link></li>
            <li><Link href="/" className="hover:text-primary transition-colors">Tablet Repair</Link></li>
            <li><Link href="/" className="hover:text-primary transition-colors">Laptop Repair</Link></li>
            <li><Link href="/" className="hover:text-primary transition-colors">Console Repair</Link></li>
            <li><Link href="/" className="hover:text-primary transition-colors">Free Diagnostics</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-black uppercase tracking-wider mb-5 text-sm">Support</h4>
          <ul className="space-y-3 text-muted-foreground text-sm font-medium">
            <li>
              <Link href="/repair-status" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <Search size={13} className="text-primary" /> Check Repair Status
              </Link>
            </li>
            <li><Link href="/shop#trade" className="hover:text-primary transition-colors">Trade-In</Link></li>
            <li><a href="#warranty" className="hover:text-primary transition-colors">Warranty Policy</a></li>
            <li><Link href="/community" className="hover:text-primary transition-colors">Community</Link></li>
          </ul>
        </div>

        {/* Contact Us */}
        <div>
          <h4 className="font-black uppercase tracking-wider mb-5 text-sm">Contact Us</h4>
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1">Phone</div>
              <a href="tel:+19852282888" className="text-foreground font-black hover:text-primary transition-colors text-base">
                1 (985) 228-2888
              </a>
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1">Email</div>
              <a href="mailto:info@jerseyquikfix.com" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                info@jerseyquikfix.com
              </a>
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1">Walk-In Welcome</div>
              <div className="text-muted-foreground font-medium leading-relaxed">
                No appointment needed for most repairs.
              </div>
            </div>
            <a
              href="tel:+19852282888"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-black px-4 py-2.5 rounded-xl text-xs uppercase hover:brightness-110 transition-all mt-1"
            >
              <Phone size={14} /> Call Now
            </a>
          </div>
        </div>
      </div>

      {/* Warranty callout */}
      <div id="warranty" className="max-w-7xl mx-auto mb-10 bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1">
            <div className="text-xs font-black uppercase tracking-wider text-primary mb-2">Warranty Policy</div>
            <h4 className="font-black text-foreground text-lg mb-2">1-Year Parts &amp; Labor Warranty</h4>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              Every repair at Jersey Quik Fix is covered by our <strong className="text-foreground">1-year warranty</strong> on both parts and labor.
              If the same issue returns within 12 months of your repair, we fix it <strong className="text-foreground">free of charge</strong>.
              Warranty covers manufacturing defects and workmanship — it does not cover new physical damage, liquid damage,
              or issues unrelated to the original repair.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm flex-shrink-0 md:text-right">
            <div className="flex md:justify-end items-center gap-2 text-green-400 font-bold">
              <CheckCircle size={15} /> Parts &amp; labor covered
            </div>
            <div className="flex md:justify-end items-center gap-2 text-green-400 font-bold">
              <CheckCircle size={15} /> Free re-repair if issue returns
            </div>
            <div className="flex md:justify-end items-center gap-2 text-green-400 font-bold">
              <CheckCircle size={15} /> 12 months from repair date
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-medium">
        <p>© {new Date().getFullYear()} Jersey Quik Fix. All rights reserved.</p>
        <div className="flex gap-6 flex-wrap justify-center">
          <a href="#warranty" className="hover:text-foreground transition-colors">Warranty</a>
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          <a href="tel:+19852282888" className="hover:text-foreground transition-colors font-bold text-foreground">1 (985) 228-2888</a>
        </div>
      </div>
    </footer>
  );
}
