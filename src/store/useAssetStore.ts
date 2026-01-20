
import { create } from 'zustand';
import { AssetGroup, StandardAsset } from '@/interface/asset';
import { v4 as uuidv4 } from 'uuid';

interface AssetStore {
    groups: AssetGroup[];
    activeGroupId: string | null;
    isDrawerOpen: boolean;

    // Actions
    toggleDrawer: (open?: boolean) => void;
    setActiveGroup: (id: string | null) => void;

    fetchGroups: () => Promise<void>;
    createGroup: (name: string) => Promise<void>;
    deleteGroup: (id: string) => Promise<void>;

    // Asset Operations
    addSystemAsset: (groupId: string, imageUrl: string, prompt?: string) => Promise<void>;
    uploadLocalAsset: (groupId: string, base64: string) => Promise<void>;
    removeAsset: (groupId: string, assetId: string) => Promise<void>;
}

export const useAssetStore = create<AssetStore>((set, get) => ({
    groups: [],
    activeGroupId: null,
    isDrawerOpen: false,

    toggleDrawer: (open) => set((state) => ({ isDrawerOpen: open ?? !state.isDrawerOpen })),

    setActiveGroup: (id) => set({ activeGroupId: id }),

    fetchGroups: async () => {
        try {
            const res = await fetch('/api/asset-group');
            if (res.ok) {
                const groups = await res.json();
                set({ groups });
            }
        } catch (error) {
            console.error('Failed to fetch asset groups', error);
        }
    },

    createGroup: async (name) => {
        try {
            const res = await fetch('/api/asset-group', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (res.ok) {
                const newGroup = await res.json();
                set((state) => ({
                    groups: [newGroup, ...state.groups],
                    activeGroupId: newGroup.id
                }));
            }
        } catch (error) {
            console.error('Failed to create group', error);
        }
    },

    deleteGroup: async (id) => {
        try {
            await fetch(`/api/asset-group/${id}`, { method: 'DELETE' });
            set((state) => ({
                groups: state.groups.filter(g => g.id !== id),
                activeGroupId: state.activeGroupId === id ? null : state.activeGroupId,
            }));
        } catch (error) {
            console.error('Failed to delete group', error);
        }
    },

    addSystemAsset: async (groupId, imageUrl, prompt) => {
        const { groups } = get();
        const groupIndex = groups.findIndex(g => g.id === groupId);
        if (groupIndex === -1) return;

        const newAsset: StandardAsset = {
            id: uuidv4(),
            type: 'image',
            source: 'system_gen',
            src: imageUrl,
            meta: { prompt }
        };

        const updatedGroup = { ...groups[groupIndex] };
        updatedGroup.assets = [newAsset, ...updatedGroup.assets];

        // Optimistic Update
        const newGroups = [...groups];
        newGroups[groupIndex] = updatedGroup;
        set({ groups: newGroups });

        // Sync to Backend
        try {
            await fetch(`/api/asset-group/${groupId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assets: updatedGroup.assets }),
            });
        } catch (error) {
            console.error('Failed to add system asset', error);
            // Revert on failure (omitted for MVP)
        }
    },

    uploadLocalAsset: async (groupId, base64) => {
        const { groups } = get();
        const groupIndex = groups.findIndex(g => g.id === groupId);
        if (groupIndex === -1) return;

        const newAsset: StandardAsset = {
            id: uuidv4(),
            type: 'image',
            source: 'local_upload',
            src: base64,
            meta: { mimeType: 'image/png' } // Assume generic for now
        };

        const updatedGroup = { ...groups[groupIndex] };
        updatedGroup.assets = [newAsset, ...updatedGroup.assets];

        // Optimistic Update
        const newGroups = [...groups];
        newGroups[groupIndex] = updatedGroup;
        set({ groups: newGroups });

        // Sync to Backend
        try {
            await fetch(`/api/asset-group/${groupId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assets: updatedGroup.assets }),
            });
        } catch (error) {
            console.error('Failed to upload local asset', error);
        }
    },

    removeAsset: async (groupId, assetId) => {
        const { groups } = get();
        const groupIndex = groups.findIndex(g => g.id === groupId);
        if (groupIndex === -1) return;

        const updatedGroup = { ...groups[groupIndex] };
        updatedGroup.assets = updatedGroup.assets.filter(a => a.id !== assetId);

        // Optimistic Update
        const newGroups = [...groups];
        newGroups[groupIndex] = updatedGroup;
        set({ groups: newGroups });

        // Sync to Backend
        try {
            await fetch(`/api/asset-group/${groupId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assets: updatedGroup.assets }),
            });
        } catch (error) {
            console.error('Failed to remove asset', error);
        }
    },
}));
