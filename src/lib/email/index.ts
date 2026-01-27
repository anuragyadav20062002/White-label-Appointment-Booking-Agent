import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const from = options.from || process.env.SMTP_FROM || 'noreply@example.com'

    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })

    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

export interface AppointmentEmailData {
  customerName: string
  customerEmail: string
  clientName: string
  serviceName?: string
  appointmentDate: string
  appointmentTime: string
  appointmentDuration: number
  tenantName: string
  primaryColor?: string
  logoUrl?: string
  cancelUrl?: string
  rescheduleUrl?: string
}

function getBaseTemplate(content: string, data: AppointmentEmailData): string {
  const primaryColor = data.primaryColor || '#4F46E5'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.tenantName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; background-color: ${primaryColor}; border-radius: 8px 8px 0 0;">
              ${data.logoUrl
                ? `<img src="${data.logoUrl}" alt="${data.tenantName}" style="max-height: 40px; max-width: 200px;">`
                : `<h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">${data.tenantName}</h1>`
              }
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px; text-align: center;">
                Powered by ${data.tenantName}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

export function getConfirmationEmailHtml(data: AppointmentEmailData): string {
  const primaryColor = data.primaryColor || '#4F46E5'

  const content = `
    <h2 style="margin: 0 0 24px; color: #111827; font-size: 20px; font-weight: 600;">
      Appointment Confirmed
    </h2>

    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.5;">
      Hi ${data.customerName},
    </p>

    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.5;">
      Your appointment with <strong>${data.clientName}</strong> has been confirmed.
    </p>

    <!-- Appointment Details Box -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 24px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding-bottom: 12px;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Date</p>
                <p style="margin: 4px 0 0; color: #111827; font-size: 16px; font-weight: 500;">${data.appointmentDate}</p>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Time</p>
                <p style="margin: 4px 0 0; color: #111827; font-size: 16px; font-weight: 500;">${data.appointmentTime}</p>
              </td>
            </tr>
            <tr>
              <td>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Duration</p>
                <p style="margin: 4px 0 0; color: #111827; font-size: 16px; font-weight: 500;">${data.appointmentDuration} minutes</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${data.cancelUrl ? `
    <p style="margin: 0 0 24px; color: #374151; font-size: 14px; line-height: 1.5;">
      Need to make changes?
      <a href="${data.cancelUrl}" style="color: ${primaryColor}; text-decoration: none;">Cancel or reschedule your appointment</a>
    </p>
    ` : ''}

    <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.5;">
      We look forward to seeing you!
    </p>
  `

  return getBaseTemplate(content, data)
}

export function getReminderEmailHtml(data: AppointmentEmailData): string {
  const primaryColor = data.primaryColor || '#4F46E5'

  const content = `
    <h2 style="margin: 0 0 24px; color: #111827; font-size: 20px; font-weight: 600;">
      Appointment Reminder
    </h2>

    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.5;">
      Hi ${data.customerName},
    </p>

    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.5;">
      This is a friendly reminder about your upcoming appointment with <strong>${data.clientName}</strong>.
    </p>

    <!-- Appointment Details Box -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 24px; background-color: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding-bottom: 12px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">Date</p>
                <p style="margin: 4px 0 0; color: #78350f; font-size: 16px; font-weight: 600;">${data.appointmentDate}</p>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">Time</p>
                <p style="margin: 4px 0 0; color: #78350f; font-size: 16px; font-weight: 600;">${data.appointmentTime}</p>
              </td>
            </tr>
            <tr>
              <td>
                <p style="margin: 0; color: #92400e; font-size: 14px;">Duration</p>
                <p style="margin: 4px 0 0; color: #78350f; font-size: 16px; font-weight: 600;">${data.appointmentDuration} minutes</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${data.cancelUrl ? `
    <p style="margin: 0 0 24px; color: #374151; font-size: 14px; line-height: 1.5;">
      Need to cancel?
      <a href="${data.cancelUrl}" style="color: ${primaryColor}; text-decoration: none;">Click here to cancel your appointment</a>
    </p>
    ` : ''}

    <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.5;">
      See you soon!
    </p>
  `

  return getBaseTemplate(content, data)
}

export function getCancellationEmailHtml(data: AppointmentEmailData): string {
  const primaryColor = data.primaryColor || '#4F46E5'

  const content = `
    <h2 style="margin: 0 0 24px; color: #111827; font-size: 20px; font-weight: 600;">
      Appointment Cancelled
    </h2>

    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.5;">
      Hi ${data.customerName},
    </p>

    <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.5;">
      Your appointment with <strong>${data.clientName}</strong> has been cancelled.
    </p>

    <!-- Cancelled Appointment Details -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 24px; background-color: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
          <p style="margin: 0 0 8px; color: #991b1b; font-size: 14px;">Cancelled Appointment</p>
          <p style="margin: 0; color: #7f1d1d; font-size: 16px;">
            ${data.appointmentDate} at ${data.appointmentTime}
          </p>
        </td>
      </tr>
    </table>

    ${data.rescheduleUrl ? `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background-color: ${primaryColor}; border-radius: 6px;">
          <a href="${data.rescheduleUrl}" style="display: inline-block; padding: 12px 24px; color: #ffffff; font-size: 16px; font-weight: 500; text-decoration: none;">
            Book a New Appointment
          </a>
        </td>
      </tr>
    </table>
    ` : ''}

    <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.5;">
      We hope to see you again soon.
    </p>
  `

  return getBaseTemplate(content, data)
}
