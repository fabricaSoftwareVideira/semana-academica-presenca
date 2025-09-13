const express = require("express");
const router = express.Router();
const eventosController = require("../controllers/eventos.controller");

router.get("/", eventosController.listar);
router.post("/", eventosController.cadastrar);

module.exports = router;