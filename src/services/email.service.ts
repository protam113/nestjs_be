// src/common/email/email.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer'; // Changed import syntax
import * as dotenv from 'dotenv';

dotenv.config();

const mail = process.env.NEXT_PRIVATE_EMAIL_USER || 'vietstrix+spam@gmail.com';
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
   <!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #f8f8f8;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
         .header {
            background: linear-gradient(135deg, #53bc26 0%, #3da015 100%);
            padding: 25px;
            text-align: center;
        }
        .header h2 {
            color: white;
            margin: 0;
            font-size: 28px;
            letter-spacing: 1px;
            text-transform: uppercase;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .content {
            padding: 30px;
            line-height: 1.6;
            color: #333;
        }
        .highlight {
            color: #0bd466;
            font-weight: bold;
        }
        .footer {
            background: linear-gradient(135deg, #53bc26 0%, #3da015 100%);;
            color: white;
            padding: 20px;
            border-radius: 0 0 12px 12px;
        }
        .footer-table {
            width: 100%;
            border-collapse: collapse;
        }
        .footer-table td {
            padding: 10px;
            vertical-align: middle;
        }
        .logo {
            height: 60px;
            border-radius: 6px;
            border: 2px solid rgba(255, 255, 255, 0.3);
        }
        .company-name {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .company-tagline {
            font-size: 14px;
            opacity: 0.8;
            margin-bottom: 10px;
        }
        .contact-info {
            font-size: 14px;
            line-height: 1.8;
        }
        .contact-link {
            color: #0bf4c3;
            text-decoration: none;
            transition: color 0.2s;
        }
        .contact-link:hover {
            color: #7bffdd;
        }
        .divider {
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            margin: 15px 0;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #0bf4c3 0%, #0bd466 100%);
            color: #1a1e35;
            padding: 12px 24px;
            border-radius: 30px;
            text-decoration: none;
            font-weight: bold;
            margin-top: 15px;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(11, 212, 102, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Hust4L</h2>
        </div>
        
        <div class="content">
            <p>Dear <span class="highlight">${name}</span>,</p>
            
            <p>Thank you for contacting us! We have received your inquiry and will get back to you as soon as possible.</p>
            
            <p>If you have any additional questions in the meantime, feel free to reach out.</p>
            
            <a href="#" class="btn">Visit Our Website</a>
            
            <p>We appreciate your business and look forward to serving you in the future.</p>
            
            <p>Best regards,<br>
            <span class="highlight">HUST4L Team</span></p>
        </div>
        
        <div class="footer">
            <table class="footer-table">
                <tr>
                    <td style="width: 30%; text-align: left;">
                        <img src="/api/placeholder/120/80" alt="Hust4L Logo" class="logo">
                    </td>
                    <td style="width: 70%; text-align: right;">
                        <div class="company-name">Hust4L</div>
                        <div class="company-tagline">Agency | Marketing</div>
                        <div class="contact-info">
                            📧 <a href="mailto:vietstrix@gmail.com" class="contact-link">vietstrix@gmail.com</a><br>
                            🌐 <a href="https://hust4l.com" class="contact-link">vietstrix.com</a><br>
                            📞 +84 123 456 789
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>

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
