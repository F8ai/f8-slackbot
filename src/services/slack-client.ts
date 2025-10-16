import { WebClient } from '@slack/web-api';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

export class SlackClient {
  private client: WebClient;

  constructor() {
    const token = process.env.SLACK_BOT_TOKEN;
    
    if (!token) {
      logger.warn('SLACK_BOT_TOKEN not configured - Slack posting disabled');
      throw new Error('SLACK_BOT_TOKEN is required');
    }
    
    this.client = new WebClient(token);
    logger.info('Slack client initialized');
  }

  /**
   * Post a message to a Slack channel
   */
  async postMessage(channel: string, text: string, options: any = {}) {
    try {
      const result = await this.client.chat.postMessage({
        channel,
        text,
        ...options
      });

      logger.success('Message posted to Slack', {
        channel,
        ts: result.ts,
        textLength: text.length
      });

      return { success: true, ts: result.ts };
    } catch (error: any) {
      logger.error('Failed to post message to Slack:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  /**
   * Post a threaded reply
   */
  async postThreadReply(channel: string, threadTs: string, text: string, options: any = {}) {
    try {
      const result = await this.client.chat.postMessage({
        channel,
        thread_ts: threadTs,
        text,
        ...options
      });

      logger.success('Thread reply posted to Slack', {
        channel,
        threadTs,
        ts: result.ts
      });

      return { success: true, ts: result.ts };
    } catch (error: any) {
      logger.error('Failed to post thread reply to Slack:', error);
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  /**
   * Format F8 agent response for Slack
   */
  formatAgentResponse(agent: string, response: string, metadata?: any) {
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: response
        }
      }
    ];

    // Add metadata context
    if (metadata) {
      (blocks as any).push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `🤖 *Agent:* ${agent} | ⚡ *Response Time:* ${metadata.responseTime || 'N/A'}ms`
          }
        ]
      });
    }

    return { blocks };
  }
}

// Singleton instance
let slackClientInstance: SlackClient | null = null;

export function getSlackClient(): SlackClient {
  if (!slackClientInstance) {
    try {
      slackClientInstance = new SlackClient();
    } catch (error: any) {
      logger.warn('Slack client not available:', error?.message || 'Unknown error');
      throw error;
    }
  }
  return slackClientInstance;
}

