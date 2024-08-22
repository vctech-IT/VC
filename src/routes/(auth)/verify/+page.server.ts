// routes/verify/+page.server.ts
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/database';
import nodemailer from 'nodemailer';
import { addMinutes } from 'date-fns';

export const load: PageServerLoad = async ({ url, locals }) => {
  if (locals.user) {
    throw redirect(302, '/');
  }
  
  const email = url.searchParams.get('email') || '';
  return { email };
};

export const actions: Actions = {
  verify: async ({ request }) => {
    const data = await request.formData();
    const email = data.get('email');
    const otp = data.get('otp');

    if (typeof email !== 'string' || typeof otp !== 'string' || !email || !otp) {
      return fail(400, { invalid: true });
    }

    const user = await db.user.findUnique({
      where: { email }
    });

    if (!user) {
      return fail(400, { userNotFound: true });
    }

    if (user.isVerified) {
      return fail(400, { alreadyVerified: true });
    }

    if (user.otp !== otp || user.otpExpires < new Date()) {
      return fail(400, { invalidOtp: true });
    }

    await db.user.update({
      where: { id: user.id },
      data: { isVerified: true, otp: null, otpExpires: null }
    });

    throw redirect(303, '/login?verified=true');
  },

  updateEmail: async ({ request }) => {
    const data = await request.formData();
    const oldEmail = data.get('oldEmail');
    const newEmail = data.get('newEmail');

    if (typeof oldEmail !== 'string' || typeof newEmail !== 'string' || !oldEmail || !newEmail) {
      return fail(400, { invalid: true });
    }

    const user = await db.user.findUnique({
      where: { email: oldEmail }
    });

  const existingUser = await db.user.findUnique({
    where: { email: newEmail }
  });

    if (!user) {
      return fail(400, { userNotFound: true });
    }

    if (user.isVerified) {
      return fail(400, { alreadyVerified: true });
    }
    if (existingUser) {
    return fail(400, { emailTaken: true });
  }

  function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
    }

  const otp = generateOTP();
  const otpExpires = addMinutes(new Date(), 15);

  const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'shubhamrane190@gmail.com',
    pass: 'srux wqpj mmte dexb'
  }
});
    
async function sendOtpEmail(email: string, otp: string) {
  try {
    await transporter.sendMail({
      from: '"VC Tech" <donotreply@vctechsolutions.com>',
      to: email,
      subject: "Verify your email",
      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your OTP Verification Code</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background-color: #f9f9f9;
            border-radius: 5px;
            padding: 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .logo {
            text-align: center;
            margin-bottom: 20px;
        }
        .logo img {
            max-width: 150px;
        }
        .otp-container {
            background-color: #007bff;
            color: white;
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .expiry {
            text-align: center;
            font-style: italic;
            margin-bottom: 20px;
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <img src="https://yourcompany.com/logo.png" alt="Your Company Logo">
        </div>
        <h1>Verification Code</h1>
        <p>Hello ${user?.username},</p>
        <p>Your one-time password (OTP) for account verification is:</p>
        <div class="otp-container">
            ${otp}
        </div>
        <p class="expiry">This code will expire in 15 minutes.</p>
        <p>If you didn't request this code, please ignore this email or contact our support team if you have concerns.</p>
        <p>Thank you for choosing our service!</p>
        <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>If you need assistance, please contact our support team at support@yourcompany.com</p>
        </div>
    </div>
</body>
</html>`
    });
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return fail(500, { emailError: true });
  }
    }

  try {
    // Update user's email and OTP in the database
    await db.user.update({
      where: { id: user.id },
      data: { 
        email: newEmail, 
        otp, 
        otpExpires,
        isVerified: false // Reset verification status
      }
    });

    // Send new OTP email
    await sendOtpEmail(newEmail, otp);

    return { emailUpdated: true, email: newEmail };
  } catch (error) {
    console.error('Failed to update email or send OTP:', error);
    return fail(500, { updateError: true });
  }
  }
};