import React from 'react';
import {
  Router as WouterRouter,
  Route,
  Switch,
  Link,
  useLocation,
} from 'wouter';
import {
  QueryClientProvider,
  QueryClient,
} from '@tanstack/react-query';

import { TooltipProvider } from '@/components/ui/tooltip';
import { Wrench, ShieldCheck } from 'lucide-react';

import ShopPage from './pages/ShopPage';
import RepairPage from './pages/RepairPage';
import CommunityPage from './pages/CommunityPage';
import AdminPage from './pages/AdminPage';

import jerseyLogo from './assets/jersey-quik-fix-logo.png';
import { SiteDataProvider } from './context/SiteDataContext';

const queryClient = new QueryClient();

// Clean trailing slash from Vite base URL
const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

/**
 * Scroll to top whenever the route changes.
 */
function ScrollToTop() {
  const [location] = useLocation();

  React.useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }, [location]);

  return null;
}

/**
 * Shared navigation.
 *
 * Admin keeps its own admin layout, so the public navigation
 * is hidden while inside /admin.
 */
function SharedNav() {
  const [location] = useLocation();

  if (location === '/admin') {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[76px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

        {/* Logo / Brand */}
        <Link
          href="/"
          className="flex items-center gap-3 no-underline"
        >
          <img
            src={jerseyLogo}
            alt="Jersey Quik Fix"
            className="h-12 w-12 rounded-xl object-contain"
          />

          <div className="hidden sm:block">
            <div className="text-lg font-black leading-none tracking-tight text-foreground">
              Jersey Quik Fix
            </div>

            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Device Repair & Electronics
            </div>
          </div>
        </Link>

        {/* Main Navigation */}
        <div className="flex gap-1 rounded-full border border-border bg-card p-1 sm:gap-2">

          <Link
            href="/"
            className={`rounded-full px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all sm:px-6 sm:text-sm ${
              location === '/'
                ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(249,115,22,0.6)]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Repair
          </Link>

          <Link
            href="/shop"
            className={`rounded-full px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all sm:px-6 sm:text-sm ${
              location === '/shop'
                ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(249,115,22,0.6)]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Shop
          </Link>

          <Link
            href="/community"
            className={`rounded-full px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all sm:px-6 sm:text-sm ${
              location === '/community'
                ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(249,115,22,0.6)]'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Community
          </Link>

          <Link
            href="/admin"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-all hover:bg-secondary hover:text-foreground sm:px-5 sm:text-sm"
          >
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden md:inline">Admin</span>
          </Link>

        </div>

        {/* Right-side icon */}
        <div className="hidden w-[100px] justify-end sm:flex">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card">
            <Wrench className="h-4 w-4 text-primary" />
          </div>
        </div>

      </div>
    </nav>
  );
}

/**
 * 404 Page
 */
function NotFoundPage() {
  return (
    <main className="flex min-h-[75vh] items-center justify-center px-6">
      <div className="max-w-xl text-center">

        <div className="mb-5 text-6xl font-black text-primary">
          404
        </div>

        <h1 className="mb-3 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Page Not Found
        </h1>

        <p className="mb-8 text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Back to Home
        </Link>

      </div>
    </main>
  );
}

/**
 * Main Application
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SiteDataProvider>

          <WouterRouter base={base}>

            {/* Scroll to top on every page change */}
            <ScrollToTop />

            {/* Shared public navigation */}
            <SharedNav />

            {/* Routes */}
            <Switch>

              <Route path="/">
                <RepairPage />
              </Route>

              <Route path="/shop">
                <ShopPage />
              </Route>

              <Route path="/community">
                <CommunityPage />
              </Route>

              <Route path="/admin">
                <AdminPage />
              </Route>

              {/* Catch-all 404 */}
              <Route>
                <NotFoundPage />
              </Route>

            </Switch>

          </WouterRouter>

        </SiteDataProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}