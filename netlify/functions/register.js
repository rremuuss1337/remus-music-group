const { Redis } = require('@upstash/redis');
const bcrypt = require('bcryptjs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  const { username, email, password } = JSON.parse(event.body);

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
};
