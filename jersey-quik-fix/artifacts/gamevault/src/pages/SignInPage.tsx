import { SignIn } from '@clerk/react';

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

export default function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-16">
      <SignIn
        routing="path"
        path={`${base}/sign-in`}
        signUpUrl={`${base}/sign-up`}
        fallbackRedirectUrl={`${base}/shop`}
        appearance={{
          elements: {
            badge: { color: '#29a5ee' },
          },
        }}
      />
    </div>
  );
}
