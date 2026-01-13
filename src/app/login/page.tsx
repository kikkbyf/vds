'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Simple client-side cookie set (for MVP) or API call
        // A real app would use an API route to set HttpOnly cookie.
        // For simplicity, we'll try setting a cookie via an API route to be cleaner.

        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });

        if (res.ok) {
            router.refresh(); // Refresh middleware
            router.push('/');
        } else {
            setError('Incorrect Password');
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
                <h1 style={{ textAlign: 'center' }}>VDS Access</h1>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password"
                    style={{ padding: '10px', borderRadius: '4px', border: 'none' }}
                />
                <button type="submit" style={{ padding: '10px', background: '#333', color: 'white', border: '1px solid #555', cursor: 'pointer' }}>
                    Enter Studio
                </button>
                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
            </form>
        </div>
    );
}
