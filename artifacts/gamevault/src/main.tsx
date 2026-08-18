import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import { dark } from '@clerk/themes';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

// ── Site design tokens (matches index.css :root) ──────────────────────────────
const navy       = 'hsl(220, 58%, 9%)';   // --background
const navyCard   = 'hsl(220, 52%, 13%)';  // --card
const navyMuted  = 'hsl(220, 35%, 20%)';  // --muted
const navyBorder = 'hsl(220, 35%, 18%)';  // --border
const blue       = 'hsl(207, 90%, 54%)';  // --primary
const cream      = 'hsl(44, 60%, 92%)';   // --foreground
const mutedText  = 'hsl(220, 20%, 60%)';  // --muted-foreground

createRoot(document.getElementById('root')!, {
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    {publishableKey ? (
      <ClerkProvider
        publishableKey={publishableKey}

        // ── Override the "Vibe Tribe" app name text ──────────────────────────
        localization={{
          signIn: {
            start: {
              title: 'Sign in to Jersey Quik Fix',
              subtitle: 'Welcome back — great to see you again.',
              actionText: "Don't have an account?",
            },
          },
          signUp: {
            start: {
              title: 'Join Jersey Quik Fix',
              subtitle: 'Create your account to get started.',
              actionText: 'Already have an account?',
            },
          },
        } as any}

        // ── Theme to match the site ──────────────────────────────────────────
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary:        blue,
            colorBackground:     navy,
            colorInputBackground: navyCard,
            colorInputText:      cream,
            colorText:           cream,
            colorTextSecondary:  mutedText,
            colorNeutral:        navyMuted,
            borderRadius:        '0.75rem',
            fontFamily:          "'Outfit', sans-serif",
            fontFamilyButtons:   "'Outfit', sans-serif",
            fontWeight: {
              normal: 500,
              medium: 600,
              bold:   900,
            } as any,
          },
          elements: {
            // Modal card
            card: {
              backgroundColor: navyCard,
              border:          `1px solid ${navyBorder}`,
              boxShadow:       '0 25px 60px rgba(0,0,0,0.8)',
              borderRadius:    '1.5rem',
              padding:         '2rem',
            },
            // Header
            headerTitle: {
              fontWeight: '900',
              fontSize:   '1.25rem',
              color:      cream,
            },
            headerSubtitle: {
              color: mutedText,
            },
            // Divider "or"
            dividerLine:  { backgroundColor: navyBorder },
            dividerText:  { color: mutedText },
            // Social buttons (e.g. Continue with Google)
            socialButtonsBlockButton: {
              backgroundColor: navyMuted,
              border:          `1px solid ${navyBorder}`,
              color:           cream,
            },
            socialButtonsBlockButtonText: {
              color:      cream,
              fontWeight: '700',
            },
            // Form fields
            formFieldLabel:  { color: cream, fontWeight: '600' },
            formFieldInput: {
              backgroundColor: navyMuted,
              border:          `1px solid ${navyBorder}`,
              color:           cream,
              borderRadius:    '0.75rem',
            },
            // Primary action button
            formButtonPrimary: {
              backgroundColor: blue,
              fontWeight:      '800',
              letterSpacing:   '0.05em',
              textTransform:   'uppercase',
            },
            // Footer
            footer:              { background: navy },
            footerActionText:    { color: mutedText },
            footerActionLink:    { color: blue, fontWeight: '700' },
            // Close button
            modalCloseButton: { color: mutedText },
            // Internal links
            identityPreviewEditButton: { color: blue },
            formResendCodeLink:        { color: blue },
          },
        }}
      >
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </ErrorBoundary>,
);
