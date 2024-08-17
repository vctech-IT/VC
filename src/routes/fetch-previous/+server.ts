//fetch-previous/+server.ts
import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import type { SalesOrder } from '$lib/types';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export async function POST({ request }) {
  const { currentStage, salesOrder } = await request.json();

  try {
    const previousStagesData = await fetchPreviousStagesData(currentStage, salesOrder);
    return json({ success: true, previousStagesData });
  } catch (error) {
    console.error('Error fetching previous stages data:', error);
    return json({ success: false, message: 'Error fetching previous stages data' }, { status: 500 });
  }
}

async function fetchPreviousStagesData(currentStage: number, salesOrder: SalesOrder) {
  const data: any = {};
  let SONo = salesOrder.salesorder_number;

  for (let stage = 0; stage < currentStage; stage++) {
    let stage0Data;
    switch (stage) {
      case 0:
        stage0Data = await prisma.stage0.findFirst({
          where: { SONumber: SONo },
          orderBy: { createdAt: 'desc' }
        });
        if (stage0Data) data.stage0 = stage0Data;
        break;
      case 1:
        if (data.stage0) {
          const lineItems = await prisma.lineItems.findMany({
            where: { SONumber: data.stage0.SONumber }
          });
          const dcBoxes = await prisma.stage1.findMany({
            where: { SONumber: data.stage0.SONumber }
          });
          data.stage1 = { lineItems, dcBoxes };
        }
        break;
      case 2:
        // Fetch stage 2 data if needed
        break;
      case 3:
        if (data.stage1) {
          const installation = await prisma.installation.findFirst({
            where: { SONumber: data.stage0.SONumber }
          });
          const service = await prisma.service.findFirst({
            where: { SONumber: data.stage0.SONumber }
          });
          data.stage3 = { installation, service };
        }
        break;
      case 4:
        if (data.stage3) {
          const stage4Data = await prisma.stage4.findFirst({
            where: { SONumber: data.stage0.SONumber }
          });
          data.stage4 = stage4Data;
        }
        break;
    }
  }

  return data;
}