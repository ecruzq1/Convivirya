const express = require('express');
const router = express.Router();
const md5 = require('md5');
const pool = require('../database');
const helpers = require('../lib/helpers');
const { isLoggedIn } = require('../lib/auth');
//--FIREBASE-------------
const firebase = require('../firebase');
function sendMessage(title, body, token) {
    if (token) {
        var message = {
            notification: {
                title: title,
                body: body,
            },
            token: token,
            android: {
                notification: {
                  click_action: "TestActivity",
                  sound:"default"
                }
            }
        };
        firebase.messaging().send(message)
            .then((response) => {
                console.log('Successfully sent message:', response);
            })
            .catch((error) => {
                console.log('Error sending message:', error);
            });
    }
}
//--FIREBASE-------------

function parseDate(date) {
    if (date != "0000-00-00") {
        var dd = date.getDate();
        var mm = date.getMonth() + 1; //hoy es 0!
        var yyyy = date.getFullYear();
        if (dd < 10) {
            dd = '0' + dd
        }

        if (mm < 10) {
            mm = '0' + mm
        }
        var fe = new Date();
        fe = yyyy + '-' + mm + '-' + dd;
        return fe;
    } else {
        return null;
    }
}
//enceustas-------------------------------------------------

router.get('/encuestas', isLoggedIn, async (req, res) => {
    const encuestas = await pool.query('SELECT  e.ENC_ID, e.COND_ID, e.ENC_DESC, DATE_FORMAT(e.ENC_FECHA_INICIO,"%Y/%m/%d") as ENC_FECHA_INICIO, DATE_FORMAT(e.ENC_FECHA_FIN,"%Y/%m/%d") as ENC_FECHA_FIN, e.ENC_ESTADO  FROM encuesta e WHERE e.COND_ID=? AND e.ENC_ESTADO="ACTIVO"', [req.user.COND_ID]);
    res.render('links/encuestas', { encuestas });
});


router.post('/crud_encuestas',isLoggedIn, async (req, res) => {
    switch (req.body.accion) {
        case 'btn_seleccionarEncuesta':
            const row = await pool.query('SELECT  *  FROM encuesta e WHERE e.ENC_ID=? AND e.ENC_ESTADO="ACTIVO"', [req.body.ENC_ID]);
            const encuestas = await pool.query('SELECT  e.ENC_ID, e.COND_ID, e.ENC_DESC, DATE_FORMAT(e.ENC_FECHA_INICIO,"%Y-%m-%d") as ENC_FECHA_INICIO, DATE_FORMAT(e.ENC_FECHA_FIN,"%Y-%m-%d") as ENC_FECHA_FIN, e.ENC_ESTADO  FROM encuesta e WHERE e.COND_ID=? AND e.ENC_ESTADO="ACTIVO"', [req.user.COND_ID]);
            const encuesta = row[0];
            encuesta.ENC_FECHA_INICIO = parseDate(encuesta.ENC_FECHA_INICIO);
            encuesta.ENC_FECHA_FIN = parseDate(encuesta.ENC_FECHA_FIN);
            const modal_encuestas = true;

            res.render('links/encuestas', { encuestas, encuesta, modal_encuestas });
            break;
        case 'btn_eliminarEncuesta':
            const dropEncuesta = {
                ENC_ESTADO: "ELIMINADO"
            }
            await pool.query('UPDATE encuesta set ? WHERE ENC_ID = ?', [dropEncuesta, req.body.ENC_ID]);
            req.flash('success', 'Reservacion eliminada exitosamente');
            res.redirect('/encuestas');
            break;
        case 'btn_ingresarEncuesta':
            const newEncuesta = {
                COND_ID: req.user.COND_ID,
                ENC_DESC: req.body.ENC_DESC,
                ENC_FECHA_INICIO: req.body.ENC_FECHA_INICIO,
                ENC_FECHA_FIN: req.body.ENC_FECHA_FIN,
                ENC_ESTADO: "ACTIVO"
            };
            await pool.query('INSERT INTO encuesta set ?', [newEncuesta]);
             // ---------------SEND-NOTIFICATION
             const usuarios = await pool.query('SELECT USU_TOKEN FROM usuario WHERE COND_ID=?', [req.user.COND_ID]);
             usuarios.forEach(element => {
                sendMessage('Una nueva encuesta ha sido lanzada', req.body.ENC_DESC, element.USU_TOKEN);
             });
             // ---------------SEND-NOTIFICATION
            req.flash('success', 'Encuesta creada exitosamente');
            res.redirect('/encuestas');
            break;
        case 'btn_modificarEncuesta':
            const updateEncuesta = {
                ENC_DESC: req.body.ENC_DESC,
                ENC_FECHA_INICIO: req.body.ENC_FECHA_INICIO,
                ENC_FECHA_FIN: req.body.ENC_FECHA_FIN
            };
            await pool.query('UPDATE encuesta set ? WHERE ENC_ID = ?', [updateEncuesta, req.body.ENC_ID]);
             // ---------------SEND-NOTIFICATION
             const usuarios1 = await pool.query('SELECT USU_TOKEN FROM usuario WHERE COND_ID=?', [req.user.COND_ID]);
             usuarios1.forEach(element => {
                sendMessage('Encuesta actualizada', req.body.ENC_DESC, element.USU_TOKEN);
             });
             // ---------------SEND-NOTIFICATION
            req.flash('success', 'Encuesta modificada exitosamente');
            res.redirect('/encuestas');
            break;
        case 'btn_cancelarEncuesta':
            res.redirect('/encuestas');
            break;
    }

});
module.exports = router;
