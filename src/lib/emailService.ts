// src/lib/emailService.ts
import nodemailer from 'nodemailer';
import { db } from './database';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'vctechops1@gmail.com',
    pass: 'qlcj ztdf mnne icbr'
  }
});

export async function sendOTP(email: string, otp: string) {
  const mailOptions = {
    from: 'vctechops1@gmail.com',
    to: email,
    subject: 'Email Verification OTP',
    text: `Your OTP for email verification is: ${otp}`
  };

  await transporter.sendMail(mailOptions);
}

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function storeOTP(email: string, otp: string) {
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

  await db.user.update({
    where: { email },
    data: { otp, otpExpires }
  });
}

export async function sendUserDeclineNotification(userEmail: string, username: string) {
  try {
    await transporter.sendMail({
      from: '"VC Tech" <noreply@vctech.com>',
      to: userEmail,
      subject: "VC Tech - Account Application Status",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Application Status</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <div style="background-color: #e74c3c; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">Account Application Status</h1>
                </div>
                <div style="padding: 20px;">
                    <p>Dear ${username},</p>
                    <p>We regret to inform you that your application for an account at VC Tech has been declined.</p>
                    <p>If you believe this decision was made in error or if you have any questions, please don't hesitate to contact our support team.</p>
                    <p>Thank you for your interest in VC Tech.</p>
                    <p>Best regards,<br>The VC Tech Team</p>
                </div>
                <div style="background-color: #f8f8f8; padding: 10px 20px; font-size: 12px; color: #666; text-align: center;">
                    <p>This email was sent to ${userEmail}. If you didn't apply for an account, please disregard this message.</p>
                </div>
            </div>
        </body>
        </html>
      `
    });
    console.log('User decline notification sent successfully to', userEmail);
  } catch (error) {
    console.error('Error sending user decline notification:', error);
  }
}

export async function sendAdminNotification(newUser: any, adminEmail: string, adminUsername: string) {
  try {
    console.log('Preparing to send email to:', adminEmail);
    console.log('New user data:', newUser);
    
    const roleName = newUser.role?.name || 'Unknown Role';
    
    const result = await transporter.sendMail({
      from: '"VC Tech" <noreply@vctech.com>',
      to: adminEmail,
      subject: "New User Registration - Action Required",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New User Registration</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <div style="background-color: #3498db; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">New User Registration</h1>
                </div>
                <div style="padding: 20px;">
                    <p>Dear ${adminUsername},</p>
                    <p>A new user has registered and is pending approval. Here are the details:</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <tr>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Username</th>
                            <td style="padding: 8px; border: 1px solid #ddd;">${newUser.username}</td>
                        </tr>
                        <tr>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Email</th>
                            <td style="padding: 8px; border: 1px solid #ddd;">${newUser.email}</td>
                        </tr>
                        <tr>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Role</th>
                            <td style="padding: 8px; border: 1px solid #ddd;">${roleName}</td>
                        </tr>
                    </table>
                    <p style="margin-top: 20px;">Please log in to the admin panel to review and approve this user registration.</p>
                    <a href="https://vc-tech.vercel.app/admin" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">Go to Admin Panel</a>
                </div>
                <div style="background-color: #f8f8f8; padding: 10px 20px; font-size: 12px; color: #666; text-align: center;">
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
      `
    });

    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Error sending admin notification:', error);
    if (error.response) {
      console.error('SMTP Response:', error.response);
    }
  }
}


export async function sendUserApprovalNotification(userEmail: string, username: string) {
  try {
    await transporter.sendMail({
      from: '"VC Tech" <noreply@vctech.com>',
      to: userEmail,
      subject: "Welcome to VC Tech - Your Account Has Been Approved!",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Approved</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 20px auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                <div style="background-color: #2ecc71; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">Welcome to VC Tech!</h1>
                </div>
                <div style="padding: 20px;">
                    <p>Dear ${username},</p>
                    <p>Great news! Your account has been approved and is now active. We're thrilled to have you join our community.</p>
                    <h2 style="color: #2ecc71;">Next Steps:</h2>
                    <ol>
                        <li>Log in to your account</li>
                        <li>Complete your profile information</li>
                        <li>Explore the features and tools available to you</li>
                        <li>Connect with other users and start collaborating</li>
                    </ol>
                    <p>If you have any questions or need assistance getting started, our support team is here to help.</p>
                    <a href="https://vc-tech.vercel.app/login" style="display: inline-block; padding: 10px 20px; background-color: #2ecc71; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">Log In Now</a>
                    <p style="margin-top: 20px;">We're excited to see what you'll achieve with our platform!</p>
                    <p>Best regards,<br>The VC Tech Team</p>
                </div>
                <div style="background-color: #f8f8f8; padding: 10px 20px; font-size: 12px; color: #666; text-align: center;">
                    <p>This email was sent to ${userEmail}. If you didn't request this approval, please contact our support team immediately.</p>
                </div>
            </div>
        </body>
        </html>
      `
    });
    console.log('User approval notification sent successfully to', userEmail);
  } catch (error) {
    console.error('Error sending user approval notification:', error);
  }
}