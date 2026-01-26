import { NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/db';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { status } = await request.json();
    const updatedOrder = await updateOrderStatus(id, status);

    if (updatedOrder) {
        return NextResponse.json(updatedOrder);
    }
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
}
