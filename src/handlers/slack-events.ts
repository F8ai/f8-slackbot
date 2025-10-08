import { routeToAgent } from '../services/agent-router.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

export interface SlackEvent {
  type: string;
  text?: string;
  channel?: string;
  user?: string;
  ts?: string;
  thread_ts?: string;
  [key: string]: any;
}

export async function processSlackEvent(event: SlackEvent): Promise<{ success: boolean; message?: string }> {
  try {
    // Only process app mentions and messages
    if (event.type !== 'app_mention' && event.type !== 'message') {
      logger.info('Ignoring event type', { eventType: event.type });
      return { success: true };
    }

    // Skip bot messages to avoid loops
    if (event.subtype === 'bot_message') {
      logger.info('Skipping bot message');
      return { success: true };
    }

    // Extract question from message text
    const question = event.text?.replace(/<@[^>]+>/g, '').trim();
    
    if (!question) {
      logger.info('No question found in event');
      return { success: true };
    }

    logger.info('Processing Slack event', {
      eventType: event.type,
      channel: event.channel,
      user: event.user,
      questionLength: question.length
    });

    // Route to appropriate agent
    const response = await routeToAgent({
      message: question,
      user_id: event.user || 'unknown',
      context: {
        channel: event.channel || undefined,
        thread_ts: event.ts || undefined,
        event_type: event.type
      }
    });

    if (response.success) {
      // In a real implementation, you would send the response back to Slack
      // For now, we just log it
      logger.success('Slack event processed successfully', {
        channel: event.channel,
        user: event.user,
        agent: response.agent,
        responseLength: response.message.length
      });
    } else {
      logger.warn('Failed to process Slack event', {
        channel: event.channel,
        user: event.user,
        error: response.message
      });
    }

    return { success: response.success, message: response.message };
  } catch (error) {
    logger.error('Error processing Slack event:', error);
    return { success: false, message: 'Error processing event' };
  }
}