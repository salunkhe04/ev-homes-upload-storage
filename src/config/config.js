const config = {
  PORT: process.env.PORT || 8082,
  DB_URL: process.env.DB_URL,
  SECRET_ACCESS_KEY: process.env.SECRET_ACCESS_KEY,
  SECRET_REFRESH_KEY: process.env.SECRET_REFRESH_KEY,
  SECRET_STORAGE_KEY: process.env.SECRET_STORAGE_KEY,
  STORAGE_ABSOLUTE_PATH: process.env.STORAGE_ABSOLUTE_PATH,
  ALLOWED_HOSTS: process.env.ALLOWED_HOSTS,
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  REDIS_KEY: process.env.REDIS_KEY,
  EASYLEADS_API_KEY: process.env.EASYLEADS_API_KEY,
  ENVIRONMENT: process.env.ENVIRONMENT,
};

export default config;
