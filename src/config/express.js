const express = require("express");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
    helmet.contentSecurityPolicy({
        useDefaults: true,
        directives: {
            "script-src": ["'self'", "https://unpkg.com"],
        },
    })
);
app.use(morgan("combined")); // log padrão estilo Apache

// View engine 
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

module.exports = app;
