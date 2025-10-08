// Simple test to verify the slackbot works
const express = require('express');
const app = express();

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'f8-slackbot',
    timestamp: new Date().toISOString()
  });
});

// Mock Slack endpoints
app.post('/api/slack/events', (req, res) => {
  console.log('Slack Events API called:', req.body);
  res.status(200).send('OK');
});

app.post('/api/slack/commands', (req, res) => {
  console.log('Slack Commands API called:', req.body);
  res.json({
    response_type: 'in_channel',
    text: 'Hello from F8 Slackbot! This is a test response.',
    attachments: [{
      color: 'good',
      footer: 'F8 Slackbot • Test Mode'
    }]
  });
});

app.post('/api/slack/ask-f8', (req, res) => {
  console.log('Ask F8 API called:', req.body);
  res.json({
    success: true,
    message: 'Hello from F8 Slackbot! This is a test response.',
    agent: 'test-agent',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 F8 Slackbot test server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Slack Events: http://localhost:${PORT}/api/slack/events`);
  console.log(`⚡ Slack Commands: http://localhost:${PORT}/api/slack/commands`);
  console.log(`❓ Ask F8: http://localhost:${PORT}/api/slack/ask-f8`);
});