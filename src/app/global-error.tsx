'use client';

/** Letzte Auffanglinie — ersetzt das komplette Dokument, daher html/body. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="de">
      <body
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          display: 'flex',
          minHeight: '100dvh',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          textAlign: 'center',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Ein Fehler ist aufgetreten</h1>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', opacity: 0.7 }}>
            Bitte lade die App neu.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '1.5rem',
              minHeight: '2.75rem',
              padding: '0 1.25rem',
              borderRadius: '0.75rem',
              border: '1px solid currentColor',
              background: 'transparent',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            Neu laden
          </button>
        </div>
      </body>
    </html>
  );
}
