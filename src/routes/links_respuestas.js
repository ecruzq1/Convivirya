const express = require('express');
const router = express.Router();
const md5 = require('md5');
const pool = require('../database');
const helpers = require('../lib/helpers');
const { isLoggedIn } = require('../lib/auth');
//respuestas--------------------------------------
router.get('/respuestas/:PRE_ID', isLoggedIn, async (req, res) => {
    const { PRE_ID } = req.params;
    const resp = await pool.query('SELECT o.OPC_DATO, o.OPC_ID, count(*) as CANT FROM respuesta r, opcion o WHERE r.PRE_ID=? AND r.OPC_ID=o.OPC_ID GROUP BY r.OPC_ID HAVING COUNT(*)>=0', [PRE_ID]);
    const row = await pool.query('SELECT *  FROM pregunta WHERE PRE_ID=?', [PRE_ID]);
    const pregunta = row[0];
    const ENC_ID = pregunta.ENC_ID;
    const respuestas = JSON.stringify(resp);
    const rowenc = await pool.query('SELECT *  FROM encuesta WHERE ENC_ID=?', [ENC_ID]);
    const encuesta = rowenc[0];
    if(encuesta.COND_ID==req.user.COND_ID){
        res.render('links/respuestas', { pregunta, respuestas, ENC_ID });
    }else{
        res.redirect("/");
    }
    
});

router.get('/respuestas_detalle/:PRE_ID', isLoggedIn, async (req, res) => {
    const { PRE_ID } = req.params;
    const opciones = await pool.query('SELECT * FROM opcion WHERE PRE_ID=?', [PRE_ID]);

    opciones.forEach(async (element) => {
        const respuestas = await pool.query('SELECT u.USU_NOMBRE FROM usuario u, respuesta r WHERE u.USU_ID=r.USU_ID AND OPC_ID=?', [element.OPC_ID]);
        element.RESP = respuestas;
        element.CANT = respuestas.length;
    });

    const row = await pool.query('SELECT *  FROM pregunta WHERE PRE_ID=?', [PRE_ID]);
    const pregunta = row[0];
    const ENC_ID = pregunta.ENC_ID;
    const rowenc = await pool.query('SELECT *  FROM encuesta WHERE ENC_ID=?', [ENC_ID]);
    const encuesta = rowenc[0];
    if(encuesta.COND_ID==req.user.COND_ID){
        res.render('links/respuestas_detalle', { opciones, ENC_ID, pregunta });
    }else{
        res.redirect("/");
    }
    
});




module.exports = router;
