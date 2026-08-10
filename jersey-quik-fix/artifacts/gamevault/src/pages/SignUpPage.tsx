import { SignUp } from '@clerk/react';

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

export default function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-16">
      <SignUp
        routing="path"
        path={`${base}/sign-up`}
        signInUrl={`${base}/sign-in`}
        fallbackRedirectUrl={`${base}/shop`}
      />
    </div>
  );
}
