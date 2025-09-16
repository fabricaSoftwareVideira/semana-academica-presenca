
const express = require('express');
const router = express.Router();
const { userView } = require('../utils/user-view.utils.js');
const respond = require("../utils/respond");

// Dashboard protegido
router.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        respond(req, res, 'dashboard', { user: userView(req.user) });
    } else {
        res.redirect('/');
    }
});

module.exports = router;
