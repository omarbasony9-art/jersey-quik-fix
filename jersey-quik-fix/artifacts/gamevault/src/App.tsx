import React, { useEffect, useRef } from 'react';
import {
  Router as WouterRouter,
  Route,
  Switch,
  Link,
  useLocation,
  Redirect,
} from 'wouter';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Wrench } from 'lucide-react';

import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
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

// REQUIRED — resolves the key from window.location.hostname so the same build
// serves multiple Clerk custom domains.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — empty in dev (Clerk hits dev FAPI directly), auto-set in prod.
// Do NOT gate on import.meta.env.PROD — the empty dev value is intentional.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return base && path.startsWith(base) ? path.slice(base.length) || '/' : path;
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
    cardBox: 'bg-[#0f1e35] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl border border-[#1a2840]',
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
    socialButtonsBlockButton: '!bg-[#1a2840] !border-[#243350] hover:!bg-[#243350]',
    formButtonPrimary: '!bg-[#29a5ee] hover:!brightness-110 font-black',
    formFieldInput: '!bg-[#1a2840] !border-[#243350] !text-[#f0e8c8]',
    footerAction: '!bg-[#081629]',
    dividerLine: '!bg-[#1a2840]',
    alert: '!bg-[#1a2840]',
    otpCodeFieldInput: '!bg-[#1a2840] !border-[#243350]',
    formFieldRow: '',
    main: '',
  },
};

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location]);
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
        <Link href="/" className="flex items-center gap-3 no-underline">
          <img src={jerseyLogo} alt="Jersey Quik Fix" className="h-12 w-12 rounded-xl object-contain" />
          <div className="hidden sm:block">
            <div className="text-lg font-black leading-none tracking-tight text-foreground">Jersey Quik Fix</div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Device Repair & Electronics</div>
          </div>
        </Link>

        <div className="flex gap-1 rounded-full border border-border bg-card p-1 sm:gap-2">
          {[['/', 'Repair'], ['/shop', 'Shop'], ['/community', 'Community']].map(([href, label]) => (
            <Link key={href} href={href}
              className={`rounded-full px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all sm:px-6 sm:text-sm ${
                location === href ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(41,165,238,0.4)]' : 'text-muted-foreground hover:text-foreground'
              }`}
            >{label}</Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {isLoaded && user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-xs text-muted-foreground font-medium">
                Hi, {user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0]}
              </span>
              <button
                onClick={() => signOut({ redirectUrl: base || '/' })}
                className="text-xs font-bold text-muted-foreground hover:text-foreground border border-border rounded-full px-3 py-1.5 transition-all hover:border-primary/50"
              >Sign out</button>
            </div>
          ) : (
            <Link href="/sign-in"
              className="text-xs font-bold text-muted-foreground hover:text-foreground border border-border rounded-full px-3 py-1.5 transition-all hover:border-primary/50"
            >Sign in</Link>
          )}
          <div className="hidden w-[60px] justify-end sm:flex">
            <Link href="/admin" aria-label="Open admin" title="Admin"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            ><Wrench size={18} /></Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NotFoundPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <h1 className="text-6xl font-black text-primary">404</h1>
      <p className="text-xl text-muted-foreground">Page not found</p>
      <Link href="/" className="rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground hover:brightness-110">Go home</Link>
    </main>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${base}/sign-in`}
      signUpUrl={`${base}/sign-up`}
      localization={{
        signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to your Jersey Quik Fix account' } },
        signUp: { start: { title: 'Create your account', subtitle: 'Shop smarter with a Jersey Quik Fix account' } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SiteDataProvider>
            <ScrollToTop />
            <SharedNav />
            <Switch>
              <Route path="/" component={RepairPage} />
              <Route path="/shop" component={ShopPage} />
              <Route path="/community" component={CommunityPage} />
              <Route path="/admin" component={AdminPage} />
              <Route path="/repair-status" component={RepairStatusPage} />
              <Route path="/sign-in/*?" component={SignInPage} />
              <Route path="/sign-up/*?" component={SignUpPage} />
              <Route component={NotFoundPage} />
            </Switch>
          </SiteDataProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function App() {
  return (
    <WouterRouter base={base}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}
