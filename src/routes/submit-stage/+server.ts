import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  export async function POST({ request }) {
    const { stage, data } = await request.json();
    try {
      let result;
      switch (stage) {
        case 0:
          result = await prisma.stage0.create({
            data: { SONumber: data.SONumber, currentStage: stage,clientName:data.clientName,SubTotal:data.SubTotal, Total:data.Total, SOCategory: data.SOCategory, PMName: data.projectManagerName }
          });
          break;
          case 1:
              // console.log("Data received in case 1:");
              // console.log("Line Items:", JSON.stringify(data.lineItems, null, 2));
              // console.log("DC Boxes:", JSON.stringify(data.dcBoxes, null, 2));
              result = await prisma.lineItems.createMany({
                  data: data.lineItems.map(item => ({ SONumber: item.SONumber, ItemName: item.name, Quantity: item.quantity, Unit: item.unit, Rate: item.rate, Amount: item.item_total, Status: item.status }))
              });
              await prisma.stage1.createMany({
                  data: data.dcBoxes.map(box => ({
                      SONumber: box.SONumber,
                      DCNumber: box.customName,
                      CourierTrackNo: box.trackingNo,
                      DispatchDate: new Date(box.dispatchedDate).toISOString(),
                      DeliveryDate: new Date(box.deliveryDate).toISOString(),
                      DCAmount: box.dcAmount,
                      Attachment: box.attachment
                  }))
              });
              break;
    //     case 2:
    //       result = await prisma.stage2.create({
    //         data: { age: parseInt(data.age), occupation: data.occupation }
    //       });
    //       break;
        case 3:
          // console.log("Data received in case 3:");
          // console.log(JSON.stringify(data, null, 2));
          if (data.Ticketid==''){
            result = await prisma.installation.create({
              data: { SONumber: data.SONumber,engName:data.engName,ScheduleDate:new Date(data.ScheduleDate).toISOString(),MobNo:data.MobNo,VendorName:data.VendorName,InstallationRem:data.Remark,InstReport:data.Report }
          });
          }else if(data.Ticketid){
            result = await prisma.service.create({
              data: { SONumber: data.SONumber,engName:data.engName,ScheduleDate:new Date(data.ScheduleDate).toISOString(),MobNo:data.MobNo,VendorName:data.VendorName,ServiceRem:data.Remark,ServiceReport:data.Report, Serticketid: data.Ticketid }
            });
          }
          if (data.ReturnPickupName){
            result = await prisma.stage4.create({
              data: { SONumber: data.SONumber,
                      Name:data.ReturnPickupName,
                      MobNo:data.ReturnPickupMobile, ProjMngRemark:data.ReturnPickupRemark }
            });
          }
          break;
        default:
          return json({ success: false, message: 'Invalid stage' }, { status: 400 });
      }
  
      return json({ success: true, data: result });
    } catch (error) {
      console.error('Error saving data:', error);
      return json({ success: false, message: 'Error saving data' }, { status: 500 });
    }
  }