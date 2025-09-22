const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth');

// Página para configurar biometria
router.get('/configurar', ensureAuthenticated, (req, res) => {
    res.render('configurar-biometria', {
        user: req.user,
        title: 'Configurar Biometria'
    });
});

module.exports = router;