// src/common/email/email.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer'; // Changed import syntax
import * as dotenv from 'dotenv';

dotenv.config();

const mail = process.env.NEXT_PRIVATE_EMAIL_USER || 'vietstrix@gmail.com';
const pass = process.env.NEXT_PRIVATE_EMAIL_PASS || 'qplg rowm fpun jfxo';

interface EmailOptions {
  recipientEmail: string;
  name?: string;
}

@Injectable()
export class EmailService {
  private createTransporter() {
    if (!mail || !pass) {
      throw new Error('Email credentials are missing');
    }

    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: mail,
        pass: pass,
      },
    });
  }

  async sendThankYouEmail({
    recipientEmail,
    name = 'bạn',
  }: EmailOptions): Promise<void> {
    const transporter = this.createTransporter();

    const mailOptions = {
      from: {
        name: 'Hust4L',
        address: mail,
      },
      to: recipientEmail,
      subject: 'Thanks for contacting us !',
      html: `
    <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; border-radius: 10px;">
        <div style="background:#53bc26; padding: 20px; text-align: center; border-top-left-radius: 10px; border-top-right-radius: 10px;">
            <h2 style="color: white; margin: 0;">Hust4L</h2>
        </div>

        <div style="background: white; padding: 20px; border-radius: 0 0 10px 10px;">
            <p>Dear <span style="color: #53bc26; font-weight: bold;">${name}</span>,</p>

            <p>Thank you for contacting us! We have received your inquiry and will get back to you as soon as possible.</p>

            <p>If you have any additional questions in the meantime, feel free to reach out.</p>

            <p>Best regards,</p>

            <p><span style="color:rgb(43, 129, 7); font-weight: bold;">VietStrix Team</span></p>

            <p>We appreciate your business and look forward to serving you in the future.</p>

            <p>Best regards,</p>
 
            <table  table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; background: #013162; color: white; padding: 15px; border-radius: 5px;">
                <tr>
                    <td style="padding: 15px; text-align: left; vertical-align: middle;">
                        <img src="https://lh3.googleusercontent.com/a-/ALV-UjWHPYbMFT4opU9pYn0ItPXhgruFrO7OB2MgNkhOs0lGBf48Zg0=s80-p-k-rw-no" alt="VietStrix Logo" style="height: 60px; border-radius: 5px;">
                    </td>
                    <td style="padding: 15px; text-align: right; vertical-align: middle;">
                        <strong style="font-size: 18px;">Hust4L</strong><br/>
                        <span style="font-size: 14px;">Agency | Marketing </span><br/>
                        📧 <a href="mailto:vietstrix@gmail.com" style="color: #4da6ff; text-decoration: none;">vietstrix@gmail.com</a><br/>
                        🌐 <a href="https://hust4l.com" style="color: #4da6ff; text-decoration: none;">vietstrix.com</a><br/>
                        📞 +84 123 456 789
                    </td>
                </tr>
            </table>
        </div>
    </div>

     `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent to:', recipientEmail);
      console.log('Message ID:', info.messageId);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}
