// src/common/email/email.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer'; // Changed import syntax
import * as dotenv from 'dotenv';

dotenv.config();

const mail = process.env.NEXT_PRIVATE_EMAIL_USER || 'vietstrix@gmail.com';
const pass = process.env.NEXT_PRIVATE_EMAIL_PASS || 'qplg rowm fpun jfxo';

interface EmailOptions {
  recipientEmail: string;
  verificationCode?: string;
}

@Injectable()
export class EmailPasswordService {
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

  async sendMail({
    recipientEmail,
    verificationCode = '123456',
  }: EmailOptions): Promise<void> {
    const transporter = this.createTransporter();

    const mailOptions = {
      from: {
        name: 'Hust4L',
        address: mail,
      },
      to: recipientEmail,
      subject: 'Password Change Verification Code',
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
            font-size: 24px;
            letter-spacing: 0.5px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .content {
            padding: 30px;
            line-height: 1.6;
            color: #333;
        }
        .verification-box {
            background: #f5f5f5;
            border-left: 4px solid #53bc26;
            padding: 20px;
            border-radius: 6px;
            margin: 25px 0;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        .verification-label {
            color: #53bc26;
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 16px;
        }
        .verification-code {
            font-family: 'Courier New', monospace;
            font-size: 24px;
            font-weight: bold;
            color: #013162;
            letter-spacing: 2px;
            background: white;
            padding: 12px 20px;
            border-radius: 4px;
            display: inline-block;
            border: 1px dashed #cccccc;
        }
        .warning {
            color: #e74c3c;
            font-weight: bold;
        }
        .time-warning {
            background-color: #fff8e8;
            border-left: 4px solid #e74c3c;
            padding: 10px 15px;
            border-radius: 4px;
            margin: 15px 0;
            font-size: 14px;
        }
        .footer {
            background: linear-gradient(135deg, #53bc26 0%, #3da015 100%);
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
            font-size: 18px;
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
            color: #4da6ff;
            text-decoration: none;
            transition: color 0.2s;
        }
        .contact-link:hover {
            color: #7bbefd;
        }
        .team-signature {
            color: rgb(43, 129, 7);
            font-weight: bold;
            margin: 20px 0 5px 0;
        }
        .info-icon {
            font-size: 16px;
            margin-right: 5px;
        }
        .support-button {
            display: inline-block;
            background: #013162;
            color: white;
            padding: 12px 24px;
            border-radius: 30px;
            text-decoration: none;
            font-weight: bold;
            margin: 15px 0;
            transition: all 0.3s ease;
            text-align: center;
        }
        .support-button:hover {
            background: #014a94;
            box-shadow: 0 4px 8px rgba(1, 49, 98, 0.3);
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Hust4L - Password Changed</h2>
        </div>
        
        <div class="content">
            <p>Dear User,</p>
            
            <p>Your password has been successfully changed.</p>
            
            <p>If you did not make this change, please contact our support team immediately. To verify your identity and confirm the password change, please enter the verification code below:</p>
            
            <div class="verification-box">
                <div class="verification-label">Your Change Verification Code:</div>
                <div class="verification-code">${verificationCode}</div>
            </div>
            
            <div class="time-warning">
                <span class="warning">Note:</span> This code will expire in 3 minutes. Please use it promptly.
            </div>
            
            <a href="https://hust4l.com/support" class="support-button">Contact Support</a>
            
            <p>Best regards,</p>
            <p class="team-signature">VietStrix Team</p>
        </div>
        
        <div class="footer">
            <table class="footer-table">
                <tr>
                    <td style="width: 30%; text-align: left;">
                        <img src="/api/placeholder/120/80" alt="VietStrix Logo" class="logo">
                    </td>
                    <td style="width: 70%; text-align: right;">
                        <div class="company-name">Hust4L</div>
                        <div class="company-tagline">Agency | Marketing</div>
                        <div class="contact-info">
                            <span class="info-icon">📧</span> <a href="mailto:vietstrix@gmail.com" class="contact-link">vietstrix@gmail.com</a><br>
                            <span class="info-icon">🌐</span> <a href="https://hust4l.com" class="contact-link">vietstrix.com</a><br>
                            <span class="info-icon">📞</span> +84 123 456 789
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
