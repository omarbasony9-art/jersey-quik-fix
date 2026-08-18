import React, { useEffect } from 'react';
import {
  Router as WouterRouter,
  Route,
  Switch,
  Link,
  useLocation,
} from 'wouter';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Wrench } from 'lucide-react';

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

function SharedNav() {
  const [location] = useLocation();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  if (location === '/admin') return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[76px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

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

        <div className="flex gap-1 rounded-full border border-border bg-card p-1 sm:gap-2">
          {[
            ['/', 'Repair'],
            ['/shop', 'Shop'],
            ['/community', 'Community'],
            ['/repair-status', 'Track Repair'],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={`rounded-full px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all sm:px-4 sm:py-2 sm:text-sm ${
                location === href
                  ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(41,165,238,0.4)]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            aria-label="Open admin"
            title="Admin"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Wrench size={18} />
          </Link>
          {isLoaded && user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-xs text-muted-foreground font-medium">
                Hi,{' '}
                {user.firstName ||
                  user.emailAddresses[0]?.emailAddress?.split('@')[0]}
              </span>

              <button
                onClick={() =>
                  signOut({
                    redirectUrl: base || '/',
                  })
                }
                className="text-xs font-bold text-muted-foreground hover:text-foreground border border-border rounded-full px-3 py-1.5 transition-all hover:border-primary/50"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/sign-in"
                className="text-xs font-bold text-muted-foreground hover:text-foreground border border-border rounded-full px-3 py-1.5 transition-all hover:border-primary/50"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="text-xs font-bold bg-primary text-primary-foreground rounded-full px-3 py-1.5 transition-all hover:brightness-110"
              >
                Sign up
              </Link>
            </div>
          )}

        </div>

      </div>
    </nav>
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