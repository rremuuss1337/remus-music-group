const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  try {
    const { username, password } = JSON.parse(event.body);

    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    const user = await sql`SELECT * FROM users WHERE username = ${username}`;
    if (user.length === 0) {
      return { statusCode: 401, body: JSON.stringify({ message: 'Kullanıcı bulunamadı!' }) };
    }

    const match = await bcrypt.compare(password, user[0].password);
    if (!match) {
      return { statusCode: 401, body: JSON.stringify({ message: 'Şifre yanlış!' }) };
    }

    await sql`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE username = ${username}`;

    const token = jwt.sign(
      { username, isAdmin: user[0].is_admin },
      process.env.JWT_SECRET || 'fallback-secret', // JWT_SECRET yoksa fallback
      { expiresIn: '7d' }
    );

    return { statusCode: 200, body: JSON.stringify({ success: true, token, isAdmin: user[0].is_admin }) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Sunucu hatası!' }) };
  }
};
