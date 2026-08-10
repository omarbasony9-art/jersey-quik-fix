import React from 'react';
import { Wrench, MapPin } from 'lucide-react';
import jerseyLogo from '../assets/jersey-quik-fix-logo.png';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-border pt-16 pb-8 px-6 mt-auto">
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
