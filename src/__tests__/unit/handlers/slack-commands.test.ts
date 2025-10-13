import { processSlackCommand, SlackCommandRequest } from '../../../handlers/slack-commands.js';
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

describe('Slack Commands Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processSlackCommand', () => {
    it('should process command successfully with usage info', async () => {
      const mockRequest: SlackCommandRequest = {
        text: 'What are cannabis regulations?',
        channel_id: 'C1234567890',
        user_id: 'U9876543210',
      };

      mockRouteToAgent.mockResolvedValue({
        success: true,
        message: 'Cannabis regulations vary by jurisdiction...',
        agent: 'compliance-agent',
        usage: {
          total_tokens: 150,
          cost: 0.0025,
          model: 'gpt-4',
        },
        timestamp: new Date().toISOString(),
      });

      const result = await processSlackCommand(mockRequest);

      expect(result.response_type).toBe('in_channel');
      expect(result.text).toBe('Cannabis regulations vary by jurisdiction...');
      expect(result.attachments).toBeDefined();
      expect(result.attachments).toHaveLength(1);
      if (result.attachments && result.attachments[0]) {
        expect(result.attachments[0].color).toBe('good');
        expect(result.attachments[0].footer).toContain('compliance-agent');
        expect(result.attachments[0].footer).toContain('150 tokens');
        expect(result.attachments[0].footer).toContain('$0.0025');
        expect(result.attachments[0].footer).toContain('gpt-4');
      }
    });

    it('should process command successfully without usage info', async () => {
      const mockRequest: SlackCommandRequest = {
        text: 'Help me with something',
        channel_id: 'C1234567890',
        user_id: 'U9876543210',
      };

      mockRouteToAgent.mockResolvedValue({
        success: true,
        message: 'How can I help you?',
        agent: 'customer-success-agent',
        timestamp: new Date().toISOString(),
      });

      const result = await processSlackCommand(mockRequest);

      expect(result.response_type).toBe('in_channel');
      expect(result.text).toBe('How can I help you?');
      expect(result.attachments).toHaveLength(0);
    });

    it('should handle agent routing failure with ephemeral message', async () => {
      const mockRequest: SlackCommandRequest = {
        text: 'Invalid command',
        channel_id: 'C1234567890',
        user_id: 'U9876543210',
      };

      mockRouteToAgent.mockResolvedValue({
        success: false,
        message: 'No suitable agent found for this request',
        timestamp: new Date().toISOString(),
      });

      const result = await processSlackCommand(mockRequest);

      expect(result.response_type).toBe('ephemeral');
      expect(result.text).toBe('Error: No suitable agent found for this request');
    });

    it('should handle errors gracefully', async () => {
      const mockRequest: SlackCommandRequest = {
        text: 'Test command',
        channel_id: 'C1234567890',
        user_id: 'U9876543210',
      };

      mockRouteToAgent.mockRejectedValue(new Error('Network timeout'));

      const result = await processSlackCommand(mockRequest);

      expect(result.response_type).toBe('ephemeral');
      expect(result.text).toBe('Error: Network timeout');
    });

    it('should handle non-Error exceptions', async () => {
      const mockRequest: SlackCommandRequest = {
        text: 'Test command',
        channel_id: 'C1234567890',
        user_id: 'U9876543210',
      };

      mockRouteToAgent.mockRejectedValue('Unknown error');

      const result = await processSlackCommand(mockRequest);

      expect(result.response_type).toBe('ephemeral');
      expect(result.text).toBe('Error: Unknown error');
    });

    it('should pass correct context to agent router', async () => {
      const mockRequest: SlackCommandRequest = {
        text: 'Test question',
        channel_id: 'C1234567890',
        user_id: 'U9876543210',
      };

      mockRouteToAgent.mockResolvedValue({
        success: true,
        message: 'Response',
        timestamp: new Date().toISOString(),
      });

      await processSlackCommand(mockRequest);

      expect(mockRouteToAgent).toHaveBeenCalledWith({
        message: 'Test question',
        user_id: 'U9876543210',
        context: {
          channel: 'C1234567890',
          command: true,
        },
      });
    });

    it('should handle long text correctly', async () => {
      const longText = 'A'.repeat(500);
      const mockRequest: SlackCommandRequest = {
        text: longText,
        channel_id: 'C1234567890',
        user_id: 'U9876543210',
      };

      mockRouteToAgent.mockResolvedValue({
        success: true,
        message: 'Response',
        timestamp: new Date().toISOString(),
      });

      const result = await processSlackCommand(mockRequest);

      expect(result.response_type).toBe('in_channel');
      expect(mockRouteToAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          message: longText,
        })
      );
    });
  });
});
