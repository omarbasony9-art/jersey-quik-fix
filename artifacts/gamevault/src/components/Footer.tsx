import React from 'react';
import { Gamepad2, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-border pt-16 pb-8 px-6 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        <div className="col-span-1 md:col-span-2">
          <a href="#" className="flex items-center gap-2 mb-6 group inline-flex">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
              <Gamepad2 size={24} strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-black tracking-tight uppercase italic text-foreground group-hover:text-primary transition-colors">
              GameVault
            </span>
          </a>
          <p className="text-muted-foreground font-medium max-w-sm mb-6 leading-relaxed">
            Your neighborhood gaming hub, leveled up for the digital age. We buy, sell, and live games.
          </p>
          <div className="flex items-center gap-2 text-sm font-bold text-foreground">
            <MapPin size={18} className="text-primary" />
            Find a store near you
          </div>
        </div>
        
        <div>
          <h4 className="font-black uppercase tracking-wider mb-6">Shop</h4>
          <ul className="space-y-4 text-muted-foreground font-medium">
            <li><a href="#" className="hover:text-primary transition-colors">New Releases</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Pre-Owned Games</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Consoles & Hardware</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Gift Cards</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-black uppercase tracking-wider mb-6">Support</h4>
          <ul className="space-y-4 text-muted-foreground font-medium">
            <li><a href="#" className="hover:text-primary transition-colors">Order Status</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Returns Policy</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Trade-In Guidelines</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-medium">
        <p>&copy; {new Date().getFullYear()} GameVault Inc. All rights reserved. (Mock Data)</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Accessibility</a>
        </div>
      </div>
    </footer>
  );
}
