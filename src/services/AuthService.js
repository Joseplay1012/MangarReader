const crypto = require('crypto');
const config = require('../config/config');

class AuthService {
  constructor() {
    this.secret = config.admin.sessionSecret;
  }

  login(username, password) {
    if (
      username === config.admin.user &&
      password === config.admin.password
    ) {
      const payload = {
        user: username,
        timestamp: Date.now(),
      };
      const token = this.generateToken(payload);
      return { success: true, token, user: username };
    }
    return { success: false, error: 'Credenciais inválidas' };
  }

  generateToken(payload) {
    const data = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(data)
      .digest('hex');
    return `${data}.${signature}`;
  }

  verifyToken(token) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [data, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(data)
      .digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      try {
        const payload = JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
        // Check expiration (e.g. 7 days)
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - payload.timestamp < sevenDays) {
          return payload;
        }
      } catch (err) {
        return null;
      }
    }
    return null;
  }
}

module.exports = new AuthService();
