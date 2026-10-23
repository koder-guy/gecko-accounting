import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { taxYearId, date, seller, orderNo, invoiceNo, description, amount, paymentType, notes, documentUrl } = body;

    const updated = await prisma.outgoingTransaction.update({
      where: { id },
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
        documentUrl: documentUrl || null, // <--- Crucial
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update outgoing transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.outgoingTransaction.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete outgoing transaction' }, { status: 500 });
  }
}
