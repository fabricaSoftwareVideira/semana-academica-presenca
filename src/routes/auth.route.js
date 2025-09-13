const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Se estiver logado então redireciona para o dashboard
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/dashboard");
    }
    next();
}

router.get("/login", checkNotAuthenticated, authController.loginPage);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

module.exports = router;
