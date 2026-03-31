export interface MenuItem {
    _id: string;
    name: string;
    price: number;
    category: string;
    foodType?: string;
    description?: string;
    image?: string;
    isAvailable: boolean;
    offerPrice?: number;
    discountPercentage?: number;
}

export interface CartItem extends MenuItem {
    quantity: number;
}

export interface OrderItem {
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    offerPrice?: number;
}

export interface Order {
    _id: string;
    orderNumber?: string;
    items: OrderItem[];
    totalAmount: number;
    status: 'placed' | 'preparing' | 'served' | 'rejected' | 'cancelled' | 'completed' | 'ready' | 'pending' | 'confirmed';
    paymentMethod?: 'cash' | 'online';
    paymentStatus?: 'PENDING' | 'VERIFIED' | 'FAILED';
    refund?: {
        status: 'none' | 'pending' | 'refunded';
        method?: 'cash' | 'online';
        amount?: number;
        processedAt?: string;
    };
    transactions?: any[];
    rejectionReason?: string;
    cancellationReason?: string;
    createdAt: string;
    updatedAt?: string;
    sessionId: string;
    deviceId: string;
    specialInstructions?: string;
    feedback?: {
        comment?: string;
        rating?: number;
        submittedAt?: string;
    };
}
