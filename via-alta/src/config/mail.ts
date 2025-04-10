// Email configuration using Resend for reliable email delivery
import { Resend } from 'resend';

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Create Resend instance with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

// Email sending function that uses Resend regardless of environment
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Use custom domain for sending emails
    // Format: Your Name <email@your-domain.com>
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'VIA ALTA MAIL TEST <no-reply@contacto.neuralharvest.com>';
    
    // Log email content in both environments for debugging
    console.log('------------- EMAIL ATTEMPT -------------');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('----------------------------------------');
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    
    if (error) {
      console.error('Error sending email with Resend:', error);
      return false;
    }
    
    console.log('Email sent successfully with Resend ID:', data?.id);
    return !!data?.id;
  } catch (error) {
    console.error('Error sending email with Resend:', error);
    return false;
  }
}