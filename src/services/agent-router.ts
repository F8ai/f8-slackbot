import axios from 'axios';
import { createLogger } from '../utils/logger.js';

const logger = createLogger();

export interface AgentRequest {
  message: string;
  user_id: string;
  context?: {
    channel?: string;
    thread_ts?: string;
    [key: string]: any;
  };
}

export interface AgentResponse {
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

export async function routeToAgent(request: AgentRequest): Promise<AgentResponse> {
  const platformGatewayUrl = process.env.PLATFORM_GATEWAY_URL;
  
  if (platformGatewayUrl) {
    // Use platform gateway (preferred method)
    return await routeViaPlatformGateway(request, platformGatewayUrl);
  } else {
    // Fallback to direct agent routing
    return await routeDirectly(request);
  }
}

async function routeViaPlatformGateway(
  request: AgentRequest, 
  platformUrl: string
): Promise<AgentResponse> {
  try {
    logger.info('Routing request via platform gateway', { 
      platformUrl,
      messageLength: request.message.length 
    });

    const response = await axios.post(`${platformUrl}/api/chat`, {
      message: request.message,
      user_id: request.user_id,
      context: request.context
    }, {
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    logger.error('Error routing via platform gateway:', error);
    
    // Fallback to direct routing
    logger.info('Falling back to direct agent routing');
    return await routeDirectly(request);
  }
}

async function routeDirectly(request: AgentRequest): Promise<AgentResponse> {
  // Determine which agent to route to based on message content
  const agentUrl = determineAgentUrl(request.message);
  
  if (!agentUrl) {
    return {
      success: false,
      message: 'No suitable agent found for this request',
      timestamp: new Date().toISOString()
    };
  }

  try {
    logger.info('Routing request directly to agent', { 
      agentUrl,
      messageLength: request.message.length 
    });

    const response = await axios.post(`${agentUrl}/query`, {
      message: request.message,
      user_id: request.user_id,
      context: request.context
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    logger.error('Error routing to agent:', error);
    
    return {
      success: false,
      message: 'Error processing request. Please try again later.',
      timestamp: new Date().toISOString()
    };
  }
}

function determineAgentUrl(message: string): string | null {
  const messageLower = message.toLowerCase();
  
  // Agent routing logic based on keywords
  const agentUrls = {
    compliance: process.env.COMPLIANCE_AGENT_URL,
    formulation: process.env.FORMULATION_AGENT_URL,
    science: process.env.SCIENCE_AGENT_URL,
    operations: process.env.OPERATIONS_AGENT_URL,
    marketing: process.env.MARKETING_AGENT_URL,
    sourcing: process.env.SOURCING_AGENT_URL,
    patent: process.env.PATENT_AGENT_URL,
    spectra: process.env.SPECTRA_AGENT_URL,
    customerSuccess: process.env.CUSTOMER_SUCCESS_AGENT_URL
  };

  // Compliance keywords
  if (messageLower.includes('compliance') || 
      messageLower.includes('regulation') || 
      messageLower.includes('fda') || 
      messageLower.includes('legal') ||
      messageLower.includes('sop')) {
    return agentUrls.compliance || null;
  }

  // Formulation keywords
  if (messageLower.includes('formulation') || 
      messageLower.includes('recipe') || 
      messageLower.includes('ingredient') || 
      messageLower.includes('dosage') ||
      messageLower.includes('concentration')) {
    return agentUrls.formulation || null;
  }

  // Science keywords
  if (messageLower.includes('science') || 
      messageLower.includes('research') || 
      messageLower.includes('study') || 
      messageLower.includes('analysis') ||
      messageLower.includes('testing')) {
    return agentUrls.science || null;
  }

  // Marketing keywords
  if (messageLower.includes('marketing') || 
      messageLower.includes('brand') || 
      messageLower.includes('promotion') || 
      messageLower.includes('advertising') ||
      messageLower.includes('social media')) {
    return agentUrls.marketing || null;
  }

  // Operations keywords
  if (messageLower.includes('operation') || 
      messageLower.includes('process') || 
      messageLower.includes('workflow') || 
      messageLower.includes('efficiency') ||
      messageLower.includes('management')) {
    return agentUrls.operations || null;
  }

  // Sourcing keywords
  if (messageLower.includes('sourcing') || 
      messageLower.includes('supplier') || 
      messageLower.includes('vendor') || 
      messageLower.includes('procurement') ||
      messageLower.includes('supply chain')) {
    return agentUrls.sourcing || null;
  }

  // Patent keywords
  if (messageLower.includes('patent') || 
      messageLower.includes('intellectual property') || 
      messageLower.includes('ip') || 
      messageLower.includes('trademark') ||
      messageLower.includes('copyright')) {
    return agentUrls.patent || null;
  }

  // Spectra keywords
  if (messageLower.includes('spectra') || 
      messageLower.includes('gcms') || 
      messageLower.includes('coa') || 
      messageLower.includes('testing') ||
      messageLower.includes('analysis')) {
    return agentUrls.spectra || null;
  }

  // Customer success keywords
  if (messageLower.includes('customer') || 
      messageLower.includes('support') || 
      messageLower.includes('help') || 
      messageLower.includes('issue') ||
      messageLower.includes('problem')) {
    return agentUrls.customerSuccess || null;
  }

  // Default to compliance agent if available
  return agentUrls.compliance || null;
}