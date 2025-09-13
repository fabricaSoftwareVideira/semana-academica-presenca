const express = require("express");
const router = express.Router();
const eventosController = require("../controllers/eventos.controller");
const { ensureAuthenticated, checkRole } = require("../middlewares/auth");

router.get("/", ensureAuthenticated, (req, res) => {
    res.json(eventosController.listar());
});
router.post("/", ensureAuthenticated, checkRole("admin"), eventosController.cadastrar);

module.exports = router;