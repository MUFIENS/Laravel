import type { PickupSessionData } from './pickup-session';

export interface OrderItemData {
    id: number;
    order_id: number;
    product_id: number | null;
    seller_id: number | null;
    product_name: string;
    unit_price: number;
    quantity: number;
    subtotal: number;
}

export interface OrderData {
    id: number;
    order_number: string;
    pickup_session_id: number | null;
    subtotal: number;
    cooperative_margin_total?: number;
    total: number;
    order_status: string;
    order_status_label: string;
    payment_status: string;
    payment_status_label: string;
    queue_number: number | null;
    queue_code: string | null;
    pickup_token_hash: string | null;
    pickup_credential?: string | null;
    qr_payload?: string | null;
    payment_token?: string | null;
    payment_qr_payload?: string | null;
    payment_method?: string;
    payment_method_label?: string;
    paid_at: string | null;
    ready_at: string | null;
    completed_at: string | null;
    cancelled_at: string | null;
    created_at: string;
    formatted_created_at?: string;
    pickup_session?: PickupSessionData | null;
    pickup_log?: {
        verified_at: string;
        method: string;
    } | null;
    items?: OrderItemData[];
    items_count?: number;
    total_quantity?: number;
}
