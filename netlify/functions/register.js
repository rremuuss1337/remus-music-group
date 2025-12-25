const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { username, email, password } = JSON.parse(event.body);

    if (!username || !email || !password) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Eksik bilgi!' }) };
    }

    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    // Tablo yoksa oluştur
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_admin BOOLEAN DEFAULT FALSE
      )
    `;

    // Aynı kullanıcı var mı?
    const existing = await sql`SELECT id FROM users WHERE username = ${username}`;
    if (existing.length > 0) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Bu kullanıcı adı zaten alınmış!' }) };
    }

    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(password, 10);

    // Kullanıcıyı ekle
    await sql`
      INSERT INTO users (username, email, password)
      VALUES (${username}, ${email}, ${hashedPassword})
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Kayıt başarılı!' })
    };
  } catch (error) {
    console.error('Register error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Sunucu hatası!' })
    };
  }
};
