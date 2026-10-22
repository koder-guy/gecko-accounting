import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taxYearId = searchParams.get('taxYearId');
    
    const items = await prisma.incomingTransaction.findMany({
      where: taxYearId ? { taxYearId } : undefined,
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch incoming transactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await prisma.incomingTransaction.create({
      data: {
        date: new Date(body.date),
        source: body.source,
        description: body.description,
        cardAmount: parseFloat(body.cardAmount) || 0,
        cashAmount: parseFloat(body.cashAmount) || 0,
        notes: body.notes || '',
        taxYearId: body.taxYearId,
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create incoming transaction' }, { status: 500 });
  }
}
