const express = require("express");
const router = express.Router();
const eventosController = require("../controllers/eventos.controller");
const { ensureAuthenticated, checkRole } = require("../middlewares/auth");

router.get("/", eventosController.listar);
router.post("/", ensureAuthenticated, checkRole("admin"), eventosController.cadastrar);

module.exports = router;