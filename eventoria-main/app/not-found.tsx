import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
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
      <h1 style={{ 
        fontSize: '6rem', 
        fontWeight: 800, 
        color: 'var(--color-accent)',
        margin: 0,
        lineHeight: 1,
      }}>
        404
      </h1>
      <h2 style={{ 
        fontSize: '2rem', 
        fontWeight: 700, 
        marginTop: '1rem',
        marginBottom: '0.5rem',
      }}>
        Page Not Found
      </h2>
      <p style={{ 
        marginBottom: '2rem', 
        color: 'var(--color-text-secondary)',
        maxWidth: '500px',
      }}>
        The page you're looking for doesn't exist or has been moved. 
        Let's get you back to planning amazing celebrations!
      </p>
      <Link href="/">
        <Button variant="primary" size="lg">
          Return Home
        </Button>
      </Link>
    </div>
  );
}
