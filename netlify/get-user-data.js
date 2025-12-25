const fetch = require('node-fetch'); // Netlify'de fetch gömülü, ama güvenli olsun diye ekledik (gerekirse sil)

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { username } = JSON.parse(event.body || "{}");

    if (!username) {
      return { statusCode: 400, body: JSON.stringify({ message: "Kullanıcı adı eksik!" }) };
    }

    // Senin register/login'de email anahtar olarak kullanılıyor
    // Ama dashboard'da username ile çekiyoruz – burada username'i email'e çevirmek için basit bir mantık kullanıyoruz
    // Gerçekte: username ile email bulmak için ek bir map tutman lazım, ama şimdilik username'i email gibi kabul ediyoruz
    const safeKey = encodeURIComponent(username); // Senin login'de email için yaptığın gibi

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    const redisResponse = await fetch(`${url}/get/user:${safeKey}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const result = await redisResponse.json();

    if (!result.result) {
      return { statusCode: 404, body: JSON.stringify({ message: "Kullanıcı bulunamadı!" }) };
    }

    const user = JSON.parse(result.result);

    // Placeholder stats (ileride gerçek veri çekebilirsin)
    const stats = {
      totalStreams: "0",
      totalRevenue: "$0",
      balance: "$0",
      totalTracks: "0"
    };

    // Hesap türü (şimdilik default 'artist', admin'den değiştireceksin)
    const accountType = user.accountType || "Artist";

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        stats,
        accountType,
        username: user.username || username,
        email: user.email || ""
      })
    };
  } catch (error) {
    console.error("Get user data error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Sunucu hatası: " + error.message })
    };
  }
};
