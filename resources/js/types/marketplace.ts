export interface MarketplaceCategory {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
}

export interface MarketplaceProduct {
    id: number;
    category_id: number;
    name: string;
    slug: string;
    description: string;
    image_path: string | null;
    image_url?: string | null;
    source_type: 'cooperative' | 'student';
    selling_price: number;
    stock: number;
    stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
    stock_status_label: string;
    is_featured: boolean;
    category: {
        id: number;
        name: string;
        slug: string;
    } | null;
    owner: {
        id: number;
        name: string;
    } | null;
}

export interface PaginatedProducts {
    data: MarketplaceProduct[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}

export interface MarketplaceFilters {
    category: string;
    search: string;
    source: string;
    availability: string;
}
