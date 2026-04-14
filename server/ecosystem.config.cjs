/** PM2 process file — run from repo root: `pm2 start server/ecosystem.config.cjs` */
module.exports = {
  apps: [
    {
      name: 'callflow-api',
      cwd: __dirname,
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
