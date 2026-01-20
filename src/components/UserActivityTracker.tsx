'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

export default function UserActivityTracker() {
    const { status } = useSession();
    // Use a ref to prevent double-firing in React strict mode or rapid re-mounts
    const handledRef = useRef(false);

    useEffect(() => {
        if (status === 'authenticated' && !handledRef.current) {
            handledRef.current = true;
            // Fire heartbeat once on mount (page load / refresh)
            fetch('/api/user/heartbeat', { method: 'POST' }).catch(err =>
                console.error('Failed to send heartbeat', err)
            );
        }
    }, [status]);

    return null;
}
