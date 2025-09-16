const express = require("express");
const path = require("path");
const helmet = require("helmet");

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

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

module.exports = app;
