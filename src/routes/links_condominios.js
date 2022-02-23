const express = require('express');
const router = express.Router();
const md5 = require('md5');
const pool = require('../database');
const helpers = require('../lib/helpers');
const { isLoggedIn } = require('../lib/auth');

//CONDOMINIOS---------------------------------------------------------------
router.get('/condominios', isLoggedIn, async (req, res) => {
    if (req.user.SADM_USUARIO) {
        const condominios = await pool.query('SELECT * FROM condominio WHERE COND_ESTADO = "ACTIVO"');
        res.render('links/condominios', { condominios });
    } else {
        res.redirect('/profile');
    }
});

router.post('/crud_condominio', isLoggedIn, async (req, res) => {
    switch (req.body.accion) {
        case 'btn_seleccioanrCondominio':
            const row = await pool.query('SELECT * FROM  condominio WHERE COND_ID = ?', [req.body.COND_ID]);
            const condominios = await pool.query('SELECT * FROM condominio WHERE COND_ESTADO="ACTIVO"');
            const condominio = row[0];
            const modal_condominio = true;
            res.render('links/condominios', { condominios, condominio, modal_condominio });
            break;
        case 'btn_eliminarCondominio':
            const dropadmin = {
                COND_ESTADO: "ELIMINADO"
            };
            await pool.query('UPDATE condominio set ? WHERE COND_ID = ?', [dropadmin, req.body.COND_ID]);
            req.flash('success', 'Inmueble eliminado exitosamente');
            res.redirect('/condominios');
            break;
        case 'btn_ingresarCondominio':
            const newCond = {
                COND_NOMBRE: req.body.COND_NOMBRE,
                COND_DIRECCION: req.body.COND_DIRECCION,
                COND_ESTADO: req.body.COND_ESTADO,
                COND_REGLAMENTO: req.body.COND_REGLAMENTO,
                COND_MISION: req.body.COND_MISION,
                COND_VISION: req.body.COND_VISION,
                COND_INFORMACION: ""
            };
            await pool.query('INSERT INTO condominio set ?', [newCond]);
            req.flash('success', 'Inmueble creado exitosamente');
            res.redirect('/condominios');
            break;
        case 'btn_modificarCondominio':
            const updateCond = {
                COND_NOMBRE: req.body.COND_NOMBRE,
                COND_DIRECCION: req.body.COND_DIRECCION,
                COND_REGLAMENTO: req.body.COND_REGLAMENTO,
                COND_MISION: req.body.COND_MISION,
                COND_VISION: req.body.COND_VISION,
            };
            await pool.query('UPDATE condominio set ? WHERE COND_ID = ?', [updateCond, req.body.COND_ID]);
            req.flash('success', 'Inmueble modificado exitosamente');
            res.redirect('/condominios');
            break;
        case 'btn_cancelarCondominio':
            res.redirect('/condominios');
            break;
    }


});
module.exports = router;
