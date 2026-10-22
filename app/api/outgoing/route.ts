import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taxYearId = searchParams.get('taxYearId');
    
    const items = await prisma.outgoingTransaction.findMany({
      where: taxYearId ? { taxYearId } : undefined,
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch outgoing transactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const item = await prisma.outgoingTransaction.create({
      data: {
        date: new Date(body.date),
        seller: body.seller,
        orderNo: body.orderNo || '',
        invoiceNo: body.invoiceNo || '',
        description: body.description,
        amount: parseFloat(body.amount) || 0,
        paymentType: body.paymentType,
        notes: body.notes || '',
        taxYearId: body.taxYearId,
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create outgoing transaction' }, { status: 500 });
  }
}
