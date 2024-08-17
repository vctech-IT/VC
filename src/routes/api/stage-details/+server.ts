// /api/stage-details/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/database';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { stage, start, end } = await request.json();

    const dateFilter = {};
    if (start && end) {
      dateFilter.createdAt = {
        gte: new Date(start),
        lte: new Date(end)
      };
    }

    const orders = await db.stage0.findMany({
      where: {
        currentStage: stage,
        ...dateFilter
      },
      select: {
        SONumber: true,
        SOId: true,
        clientName: true,
        Total: true,
        SOCategory: true,
        PMName: true,
        clientExpectedDate: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
    });

    return json({ orders });
  } catch (error) {
    console.error('Error fetching stage details:', error);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};