import { routeToAgent } from '../services/agent-router.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

export interface SlackCommandRequest {
  text: string;
  channel_id: string;
  user_id: string;
}

export interface SlackCommandResponse {
  response_type: 'in_channel' | 'ephemeral';
  text: string;
  attachments?: Array<{
    color: string;
    footer: string;
  }>;
}

export async function processSlackCommand(request: SlackCommandRequest): Promise<SlackCommandResponse> {
  try {
    const { text, channel_id, user_id } = request;

    logger.info('Processing Slack command', {
      text: text.substring(0, 100),
      channel: channel_id,
      user: user_id
    });

    // Route to appropriate agent
    const response = await routeToAgent({
      message: text,
      user_id,
      context: {
        channel: channel_id,
        command: true
      }
    });

    if (response.success) {
      return {
        response_type: 'in_channel',
        text: response.message,
        attachments: response.usage ? [
          {
            color: 'good',
            footer: `F8 AI Platform • ${response.agent} • ${response.usage.total_tokens} tokens • $${response.usage.cost.toFixed(4)} • ${response.usage.model}`
          }
        ] : []
      };
    } else {
      return {
        response_type: 'ephemeral',
        text: `Error: ${response.message}`
      };
    }
  } catch (error) {
    logger.error('Error processing Slack command:', error);
    return {
      response_type: 'ephemeral',
      text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}