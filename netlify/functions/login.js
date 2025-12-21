const { Redis } = require('@upstash/redis');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const { username, password } = JSON.parse(event.body);

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    const user = await redis.hgetall(`user:${username}`);
    if (Object.keys(user).length === 0) {
      return { statusCode: 401, body: JSON.stringify({ message: 'Kullanıcı bulunamadı!' }) };
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return { statusCode: 401, body: JSON.stringify({ message: 'Şifre yanlış!' }) };
    }

    await redis.hset(`user:${username}`, 'lastLogin', Date.now());

    const token = jwt.sign(
      { username, isAdmin: user.isAdmin === 'true' || user.isAdmin === true },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { statusCode: 200, body: JSON.stringify({ success: true, token, isAdmin: user.isAdmin }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ message: 'Sunucu hatası!' }) };
  }
};
