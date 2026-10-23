import { NextRequest, NextResponse } from 'next/server';
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


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taxYearId, date, seller, orderNo, invoiceNo, description, amount, paymentType, notes, documentUrl } = body;

    const record = await prisma.outgoingTransaction.create({
      data: {
        taxYearId,
        date: new Date(date),
        seller,
        orderNo: orderNo || null,
        invoiceNo: invoiceNo || null,
        description,
        amount: parseFloat(amount) || 0,
        paymentType,
        notes: notes || null,
        documentUrl: documentUrl || null,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Failed to create outgoing transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

