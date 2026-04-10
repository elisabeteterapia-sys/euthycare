// PM2 Ecosystem — EuthyCare Production
// Iniciar tudo:  pm2 start ecosystem.config.js
// Guardar:       pm2 save
// Arranque auto: pm2 startup (seguir as instruções impressas)

module.exports = {
  apps: [
    // ── Backend (Express / Node.js) ─────────────────────────────
    {
      name: 'euthycare-api',
      cwd: '/var/www/euthycare/backend',
      script: 'dist/index.js',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // Reinicia automaticamente se o processo consumir mais de 500 MB
      max_memory_restart: '500M',
      // Logs
      out_file: '/var/log/pm2/euthycare-api-out.log',
      error_file: '/var/log/pm2/euthycare-api-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },

    // ── Frontend (Next.js standalone) ───────────────────────────
    {
      name: 'euthycare-web',
      cwd: '/var/www/euthycare/frontend',
      // Next.js output: 'standalone' gera este servidor compacto
      script: '.next/standalone/server.js',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // O standalone server precisa de saber onde estão os ficheiros estáticos
        HOSTNAME: '127.0.0.1',
      },
      max_memory_restart: '1G',
      out_file: '/var/log/pm2/euthycare-web-out.log',
      error_file: '/var/log/pm2/euthycare-web-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
}
