import type { DefaultSession } from 'next-auth';

// Extend the built-in Session to expose user.id (JWT sub)
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}
