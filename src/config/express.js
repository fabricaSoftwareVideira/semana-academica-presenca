const express = require("express");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");

const app = express();

// Configuração do CORS
const allowedOrigins =
    process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim()) : [
        'http://localhost:3000',
    ];

app.use(
    cors({
        origin: function (origin, callback) {
            // Permite requisições sem "origin" (ex: mobile apps, curl)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            } else {
                return callback(new Error("Não permitido pelo CORS"));
            }
        },
        credentials: process.env.CORS_CREDENTIALS === "true",
    })
);

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
    helmet.contentSecurityPolicy({
        useDefaults: true,
        directives: {
            "script-src": ["'self'", "https://unpkg.com", "https://cdnjs.cloudflare.com"],
        },
    })
);
app.use(morgan("combined")); // log padrão estilo Apache

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

module.exports = app;
