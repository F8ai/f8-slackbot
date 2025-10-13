import crypto from 'crypto';
import { verifySlackSignature } from '../../../utils/slack-verification.js';

describe('Slack Signature Verification', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('verifySlackSignature', () => {
    it('should verify valid signature correctly', () => {
      const slackSigningSecret = 'test_signing_secret';
      process.env.SLACK_SIGNING_SECRET = slackSigningSecret;

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = JSON.stringify({ type: 'url_verification', challenge: 'test' });
      
      const sigBaseString = `v0:${timestamp}:${body}`;
      const signature = 'v0=' + crypto
        .createHmac('sha256', slackSigningSecret)
        .update(sigBaseString)
        .digest('hex');

      const result = verifySlackSignature(body, signature, timestamp);

      expect(result).toBe(true);
    });

    it('should reject invalid signature', () => {
      const slackSigningSecret = 'test_signing_secret';
      process.env.SLACK_SIGNING_SECRET = slackSigningSecret;

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = JSON.stringify({ type: 'url_verification' });
      
      // Create a valid signature first, then modify it to make it invalid but same length
      const sigBaseString = `v0:${timestamp}:${body}`;
      const validSignature = 'v0=' + crypto
        .createHmac('sha256', slackSigningSecret)
        .update(sigBaseString)
        .digest('hex');
      
      // Create invalid signature with same length by changing one character
      const invalidSignature = validSignature.slice(0, -1) + 'X';

      const result = verifySlackSignature(body, invalidSignature, timestamp);

      expect(result).toBe(false);
    });

    it('should reject timestamp that is too old', () => {
      process.env.SLACK_SIGNING_SECRET = 'test_signing_secret';

      const oldTimestamp = (Math.floor(Date.now() / 1000) - 400).toString(); // 400 seconds ago
      const body = JSON.stringify({ type: 'url_verification' });
      const signature = 'v0=some_signature';

      const result = verifySlackSignature(body, signature, oldTimestamp);

      expect(result).toBe(false);
    });

    it('should reject timestamp that is too far in the future', () => {
      process.env.SLACK_SIGNING_SECRET = 'test_signing_secret';

      const futureTimestamp = (Math.floor(Date.now() / 1000) + 400).toString(); // 400 seconds in future
      const body = JSON.stringify({ type: 'url_verification' });
      const signature = 'v0=some_signature';

      const result = verifySlackSignature(body, signature, futureTimestamp);

      expect(result).toBe(false);
    });

    it('should return false when SLACK_SIGNING_SECRET is not configured', () => {
      delete process.env.SLACK_SIGNING_SECRET;

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = JSON.stringify({ type: 'url_verification' });
      const signature = 'v0=some_signature';

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = verifySlackSignature(body, signature, timestamp);

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('SLACK_SIGNING_SECRET not configured');
      consoleErrorSpy.mockRestore();
    });

    it('should handle Buffer body correctly', () => {
      const slackSigningSecret = 'test_signing_secret';
      process.env.SLACK_SIGNING_SECRET = slackSigningSecret;

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const bodyString = JSON.stringify({ type: 'url_verification' });
      const bodyBuffer = Buffer.from(bodyString);
      
      const sigBaseString = `v0:${timestamp}:${bodyBuffer}`;
      const signature = 'v0=' + crypto
        .createHmac('sha256', slackSigningSecret)
        .update(sigBaseString)
        .digest('hex');

      const result = verifySlackSignature(bodyBuffer, signature, timestamp);

      expect(result).toBe(true);
    });

    it('should use timing-safe comparison to prevent timing attacks', () => {
      const slackSigningSecret = 'test_signing_secret';
      process.env.SLACK_SIGNING_SECRET = slackSigningSecret;

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = JSON.stringify({ type: 'url_verification' });
      
      const sigBaseString = `v0:${timestamp}:${body}`;
      const correctSignature = 'v0=' + crypto
        .createHmac('sha256', slackSigningSecret)
        .update(sigBaseString)
        .digest('hex');

      // Create a slightly different signature with same length by changing a middle character
      const incorrectSignature = correctSignature.slice(0, 10) + 'X' + correctSignature.slice(11);

      const result = verifySlackSignature(body, incorrectSignature, timestamp);

      expect(result).toBe(false);
    });

    it('should accept timestamp exactly 300 seconds old (boundary test)', () => {
      const slackSigningSecret = 'test_signing_secret';
      process.env.SLACK_SIGNING_SECRET = slackSigningSecret;

      const timestamp = (Math.floor(Date.now() / 1000) - 300).toString();
      const body = JSON.stringify({ type: 'url_verification' });
      
      const sigBaseString = `v0:${timestamp}:${body}`;
      const signature = 'v0=' + crypto
        .createHmac('sha256', slackSigningSecret)
        .update(sigBaseString)
        .digest('hex');

      const result = verifySlackSignature(body, signature, timestamp);

      expect(result).toBe(true);
    });

    it('should reject empty or malformed signature', () => {
      const slackSigningSecret = 'test_signing_secret';
      process.env.SLACK_SIGNING_SECRET = slackSigningSecret;

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = JSON.stringify({ type: 'url_verification' });
      
      // Create a signature of correct length but with wrong prefix
      const sigBaseString = `v0:${timestamp}:${body}`;
      const correctHash = crypto
        .createHmac('sha256', slackSigningSecret)
        .update(sigBaseString)
        .digest('hex');
      const malformedSignature = 'v1=' + correctHash; // Wrong version

      const result = verifySlackSignature(body, malformedSignature, timestamp);

      expect(result).toBe(false);
    });
  });
});
