const express = require('express');
const router = express.Router();
const md5 = require('md5');
const pool = require('../database');
const helpers = require('../lib/helpers');
const { isLoggedIn } = require('../lib/auth');

//ADMINISTRADORES---------------------------------------------------
router.get('/usuariopassword', isLoggedIn, async (req, res) => {
    res.render('links/usuariopassword');
});


router.post('/crud_usuariocontrasena', async (req, res) => {
    switch (req.body.accion) {
        case 'btn_cambiarpassword':
            var password;
            if (req.user.SADM_USUARIO) {
                password = req.user.SADM_PASSWORD;
            }
            if (req.user.ADM_USUARIO) {
                password = req.user.ADM_PASSWORD;
            }
            if (await helpers.matchPassword(req.body.PASSWORD, password)) {
                if (req.body.PASSWORD_NUEVA == req.body.PASSWORD_CONF) {

                    if (req.user.SADM_USUARIO) {
                        const updateadmin = {
                            SADM_PASSWORD: await helpers.encryptPassword(req.body.PASSWORD_NUEVA),
                        };
                        await pool.query('UPDATE super_admin set ? WHERE SADM_USUARIO = ?', [updateadmin, req.user.SADM_USUARIO]);
                    }
                    if (req.user.ADM_USUARIO) {
                        const updateadmin = {
                            ADM_PASSWORD: await helpers.encryptPassword(req.body.PASSWORD_NUEVA),
                        };
                        await pool.query('UPDATE administrador set ? WHERE ADM_USUARIO = ?', [updateadmin, req.user.ADM_USUARIO]);
                    }


                    req.flash('success', 'Datos modificados exitosamente');
                    res.redirect('/profile');
                    break;
                }
                req.flash('message', 'No coinciden las contraseñas');
                res.render('links/usuariopassword');
                break;
            }
            req.flash('message', 'Contraseña antigua incorrecta');
            res.render('links/usuariopassword');
            break;

    }
});

module.exports = router;