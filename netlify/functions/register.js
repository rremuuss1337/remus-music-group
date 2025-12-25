exports.handler = async (event, context) => {
  // Sadece POST isteklerini kabul et
  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ message: "Method Not Allowed" }) 
    };
  }

  try {
    const { username, email, password } = JSON.parse(event.body);

    // Upstash Bilgileri (Netlify panelindeki Environment Variables'dan gelir)
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    // Email içindeki özel karakterler (@, .) URL'i bozmasın diye temizliyoruz
    const safeKey = encodeURIComponent(email);

    // Redis'e kayıt (node-fetch gerektirmez, native fetch kullanılır)
    const redisResponse = await fetch(`${url}/set/user:${safeKey}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
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
        body: JSON.stringify({ message: "Redis hatası: " + JSON.stringify(result) }),
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
