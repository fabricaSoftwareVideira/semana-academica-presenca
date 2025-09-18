const express = require("express");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");

const app = express();

// Configuração CORS
const corsOptions = {
    origin: function (origin, callback) {
        // Lista de origens permitidas (de variável de ambiente ou padrão)
        const allowedOrigins = process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
            : [
                'http://localhost:3000',
                'http://localhost:5000',
                'http://127.0.0.1:3000',
                'http://127.0.0.1:5000'
            ];

        // Permite requisições sem origin (navegação direta, aplicativos mobile, Postman)
        if (!origin) {
            return callback(null, true);
        }

        // Permite origens autorizadas
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Em desenvolvimento, pode ser mais permissivo
        if (process.env.NODE_ENV !== 'production') {
            console.log(`CORS: Permitindo origem em desenvolvimento: ${origin}`);
            return callback(null, true);
        }

        // Rejeita origem não autorizada
        console.log(`CORS: Origem rejeitada: ${origin}`);
        callback(new Error('Não permitido pelo CORS'));
    },
    credentials: process.env.CORS_CREDENTIALS === 'true' || true, // Permite envio de cookies e headers de autenticação
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'Pragma'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400 // Cache do preflight por 24 horas
};

app.use(cors(corsOptions));

// Middlewares básicos
app.use(express.json({ limit: '10mb' })); // Limite de payload JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static("public"));

// Configurações de segurança com Helmet
app.use(
    helmet({
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                "script-src": ["'self'", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
                "style-src": ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "'unsafe-inline'"],
                "font-src": ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
                "img-src": ["'self'", "data:", "https:"],
                "connect-src": ["'self'", "https://cdnjs.cloudflare.com"],
            },
        },
        crossOriginEmbedderPolicy: false, // Permite embeds externos se necessário
        crossOriginResourcePolicy: { policy: "cross-origin" }
    })
);

// Middleware de rate limiting básico (opcional)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW) || 60000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100; // 100 requests por minuto

app.use((req, res, next) => {
    // Pular rate limiting em desenvolvimento se configurado
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true') {
        return next();
    }

    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!rateLimitMap.has(clientIP)) {
        rateLimitMap.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return next();
    }

    const clientData = rateLimitMap.get(clientIP);

    if (now > clientData.resetTime) {
        clientData.count = 1;
        clientData.resetTime = now + RATE_LIMIT_WINDOW;
        return next();
    }

    if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
        console.log(`Rate limit excedido para IP: ${clientIP}`);
        return res.status(429).json({ error: 'Muitas requisições. Tente novamente em 1 minuto.' });
    }

    clientData.count++;
    next();
});

app.use(morgan("combined")); // log padrão estilo Apache

// View engine 
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

module.exports = app;
