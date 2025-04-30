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

// Function to send schedule confirmation email to students
export async function sendScheduleConfirmationEmail(
  email: string,
  studentName: string,
  studentId: string,
  schedule: any[]
): Promise<boolean> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const viewScheduleUrl = `${baseUrl}/estudiante`;
    
    // Log the schedule data for debugging
    console.log('[EMAIL SCHEDULE DATA]', JSON.stringify(schedule.slice(0, 2)));
    
    // Format the schedule items to show in the email, handling different property naming conventions
    const scheduleItems = schedule
      .map((item) => {
        // Handle different property naming conventions (camelCase vs PascalCase)
        const subject = item.MateriaNombre || item.materianombre || item.nombre || 'Materia sin nombre';
        const professor = item.ProfesorNombre || item.profesornombre || 'Profesor no asignado';
        const day = item.Dia || item.dia || '';
        const startTime = item.HoraInicio || item.horainicio || '';
        const endTime = item.HoraFin || item.horafin || '';
        const semester = item.Semestre || item.semestre || '';
        const classroom = item.salon || item.Salon || item.idsalon || 'Por asignar';
        
        // Create a formatted row for the email table
        return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${subject}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${professor}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${day}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${startTime} - ${endTime}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${semester || 'N/A'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${classroom}</td>
          </tr>
        `;
      })
      .join('');

    // Plain text version for email clients that don't support HTML
    const plainTextSchedule = schedule
      .map((item) => {
        const subject = item.MateriaNombre || item.materianombre || item.nombre || 'Materia sin nombre';
        const professor = item.ProfesorNombre || item.profesornombre || 'Profesor no asignado';
        const day = item.Dia || item.dia || '';
        const startTime = item.HoraInicio || item.horainicio || '';
        const endTime = item.HoraFin || item.horafin || '';
        const semester = item.Semestre || item.semestre || '';
        const classroom = item.salon || item.Salon || item.idsalon || 'Por asignar';
        
        return `- ${subject} (${professor}): ${day} ${startTime} - ${endTime}, Semestre: ${semester}, Salón: ${classroom}`;
      })
      .join('\n');

    return await sendEmail({
      to: email,
      subject: 'Confirmación de Horario - Via Alta',
      text: `
        Hola ${studentName || 'Estudiante'},
        
        Tu horario ha sido confirmado exitosamente. A continuación, encontrarás los detalles de tu horario:
        
        ${plainTextSchedule}
        
        Puedes ver tu horario completo en el siguiente enlace:
        ${viewScheduleUrl}
        
        Saludos,
        Equipo Via Alta
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Confirmación de Horario</h2>
          <p>Hola ${studentName || 'Estudiante'},</p>
          <p>Tu horario ha sido confirmado exitosamente. A continuación, encontrarás los detalles de tu horario:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 10px; text-align: left;">Materia</th>
                <th style="padding: 10px; text-align: left;">Profesor</th>
                <th style="padding: 10px; text-align: left;">Día</th>
                <th style="padding: 10px; text-align: left;">Horario</th>
                <th style="padding: 10px; text-align: left;">Semestre</th>
                <th style="padding: 10px; text-align: left;">Salón</th>
              </tr>
            </thead>
            <tbody>
              ${scheduleItems}
            </tbody>
          </table>
          
          <p style="margin-top: 20px;">Puedes ver tu horario completo haciendo clic en el siguiente botón:</p>
          <p style="text-align: center; margin: 25px 0;">
            <a href="${viewScheduleUrl}" style="display: inline-block; padding: 10px 20px; background-color: #b91c1c; color: white; text-decoration: none; border-radius: 5px;">Ver Mi Horario</a>
          </p>
          
          <hr>
          <p style="color: #777; font-size: 12px; margin-top: 20px;">Este es un correo automático, por favor no responda a este mensaje.</p>
        </div>
      `
    });
  } catch (error) {
    console.error('Error sending schedule confirmation email:', error);
    return false;
  }
}