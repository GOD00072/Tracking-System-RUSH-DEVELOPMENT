// JWT Configuration
// Centralized JWT settings - DO NOT use fallback dev keys in production

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production environment');
}

export const jwtConfig = {
  secret: JWT_SECRET || 'INSECURE_DEV_KEY_NOT_FOR_PRODUCTION',
  expiresIn: '7d',
  cookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

export default jwtConfig;
