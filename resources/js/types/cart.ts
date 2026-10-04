import type { ProductSourceType } from '@/components/commerce/ProductSourceBadge';

export interface CartProduct {
    id: number;
    name: string;
    slug: string;
    image_path: string | null;
    selling_price: number;
    stock: number;
    status: 'draft' | 'active' | 'inactive' | 'archived';
    source_type: ProductSourceType;
    category?: {
        id: number;
        name: string;
        slug: string;
    } | null;
    owner?: {
        id: number;
        name: string;
    } | null;
}

export interface CartItemData {
    id: number;
    cart_id: number;
    product_id: number;
    quantity: number;
    line_subtotal: number;
    is_available: boolean;
    is_out_of_stock: boolean;
    is_inactive: boolean;
    has_insufficient_stock: boolean;
    max_available_quantity: number;
    product: CartProduct | null;
}

export interface CartData {
    id: number;
    items: CartItemData[];
    total_quantity: number;
    subtotal: number;
    can_checkout: boolean;
    has_unavailable_items: boolean;
}
