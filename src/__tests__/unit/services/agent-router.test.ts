import axios from 'axios';
import { routeToAgent, AgentRequest } from '../../../services/agent-router.js';

// Mock dependencies
jest.mock('axios');
jest.mock('../../../utils/logger.js', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    success: jest.fn(),
  }),
}));

const mockAxios = axios as jest.Mocked<typeof axios>;

describe('Agent Router Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('routeToAgent', () => {
    it('should route via platform gateway when PLATFORM_GATEWAY_URL is set', async () => {
      process.env.PLATFORM_GATEWAY_URL = 'https://platform-gateway.example.com';

      const mockRequest: AgentRequest = {
        message: 'What are compliance requirements?',
        user_id: 'U1234567890',
        context: { channel: 'C1234567890' },
      };

      const mockResponse = {
        data: {
          success: true,
          message: 'Compliance requirements include...',
          agent: 'compliance-agent',
          timestamp: new Date().toISOString(),
        },
      };

      mockAxios.post.mockResolvedValue(mockResponse);

      const result = await routeToAgent(mockRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Compliance requirements include...');
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://platform-gateway.example.com/api/chat',
        {
          message: 'What are compliance requirements?',
          user_id: 'U1234567890',
          context: { channel: 'C1234567890' },
        },
        expect.objectContaining({
          timeout: 30000,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should fallback to direct routing when platform gateway fails', async () => {
      process.env.PLATFORM_GATEWAY_URL = 'https://platform-gateway.example.com';
      process.env.COMPLIANCE_AGENT_URL = 'https://compliance-agent.example.com';

      const mockRequest: AgentRequest = {
        message: 'What are compliance requirements?',
        user_id: 'U1234567890',
      };

      // First call (gateway) fails, second call (direct) succeeds
      mockAxios.post
        .mockRejectedValueOnce(new Error('Gateway timeout'))
        .mockResolvedValueOnce({
          data: {
            success: true,
            message: 'Direct response',
            timestamp: new Date().toISOString(),
          },
        });

      const result = await routeToAgent(mockRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Direct response');
      expect(mockAxios.post).toHaveBeenCalledTimes(2);
    });

    it('should route to compliance agent for compliance keywords', async () => {
      delete process.env.PLATFORM_GATEWAY_URL;
      process.env.COMPLIANCE_AGENT_URL = 'https://compliance-agent.example.com';

      const mockRequest: AgentRequest = {
        message: 'What are FDA regulations?',
        user_id: 'U1234567890',
      };

      mockAxios.post.mockResolvedValue({
        data: {
          success: true,
          message: 'FDA regulations...',
          timestamp: new Date().toISOString(),
        },
      });

      const result = await routeToAgent(mockRequest);

      expect(result.success).toBe(true);
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://compliance-agent.example.com/query',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should route to formulation agent for formulation keywords', async () => {
      delete process.env.PLATFORM_GATEWAY_URL;
      process.env.FORMULATION_AGENT_URL = 'https://formulation-agent.example.com';

      const mockRequest: AgentRequest = {
        message: 'What is the best recipe for this product?',
        user_id: 'U1234567890',
      };

      mockAxios.post.mockResolvedValue({
        data: {
          success: true,
          message: 'Recipe details...',
          timestamp: new Date().toISOString(),
        },
      });

      const result = await routeToAgent(mockRequest);

      expect(result.success).toBe(true);
      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://formulation-agent.example.com/query',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should route to science agent for research keywords', async () => {
      delete process.env.PLATFORM_GATEWAY_URL;
      process.env.SCIENCE_AGENT_URL = 'https://science-agent.example.com';

      const mockRequest: AgentRequest = {
        message: 'What does the research say about this?',
        user_id: 'U1234567890',
      };

      mockAxios.post.mockResolvedValue({
        data: {
          success: true,
          message: 'Research findings...',
          timestamp: new Date().toISOString(),
        },
      });

      await routeToAgent(mockRequest);

      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://science-agent.example.com/query',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should route to marketing agent for marketing keywords', async () => {
      delete process.env.PLATFORM_GATEWAY_URL;
      process.env.MARKETING_AGENT_URL = 'https://marketing-agent.example.com';

      const mockRequest: AgentRequest = {
        message: 'How should we brand this product?',
        user_id: 'U1234567890',
      };

      mockAxios.post.mockResolvedValue({
        data: {
          success: true,
          message: 'Branding recommendations...',
          timestamp: new Date().toISOString(),
        },
      });

      await routeToAgent(mockRequest);

      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://marketing-agent.example.com/query',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should route to customer success agent for support keywords', async () => {
      delete process.env.PLATFORM_GATEWAY_URL;
      process.env.CUSTOMER_SUCCESS_AGENT_URL = 'https://customer-success-agent.example.com';

      const mockRequest: AgentRequest = {
        message: 'I need help with my account',
        user_id: 'U1234567890',
      };

      mockAxios.post.mockResolvedValue({
        data: {
          success: true,
          message: 'I can help you with that...',
          timestamp: new Date().toISOString(),
        },
      });

      await routeToAgent(mockRequest);

      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://customer-success-agent.example.com/query',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should return error when no agent URL is configured', async () => {
      delete process.env.PLATFORM_GATEWAY_URL;
      // Don't set any agent URLs

      const mockRequest: AgentRequest = {
        message: 'Test question',
        user_id: 'U1234567890',
      };

      const result = await routeToAgent(mockRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('No suitable agent found for this request');
      expect(mockAxios.post).not.toHaveBeenCalled();
    });

    it('should handle agent routing errors gracefully', async () => {
      delete process.env.PLATFORM_GATEWAY_URL;
      process.env.COMPLIANCE_AGENT_URL = 'https://compliance-agent.example.com';

      const mockRequest: AgentRequest = {
        message: 'What are compliance requirements?',
        user_id: 'U1234567890',
      };

      mockAxios.post.mockRejectedValue(new Error('Network error'));

      const result = await routeToAgent(mockRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error processing request. Please try again later.');
      expect(result.timestamp).toBeDefined();
    });

    it('should pass context correctly to agent', async () => {
      delete process.env.PLATFORM_GATEWAY_URL;
      process.env.COMPLIANCE_AGENT_URL = 'https://compliance-agent.example.com';

      const mockRequest: AgentRequest = {
        message: 'What are regulations?',
        user_id: 'U1234567890',
        context: {
          channel: 'C1234567890',
          thread_ts: '1234567890.123456',
          custom_field: 'custom_value',
        },
      };

      mockAxios.post.mockResolvedValue({
        data: {
          success: true,
          message: 'Response',
          timestamp: new Date().toISOString(),
        },
      });

      await routeToAgent(mockRequest);

      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          context: {
            channel: 'C1234567890',
            thread_ts: '1234567890.123456',
            custom_field: 'custom_value',
          },
        }),
        expect.any(Object)
      );
    });

    it('should handle case-insensitive keyword matching', async () => {
      delete process.env.PLATFORM_GATEWAY_URL;
      process.env.COMPLIANCE_AGENT_URL = 'https://compliance-agent.example.com';

      const mockRequest: AgentRequest = {
        message: 'What are COMPLIANCE requirements?',
        user_id: 'U1234567890',
      };

      mockAxios.post.mockResolvedValue({
        data: {
          success: true,
          message: 'Response',
          timestamp: new Date().toISOString(),
        },
      });

      await routeToAgent(mockRequest);

      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://compliance-agent.example.com/query',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should default to compliance agent when no specific keywords match', async () => {
      delete process.env.PLATFORM_GATEWAY_URL;
      process.env.COMPLIANCE_AGENT_URL = 'https://compliance-agent.example.com';

      const mockRequest: AgentRequest = {
        message: 'Random question without specific keywords',
        user_id: 'U1234567890',
      };

      mockAxios.post.mockResolvedValue({
        data: {
          success: true,
          message: 'Response',
          timestamp: new Date().toISOString(),
        },
      });

      await routeToAgent(mockRequest);

      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://compliance-agent.example.com/query',
        expect.any(Object),
        expect.any(Object)
      );
    });
  });
});
