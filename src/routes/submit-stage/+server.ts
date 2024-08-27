import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';
import { db } from '$lib/database';

const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
  export async function POST({ request }) {
    const { stage, data } = await request.json();

    console.log("Data inside push:", JSON.stringify(data, null, 2));
    try {
      let result;
      switch (stage) {
        case 0:
          await prisma.stage0.update({
            where: {
                SONumber: data.SONumber
            },
            data: {  clientExpectedDate: new Date(data.clientExpectedDate).toISOString() }
          });
          break;
        case 1:
          // console.log("Line Items:", JSON.stringify(data.lineItems, null, 2));
          // console.log("DC Boxes:", JSON.stringify(data.dcBoxes, null, 2));
          const existingLineItems = await prisma.lineItems.findFirst({
            where: { SONumber: data.lineItems[0].SONumber }
          });
  
          if (!existingLineItems) {
            // Create lineItems only if they don't exist
            await prisma.lineItems.createMany({
              data: data.lineItems.map(item => ({ 
                Itemid: item.Itemid,
                SONumber: item.SONumber, 
                name: item.name, 
                quantity: item.quantity, 
                unit: item.unit, 
                rate: item.rate, 
                amount: item.amount, 
                status: item.status,
                isAvailabilityFrozen: item.isAvailabilityFrozen,
                needToPurchaseLocally: item.needToPurchaseLocally,
                isAvailable: item.isAvailable,
                serialNo: item.serialNo,
                invoiceNo: item.invoiceNo,
                attachment: item.attachment
              }))
            });
          }
          await prisma.stage1.create({
            data: {
              SONumber: data.dcBoxes.SONumber,
              DCNumber: data.dcBoxes.DCNumber,
              status: data.dcBoxes.status,
              PODNo: data.dcBoxes.PODNo,
              DispatchDate: new Date(data.dcBoxes.DispatchDate).toISOString(),
              EstdDeliveryDate: new Date(data.dcBoxes.EstdDeliveryDate).toISOString(),
              dcAmount: data.dcBoxes.dcAmount,
              attachment: data.dcBoxes.attachment,
              lineItemCount: data.dcBoxes.lineItemCount || 0,
              isSaved: data.dcBoxes.isSaved || false,
              lineItemIndices: data.dcBoxes.lineItemIndices || [],
              fileName: data.dcBoxes.fileName || '',
              filePreviewUrl: data.dcBoxes.filePreviewUrl,
              billType: data.dcBoxes.billType || 'DC',
              isTypeSet: data.dcBoxes.isTypeSet || false,
              dcDetails: {
                create: {
                  dcNumber: data.dcBoxes.dcDetails.dcNumber,
                  customerName: data.dcBoxes.dcDetails.customerName,
                  companyName: data.dcBoxes.dcDetails.companyName,
                  dcDate: new Date(data.dcBoxes.dcDetails.dcDate).toISOString(),
                  total: data.dcBoxes.dcDetails.total,
                  status: data.dcBoxes.dcDetails.status,
                  challanStatus: data.dcBoxes.dcDetails.challanStatus,
                  referenceNumber: data.dcBoxes.dcDetails.referenceNumber,
                  branchName: data.dcBoxes.dcDetails.branchName
                }
              }
            }
            })
          break;
    //     case 2:
    //       result = await prisma.stage2.create({
    //         data: { age: parseInt(data.age), occupation: data.occupation }
    //       });
    //       break;
        case 3:
          console.log("Data received in case 3:");
          console.log(JSON.stringify(data, null, 2));
          if (data.Ticketid==''){
            result = await prisma.installation.create({
              data: { SONumber: data.SONumber,engName:data.engName,ScheduleDate:new Date(data.ScheduleDate).toISOString(),MobNo:data.MobNo,VendorName:data.VendorName,InstallationRem:data.Remark,InstReport:data.Report ,activeTab: data.activeTab}
          });
          }else if(data.Ticketid){
            result = await prisma.service.create({
              data: { SONumber: data.SONumber,engName:data.engName,ScheduleDate:new Date(data.ScheduleDate).toISOString(),MobNo:data.MobNo,VendorName:data.VendorName,ServiceRem:data.Remark,ServiceReport:data.Report, Serticketid: data.Ticketid ,activeTab: data.activeTab}
            });
          }
          if (data.ReturnPickupName){
            result = await prisma.stage4.create({
              data: { SONumber: data.SONumber,
                      ReturnPickupName:data.ReturnPickupName,
                      ReturnPickupMobile:data.ReturnPickupMobile, ReturnPickupRemark:data.ReturnPickupRemark }
            });
          }
          break;
        case 4: 
          console.log("Data in stage4:", JSON.stringify(data, null, 2));
          const existingRecord = await prisma.stage4.findUnique({
            where: { SONumber: data.SONumber },
          });
          if (existingRecord) {
            await prisma.stage4.update({
                where: {
                    SONumber: data.SONumber,
                },
                data: {
                  DCNumber: data.DCNumber,
                  CourierTrackNo: data.CourierTrackNo,
                  DCAmount: data.DCAmount,
                  DispatchDate: new Date(data.DispatchDate).toISOString(),
                  DeliveryDate: new Date(data.DeliveryDate).toISOString(),
                  Remark: data.Remark,
                  Attachment: data.Attachment,
                  fileName: data.fileName
                },
            });
            console.log(`Record with SONumber ${data.SONumber} updated successfully.`);
          } else {
            console.log(`No record found in stage4 with SONumber ${data.SONumber}. Update skipped.`);
          }
          break;

        case 5:
          console.log("Data in stage 5:", JSON.stringify(data, null, 2));
          await prisma.stage5.create({
            data: {
              SONumber: data.SONumber,
              rejected: data.rejected,
              rejectionRemark: data.rejectionRemark,
              accountRemark: data.accountRemark,
              retaccStatus: data.retaccStatus,
              retrejected: data.retrejected,
              retrejectionRemark: data.retrejectionRemark,
              retaccountRemark: data.retaccountRemark
            },
        });
        default:
          return json({ success: false, message: 'Invalid stage' }, { status: 400 });
      }
  
      return json({ success: true, data: result });
    } catch (error) {
      console.error('Error saving data:', error);
      return json({ success: false, message: 'Error saving data' }, { status: 500 });
    }
  }

function currentDate(): any {
  throw new Error('Function not implemented.');
}




