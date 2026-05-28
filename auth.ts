/**
 * Auth.js v5 (next-auth@5) configuration.
 *
 * Strategy: JWT (no DB adapter for auth sessions — we manage user records
 * ourselves in game_users with only a sha256(sub) key, never raw profile data).
 *
 * COPPA: the OAuth flow is only reachable by teen/adult users.
 * Under-13 never sees the sign-in button (enforced in AuthButton component).
 */
import NextAuth from 'next-auth';
import Google   from 'next-auth/providers/google';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId:     process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],

  // JWT strategy — no third-party tables; we own all persistent state
  session: { strategy: 'jwt' },

  callbacks: {
    session({ session, token }) {
      // Expose the JWT sub as session.user.id so API routes can hash it
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
