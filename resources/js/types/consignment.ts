import type { User } from './auth';

export type ProductSubmissionStatus =
    | 'submitted'
    | 'under_review'
    | 'approved'
    | 'rejected';

export type Category = {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    is_active?: boolean;
    display_order?: number;
};

export type Product = {
    id: number;
    category_id: number;
    owner_id?: number | null;
    name: string;
    slug: string;
    description: string;
    image_path?: string | null;
    source_type: 'cooperative' | 'student';
    base_price: number;
    cooperative_margin: number;
    selling_price: number;
    stock: number;
    status: 'draft' | 'active' | 'inactive' | 'archived';
    is_featured: boolean;
    published_at?: string | null;
    category?: Category;
    owner?: User;
    created_at: string;
    updated_at: string;
};

export type ProductSubmission = {
    id: number;
    student_id: number;
    product_id?: number | null;
    category_id: number;
    name: string;
    description: string;
    image_path: string;
    base_price: number;
    proposed_stock: number;
    cooperative_margin?: number | null;
    proposed_selling_price?: number | null;
    status: ProductSubmissionStatus;
    rejection_reason?: string | null;
    reviewed_by?: number | null;
    reviewed_at?: string | null;
    created_at: string;
    updated_at: string;
    student?: User;
    category?: Category;
    product?: Product;
    reviewer?: {
        id: number;
        name: string;
    };
};
