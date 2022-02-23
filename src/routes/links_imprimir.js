const express = require('express');
const router = express.Router();
const pool = require('../database');
const helpers = require('../lib/helpers');
const { isLoggedIn } = require('../lib/auth');



router.get('/imprimir', isLoggedIn, async (req, res) => {

    res.redirect('/');
});





module.exports = router;