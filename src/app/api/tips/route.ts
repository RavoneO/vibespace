
import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';
import { processTip } from '@/services/paymentService.server';
import { Tip } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { fromUserId, toUserId, postId, amount } = await request.json();

    if (!fromUserId || !toUserId || !postId || !amount) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const transactionId = await processTip(fromUserId, toUserId, amount);

    const tip: Omit<Tip, 'id'> = {
      fromUserId,
      toUserId,
      postId,
      amount,
      timestamp: Date.now(),
    };

    const tipRef = await firestore.collection('tips').add(tip);

    return NextResponse.json({ success: true, transactionId, tipId: tipRef.id });
  } catch (error) {
    console.error("Error processing tip:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
