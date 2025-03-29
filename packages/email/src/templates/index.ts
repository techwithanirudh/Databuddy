import { render } from '@react-email/render';
import { EmailTemplate } from '../types';
import { VerificationEmail } from './verification';
import { PasswordResetEmail } from './password-reset';
import { WelcomeEmail } from './welcome';

export * from './verification';
export * from './password-reset';
export * from './welcome';

const templates = {
  'verification': VerificationEmail,
  'password-reset': PasswordResetEmail,
  'welcome': WelcomeEmail,
};

export async function renderTemplate(
  template: EmailTemplate, 
  data: Record<string, any>
): Promise<string> {
  const TemplateComponent = templates[template];
  
  if (!TemplateComponent) {
    throw new Error(`Template "${template}" not found`);
  }
  
  // Cast data to any to bypass TypeScript's type checking
  // This is necessary because we're using a dynamic template component
  const reactElement = TemplateComponent(data as any);
  
  // Render the React element to HTML
  return render(reactElement, {
    pretty: true,
    plainText: false
  });
} 