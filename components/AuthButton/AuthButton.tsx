'use client';

/**
 * COPPA-safe cloud save button.
 *
 * Rendering rules:
 *  - ageTier === 'child' (or null)  →  renders NOTHING (COPPA compliance)
 *  - Not signed in + teen/adult     →  "☁️ Save" button → signIn('google')
 *  - Signed in                      →  "✓ Saved" indicator + sign-out option
 *
 * The Google OAuth flow is NEVER initiated for under-13 users.
 * SessionProvider (parent) loads no external scripts so it's safe for all tiers.
 */
import { useSession, signIn, signOut } from 'next-auth/react';
import type { AgeTier } from '@/types/game';
import styles from './AuthButton.module.css';

interface AuthButtonProps {
  ageTier: AgeTier | null;
}

export default function AuthButton({ ageTier }: AuthButtonProps) {
  const { data: session, status } = useSession();

  // COPPA guard: under-13 never sees this component
  if (!ageTier || ageTier === 'child') return null;

  if (status === 'loading') return null;

  if (session) {
    return (
      <div className={styles.signedIn}>
        {session.user?.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt=""
            className={styles.avatar}
            aria-hidden="true"
          />
        )}
        <button
          className={styles.signOutBtn}
          onClick={() => signOut()}
          title={`Signed in as ${session.user?.email ?? 'unknown'} — click to sign out`}
          aria-label="Sign out"
        >
          ✓ Saved
        </button>
      </div>
    );
  }

  return (
    <button
      className={styles.signInBtn}
      onClick={() => signIn('google')}
      aria-label="Save progress to cloud with Google"
    >
      ☁️ Save
    </button>
  );
}
