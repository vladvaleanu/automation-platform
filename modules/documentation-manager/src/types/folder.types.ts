/**
 * Folder Types
 * Centralized type definitions for folder-related operations
 */

export interface FolderRow {
    id: string;
    name: string;
    description: string | null;
    category_id: string;
    parent_id: string | null;
    icon: string | null;
    order: number;
    created_by: string;
    created_at: Date;
    updated_at: Date;
}

export interface FolderWithCount extends FolderRow {
    document_count: number;
    subfolder_count?: number;
    level?: number;
}

export interface FolderWithChildren extends FolderWithCount {
    children?: FolderWithChildren[];
    category?: {
        id: string;
        name: string;
        icon: string | null;
    };
}

export interface CreateFolderInput {
    name: string;
    description?: string;
    categoryId: string;
    parentId?: string;
    icon?: string;
    order?: number;
}

export interface UpdateFolderInput {
    name?: string;
    description?: string | null;
    parentId?: string | null;
    icon?: string | null;
    order?: number;
}
