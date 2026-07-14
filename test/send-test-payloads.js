const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const APP_SECRET = process.env.WHATSAPP_APP_SECRET || 'test_app_secret_1234567890abcdef';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3001/api/webhook';
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || '123456789012345';
const BUSINESS_PHONE = process.env.BUSINESS_PHONE || '1234567890';

function generateSignature(payload) {
  const hmac = crypto.createHmac('sha256', APP_SECRET);
  hmac.update(payload);
  return 'sha256=' + hmac.digest('hex');
}

function buildWebhookPayload(messageData) {
  return {
    object: 'whatsapp_business_account',
    entry: [{
      id: `10234567890${messageData.id}`,
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: BUSINESS_PHONE,
            phone_number_id: PHONE_NUMBER_ID,
          },
          contacts: [{
            profile: {
              name: messageData.contactName,
            },
            wa_id: messageData.from,
          }],
          messages: [{
            from: messageData.from,
            id: `wamid.${Date.now()}${messageData.id}`,
            timestamp: messageData.timestamp,
            type: 'text',
            text: {
              body: messageData.message,
            },
          }],
        },
        field: 'messages',
      }],
    }],
  };
}

async function sendTestPayloads() {
  const payloadsFile = path.join(__dirname, 'test-payloads.json');
  
  if (!fs.existsSync(payloadsFile)) {
    console.error('Test payloads file not found:', payloadsFile);
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(payloadsFile, 'utf8'));
  const payloads = data.payloads;
  
  console.log('='.repeat(80));
  console.log('WhatsApp Triage & Auto-Reply Agent - Phase 1 Test Suite');
  console.log('='.repeat(80));
  console.log(`Total payloads: ${payloads.length}`);
  console.log(`Webhook URL: ${WEBHOOK_URL}`);
  console.log('');
  
  const results = {
    total: 0,
    success: 0,
    failed: 0,
    byCategory: {},
  };
  
  for (const payloadData of payloads) {
    results.total++;
    
    if (!results.byCategory[payloadData.category]) {
      results.byCategory[payloadData.category] = { total: 0, success: 0, failed: 0 };
    }
    
    results.byCategory[payloadData.category].total++;
    
    const webhookPayload = buildWebhookPayload(payloadData);
    const payloadString = JSON.stringify(webhookPayload);
    const signature = generateSignature(payloadString);
    
    try {
      const startTime = Date.now();
      const response = await axios.post(WEBHOOK_URL, webhookPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Hub-Signature-256': signature,
        },
        timeout: 10000,
      });
      const processingTime = Date.now() - startTime;
      
      results.success++;
      results.byCategory[payloadData.category].success++;
      
      console.log(`[${String(payloadData.id).padStart(2)}] ✓ ${payloadData.category.padEnd(10)} | ${payloadData.message.substring(0, 60).padEnd(60)} | ${processingTime}ms`);
      console.log(`       Expected: ${payloadData.expectedClassification} -> ${payloadData.expectedAction}`);
      
      if (response.data && response.data.status) {
        console.log(`       Response: ${response.data.status}`);
      }
      console.log('');
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      results.failed++;
      results.byCategory[payloadData.category].failed++;
      
      console.error(`[${String(payloadData.id).padStart(2)}] ✗ ${payloadData.category.padEnd(10)} | ${payloadData.message.substring(0, 60).padEnd(60)}`);
      console.error(`       Error: ${error.message}`);
      
      if (error.response) {
        console.error(`       Status: ${error.response.status} ${error.response.statusText}`);
        if (error.response.data) {
          console.error(`       Data: ${JSON.stringify(error.response.data)}`);
        }
      }
      console.log('');
    }
  }
  
  console.log('='.repeat(80));
  console.log('Test Results Summary');
  console.log('='.repeat(80));
  console.log(`Total: ${results.total}`);
  console.log(`Success: ${results.success} (${((results.success / results.total) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${results.failed} (${((results.failed / results.total) * 100).toFixed(1)}%)`);
  console.log('');
  
  console.log('By Category:');
  for (const [category, stats] of Object.entries(results.byCategory)) {
    const successRate = ((stats.success / stats.total) * 100).toFixed(1);
    console.log(`  ${category.padEnd(10)}: ${stats.success}/${stats.total} (${successRate}%)`);
  }
  
  console.log('');
  console.log('='.repeat(80));
  
  if (results.failed > 0) {
    process.exit(1);
  }
}

// Run with custom payload
async function sendSinglePayload(message, from = '919876543210', contactName = 'Test User') {
  const payloadData = {
    id: Date.now(),
    category: 'custom',
    description: 'Custom test message',
    from,
    contactName,
    message,
    expectedClassification: 'ambiguous',
    expectedAction: 'queued',
    timestamp: Date.now().toString(),
  };
  
  const webhookPayload = buildWebhookPayload(payloadData);
  const payloadString = JSON.stringify(webhookPayload);
  const signature = generateSignature(payloadString);
  
  try {
    const response = await axios.post(WEBHOOK_URL, webhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature-256': signature,
      },
    });
    
    console.log('✓ Message sent successfully');
    console.log('  Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('✗ Failed to send message');
    console.error('  Error:', error.message);
    if (error.response) {
      console.error('  Response:', error.response.data);
    }
    throw error;
  }
}

// Export for use in other scripts
module.exports = { sendTestPayloads, sendSinglePayload, generateSignature, buildWebhookPayload };

// Run if called directly
if (require.main === module) {
  sendTestPayloads().catch(console.error);
}
