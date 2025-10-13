import { processSlackEvent, SlackEvent } from '../../../handlers/slack-events.js';
import { routeToAgent } from '../../../services/agent-router.js';

// Mock dependencies
jest.mock('../../../services/agent-router.js');
jest.mock('../../../utils/logger.js', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    success: jest.fn(),
  }),
}));

const mockRouteToAgent = routeToAgent as jest.MockedFunction<typeof routeToAgent>;

describe('Slack Events Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processSlackEvent', () => {
    it('should process app_mention event successfully', async () => {
      const mockEvent: SlackEvent = {
        type: 'app_mention',
        text: '<@U1234567890> What are cannabis regulations?',
        channel: 'C1234567890',
        user: 'U9876543210',
        ts: '1234567890.123456',
      };

      mockRouteToAgent.mockResolvedValue({
        success: true,
        message: 'Cannabis regulations vary by jurisdiction...',
        agent: 'compliance-agent',
        timestamp: new Date().toISOString(),
      });

      const result = await processSlackEvent(mockEvent);

      expect(result.success).toBe(true);
      expect(mockRouteToAgent).toHaveBeenCalledWith({
        message: 'What are cannabis regulations?',
        user_id: 'U9876543210',
        context: {
          channel: 'C1234567890',
          thread_ts: '1234567890.123456',
          event_type: 'app_mention',
        },
      });
    });

    it('should process message event successfully', async () => {
      const mockEvent: SlackEvent = {
        type: 'message',
        text: 'Hello, how can I help?',
        channel: 'C1234567890',
        user: 'U9876543210',
        ts: '1234567890.123456',
      };

      mockRouteToAgent.mockResolvedValue({
        success: true,
        message: 'Hello! I can help with compliance questions.',
        agent: 'customer-success-agent',
        timestamp: new Date().toISOString(),
      });

      const result = await processSlackEvent(mockEvent);

      expect(result.success).toBe(true);
      expect(mockRouteToAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Hello, how can I help?',
          user_id: 'U9876543210',
        })
      );
    });

    it('should ignore non-app_mention and non-message events', async () => {
      const mockEvent: SlackEvent = {
        type: 'reaction_added',
        user: 'U1234567890',
      };

      const result = await processSlackEvent(mockEvent);

      expect(result.success).toBe(true);
      expect(mockRouteToAgent).not.toHaveBeenCalled();
    });

    it('should skip bot messages to avoid loops', async () => {
      const mockEvent: SlackEvent = {
        type: 'message',
        text: 'Bot response',
        subtype: 'bot_message',
        channel: 'C1234567890',
        user: 'U9876543210',
        ts: '1234567890.123456',
      };

      const result = await processSlackEvent(mockEvent);

      expect(result.success).toBe(true);
      expect(mockRouteToAgent).not.toHaveBeenCalled();
    });

    it('should handle empty or missing text', async () => {
      const mockEvent: SlackEvent = {
        type: 'app_mention',
        text: '<@U1234567890>   ',
        channel: 'C1234567890',
        user: 'U9876543210',
        ts: '1234567890.123456',
      };

      const result = await processSlackEvent(mockEvent);

      expect(result.success).toBe(true);
      expect(mockRouteToAgent).not.toHaveBeenCalled();
    });

    it('should handle agent routing failure', async () => {
      const mockEvent: SlackEvent = {
        type: 'app_mention',
        text: '<@U1234567890> Test question',
        channel: 'C1234567890',
        user: 'U9876543210',
        ts: '1234567890.123456',
      };

      mockRouteToAgent.mockResolvedValue({
        success: false,
        message: 'No suitable agent found',
        timestamp: new Date().toISOString(),
      });

      const result = await processSlackEvent(mockEvent);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No suitable agent found');
    });

    it('should handle errors gracefully', async () => {
      const mockEvent: SlackEvent = {
        type: 'app_mention',
        text: '<@U1234567890> Test question',
        channel: 'C1234567890',
        user: 'U9876543210',
        ts: '1234567890.123456',
      };

      mockRouteToAgent.mockRejectedValue(new Error('Network error'));

      const result = await processSlackEvent(mockEvent);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error processing event');
    });

    it('should properly extract question from text with mentions', async () => {
      const mockEvent: SlackEvent = {
        type: 'app_mention',
        text: '<@U1234567890> <@U0987654321> What are the requirements?',
        channel: 'C1234567890',
        user: 'U9876543210',
        ts: '1234567890.123456',
      };

      mockRouteToAgent.mockResolvedValue({
        success: true,
        message: 'Response',
        timestamp: new Date().toISOString(),
      });

      await processSlackEvent(mockEvent);

      expect(mockRouteToAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'What are the requirements?',
        })
      );
    });

    it('should handle missing optional fields', async () => {
      const mockEvent: SlackEvent = {
        type: 'app_mention',
        text: '<@U1234567890> Test question',
      };

      mockRouteToAgent.mockResolvedValue({
        success: true,
        message: 'Response',
        timestamp: new Date().toISOString(),
      });

      const result = await processSlackEvent(mockEvent);

      expect(result.success).toBe(true);
      expect(mockRouteToAgent).toHaveBeenCalledWith({
        message: 'Test question',
        user_id: 'unknown',
        context: {
          event_type: 'app_mention',
        },
      });
    });
  });
});
