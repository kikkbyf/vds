import { getLibrary } from '@/actions/getLibrary';
import LibraryContent from './LibraryContent';

export default async function LibraryPage() {
    const creations = await getLibrary();

    return <LibraryContent creations={creations} />;
}
