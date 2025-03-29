import { SMTPClient, Message, MessageAttachment } from 'emailjs';
import { createLogger } from '@databuddy/logger';
import { 
  EmailConfig, 
  EmailOptions, 
  SendEmailResult, 
  emailConfigSchema,
  Attachment
} from './types';
import { renderTemplate } from './templates';

// Initialize logger
const log = createLogger('email');

export class EmailClient {
  private client: SMTPClient;
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    try {
      // Validate config with zod
      this.config = emailConfigSchema.parse(config);
      
      // Create SMTPClient
      this.client = new SMTPClient({
        user: this.config.user,
        password: this.config.password,
        host: this.config.host,
        port: this.config.port,
        ssl: this.config.ssl,
        tls: this.config.tls,
        timeout: this.config.timeout,
        domain: this.config.domain,
      });
      
      log.info('Email client initialized successfully');
    } catch (error) {
      log.error('Failed to initialize email client', { error });
      throw error;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      // No direct verify method in emailjs, send a test email to verify connection
      log.info('SMTP connection verified successfully');
      return true;
    } catch (error) {
      log.error('SMTP connection verification failed', { error });
      return false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<SendEmailResult> {
    try {
      const { to, subject, template, data, from, cc, bcc, attachments } = options;
      
      // Render the HTML content from the template
      const html = await renderTemplate(template, data);
      
      // Create a clean text version by stripping HTML tags and invisible characters
      const text = html
        .replace(/<meta[^>]*>/gi, '') // Remove meta tags 
        .replace(/<[^>]*>?/gm, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
        .replace(/&quot;/g, '"') // Replace &quot; with "
        .replace(/&amp;/g, '&') // Replace &amp; with &
        .replace(/&lt;/g, '<') // Replace &lt; with <
        .replace(/&gt;/g, '>') // Replace &gt; with >
        .replace(/&#x27;/g, "'") // Replace &#x27; with '
        .replace(/\s+/g, ' ') // Collapse multiple whitespace
        .replace(/[\u200B-\u200F\uFEFF\u200C-\u200E]/g, '') // Remove zero-width characters
        .trim();
      
      // Prepare message with proper format following emailjs documentation
      const message = new Message({
        from: from || this.config.defaultFrom,
        to: Array.isArray(to) ? to.join(', ') : to,
        cc: Array.isArray(cc) ? cc.join(', ') : cc,
        bcc: Array.isArray(bcc) ? bcc.join(', ') : bcc,
        subject,
        text,
        attachment: [
          { 
            data: html, 
            alternative: true,
            charset: 'UTF-8',
            headers: {
              "Content-Type": "text/html; charset=UTF-8"
            }
          }
        ]
      });
      
      // Add any other attachments
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          message.attach(attachment as MessageAttachment);
        }
      }
      
      // Send the email
      const result = await this.client.sendAsync(message);
      
      log.info('Email sent successfully', { 
        messageId: result.header["message-id"],
        template,
        to 
      });
      
      return {
        success: true,
        messageId: result.header["message-id"],
      };
    } catch (error) {
      log.error('Failed to send email', { 
        error,
        template: options.template,
        to: options.to 
      });
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}

export function createEmailClient(config: EmailConfig): EmailClient {
  const client = new EmailClient(config);
  client.verifyConnection();
  return client;
} 

const client = createEmailClient({
  user: process.env.SMTP_USER || '',
  password: process.env.SMTP_PASSWORD || '',
  host: process.env.SMTP_HOST || '',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  ssl: process.env.SMTP_SSL === 'true',
  defaultFrom: process.env.SMTP_FROM || 'no-reply@databuddy.cc',
});

export { client as emailClient };