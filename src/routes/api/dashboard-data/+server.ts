import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/database';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { start, end } = await request.json();

    type DateFilter = {
      createdAt?: {
        gte?: Date;
        lte?: Date;
      };
    };

    const dateFilter: DateFilter = {};
    if (start && end) {
      dateFilter.createdAt = {
        gte: new Date(start),
        lte: new Date(end)
      };
    }

    const [
      totalOrders,
      totalRevenue,
      activeInstallations,
      activeServices,
      orderCategories,
      recentOrders,
      ordersByStage,
      topCustomers,
      installationDetails,
      serviceDetails
    ] = await Promise.all([
      db.stage0.count({ where: dateFilter }),
      db.stage0.aggregate({
        _sum: { Total: true },
        where: dateFilter
      }),
      db.installation.count({
        where: {
          ...dateFilter,
          InstReport: { not: null }
        }
      }),
      db.service.count({
        where: {
          ...dateFilter,
          ServiceReport: { not: null }
        }
      }),
      db.stage0.groupBy({
        by: ['SOCategory'],
        _count: true,
        where: dateFilter
      }),
      db.stage0.findMany({
        where: dateFilter,
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          SONumber: true,
          SOId: true,
          clientName: true,
          Total: true,
          currentStage: true,
          createdAt: true
        }
      }),
      db.stage0.groupBy({
        by: ['currentStage'],
        _count: true,
        where: dateFilter
      }),
      db.stage0.groupBy({
        by: ['clientName'],
        _count: { SONumber: true },
        _sum: { Total: true },
        orderBy: [{ _sum: { Total: 'desc' } }],
        where: dateFilter
      }),
      // Installation details
      db.installation.findMany({
        where: {
          ...dateFilter,
          InstReport: { not: null }
        },
        select: {
          SONumber: true,
          engName: true,
          ScheduleDate: true,
          VendorName: true,
          SONo: {
            select: {
              SOId: true,
              clientName: true,
              SOCategory: true,
              Total: true
            }
          }
        }
      }),
      // Service details
      db.service.findMany({
        where: {
          ...dateFilter,
          ServiceReport: { not: null }
        },
        select: {
          SONumber: true,
          engName: true,
          ScheduleDate: true,
          VendorName: true,
          SONo: {
            select: {
              SOId: true,
              clientName: true,
              SOCategory: true,
              Total: true
            }
          }
        }
      })
    ]);

    return json({
      totalOrders,
      totalRevenue: totalRevenue._sum.Total || 0,
      activeInstallations,
      activeServices,
      orderCategories: orderCategories.map(c => ({
        category: c.SOCategory,
        count: c._count,
      })),
      recentOrders,
      ordersByStage: ordersByStage.map(s => ({
        stage: s.currentStage,
        count: s._count,
      })),
      topCustomers: topCustomers.map(c => ({
        name: c.clientName,
        totalOrders: c._count.SONumber,
        totalRevenue: c._sum.Total || 0,
      })),
      installationDetails: installationDetails.map(i => ({
        SONumber: i.SONumber,
        SOId: i.SONo.SOId,
        clientName: i.SONo.clientName,
        category: i.SONo.SOCategory,
        cost: i.SONo.Total,
        engName: i.engName,
        scheduleDate: i.ScheduleDate,
        vendorName: i.VendorName
      })),
      serviceDetails: serviceDetails.map(s => ({
        SONumber: s.SONumber,
        SOId: s.SONo.SOId,
        clientName: s.SONo.clientName,
        category: s.SONo.SOCategory,
        cost: s.SONo.Total,
        engName: s.engName,
        scheduleDate: s.ScheduleDate,
        vendorName: s.VendorName
      }))
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  }
};