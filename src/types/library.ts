import type { Creation, User } from '@prisma/client';

export type LibraryCreationType = 'extraction' | 'digital_human' | 'standard';

export type LibraryCreationUser = Pick<User, 'name' | 'email' | 'image'>;

type FullCreationBase = Pick<
    Creation,
    | 'id'
    | 'userId'
    | 'prompt'
    | 'negative'
    | 'aspectRatio'
    | 'imageSize'
    | 'shotPreset'
    | 'lightingPreset'
    | 'focalLength'
    | 'guidance'
    | 'inputImageUrls'
    | 'outputImageUrl'
    | 'status'
    | 'createdAt'
    | 'visible'
    | 'deletedAt'
>;

export interface FullCreation extends FullCreationBase {
    sessionId?: string;
    creationType?: LibraryCreationType;
    user?: LibraryCreationUser | null;
}
