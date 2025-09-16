const express = require('express');
const router = express.Router();
const { userView } = require('../utils/user-view.utils.js');

// Dashboard protegido
router.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.render('dashboard', { user: userView(req.user) });
    } else {
        res.redirect('/');
    }
});

module.exports = router;
