// PM2 ecosystem file for Semana Acadêmica
module.exports = {
    apps: [
        {
            name: 'semana-academica',
            script: 'server.js',
            instances: 'max',
            exec_mode: 'cluster',
            env: {
                NODE_ENV: process.env.NODE_ENV || 'development',
                PORT: process.env.PORT || 3000
            }
        }
    ]
};
