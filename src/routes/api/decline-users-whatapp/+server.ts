import { PrismaClient } from '@prisma/client';
import type { RequestHandler } from './$types';

const prisma = new PrismaClient();

export const POST: RequestHandler = async ({ request }) => {
  const { userId, adminPhoneNumber } = await request.json();

  if (!userId || !adminPhoneNumber) {
    return new Response('Missing userId or adminPhoneNumber', { status: 400 });
  }

  try {
    await prisma.user.delete({
      where: { id: userId }
    });

    return new Response('User declined successfully', { status: 200 });
  } catch (error) {
    console.error('Error declining user:', error);
    return new Response('Error declining user', { status: 500 });
  }
};
