import { PrismaClient } from '@prisma/client';
import { sendUserApprovalNotification } from '$lib/whatsappServices'; 
import type { RequestHandler } from './$types';

const prisma = new PrismaClient();

export const POST: RequestHandler = async ({ request }) => {
  const { userId, adminPhoneNumber } = await request.json();

  if (!userId || !adminPhoneNumber) {
    return new Response('Missing userId or adminPhoneNumber', { status: 400 });
  }

  try {
    // Update user approval status in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isApproved: true }
    });

    // Send WhatsApp notification to the user confirming their approval
    await sendUserApprovalNotification(updatedUser.phoneNo, updatedUser.username);

    return new Response('User approved successfully and notified via WhatsApp', { status: 200 });
  } catch (error) {
    console.error('Error approving user:', error);
    return new Response('Error approving user', { status: 500 });
  }
};
