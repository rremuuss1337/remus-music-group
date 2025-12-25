const { Redis } = require('@upstash/redis');
const bcrypt = require('bcryptjs');

exports.handler = async (event) => {
  console.log('Register function called with method:', event.httpMethod);

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    let body = event.body;
    if (event.isBase64Encoded) {
      body = Buffer.from(body, 'base64').toString();
    }

    const { username, email, password } = JSON.parse(body);

    console.log('Parsed body:', { username, email });

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    const existing = await redis.hgetall(`user:${username}`);
    if (Object.keys(existing).length > 0) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Bu kullanıcı adı zaten alınmış!' }) };
    }

    const hash = await bcrypt.hash(password, 10);

    await redis.hset(`user:${username}`, {
      password: hash,
      email,
      createdAt: Date.now(),
      lastLogin: 0,
      isAdmin: false
    });

    return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Kayıt başarılı!' }) };
  } catch (error) {
    console.error('Register error:', error.message);
    return { statusCode: 500, body: JSON.stringify({ message: 'Sunucu hatası: ' + error.message }) };
  }
};
