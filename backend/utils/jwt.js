import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'bso_school_system_secret_key_2026_super_secure';
};

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};
