import { Order } from '@/lib/types';

interface BillPrinterProps {
    order: Order | null;
}

export default function BillPrinter({ order }: BillPrinterProps) {
    if (!order) return null;

    return (
        <div className="print-only p-4 w-[80mm] mx-auto text-black font-mono text-sm">
            <div className="text-center mb-4">
                <h2 className="text-xl font-bold uppercase">FoodShop</h2>
                <p>123 Kitchen Street, City</p>
                <p>Tel: 012-3456789</p>
            </div>

            <div className="border-b-2 border-dashed border-black my-2" />

            <div className="flex justify-between font-bold">
                <span>Order #:</span>
                <span>{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
                <span>Payment:</span>
                <span>{order.paymentMethod}</span>
            </div>

            <div className="border-b-2 border-dashed border-black my-2" />

            <div className="space-y-1">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                        <span>{item.name} x{item.quantity}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
            </div>

            <div className="border-b-2 border-dashed border-black my-2" />

            <div className="flex justify-between text-lg font-bold">
                <span>TOTAL:</span>
                <span>${order.total.toFixed(2)}</span>
            </div>

            <div className="text-center mt-6 pt-4 border-t border-black">
                <p className="font-bold">THANK YOU!</p>
                <p>Please come again</p>
                {/* Simple barcode simulation */}
                <div className="mt-2 h-8 bg-black w-full" />
                <p className="text-[8px] mt-1">{order.id}</p>
            </div>
        </div>
    );
}
