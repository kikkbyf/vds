import { getLibrary } from '@/actions/getLibrary';
import LibraryContent from './LibraryContent';

export default async function LibraryPage() {
    // 1. Fetch data on the server
    const { creations, isAdmin } = await getLibrary();

    // 2. Pass data to Client Component
    return <LibraryContent creations={creations} isAdmin={isAdmin} />;
}
