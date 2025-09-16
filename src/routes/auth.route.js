const express = require("express");
const router = express.Router();
const { loginPage, login, logout } = require("../controllers/auth.controller");

// Se estiver logado então redireciona para o dashboard
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/dashboard");
    }
    next();
}

router.get("/login", checkNotAuthenticated, loginPage);
router.post("/login", login);
router.get("/logout", logout);

module.exports = router;
