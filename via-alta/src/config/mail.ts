// Email configuration using SendGrid for reliable email delivery
import sgMail from '@sendgrid/mail';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Initialize SendGrid with API key from environment
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// Email sending function that uses SendGrid regardless of environment
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // When no custom domain is available, use a default sender address
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'Via Alta <noreply@viaalta.edu.mx>';
    
    // Log email content in both environments for debugging
    console.log('------------- EMAIL ATTEMPT -------------');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('----------------------------------------');
    
    const msg = {
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      // You can also add a reply-to address to make replies go to an address you control
      replyTo: process.env.REPLY_TO_EMAIL || 'support@viaalta.edu.mx',
    };
    
    const response = await sgMail.send(msg);
    
    if (response[0].statusCode !== 202) {
      console.error('Error sending email with SendGrid:', response);
      return false;
    }
    
    console.log('Email sent successfully with SendGrid');
    return true;
  } catch (error) {
    console.error('Error sending email with SendGrid:', error);
    return false;
  }
}