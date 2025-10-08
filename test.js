#!/usr/bin/env node

/**
 * Test script for F8 Slackbot Microservice
 * Tests all endpoints to ensure they work correctly
 */

const https = require('https');
const http = require('http');

// Configuration
const SERVICE_URL = process.env.SLACKBOT_URL || 'http://localhost:3000';
const isHttps = SERVICE_URL.startsWith('https');
const client = isHttps ? https : http;

console.log('🧪 F8 Slackbot Microservice Test');
console.log('================================');
console.log(`Testing: ${SERVICE_URL}`);
console.log('');

// Test helper function
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SERVICE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'F8-Slackbot-Test/1.0'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test functions
async function testHealth() {
  console.log('1. Testing Health Endpoint...');
  try {
    const response = await makeRequest('/health');
    if (response.statusCode === 200 && response.body.status === 'healthy') {
      console.log('   ✅ Health check passed');
      console.log(`   Service: ${response.body.service}`);
      console.log(`   Version: ${response.body.version}`);
      return true;
    } else {
      console.log('   ❌ Health check failed');
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Response: ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Health check error:', error.message);
    return false;
  }
}

async function testSlackEvents() {
  console.log('\n2. Testing Slack Events Endpoint...');
  try {
    // Test URL verification
    const verificationData = {
      type: 'url_verification',
      challenge: 'test_challenge_123'
    };
    
    const response = await makeRequest('/api/slack/events', 'POST', verificationData);
    if (response.statusCode === 200 && response.body.challenge === 'test_challenge_123') {
      console.log('   ✅ URL verification test passed');
    } else {
      console.log('   ❌ URL verification test failed');
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Response: ${JSON.stringify(response.body)}`);
      return false;
    }

    // Test event callback (without signature verification for testing)
    const eventData = {
      type: 'event_callback',
      event: {
        type: 'app_mention',
        text: '<@U1234567890> hello world',
        channel: 'C1234567890',
        user: 'U1234567890',
        ts: '1234567890.123456'
      }
    };
    
    const eventResponse = await makeRequest('/api/slack/events', 'POST', eventData);
    if (eventResponse.statusCode === 200) {
      console.log('   ✅ Event callback test passed');
      return true;
    } else {
      console.log('   ❌ Event callback test failed');
      console.log(`   Status: ${eventResponse.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Slack events test error:', error.message);
    return false;
  }
}

async function testSlackCommands() {
  console.log('\n3. Testing Slack Commands Endpoint...');
  try {
    const commandData = {
      text: 'What are cannabis regulations?',
      channel_id: 'C1234567890',
      user_id: 'U1234567890'
    };
    
    const response = await makeRequest('/api/slack/commands', 'POST', commandData);
    if (response.statusCode === 200) {
      console.log('   ✅ Slack commands test passed');
      console.log(`   Response type: ${response.body.response_type}`);
      return true;
    } else {
      console.log('   ❌ Slack commands test failed');
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Response: ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Slack commands test error:', error.message);
    return false;
  }
}

async function testAskF8() {
  console.log('\n4. Testing Ask F8 Endpoint...');
  try {
    const askData = {
      question: 'What are cannabis regulations?',
      channel: '#test',
      user: 'test_user'
    };
    
    const response = await makeRequest('/api/slack/ask-f8', 'POST', askData);
    if (response.statusCode === 200) {
      console.log('   ✅ Ask F8 test passed');
      console.log(`   Success: ${response.body.success}`);
      return true;
    } else {
      console.log('   ❌ Ask F8 test failed');
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Response: ${JSON.stringify(response.body)}`);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Ask F8 test error:', error.message);
    return false;
  }
}

async function test404() {
  console.log('\n5. Testing 404 Handling...');
  try {
    const response = await makeRequest('/nonexistent');
    if (response.statusCode === 404) {
      console.log('   ✅ 404 handling test passed');
      return true;
    } else {
      console.log('   ❌ 404 handling test failed');
      console.log(`   Status: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log('   ❌ 404 test error:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  const results = [];
  
  results.push(await testHealth());
  results.push(await testSlackEvents());
  results.push(await testSlackCommands());
  results.push(await testAskF8());
  results.push(await test404());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📊 Test Results');
  console.log('================');
  console.log(`Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! F8 Slackbot is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the output above for details.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});