// Middleware de validação de segurança para requisições críticas
function validarRequisicaoCritica(req, res, next) {
    // Verificar se a requisição tem origem válida
    const origin = req.get('Origin') || req.get('Referer');
    const userAgent = req.get('User-Agent');

    // Bloquear requisições suspeitas
    if (!userAgent || userAgent.toLowerCase().includes('bot') || userAgent.toLowerCase().includes('crawler')) {
        console.log(`Requisição suspeita bloqueada: ${userAgent} de ${req.ip}`);
        return res.status(403).json({ error: 'Acesso negado' });
    }

    // Validar token CSRF em requisições POST/PUT/DELETE (se implementado)
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        // Aqui você pode adicionar validação de token CSRF se necessário
        // const csrfToken = req.get('X-CSRF-Token') || req.body._token;
        // if (!csrfToken || !validarCSRF(csrfToken)) {
        //     return res.status(403).json({ error: 'Token CSRF inválido' });
        // }
    }

    next();
}

// Middleware para sanitizar inputs
function sanitizarInputs(req, res, next) {
    // Função básica para remover caracteres perigosos
    function sanitizar(obj) {
        if (typeof obj === 'string') {
            return obj
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
                .replace(/javascript:/gi, '') // Remove javascript:
                .replace(/on\w+\s*=/gi, ''); // Remove event handlers
        }

        if (typeof obj === 'object' && obj !== null) {
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    obj[key] = sanitizar(obj[key]);
                }
            }
        }

        return obj;
    }

    // Sanitizar body, query e params
    if (req.body) req.body = sanitizar(req.body);
    if (req.query) req.query = sanitizar(req.query);
    if (req.params) req.params = sanitizar(req.params);

    next();
}

// Middleware para logging de segurança
function logSeguranca(req, res, next) {
    // Log apenas em produção ou quando especificamente habilitado
    if (process.env.NODE_ENV === 'production' || process.env.SECURITY_LOGGING === 'true') {
        const logData = {
            timestamp: new Date().toISOString(),
            ip: req.ip,
            method: req.method,
            url: req.url,
            userAgent: req.get('User-Agent'),
            origin: req.get('Origin'),
            referer: req.get('Referer')
        };

        // Em produção, você pode enviar estes logs para um serviço de monitoramento
        console.log('Security Log:', JSON.stringify(logData));
    }

    next();
}

module.exports = {
    validarRequisicaoCritica,
    sanitizarInputs,
    logSeguranca
};