const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const https = require('https');
const os = require('os');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  // 1. Get the latest offer
  const offer = await prisma.offer.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { store: true }
  });

  if (!offer) {
    console.log('No offers found in DB');
    return;
  }

  // 2. Load CLI token
  const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const accessToken = config.tokens.access_token;

  // 3. Send FCM
  const message = {
    message: {
      topic: 'all_users',
      notification: {
        title: '🔥 عرض جديد حصري!',
        body: `المحل: "${offer.store.name}" نزل عرض جديد: "${offer.title}". اضغط هنا للتفاصيل!`
      },
      data: {
        type: 'OFFER_NEW',
        offerId: offer.id,
        storeId: offer.storeId
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
      process.exit(0);
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
    process.exit(1);
  });

  req.write(postData);
  req.end();
}

main();
