export type StockStatusType = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface InventoryMovementItem {
    id: number;
    type: 'restock' | 'sale' | 'restore' | 'adjustment' | (string & {});
    type_label: string;
    quantity: number;
    reference_type: string | null;
    reference_id: number | null;
    reason: string | null;
    created_by: number | null;
    creator_name: string;
    created_at: string;
}

export interface InventoryProductItem {
    id: number;
    name: string;
    slug: string;
    image_path: string | null;
    source_type: 'cooperative' | 'student';
    stock: number;
    stock_status: StockStatusType;
    stock_status_label: string;
    selling_price: number;
    base_price: number;
    cooperative_margin: number;
    status: string;
    category: {
        id: number;
        name: string;
        slug: string;
    } | null;
    owner: {
        id: number;
        name: string;
        student_identifier?: string | null;
    } | null;
    latest_movement: {
        id: number;
        type: string;
        type_label: string;
        quantity: number;
        reason: string | null;
        created_at: string | null;
        creator_name: string | null;
    } | null;
    updated_at: string | null;
}

export interface InventoryProductDetail extends InventoryProductItem {
    description: string;
    created_at: string;
}

export interface InventoryStats {
    total_products: number;
    in_stock: number;
    low_stock: number;
    out_of_stock: number;
    total_units: number;
}

export interface InventoryFilterParams {
    source: string;
    category: string;
    stock_status: string;
    search: string;
}
