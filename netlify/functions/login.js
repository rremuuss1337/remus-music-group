const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { username, password } = JSON.parse(event.body);

    if (!username || !password) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Eksik bilgi!' }) };
    }

    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    const users = await sql`SELECT * FROM users WHERE username = ${username}`;
    if (users.length === 0) {
      return { statusCode: 401, body: JSON.stringify({ message: 'Kullanıcı bulunamadı!' }) };
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return { statusCode: 401, body: JSON.stringify({ message: 'Şifre yanlış!' }) };
    }

    // Son giriş zamanını güncelle
    await sql`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ${user.id}`;

    // JWT token oluştur
    const token = jwt.sign(
      { username: user.username, isAdmin: user.is_admin },
      process.env.JWT_SECRET || 'fallback-secret-key',
      { expiresIn: '7d' }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, token, isAdmin: user.is_admin })
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Sunucu hatası!' })
    };
  }
};
