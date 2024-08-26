import { fail } from '@sveltejs/kit';
import type { Action, Actions } from './$types';
import { db } from '$lib/database';
import { sendPasswordResetEmail } from '$lib/emailService';

const forgotPassword: Action = async ({ request }) => {
  const data = await request.formData();
  const email = data.get('email');

  if (typeof email !== 'string' || !email) {
    return fail(400, { error: 'Invalid email address' });
  }

  const user = await db.user.findUnique({ where: { email } });

  if (user) {
    const resetToken = crypto.randomUUID();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    await db.user.update({
      where: { email },
      data: { resetToken, resetTokenExpiry }
    });

    await sendPasswordResetEmail(user.email, resetToken);
  }

  // Always return success to prevent email enumeration
  return { success: true };
};

export const actions: Actions = { forgotPassword };