// CSS-only loading skeleton — shown during Next.js route navigation
// No JS, no fonts needed — renders immediately from the server.
export default function Loading() {
  return (
    <main
      style={{
        minHeight: '100dvh',
        background: '#FFFBF0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
      }}
      aria-busy="true"
      aria-label="Loading StockStand"
    >
      <span style={{ fontSize: '3.5rem', lineHeight: 1 }} role="img" aria-label="Lemon">
        🍋
      </span>
      <p
        style={{
          fontFamily: 'Nunito, sans-serif',
          fontSize: '1.1rem',
          color: '#6B6B6B',
          margin: 0,
        }}
      >
        Opening your stand…
      </p>
    </main>
  );
}
