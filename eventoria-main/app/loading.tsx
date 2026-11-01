import { Spinner } from '@/components/ui/Spinner';

export default function Loading() {
  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem',
      }}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <Spinner size="lg" />
      <p style={{ color: 'var(--color-text-secondary)' }}>
        Loading...
      </p>
    </div>
  );
}
