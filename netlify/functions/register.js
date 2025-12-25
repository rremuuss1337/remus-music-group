exports.handler = async (event, context) => {
  // CORS ve Method kontrolü
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { username, email, password } = JSON.parse(event.body);

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    // Email içinde @ ve . olduğu için URL güvenliği adına encode ediyoruz
    const safeEmail = encodeURIComponent(email);

    const redisResponse = await fetch(`${url}/set/user:${safeEmail}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      // Veriyi string olarak saklıyoruz
      body: JSON.stringify({
        username,
        email,
        password
      })
    });

    const result = await redisResponse.json();

    if (result.result === "OK") {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Başarıyla kayıt olundu!" }),
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Kayıt sırasında hata: " + JSON.stringify(result) }),
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
