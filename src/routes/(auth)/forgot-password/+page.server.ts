import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/database';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '$lib/emailService';

export const actions: Actions = {
  forgotPassword: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email');

    if (typeof email !== 'string' || !email) {
      return fail(400, { error: 'Please provide a valid email address.' });
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      // For security reasons, we still return success even if the email doesn't exist
      return { success: true };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    await db.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Send password reset email
    await sendPasswordResetEmail(email, resetToken);

    return {
      success: true
    };
  }
};