import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/database';
import { sendPasswordResetEmail } from '$lib/emailService'; // You'll need to implement this function

export const actions: Actions = {
  forgotPassword: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email');

    if (typeof email !== 'string' || !email) {
      return fail(400, { error: 'Invalid email' });
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return fail(400, { error: 'No account found with this email' });
    }

    // Generate a password reset token
    const resetToken = crypto.randomUUID();
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Update the user with the reset token and expiration
    await db.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpires,
      },
    });

    // Send password reset email
    await sendPasswordResetEmail(email, resetToken);

    return { success: true };
  },
};