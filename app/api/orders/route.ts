import { NextResponse } from 'next/server';
import { getOrders, saveOrder } from '@/lib/db';
import { Order } from '@/lib/types';

export async function GET() {
    const orders = getOrders();
    return NextResponse.json(orders);
}

export async function POST(request: Request) {
    const orderData = await request.json();
    const orders = getOrders();

    const newOrder: Order = {
        ...orderData,
        id: Math.random().toString(36).substr(2, 9),
        orderNumber: (orders.length + 101).toString(),
        status: 'PENDING',
        createdAt: new Date().toISOString(),
    };

    saveOrder(newOrder);
    return NextResponse.json(newOrder);
}
