const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const pool = require('../database');
const helpers = require('./helpers');

passport.use('local.signin', new LocalStrategy({
  usernameField: 'SADM_USUARIO',
  passwordField: 'SADM_PASSWORD',
  passReqToCallback: true
}, async (req, SADM_USUARIO, SADM_PASSWORD, done) => {
  const rows = await pool.query('SELECT * FROM super_admin WHERE SADM_USUARIO = ?', [SADM_USUARIO]);
  if (rows.length > 0) {
    const usuario = rows[0];
    const validPassword = await helpers.matchPassword(SADM_PASSWORD, usuario.SADM_PASSWORD)
    if (validPassword) {
      return done(null, usuario);
    } else {
      return done(null, false, req.flash('message', 'Contraseña Incorecta'));
    }
  } else {
    const rows = await pool.query('SELECT * FROM administrador WHERE ADM_USUARIO = ? AND ADM_ESTADO="ACTIVO"', [SADM_USUARIO]);
    if (rows.length > 0) {
      const usuario = rows[0];
      const validPassword = await helpers.matchPassword(SADM_PASSWORD, usuario.ADM_PASSWORD)
      if (validPassword) {
        return done(null, usuario);
      } else {
        return done(null, false, req.flash('message', 'Contraseña Incorecta'));
      }
    } else {
      return done(null, false, req.flash('message', 'Usuario no existe'));
    }
  }
}));

passport.use('local.signup', new LocalStrategy({
  usernameField: 'SADM_USUARIO',
  passwordField: 'SADM_PASSWORD',
  passReqToCallback: true
}, async (req, SADM_USUARIO, SADM_PASSWORD, done) => {

  let newUser = {
    SADM_USUARIO,
    SADM_PASSWORD
  };
  newUser.SADM_PASSWORD = await helpers.encryptPassword(SADM_PASSWORD);
  // Saving in the Database
  const result = await pool.query('INSERT INTO super_admin SET ? ', newUser);
  newUser.id = result.insertId;
  return done(null, newUser);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser(async (user, done) => {
  if (user.SADM_USUARIO) {
    const rows = await pool.query('SELECT * FROM super_admin WHERE SADM_USUARIO = ? ', [user.SADM_USUARIO]);
    done(null, rows[0]);
  } else {
    const rows = await pool.query('SELECT * FROM administrador WHERE ADM_ID = ? AND ADM_ESTADO="ACTIVO"', [user.ADM_ID]);
    done(null, rows[0]);
  }

});

