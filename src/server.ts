import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createLogger } from './utils/logger.js';
import { verifySlackSignature } from './utils/slack-verification.js';
import { processSlackEvent } from './handlers/slack-events.js';
import { processSlackCommand } from './handlers/slack-commands.js';
import { processAskF8 } from './handlers/ask-f8.js';
import { routeToAgent } from './services/agent-router.js';

// Load environment variables
dotenv.config();

const app = express();
const logger = createLogger();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'F8 Slackbot Microservice',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================================================
// SLACK EVENTS API
// ============================================================================

app.post('/api/slack/events', async (req, res) => {
  try {
    // Verify Slack signature
    const signature = req.get('X-Slack-Signature');
    const timestamp = req.get('X-Slack-Request-Timestamp');
    
    if (!signature || !timestamp) {
      logger.warn('Missing Slack signature or timestamp');
      return res.status(400).json({ error: 'Missing required headers' });
    }

    if (!verifySlackSignature(req.body, signature, timestamp)) {
      logger.warn('Invalid Slack signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { type, event } = req.body;

    // Handle URL verification
    if (type === 'url_verification') {
      logger.info('Slack URL verification request');
      return res.json({ challenge: req.body.challenge });
    }

    // Handle event callback
    if (type === 'event_callback' && event) {
      logger.info('Processing Slack event', { eventType: event.type });
      
      // Process asynchronously to avoid timeout
      processSlackEvent(event)
        .then((response) => {
          if (response.success) {
            logger.success('Slack event processed successfully', {
              channel: event.channel,
              user: event.user,
              eventType: event.type
            });
          }
        })
        .catch((error) => {
          logger.error('Error processing Slack event:', error);
        });
    }

    res.status(200).send('OK');
  } catch (error) {
    logger.error('Error in Slack events endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// SLACK COMMANDS API
// ============================================================================

app.post('/api/slack/commands', async (req, res) => {
  try {
    // Verify Slack signature
    const signature = req.get('X-Slack-Signature');
    const timestamp = req.get('X-Slack-Request-Timestamp');
    
    if (!signature || !timestamp) {
      logger.warn('Missing Slack signature or timestamp for command');
      return res.status(400).json({ error: 'Missing required headers' });
    }

    if (!verifySlackSignature(req.body, signature, timestamp)) {
      logger.warn('Invalid Slack signature for command');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { text, channel_id, user_id } = req.body;

    if (!text) {
      return res.json({
        response_type: 'ephemeral',
        text: 'Please provide a question or command. Usage: /f8 [question]',
      });
    }

    logger.info('Processing Slack command', { 
      text: text.substring(0, 100), 
      channel: channel_id, 
      user: user_id 
    });

    const response = await processSlackCommand({
      text,
      channel_id,
      user_id
    });

    res.json(response);
  } catch (error) {
    logger.error('Error in Slack commands endpoint:', error);
    res.json({
      response_type: 'ephemeral',
      text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
});

// ============================================================================
// ASK F8 API
// ============================================================================

app.post('/api/slack/ask-f8', async (req, res) => {
  try {
    const { question, channel, user } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: 'Question is required',
      });
    }

    logger.info('Processing Ask F8 request', { 
      question: question.substring(0, 100), 
      channel, 
      user 
    });

    const result = await processAskF8({
      question,
      channel,
      user
    });

    res.json(result);
  } catch (error) {
    logger.error('Error in Ask F8 endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path
  });
});

app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`F8 Slackbot Microservice running on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});