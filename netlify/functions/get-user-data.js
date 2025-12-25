const { Redis } = require('@upstash/redis');

exports.handler = async (event) => {
  console.log('get-user-data called with method:', event.httpMethod);

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { username } = body;

    if (!username) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Kullanıcı adı eksik!' }) };
    }

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    const user = await redis.hgetall(`user:${username}`);
    if (Object.keys(user).length === 0) {
      return { statusCode: 404, body: JSON.stringify({ message: 'Kullanıcı bulunamadı!' }) };
    }

    // Senin sisteminde email anahtar, ama username ile çekiyoruz – placeholder stats
    const stats = {
      totalStreams: user.totalStreams || '0',
      totalRevenue: user.totalRevenue || '$0',
      balance: user.balance || '$0',
      totalTracks: user.totalTracks || '0'
    };

    const accountType = user.accountType || 'Artist';

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        stats,
        accountType,
        username: user.username || username,
        email: user.email || ''
      })
    };
  } catch (error) {
    console.error('Get user data error:', error.message);
    return { statusCode: 500, body: JSON.stringify({ message: 'Sunucu hatası: ' + error.message }) };
  }
};
