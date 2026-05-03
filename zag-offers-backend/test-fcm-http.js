const fs = require('fs');
const https = require('https');
const os = require('os');
const path = require('path');

const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const accessToken = config.tokens.access_token;

const message = {
  message: {
    topic: 'all_users',
    notification: {
      title: '🔥 عرض جديد في الزقازيق!',
      body: 'المحل: "أكاديمية المستقبل" نزل عرض جديد: "كورس الإنجليزي المكثف". الحق الخصم دلوقتي! 🚀'
    },
    data: {
      type: 'OFFER_NEW',
      offerId: '1a068045-6fa2-47bd-82cd-ecf349e7cca1',
      storeId: 'ef8a4577-a3c8-4f68-bd4e-96536cf05295'
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channel_id: 'offers_channel'
      }
    }
  }
};

const postData = JSON.stringify(message);

const options = {
  hostname: 'fcm.googleapis.com',
  path: '/v1/projects/zagoffers/messages:send',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`BODY: ${data}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
