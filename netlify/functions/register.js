const fetch = require('node-fetch'); // Eğer hata alırsan bu satırı kaldır, Netlify'da fetch gömülüdür.

exports.handler = async (event, context) => {
  // Sadece POST isteklerini kabul et
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { username, email, password } = JSON.parse(event.body);

    // Upstash Bilgileri (Netlify panelinden gelecek)
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    // Redis'e kullanıcıyı kaydet (Anahtar olarak email kullanıyoruz)
    // SET komutu ile kullanıcı verilerini JSON olarak saklıyoruz
    const redisResponse = await fetch(`${url}/set/user:${email}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        username,
        email,
        password // Not: Gerçek projelerde şifreyi hash'lemelisin!
      })
    });

    const result = await redisResponse.json();

    if (result.result === "OK") {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Başarıyla kayıt olundu!" }),
      };
    } else {
      throw new Error("Redis kayıt hatası");
    }

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Sunucu hatası: " + error.message }),
    };
  }
};
