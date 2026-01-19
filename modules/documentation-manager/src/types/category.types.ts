/**
 * Category Types
 * Centralized type definitions for category-related operations
 */

export interface CategoryRow {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    order: number;
    created_at: Date;
    updated_at: Date;
}

export interface CategoryWithCount extends CategoryRow {
    document_count: number;
    folder_count?: number;
}

export interface CreateCategoryInput {
    name: string;
    description?: string;
    icon?: string;
    order?: number;
}

export interface UpdateCategoryInput {
    name?: string;
    description?: string | null;
    icon?: string | null;
    order?: number;
}
