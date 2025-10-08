import crypto from 'crypto';

export function verifySlackSignature(
  body: string | Buffer,
  signature: string,
  timestamp: string
): boolean {
  const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
  
  if (!slackSigningSecret) {
    console.error('SLACK_SIGNING_SECRET not configured');
    return false;
  }

  // Check timestamp to prevent replay attacks
  const currentTime = Math.floor(Date.now() / 1000);
  const requestTime = parseInt(timestamp, 10);
  
  if (Math.abs(currentTime - requestTime) > 300) { // 5 minutes
    console.warn('Request timestamp too old');
    return false;
  }

  // Create signature
  const sigBaseString = `v0:${timestamp}:${body}`;
  const expectedSignature = 'v0=' + crypto
    .createHmac('sha256', slackSigningSecret)
    .update(sigBaseString)
    .digest('hex');

  // Compare signatures using timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}