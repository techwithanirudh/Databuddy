export * from './client';
export * from './templates';
export * from './types';

/**
 * Example usage:
 * 
 * ```typescript
 * import { createEmailClient } from '@databuddy/email';
 * 
 * async function main() {
 *   // Create email client
 *   const emailClient = await createEmailClient({
 *     user: 'your-username',
 *     password: 'your-password',
 *     host: 'smtp.example.com',
 *     ssl: true,
 *     defaultFrom: 'noreply@yourdomain.com'
 *   });
 * 
 *   // Send verification email
 *   const result = await emailClient.sendEmail({
 *     to: 'user@example.com',
 *     subject: 'Please verify your email',
 *     template: 'verification',
 *     data: {
 *       userName: 'John Doe',
 *       verificationUrl: 'https://yourdomain.com/verify?token=abc123',
 *       companyName: 'Your Company'
 *     }
 *   });
 * 
 *   console.log(result.success ? 'Email sent!' : 'Failed to send email');
 * }
 * ```
 */ 