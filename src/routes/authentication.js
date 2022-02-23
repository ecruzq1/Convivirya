const express = require('express');
const router = express.Router();

const passport = require('passport');
const { isLoggedIn } = require('../lib/auth');
const pool = require('../database');

// SIGNUP
router.get('/signup', (req, res) => {
  res.render('auth/signup');
});

router.post('/signup', passport.authenticate('local.signup', {
  failureRedirect: '/signup',
  successRedirect: '/profile',
  failureFlash: true
}));

// SINGIN
router.get('/signin', (req, res) => {
  res.render('auth/signin');
});

router.post('/signin', (req, res, next) => {
  req.check('SADM_USUARIO', 'Username is Required').notEmpty();
  req.check('SADM_PASSWORD', 'Password is Required').notEmpty();
  const errors = req.validationErrors();
  if (errors.length > 0) {
    req.flash('message', errors[0].msg);
    res.redirect('/signin');
  }
  passport.authenticate('local.signin', {
    successRedirect: '/profile',
    failureRedirect: '/signin',
  })(req, res, next);
});

router.get('/logout', (req, res) => {
  req.logOut();
  res.redirect('/');
});

router.get('/profile', isLoggedIn, async(req, res) => {
  const rows = await pool.query('SELECT * FROM condominio WHERE COND_ID=? AND COND_ESTADO="ACTIVO"', [req.user.COND_ID]);
  const condominio = rows[0];
  res.render('profile',{condominio});
});

module.exports = router;

