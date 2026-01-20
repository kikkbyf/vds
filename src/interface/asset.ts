
export interface StandardAsset {
    id: string;
    src: string;          // URL or Base64 (starts with "data:image/...")
    type: 'image';
    source: 'system_gen' | 'local_upload';
    meta?: {
        prompt?: string;
        width?: number;
        height?: number;
        mimeType?: string;
    };
}

export interface AssetGroup {
    id: string;
    userId: string;
    name: string;
    description?: string;
    assets: StandardAsset[];
    createdAt: string; // Serialized Date
    updatedAt: string;
}
