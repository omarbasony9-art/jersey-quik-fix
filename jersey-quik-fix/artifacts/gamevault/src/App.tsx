import React, { useEffect, useState } from 'react';
import {
  Router as WouterRouter,
  Route,
  Switch,
  Link,
  useLocation,
} from 'wouter';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Wrench, Menu, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { ClerkProvider, useClerk, useUser } from '@clerk/react';
import { shadcn } from '@clerk/themes';

import ShopPage from './pages/ShopPage';
import RepairPage from './pages/RepairPage';
import CommunityPage from './pages/CommunityPage';
import AdminPage from './pages/AdminPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import RepairStatusPage from './pages/RepairStatusPage';

import jerseyLogo from './assets/jersey-quik-fix-logo.png';
import { SiteDataProvider } from './context/SiteDataContext';

const queryClient = new QueryClient();

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

const clerkPubKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  'pk_test_aW50ZWdyYWwtcHJpbWF0ZS03NS5jbGVyay5hY2NvdW50cy5kZXYk';

function stripBase(path: string): string {
  return base && path.startsWith(base)
    ? path.slice(base.length) || '/'
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: base || '/',
    logoImageUrl: `${window.location.origin}${base}/logo.svg`,
  },
  variables: {
    colorPrimary: '#29a5ee',
    colorForeground: '#f0e8c8',
    colorMutedForeground: '#8fa5c0',
    colorDanger: '#ef4444',
    colorBackground: '#081629',
    colorInput: '#1a2840',
    colorInputForeground: '#f0e8c8',
    colorNeutral: '#1a2840',
    fontFamily: 'Outfit, system-ui, sans-serif',
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox:
      'bg-[#0f1e35] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl border border-[#1a2840]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#f0e8c8] font-black',
    headerSubtitle: 'text-[#8fa5c0]',
    socialButtonsBlockButtonText: 'text-[#f0e8c8] font-bold',
    formFieldLabel: 'text-[#8fa5c0] font-medium',
    footerActionLink: 'text-[#29a5ee] font-bold',
    footerActionText: 'text-[#8fa5c0]',
    dividerText: 'text-[#8fa5c0]',
    identityPreviewEditButton: 'text-[#29a5ee]',
    formFieldSuccessText: 'text-green-400',
    alertText: 'text-[#f0e8c8]',
    logoBox: 'flex justify-center mb-2',
    logoImage: 'h-12 w-auto',
    socialButtonsBlockButton:
      '!bg-[#1a2840] !border-[#243350] hover:!bg-[#243350]',
    formButtonPrimary:
      '!bg-[#29a5ee] hover:!brightness-110 font-black',
    formFieldInput:
      '!bg-[#1a2840] !border-[#243350] !text-[#f0e8c8]',
    footerAction: '!bg-[#081629]',
    dividerLine: '!bg-[#1a2840]',
    alert: '!bg-[#1a2840]',
    otpCodeFieldInput:
      '!bg-[#1a2840] !border-[#243350]',
    formFieldRow: '',
    main: '',
  },
};

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant',
    });
  }, [location]);

  return null;
}

function BackNavigationGuard() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;

      const allowedRoutes = [
        '/',
        '/shop',
        '/community',
        '/repair-status',
        '/sign-in',
        '/sign-up',
        '/admin',
      ];

      const valid =
        allowedRoutes.includes(path) ||
        path.startsWith('/sign-in') ||
        path.startsWith('/sign-up');

      if (!valid) {
        setLocation('/');
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [setLocation]);

  return null;
}

const NAV_LINKS = [
  ['/', 'Repair'],
  ['/shop', 'Shop'],
  ['/community', 'Community'],
  ['/repair-status', 'Track Repair'],
] as const;

function SharedNav() {
  const [location] = useLocation();
  const { user, isLoaded } = useUser();
  const { signOut, openSignIn } = useClerk();
  const [menuOpen, setMenuOpen] = useState(false);

  if (location === '/admin') return null;

  const initial = user
    ? (user.firstName?.[0] || user.emailAddresses?.[0]?.emailAddress?.[0] || '?').toUpperCase()
    : null;

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[64px] w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Open menu"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground sm:hidden"
          >
            <Menu size={20} />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 no-underline flex-shrink-0">
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

          {/* Desktop nav pills */}
          <div className="hidden sm:flex gap-1 rounded-full border border-border bg-card p-1 sm:gap-2">
            {NAV_LINKS.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all sm:text-sm ${
                  location === href
                    ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(41,165,238,0.4)]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Admin wrench — desktop only */}
            <Link
              href="/admin"
              aria-label="Admin"
              title="Admin"
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Wrench size={18} />
            </Link>

            {/* Single auth button */}
            {isLoaded && user ? (
              <button
                onClick={() => signOut({ redirectUrl: base || '/' })}
                title={`Signed in as ${user.firstName || user.emailAddresses[0]?.emailAddress}`}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-black transition-all hover:brightness-110"
              >
                {initial}
              </button>
            ) : (
              <button
                onClick={() => openSignIn({})}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-bold text-foreground transition-all hover:border-primary hover:text-primary"
              >
                <User size={14} />
                Sign in
              </button>
            )}
          </div>

        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 sm:hidden"
              onClick={() => setMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-card border-r border-border flex flex-col sm:hidden shadow-2xl"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <img src={jerseyLogo} alt="Jersey Quik Fix" className="h-8 w-8 rounded-lg object-contain" />
                  <span className="font-black text-sm uppercase tracking-tight">Jersey Quik Fix</span>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Auth row */}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  if (user) {
                    signOut({ redirectUrl: base || '/' });
                  } else {
                    openSignIn({});
                  }
                }}
                className="flex items-center gap-3 px-5 py-4 border-b border-border hover:bg-muted transition-colors text-left"
              >
                {user ? (
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center shrink-0">
                    {initial}
                  </span>
                ) : (
                  <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User size={16} className="text-muted-foreground" />
                  </span>
                )}
                <div>
                  <p className="font-bold text-sm">
                    {user ? (user.firstName || 'My Account') : 'Sign In'}
                  </p>
                  {user && (
                    <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                      {user.emailAddresses?.[0]?.emailAddress}
                    </p>
                  )}
                  {!user && (
                    <p className="text-xs text-muted-foreground">
                      Sign up option inside
                    </p>
                  )}
                </div>
              </button>

              {/* Nav links */}
              <div className="flex-1 overflow-y-auto py-3">
                <p className="px-5 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Navigation
                </p>
                {NAV_LINKS.map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={`block w-full px-5 py-3 font-bold text-sm transition-colors flex items-center justify-between ${
                      location === href
                        ? 'text-primary bg-primary/10'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    {label}
                    {location === href && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                ))}
              </div>

              {/* Admin link at bottom */}
              <div className="border-t border-border p-4">
                <Link
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-muted transition-colors font-bold text-sm"
                >
                  <Wrench size={16} />
                  Admin Panel
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function NotFoundPage() {
  return (
    <main className="flex min-h-[75vh] items-center justify-center px-6">
      <div className="text-center">
        <div className="mb-4 text-6xl font-black text-primary">
          404
        </div>

        <h1 className="mb-3 text-3xl font-black">
          Page not found
        </h1>

        <Link
          href="/"
          className="inline-flex rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  if (!clerkPubKey) {
    console.error(
      'VITE_CLERK_PUBLISHABLE_KEY is missing'
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      appearance={clerkAppearance}
      signInUrl={`${base}/sign-in`}
      signUpUrl={`${base}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: 'Welcome back',
            subtitle:
              'Sign in to your Jersey Quik Fix account',
          },
        },
        signUp: {
          start: {
            title: 'Create your account',
            subtitle:
              'Shop smarter with a Jersey Quik Fix account',
          },
        },
      }}
      routerPush={(to) =>
        setLocation(stripBase(to))
      }
      routerReplace={(to) =>
        setLocation(stripBase(to), {
          replace: true,
        })
      }
    >
      <SiteDataProvider>
        <ScrollToTop />
        <BackNavigationGuard />

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

          <Route path="/repair-status">
            <RepairStatusPage />
          </Route>

          <Route path="/sign-in">
            <SignInPage />
          </Route>

          <Route path="/sign-up">
            <SignUpPage />
          </Route>

          <Route path="/admin">
            <AdminPage />
          </Route>

          <Route>
            <NotFoundPage />
          </Route>
        </Switch>
      </SiteDataProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={base}>
          <ClerkProviderWithRoutes />
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}