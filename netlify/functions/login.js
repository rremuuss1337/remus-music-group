exports.handler = async (event, context) => {
  // Sadece POST isteklerini kabul et
  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ message: "Method Not Allowed" }) 
    };
  }

  try {
    // HTML'den gelen veriyi al (email ve password)
    const { email, password } = JSON.parse(event.body);

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    // Email adresini URL dostu hale getir (çünkü register'da böyle kaydettik)
    const safeKey = encodeURIComponent(email);

    // Redis'ten kullanıcıyı çek
    const redisResponse = await fetch(`${url}/get/user:${safeKey}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await redisResponse.json();

    // Eğer Redis'te bu email ile bir anahtar yoksa result.result null döner
    if (!result.result) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Bu e-posta ile kayıtlı kullanıcı bulunamadı!" }),
      };
    }

    // Redis'ten gelen string veriyi tekrar JSON objesine çevir
    const user = JSON.parse(result.result);

    // Şifre kontrolü (Eğer bcrypt kullanmıyorsan düz metin kontrolü yapar)
    if (user.password === password) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          success: true,
          message: "Giriş başarılı!",
          username: user.username 
        }),
      };
    } else {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Şifre hatalı!" }),
      };
    }

  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Sunucu hatası: " + error.message }),
    };
  }
};
