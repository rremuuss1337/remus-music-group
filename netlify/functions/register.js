const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405 };

  try {
    const { username, email, password } = JSON.parse(event.body);

    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    // Tablo yoksa oluştur (ilk seferde çalışır)
    await sql`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP,
      is_admin BOOLEAN DEFAULT FALSE
    )`;

    const existing = await sql`SELECT * FROM users WHERE username = ${username}`;
    if (existing.length > 0) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Bu kullanıcı adı zaten alınmış!' }) };
    }

    const hash = await bcrypt.hash(password, 10);

    await sql`INSERT INTO users (username, email, password) VALUES (${username}, ${email}, ${hash})`;

    return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Kayıt başarılı!' }) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Sunucu hatası!' }) };
  }
};
