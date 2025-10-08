import { routeToAgent } from '../services/agent-router.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

export interface AskF8Request {
  question: string;
  channel: string;
  user: string;
}

export interface AskF8Response {
  success: boolean;
  message: string;
  agent?: string;
  usage?: {
    total_tokens: number;
    cost: number;
    model: string;
  };
  timestamp?: string;
}

export async function processAskF8(request: AskF8Request): Promise<AskF8Response> {
  try {
    const { question, channel, user } = request;

    logger.info('Processing Ask F8 request', {
      question: question.substring(0, 100),
      channel,
      user
    });

    // Route to appropriate agent
    const response = await routeToAgent({
      message: question,
      user_id: user,
      context: {
        channel,
        ask_f8: true
      }
    });

    return {
      success: response.success,
      message: response.message,
      ...(response.agent && { agent: response.agent }),
      ...(response.usage && { usage: response.usage }),
      timestamp: response.timestamp || new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error processing Ask F8 request:', error);
    return {
      success: false,
      message: 'Error processing request. Please try again later.',
      timestamp: new Date().toISOString()
    };
  }
}