const express = require("express");
const path = require("path");
const isProduction = process.env.NODE_ENV === "production";

const app = express();

if (isProduction) {
    app.set("trust proxy", 1); // Trust first proxy
}

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

module.exports = app;
