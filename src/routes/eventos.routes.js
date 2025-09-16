const express = require("express");
const router = express.Router();

const eventosController = require("../controllers/eventos.controller");
const { ensureAuthenticated, checkRole } = require("../middlewares/auth");
const respond = require("../utils/respond");

router.get("/", ensureAuthenticated, (req, res) => {
    const eventos = eventosController.listar();
    const eventosAgrupados = eventosController.agruparPorTipo();
    respond(req, res, "eventos", { user: req.user, eventos, eventosAgrupados });
});

router.post("/", ensureAuthenticated, checkRole("admin"), eventosController.cadastrar);

module.exports = router;