'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
        Something went wrong!
      </h1>
      <p style={{ marginBottom: '2rem', color: 'var(--color-text-secondary)' }}>
        We encountered an unexpected error. Please try again.
      </p>
      {error.digest && (
        <p style={{ 
          fontSize: '0.875rem', 
          color: 'var(--color-text-muted)', 
          marginBottom: '1rem',
          fontFamily: 'var(--font-mono)',
        }}>
          Error ID: {error.digest}
        </p>
      )}
      <Button
        variant="primary"
        size="lg"
        onClick={() => reset()}
      >
        Try again
      </Button>
    </div>
  );
}
