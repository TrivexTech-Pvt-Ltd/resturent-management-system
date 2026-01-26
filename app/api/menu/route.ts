import { NextResponse } from 'next/server';
import { getMenu } from '@/lib/db';

export async function GET() {
    const menu = await getMenu();
    return NextResponse.json(menu);
}
