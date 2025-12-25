const { Redis } = require('@upstash/redis');
const bcrypt = require('bcryptjs');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // Body'yi güvenli parse et
    const body = JSON.parse(event.body || "{}");
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return { statusCode: 400, body: JSON.stringify({ message: "Eksik bilgi! (username, email, password zorunlu)" }) };
    }

    // Upstash Redis bağlantısı (environment variable'lar Netlify'den gelir)
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Kullanıcı var mı kontrol et (email ile anahtar yapabilirsin, ama username unique olsun)
    const existing = await redis.hgetall(`user:${username}`);
    if (Object.keys(existing).length > 0) {
      return { statusCode: 400, body: JSON.stringify({ message: "Bu kullanıcı adı zaten alınmış!" }) };
    }

    // Şifreyi hash'le (güvenlik için)
    const hash = await bcrypt.hash(password, 10);

    // Redis'e kaydet
    await redis.hset(`user:${username}`, {
      email: email,
      password: hash,
      createdAt: Date.now(),
      lastLogin: 0,
      isAdmin: false
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Başarıyla kayıt olundu!" })
    };
  } catch (error) {
    console.error("Register error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Sunucu hatası: " + error.message })
    };
  }
};
