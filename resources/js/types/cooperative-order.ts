export interface CooperativeOrderItem {
    id: number;
    order_id: number;
    product_id: number | null;
    product_name: string;
    unit_price: number;
    base_price: number;
    cooperative_margin: number;
    quantity: number;
    subtotal: number;
    seller: {
        id: number;
        name: string;
        student_identifier?: string | null;
    } | null;
    product: {
        id: number;
        name: string;
        slug: string;
        image_path?: string | null;
    } | null;
}

export interface CooperativeOrderListItem {
    id: number;
    order_number: string;
    customer: {
        id: number;
        name: string;
        student_identifier?: string | null;
    } | null;
    order_status: string;
    order_status_label: string;
    payment_status: string;
    payment_status_label: string;
    total: number;
    subtotal: number;
    cooperative_margin_total: number;
    queue_number: number | null;
    queue_code: string | null;
    items_count: number;
    total_quantity: number;
    pickup_session: {
        id: number;
        name: string;
        pickup_date: string;
        formatted_time: string;
    } | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface CooperativeOrderDetail {
    id: number;
    order_number: string;
    customer: {
        id: number;
        name: string;
        student_identifier?: string | null;
        email?: string | null;
    } | null;
    order_status: string;
    order_status_label: string;
    payment_status: string;
    payment_status_label: string;
    queue_number: number | null;
    queue_code: string | null;
    subtotal: number;
    cooperative_margin_total: number;
    total: number;
    paid_at: string | null;
    ready_at: string | null;
    completed_at: string | null;
    cancelled_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    pickup_session: {
        id: number;
        name: string;
        pickup_date: string;
        starts_at: string;
        ends_at: string;
        queue_prefix: string;
        status: string;
        status_label: string;
        formatted_time: string;
    } | null;
    pickup_log: {
        id: number;
        verified_at: string;
        verified_by_name: string;
        method: string;
        metadata: Record<string, unknown> | null;
    } | null;
    items: CooperativeOrderItem[];
    payment: {
        id: number;
        provider: string;
        provider_transaction_id: string | null;
        provider_order_id: string | null;
        payment_type: string | null;
        gross_amount: number;
        status: string;
        status_label: string;
        paid_at: string | null;
        created_at: string | null;
    } | null;
}

export interface CooperativeOrderStats {
    total_orders: number;
    pending_payment: number;
    ready_for_pickup: number;
    completed: number;
    total_paid_revenue: number;
}

export interface CooperativeOrderFilters {
    search: string;
    payment_status: string;
    order_status: string;
    pickup_session_id: string;
    date: string;
}
