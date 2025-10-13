import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'crypto';

// Create a test app instance
function createTestApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Import handlers (mocked in tests)
  const mockProcessSlackEvent = jest.fn();
  const mockProcessSlackCommand = jest.fn();
  const mockProcessAskF8 = jest.fn();
  const mockVerifySlackSignature = jest.fn();

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'F8 Slackbot Microservice',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // Slack events endpoint
  app.post('/api/slack/events', async (req, res) => {
    try {
      const signature = req.get('X-Slack-Signature');
      const timestamp = req.get('X-Slack-Request-Timestamp');
      
      if (!signature || !timestamp) {
        return res.status(400).json({ error: 'Missing required headers' });
      }

      if (!mockVerifySlackSignature(req.body, signature, timestamp)) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const { type, event } = req.body;

      if (type === 'url_verification') {
        return res.json({ challenge: req.body.challenge });
      }

      if (type === 'event_callback' && event) {
        mockProcessSlackEvent(event).catch(() => {});
      }

      return res.status(200).send('OK');
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Slack commands endpoint
  app.post('/api/slack/commands', async (req, res) => {
    try {
      const signature = req.get('X-Slack-Signature');
      const timestamp = req.get('X-Slack-Request-Timestamp');
      
      if (!signature || !timestamp) {
        return res.status(400).json({ error: 'Missing required headers' });
      }

      if (!mockVerifySlackSignature(req.body, signature, timestamp)) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const { text } = req.body;

      if (!text) {
        return res.json({
          response_type: 'ephemeral',
          text: 'Please provide a question or command. Usage: /f8 [question]',
        });
      }

      const response = await mockProcessSlackCommand(req.body);
      return res.json(response);
    } catch (error) {
      return res.json({
        response_type: 'ephemeral',
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  });

  // Ask F8 endpoint
  app.post('/api/slack/ask-f8', async (req, res) => {
    try {
      const { question } = req.body;

      if (!question) {
        return res.status(400).json({
          success: false,
          message: 'Question is required',
        });
      }

      const result = await mockProcessAskF8(req.body);
      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint not found',
      path: req.path
    });
  });

  return {
    app,
    mocks: {
      processSlackEvent: mockProcessSlackEvent,
      processSlackCommand: mockProcessSlackCommand,
      processAskF8: mockProcessAskF8,
      verifySlackSignature: mockVerifySlackSignature,
    }
  };
}

describe('API Endpoints Integration Tests', () => {
  let testApp: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    testApp = createTestApp();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(testApp.app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('F8 Slackbot Microservice');
      expect(response.body.version).toBe('1.0.0');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });

  describe('POST /api/slack/events', () => {
    it('should handle URL verification', async () => {
      testApp.mocks.verifySlackSignature.mockReturnValue(true);

      const response = await request(testApp.app)
        .post('/api/slack/events')
        .set('X-Slack-Signature', 'v0=test_signature')
        .set('X-Slack-Request-Timestamp', Math.floor(Date.now() / 1000).toString())
        .send({
          type: 'url_verification',
          challenge: 'test_challenge_123'
        })
        .expect(200);

      expect(response.body.challenge).toBe('test_challenge_123');
    });

    it('should handle event callback', async () => {
      testApp.mocks.verifySlackSignature.mockReturnValue(true);
      testApp.mocks.processSlackEvent.mockResolvedValue({ success: true });

      const response = await request(testApp.app)
        .post('/api/slack/events')
        .set('X-Slack-Signature', 'v0=test_signature')
        .set('X-Slack-Request-Timestamp', Math.floor(Date.now() / 1000).toString())
        .send({
          type: 'event_callback',
          event: {
            type: 'app_mention',
            text: '<@U1234567890> hello',
            channel: 'C1234567890',
            user: 'U9876543210',
            ts: '1234567890.123456'
          }
        })
        .expect(200);

      expect(response.text).toBe('OK');
    });

    it('should reject request without signature headers', async () => {
      const response = await request(testApp.app)
        .post('/api/slack/events')
        .send({
          type: 'event_callback',
          event: { type: 'app_mention' }
        })
        .expect(400);

      expect(response.body.error).toBe('Missing required headers');
    });

    it('should reject request with invalid signature', async () => {
      testApp.mocks.verifySlackSignature.mockReturnValue(false);

      const response = await request(testApp.app)
        .post('/api/slack/events')
        .set('X-Slack-Signature', 'v0=invalid_signature')
        .set('X-Slack-Request-Timestamp', Math.floor(Date.now() / 1000).toString())
        .send({
          type: 'event_callback',
          event: { type: 'app_mention' }
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid signature');
    });
  });

  describe('POST /api/slack/commands', () => {
    it('should process slash command successfully', async () => {
      testApp.mocks.verifySlackSignature.mockReturnValue(true);
      testApp.mocks.processSlackCommand.mockResolvedValue({
        response_type: 'in_channel',
        text: 'Command response',
        attachments: []
      });

      const response = await request(testApp.app)
        .post('/api/slack/commands')
        .set('X-Slack-Signature', 'v0=test_signature')
        .set('X-Slack-Request-Timestamp', Math.floor(Date.now() / 1000).toString())
        .send({
          text: 'What are cannabis regulations?',
          channel_id: 'C1234567890',
          user_id: 'U9876543210'
        })
        .expect(200);

      expect(response.body.response_type).toBe('in_channel');
      expect(response.body.text).toBe('Command response');
    });

    it('should return usage message for empty command', async () => {
      testApp.mocks.verifySlackSignature.mockReturnValue(true);

      const response = await request(testApp.app)
        .post('/api/slack/commands')
        .set('X-Slack-Signature', 'v0=test_signature')
        .set('X-Slack-Request-Timestamp', Math.floor(Date.now() / 1000).toString())
        .send({
          text: '',
          channel_id: 'C1234567890',
          user_id: 'U9876543210'
        })
        .expect(200);

      expect(response.body.response_type).toBe('ephemeral');
      expect(response.body.text).toContain('Usage: /f8 [question]');
    });

    it('should reject request without signature headers', async () => {
      const response = await request(testApp.app)
        .post('/api/slack/commands')
        .send({
          text: 'test command',
          channel_id: 'C1234567890',
          user_id: 'U9876543210'
        })
        .expect(400);

      expect(response.body.error).toBe('Missing required headers');
    });

    it('should reject request with invalid signature', async () => {
      testApp.mocks.verifySlackSignature.mockReturnValue(false);

      const response = await request(testApp.app)
        .post('/api/slack/commands')
        .set('X-Slack-Signature', 'v0=invalid_signature')
        .set('X-Slack-Request-Timestamp', Math.floor(Date.now() / 1000).toString())
        .send({
          text: 'test command',
          channel_id: 'C1234567890',
          user_id: 'U9876543210'
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid signature');
    });
  });

  describe('POST /api/slack/ask-f8', () => {
    it('should process Ask F8 request successfully', async () => {
      testApp.mocks.processAskF8.mockResolvedValue({
        success: true,
        message: 'Here is the answer...',
        agent: 'compliance-agent',
        timestamp: new Date().toISOString()
      });

      const response = await request(testApp.app)
        .post('/api/slack/ask-f8')
        .send({
          question: 'What are cannabis regulations?',
          channel: '#general',
          user: 'test_user'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Here is the answer...');
      expect(response.body.agent).toBe('compliance-agent');
    });

    it('should reject request without question', async () => {
      const response = await request(testApp.app)
        .post('/api/slack/ask-f8')
        .send({
          channel: '#general',
          user: 'test_user'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Question is required');
    });

    it('should handle processing errors', async () => {
      testApp.mocks.processAskF8.mockRejectedValue(new Error('Processing error'));

      const response = await request(testApp.app)
        .post('/api/slack/ask-f8')
        .send({
          question: 'Test question',
          channel: '#general',
          user: 'test_user'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');
    });
  });

  describe('404 Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(testApp.app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Endpoint not found');
      expect(response.body.path).toBe('/nonexistent');
    });

    it('should return 404 for POST to non-existent endpoints', async () => {
      const response = await request(testApp.app)
        .post('/api/invalid')
        .send({})
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Endpoint not found');
    });
  });

  describe('CORS and Security Headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(testApp.app)
        .get('/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should include security headers from helmet', async () => {
      const response = await request(testApp.app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });
});
