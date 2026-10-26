import NextAuthImport from 'next-auth';
import GoogleProviderImport from 'next-auth/providers/google';

// This package is ESM (`"type": "module"`), so Node exposes next-auth's CJS
// default as a module object. Unwrap it once for both the bundler and Node.
const NextAuth = NextAuthImport?.default ?? NextAuthImport;
const GoogleProvider = GoogleProviderImport?.default ?? GoogleProviderImport;

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          prompt: 'select_account',
          scope: 'openid email profile',
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 30,
  },
  pages: {
    signIn: '/signin',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
