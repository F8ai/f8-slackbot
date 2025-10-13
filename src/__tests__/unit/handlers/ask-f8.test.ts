import { processAskF8, AskF8Request } from '../../../handlers/ask-f8.js';
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

describe('Ask F8 Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processAskF8', () => {
    it('should process ask F8 request successfully with full response', async () => {
      const mockRequest: AskF8Request = {
        question: 'What are cannabis regulations?',
        channel: '#general',
        user: 'test_user',
      };

      const mockTimestamp = new Date().toISOString();
      mockRouteToAgent.mockResolvedValue({
        success: true,
        message: 'Cannabis regulations vary by jurisdiction...',
        agent: 'compliance-agent',
        usage: {
          total_tokens: 150,
          cost: 0.0025,
          model: 'gpt-4',
        },
        timestamp: mockTimestamp,
      });

      const result = await processAskF8(mockRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Cannabis regulations vary by jurisdiction...');
      expect(result.agent).toBe('compliance-agent');
      expect(result.usage).toEqual({
        total_tokens: 150,
        cost: 0.0025,
        model: 'gpt-4',
      });
      expect(result.timestamp).toBe(mockTimestamp);
    });

    it('should process ask F8 request successfully without usage info', async () => {
      const mockRequest: AskF8Request = {
        question: 'Simple question',
        channel: '#test',
        user: 'user123',
      };

      mockRouteToAgent.mockResolvedValue({
        success: true,
        message: 'Simple answer',
        timestamp: new Date().toISOString(),
      });

      const result = await processAskF8(mockRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Simple answer');
      expect(result.agent).toBeUndefined();
      expect(result.usage).toBeUndefined();
      expect(result.timestamp).toBeDefined();
    });

    it('should handle agent routing failure', async () => {
      const mockRequest: AskF8Request = {
        question: 'Invalid question',
        channel: '#test',
        user: 'user123',
      };

      mockRouteToAgent.mockResolvedValue({
        success: false,
        message: 'No suitable agent found',
        timestamp: new Date().toISOString(),
      });

      const result = await processAskF8(mockRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No suitable agent found');
    });

    it('should handle errors gracefully', async () => {
      const mockRequest: AskF8Request = {
        question: 'Test question',
        channel: '#test',
        user: 'user123',
      };

      mockRouteToAgent.mockRejectedValue(new Error('Network error'));

      const result = await processAskF8(mockRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error processing request. Please try again later.');
      expect(result.timestamp).toBeDefined();
    });

    it('should pass correct context to agent router', async () => {
      const mockRequest: AskF8Request = {
        question: 'Test question',
        channel: '#general',
        user: 'test_user',
      };

      mockRouteToAgent.mockResolvedValue({
        success: true,
        message: 'Response',
        timestamp: new Date().toISOString(),
      });

      await processAskF8(mockRequest);

      expect(mockRouteToAgent).toHaveBeenCalledWith({
        message: 'Test question',
        user_id: 'test_user',
        context: {
          channel: '#general',
          ask_f8: true,
        },
      });
    });

    it('should generate timestamp if not provided by agent', async () => {
      const mockRequest: AskF8Request = {
        question: 'Test question',
        channel: '#test',
        user: 'user123',
      };

      mockRouteToAgent.mockResolvedValue({
        success: true,
        message: 'Response without timestamp',
      });

      const result = await processAskF8(mockRequest);

      expect(result.success).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp!).toString()).not.toBe('Invalid Date');
    });

    it('should handle long questions correctly', async () => {
      const longQuestion = 'A'.repeat(1000);
      const mockRequest: AskF8Request = {
        question: longQuestion,
        channel: '#test',
        user: 'user123',
      };

      mockRouteToAgent.mockResolvedValue({
        success: true,
        message: 'Response',
        timestamp: new Date().toISOString(),
      });

      const result = await processAskF8(mockRequest);

      expect(result.success).toBe(true);
      expect(mockRouteToAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          message: longQuestion,
        })
      );
    });

    it('should handle special characters in channel and user', async () => {
      const mockRequest: AskF8Request = {
        question: 'Test question',
        channel: '#test-channel_123',
        user: 'user.name+test@example',
      };

      mockRouteToAgent.mockResolvedValue({
        success: true,
        message: 'Response',
        timestamp: new Date().toISOString(),
      });

      const result = await processAskF8(mockRequest);

      expect(result.success).toBe(true);
      expect(mockRouteToAgent).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user.name+test@example',
          context: expect.objectContaining({
            channel: '#test-channel_123',
          }),
        })
      );
    });
  });
});
