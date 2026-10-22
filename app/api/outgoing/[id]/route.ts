import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const item = await prisma.outgoingTransaction.update({
      where: { id: params.id },
      data: {
        date: new Date(body.date),
        seller: body.seller,
        orderNo: body.orderNo || '',
        invoiceNo: body.invoiceNo || '',
        description: body.description,
        amount: parseFloat(body.amount) || 0,
        paymentType: body.paymentType,
        notes: body.notes || '',
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update outgoing transaction' }, { status: 500 });
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
