// PM2 ecosystem file for Semana Acadêmica
module.exports = {
    apps: [
        {
            name: 'semana-academica',
            script: 'server.js',
            instances: 'max',
            exec_mode: 'fork', // Usar 'fork' para evitar problemas com bibliotecas que não suportam cluster
            env: {
                NODE_ENV: process.env.NODE_ENV || 'development',
                PORT: process.env.PORT || 3000
            },
            out_file: './logs/out.log',
            error_file: './logs/error.log',
            log_date_format: 'YYYY-MM-DD HH:mm Z'
        }
    ]
};
