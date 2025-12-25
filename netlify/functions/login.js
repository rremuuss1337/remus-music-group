exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { email, password } = JSON.parse(event.body);
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    const safeKey = encodeURIComponent(email);

    const redisResponse = await fetch(`${url}/get/user:${safeKey}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const result = await redisResponse.json();

    if (!result.result) {
      return { statusCode: 401, body: JSON.stringify({ message: "Kullanıcı bulunamadı!" }) };
    }

    const user = JSON.parse(result.result);

    if (user.password === password) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: true, message: "Giriş başarılı!", username: user.username, token: "fake-jwt-token" })
      };
    } else {
      return { statusCode: 401, body: JSON.stringify({ message: "Şifre hatalı!" }) };
    }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ message: error.message }) };
  }
};
