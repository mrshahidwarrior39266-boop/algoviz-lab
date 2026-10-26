import { SignInCard } from '@/components/SignInCard';

export const metadata = {
  title: 'Sign in',
  description: 'Sign in to AlgoViz with Google.',
};

export const dynamic = 'force-dynamic';

export default function SignInPage() {
  const configured = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.NEXTAUTH_SECRET,
  );

  const baseUrl =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  return (
    <main className="signin-page" id="main-content">
      <SignInCard configured={configured} callbackUrl={`${baseUrl}/api/auth/callback/google`} />
    </main>
  );
}
