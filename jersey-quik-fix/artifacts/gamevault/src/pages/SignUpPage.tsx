import { SignUp } from '@clerk/react';

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

export default function SignUpPage() {
  return (
    <SignUp
      routing="hash"
      signInUrl={`${base}/sign-in`}
    />
  );
}