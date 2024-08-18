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
        createdAt: true,
        stageHistory: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
    });

  const processedOrders = orders.map(order => ({
  ...order,
  ageInHours: order.stageHistory[0] 
    ? Math.round((new Date().getTime() - new Date(order.stageHistory[0].timestamp).getTime()) / (60 * 60 * 1000))
    : 0,
  lastUpdated: order.stageHistory[0] ? order.stageHistory[0].timestamp : null
}));

    return json({ orders: processedOrders });
  } catch (error) {
    console.error('Error fetching stage details:', error);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};