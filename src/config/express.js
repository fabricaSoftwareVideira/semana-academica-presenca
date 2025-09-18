const express = require("express");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");

const app = express();

// Configuração do CORS
const allowedOrigins =
    process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim()) : [];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            } else {
                return callback(new Error("CORS_ERROR"));
            }
        },
        credentials: process.env.CORS_CREDENTIALS === "true",
    })
);

// ⚠️ Error handler global — precisa vir DEPOIS das rotas
app.use((err, req, res, next) => {
    if (err.message === "CORS_ERROR") {
        return res.status(403).render("error", {
            title: "Acesso Negado",
            message: "Origem não permitida pelo CORS.",
        });
    }

    // outros erros
    console.error(err.stack);
    res.status(500).render("error", {
        title: "Erro Interno",
        message: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
    });
});

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
