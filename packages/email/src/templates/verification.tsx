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

interface VerificationEmailProps {
  userName: string;
  verificationUrl: string;
  companyName?: string;
  expiryHours?: number;
}

export const VerificationEmail = ({
  userName,
  verificationUrl,
  companyName = 'Databuddy',
  expiryHours = 24,
}: VerificationEmailProps) => {
  const previewText = `Verify your email address for ${companyName}`;

  return (
    <Html lang="en">
      <Head>
        <meta content="text/html; charset=UTF-8" httpEquiv="Content-Type" />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading style={styles.heading}>{companyName}</Heading>
          <Section>
            <Text style={styles.text}>Hello {userName},</Text>
            <Text style={styles.text}>
              Thank you for signing up with {companyName}. To complete your registration, 
              please verify your email address by clicking the button below:
            </Text>
            <Button style={styles.button} href={verificationUrl}>
              Verify Email Address
            </Button>
            <Text style={styles.text}>
              This verification link will expire in {expiryHours} hours.
            </Text>
            <Text style={styles.text}>
              If you did not create an account, you can safely ignore this email.
            </Text>
            <Hr style={styles.hr} />
            <Text style={styles.footer}>
              If the button above doesn't work, please copy and paste the following link into your browser:
            </Text>
            <Text style={styles.link}>
              <Link href={verificationUrl} style={styles.link}>
                {verificationUrl}
              </Link>
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
  },
  link: {
    color: '#0ea5e9', // Tailwind sky-500
    textDecoration: 'underline',
    fontSize: '14px',
    lineHeight: '20px',
    wordBreak: 'break-all' as const,
  },
}; 