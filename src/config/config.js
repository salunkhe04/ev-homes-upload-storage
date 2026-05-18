const config = {
  PORT: process.env.PORT || 8082,
  DB_URL: process.env.DB_URL,
  SECRET_STORAGE_KEY: process.env.SECRET_STORAGE_KEY,
  STORAGE_ABSOLUTE_PATH: process.env.STORAGE_ABSOLUTE_PATH,
  ALLOWED_HOSTS: process.env.ALLOWED_HOSTS,
  REDIS_KEY: process.env.REDIS_KEY,
  ENVIRONMENT: process.env.ENVIRONMENT,
};

export default config;
