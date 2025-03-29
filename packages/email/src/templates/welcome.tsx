import React from 'react';
import { 
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text 
} from '@react-email/components';

interface WelcomeEmailProps {
  userName: string;
  loginUrl: string;
  companyName?: string;
  supportEmail?: string;
}

export const WelcomeEmail = ({
  userName,
  loginUrl,
  companyName = 'Databuddy',
  supportEmail = 'support@databuddy.io',
}: WelcomeEmailProps) => {
  const previewText = `Welcome to ${companyName}!`;

  return (
    <Html lang="en">
      <Head>
        <meta content="text/html; charset=UTF-8" httpEquiv="Content-Type" />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>Welcome to {companyName}!</Heading>
          <Section>
            <Text style={styles.text}>Hello {userName},</Text>
            <Text style={styles.text}>
              Thank you for joining {companyName}! We're excited to have you on board.
            </Text>
            <Text style={styles.text}>
              Your account has been successfully created and is ready to use. You can now log in
              to access all the features and services available to you.
            </Text>
            <Button style={styles.button} href={loginUrl}>
              Log In to Your Account
            </Button>
            <Text style={styles.text}>
              Here are a few things you can do to get started:
            </Text>
            <ul style={styles.list}>
              <li style={styles.listItem}>Complete your profile</li>
              <li style={styles.listItem}>Explore the dashboard</li>
              <li style={styles.listItem}>Check out our documentation</li>
            </ul>
            <Text style={styles.text}>
              If you have any questions or need assistance, please don't hesitate to
              contact our support team at <Link href={`mailto:${supportEmail}`} style={styles.link}>{supportEmail}</Link>.
            </Text>
            <Hr style={styles.hr} />
            <Text style={styles.footer}>
              Thank you for choosing {companyName}. We look forward to helping you succeed!
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const styles = {
  body: {
    backgroundColor: '#f9fafb',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
    padding: '20px 0',
  },
  container: {
    margin: '0 auto',
    padding: '32px',
    maxWidth: '580px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  },
  heading: {
    fontSize: '24px',
    lineHeight: '1.25',
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
  text: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#374151',
    marginBottom: '16px',
  },
  button: {
    backgroundColor: '#0ea5e9', // Tailwind sky-500
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '500',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '10px 16px',
    marginBottom: '24px',
    marginTop: '24px',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  },
  hr: {
    borderColor: '#e5e7eb',
    margin: '24px 0',
  },
  footer: {
    fontSize: '14px',
    lineHeight: '20px',
    color: '#6b7280',
    marginBottom: '8px',
    textAlign: 'center' as const,
  },
  link: {
    color: '#0ea5e9', // Tailwind sky-500
    textDecoration: 'underline',
  },
  list: {
    marginBottom: '24px',
    paddingLeft: '24px',
  },
  listItem: {
    fontSize: '16px',
    lineHeight: '24px',
    color: '#374151',
    marginBottom: '8px',
  },
}; 