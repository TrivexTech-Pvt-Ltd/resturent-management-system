import { NextResponse } from 'next/server';
import { getOrders, saveOrder } from '@/lib/db';
import { Order } from '@/lib/types';

export async function GET() {
    const orders = await getOrders();
    return NextResponse.json(orders);
}

export async function POST(request: Request) {
    try {
        const orderData = await request.json();
        const savedOrder = await saveOrder(orderData);
        return NextResponse.json(savedOrder);
    } catch (error: any) {
        console.error('API Route Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
