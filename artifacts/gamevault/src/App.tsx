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
import { Wrench, User } from 'lucide-react';
import { useUser, useClerk } from '@clerk/react';

import ShopPage from './pages/ShopPage';
import RepairPage from './pages/RepairPage';
import CommunityPage from './pages/CommunityPage';
import AdminPage from './pages/AdminPage';

import jerseyLogo from './assets/jersey-quik-fix-logo.png';
import { SiteDataProvider } from './context/SiteDataContext';

const queryClient = new QueryClient();

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

/**
 * Scroll to the top whenever the route changes.
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

/** Sign-in / user avatar button — gracefully no-ops if Clerk isn't configured */
function AuthButton() {
  let user: ReturnType<typeof useUser>['user'] = null;
  let openSignIn: (() => void) | null = null;

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const u = useUser();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const clerk = useClerk();
    user = u.user ?? null;
    openSignIn = () => clerk.openSignIn({});
  } catch {
    return null; // ClerkProvider not mounted
  }

  const initial = user
    ? (user.firstName?.[0] || user.emailAddresses?.[0]?.emailAddress?.[0] || '?').toUpperCase()
    : null;

  return (
    <button
      onClick={openSignIn ?? undefined}
      title={user ? `Signed in as ${user.firstName || user.emailAddresses?.[0]?.emailAddress}` : 'Sign in'}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card transition-all hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]"
    >
      {initial ? (
        <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center">
          {initial}
        </span>
      ) : (
        <User className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
}

/**
 * Shared navigation.
 * Hidden completely on the admin page.
 */
function SharedNav() {
  const [location] = useLocation();

  if (location === '/admin') {
    return null;
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[64px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 no-underline"
        >
          <img
            src={jerseyLogo}
            alt="Jersey Quik Fix"
            className="h-10 w-10 rounded-xl object-contain"
          />

          <div className="hidden sm:block">
            <div className="text-base font-black leading-none tracking-tight text-foreground">
              Jersey Quik Fix
            </div>
            <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Device Repair & Electronics
            </div>
          </div>
        </Link>

        {/* Main navigation */}
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
        </div>

        {/* Right side: sign-in + admin wrench */}
        <div className="flex items-center gap-2">
          <AuthButton />
          <Link
            href="/admin"
            aria-label="Open admin"
            title="Admin"
            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card transition-all hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]"
          >
            <Wrench className="h-4 w-4 text-primary" />
          </Link>
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
 * Main application
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SiteDataProvider>

          <WouterRouter base={base}>

            <ScrollToTop />

            <SharedNav />

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