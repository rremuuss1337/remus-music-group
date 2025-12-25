exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { email, password } = JSON.parse(event.body);

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    const safeEmail = encodeURIComponent(email);

    // Veriyi çekiyoruz
    const redisResponse = await fetch(`${url}/get/user:${safeEmail}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await redisResponse.json();

    // Kullanıcı yoksa result.result null döner
    if (!result.result) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Kullanıcı bulunamadı!" }),
      };
    }

    // Redis'ten gelen veri string olduğu için objeye çeviriyoruz
    const user = JSON.parse(result.result);

    if (user.password === password) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: "Giriş başarılı!",
          username: user.username 
        }),
      };
    } else {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Hatalı şifre!" }),
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
