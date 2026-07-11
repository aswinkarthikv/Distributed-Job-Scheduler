// Config placeholder for environment vars and credentials
export const CONFIG = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || 'super-secret-key-placeholder',
  dbUrl: process.env.DATABASE_URL || 'postgres://localhost:5432/scheduler',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379'
};
