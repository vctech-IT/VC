import { PrismaClient } from '@prisma/client';
import { json } from '@sveltejs/kit';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

const MAX_CELL_LENGTH = 32700; // Slightly less than the max to be safe

function truncateData(data: any[]): any[] {
  return data.map(item => {
    const truncatedItem: any = {};
    for (const [key, value] of Object.entries(item)) {
      if (typeof value === 'string' && value.length > MAX_CELL_LENGTH) {
        truncatedItem[key] = value.substring(0, MAX_CELL_LENGTH) + '... (truncated)';
      } else {
        truncatedItem[key] = value;
      }
    }
    return truncatedItem;
  });
}

export async function GET() {
  try {
    // Fetch data from all tables, excluding specific fields
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        phoneNo: true,
        isApproved: true,
        userAuthToken: true,
        otp: true,
        otpExpires: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        roleId: true
      }
    });
    const roles = await prisma.roles.findMany();
    const stage0 = await prisma.stage0.findMany();
    const stage1 = await prisma.stage1.findMany({
      select: {
        DCid: true,
        SONumber: true,
        DCNumber: true,
        status: true,
        PODNo: true,
        DispatchDate: true,
        EstdDeliveryDate: true,
        dcAmount: true,
        isSaved: true,
        fileName: true,
        billType: true,
        isTypeSet: true,
        submittedOn: true,
        // Excluded: attachment, filePreviewUrl
      }
    });
    const lineItems = await prisma.lineItems.findMany({
      select: {
        Itemid: true,
        SONumber: true,
        name: true,
        quantity: true,
        unit: true,
        rate: true,
        amount: true,
        status: true,
        isAvailabilityFrozen: true,
        needToPurchaseLocally: true,
        isAvailable: true,
        serialNo: true,
        invoiceNo: true,
        // Excluded: invoiceattachment
      }
    });
    const installation = await prisma.installation.findMany({
      select: {
        SONumber: true,
        engName: true,
        ScheduleDate: true,
        MobNo: true,
        VendorName: true,
        InstallationRem: true,
        activeTab: true,
        submittedOn: true,
        InstReportName: true,
        // Excluded: InstReport
      }
    });
    const service = await prisma.service.findMany({
      select: {
        SONumber: true,
        engName: true,
        ScheduleDate: true,
        MobNo: true,
        VendorName: true,
        ServiceRem: true,
        activeTab: true,
        Serticketid: true,
        submittedOn: true,
        // Excluded: ServiceReport, ServiceReportName
      }
    });
    const stage4 = await prisma.stage4.findMany({
      select: {
        SONumber: true,
        ReturnPickupName: true,
        ReturnPickupMobile: true,
        ReturnPickupRemark: true,
        DCNumber: true,
        CourierTrackNo: true,
        DCAmount: true,
        DispatchDate: true,
        DeliveryDate: true,
        Remark: true,
        fileName: true,
        // Excluded: Attachment
      }
    });
    const stage5 = await prisma.stage5.findMany();
    const activityLogs = await prisma.activityLog.findMany();
    const stageHistory = await prisma.stageHistory.findMany();

    // Truncate data for each table
    const truncatedData = {
      Users: truncateData(users),
      Roles: truncateData(roles),
      Stage0: truncateData(stage0),
      Stage1: truncateData(stage1),
      LineItems: truncateData(lineItems),
      Installation: truncateData(installation),
      Service: truncateData(service),
      Stage4: truncateData(stage4),
      Stage5: truncateData(stage5),
      ActivityLogs: truncateData(activityLogs),
      StageHistory: truncateData(stageHistory)
    };

    // Create workbook and add worksheets
    const wb = XLSX.utils.book_new();
    for (const [sheetName, data] of Object.entries(truncatedData)) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), sheetName);
    }

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="database_export.xlsx"'
      }
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return json({ error: 'Failed to export data' }, { status: 500 });
  }
}