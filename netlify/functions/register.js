exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { username, email, password } = JSON.parse(event.body);
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    const safeKey = encodeURIComponent(email);

    const redisResponse = await fetch(`${url}/set/user:${safeKey}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ username, email, password })
    });

    const result = await redisResponse.json();
    if (result.result === "OK") {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: true, message: "Başarıyla kayıt olundu!" })
      };
    }
    return { statusCode: 400, body: JSON.stringify({ message: "Kayıt hatası" }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};
