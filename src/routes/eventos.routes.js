const express = require("express");
const router = express.Router();
const eventosController = require("../controllers/eventos.controller");
const { ensureAuthenticated, checkRole } = require("../middlewares/auth");

router.get("/", ensureAuthenticated, (req, res) => {
    // res.json(eventosController.listar());
    const eventos = eventosController.listar();
    const eventosAgrupados = eventosController.agruparPorTipo();

    console.log(eventosAgrupados);

    res.render("eventos", { user: req.user, eventos, eventosAgrupados });
});

router.post("/", ensureAuthenticated, checkRole("admin"), eventosController.cadastrar);

module.exports = router;