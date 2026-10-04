export interface PickupSessionData {
    id: number;
    name: string;
    pickup_date: string;
    starts_at: string;
    ends_at: string;
    queue_prefix: string;
    status: 'scheduled' | 'active' | 'closed';
    status_label?: string;
    formatted_time?: string;
    formatted_date?: string;
}
