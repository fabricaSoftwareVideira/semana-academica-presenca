// Teste das rotas de biometria com um servidor real
const express = require('express');
const app = express();

// Middleware básico
app.use(express.json());

// Mock do middleware de autenticação
app.use((req, res, next) => {
    req.user = { username: 'test' };
    next();
});

// Carregar as rotas de biometria
try {
    const biometriaRoutes = require('./src/routes/biometria.routes');
    app.use('/biometria', biometriaRoutes);
    console.log('✅ Rotas de biometria montadas com sucesso');

    const server = app.listen(3001, () => {
        console.log('✅ Servidor de teste rodando na porta 3001');

        // Fazer uma requisição de teste
        const http = require('http');
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/biometria/credenciais',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            console.log(`✅ Resposta do servidor: ${res.statusCode}`);
            server.close();
            process.exit(0);
        });

        req.on('error', (error) => {
            console.error('❌ Erro na requisição:', error);
            server.close();
            process.exit(1);
        });

        req.end();
    });

} catch (error) {
    console.error('❌ Erro ao montar rotas:', error);
    process.exit(1);
}