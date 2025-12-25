// En üstteki require('node-fetch') satırını SİLDİK.

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { username, email, password } = JSON.parse(event.body);

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    // Doğrudan global fetch kullanıyoruz
    const redisResponse = await fetch(`${url}/set/user:${email}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
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
      throw new Error("Redis kayıt hatası: " + JSON.stringify(result));
    }

  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Sunucu hatası: " + error.message }),
    };
  }
};
