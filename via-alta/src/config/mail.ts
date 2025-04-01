// Email configuration for password reset emails
// In a production environment, use a proper email service like Nodemailer,
// AWS SES, SendGrid, etc.

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Load email configuration from environment variables
export const emailConfig: EmailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASSWORD || '',
  },
  from: process.env.EMAIL_FROM || 'no-reply@viaalta.edu.mx',
};

// Mock email sending function for development
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (process.env.NODE_ENV === 'production') {
    // In production, implement actual email sending
    // Example with Nodemailer:
    // const transporter = nodemailer.createTransport(emailConfig);
    // await transporter.sendMail({
    //   from: emailConfig.from,
    //   ...options,
    // });
    console.log('Production email would be sent:', options);
    return true;
  } else {
    // In development, just log the email content
    console.log('------------- DEV EMAIL -------------');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('Text:', options.text);
    console.log('-----------------------------------');
    return true;
  }
}