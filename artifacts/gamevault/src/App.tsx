import React from 'react';
import { Router as WouterRouter, Route, Switch, Link, useLocation } from 'wouter';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Gamepad2 } from 'lucide-react';
import ShopPage from './pages/ShopPage';
import RepairPage from './pages/RepairPage';

const queryClient = new QueryClient();

// Ensure BASE_URL exists and clean trailing slash
const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

function SharedNav() {
  const [location] = useLocation();

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
            <Gamepad2 size={20} strokeWidth={2.5} />
          </div>
          <span className="text-xl font-black tracking-tight uppercase italic text-foreground hidden sm:block">
            GameVault
          </span>
        </Link>

        <div className="flex gap-2 p-1 bg-card border border-border rounded-full">
          <Link 
            href="/" 
            className={`px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider transition-all ${
              location === '/' 
                ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Repair
          </Link>
          <Link 
            href="/shop" 
            className={`px-6 py-2 rounded-full font-bold text-sm uppercase tracking-wider transition-all ${
              location === '/shop' 
                ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Shop
          </Link>
        </div>
        
        <div className="w-[100px] hidden sm:block"></div> {/* Spacer for centering */}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={base}>
          <SharedNav />
          <Switch>
            <Route path="/" component={RepairPage} />
            <Route path="/shop" component={ShopPage} />
            <Route>
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <Gamepad2 size={48} className="text-muted-foreground mb-4 opacity-50" />
                <h1 className="text-3xl font-black uppercase italic">404 - Level Not Found</h1>
                <p className="text-muted-foreground mt-2">The page you're looking for doesn't exist.</p>
                <Link href="/" className="mt-6 text-primary hover:underline font-bold uppercase">Return to Base</Link>
              </div>
            </Route>
          </Switch>
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
