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
                  click_action: "MeetingActivity",
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

//REUNIONES-------------------------------------------------

router.get('/reuniones', isLoggedIn, async (req, res) => {
    const reuniones = await pool.query('SELECT r.COND_ID, r.REU_ID, DATE_FORMAT(r.REU_FECHA,"%Y/%m/%d") as REU_FECHA , r.REU_HORA , r.REU_LUGAR, r.REU_DATA, r.REU_ESTADO, r.REU_RESUMEN FROM reunion r WHERE r.COND_ID = ? AND r.REU_ESTADO <> "ELIMINADO"', [req.user.COND_ID]);
    res.render('links/reuniones', { reuniones });
});


router.post('/crud_reuniones',isLoggedIn, async (req, res) => {
    switch (req.body.accion) {
        case 'btn_seleccionarReunion':
            const row = await pool.query('SELECT * FROM reunion WHERE REU_ID= ? ', [req.body.REU_ID]);
            const reuniones = await pool.query('SELECT r.COND_ID,r.REU_ID, DATE_FORMAT(r.REU_FECHA,"%Y/%m/%d") as REU_FECHA , r.REU_HORA , r.REU_LUGAR, r.REU_DATA, r.REU_ESTADO, r.REU_RESUMEN FROM reunion r WHERE r.COND_ID = ? AND r.REU_ESTADO <> "ELIMINADO"', [req.user.COND_ID]);
            const reunion = row[0];
            const modal_reuniones = true;
            reunion.REU_FECHA = parseDate(reunion.REU_FECHA);
            res.render('links/reuniones', { reuniones, reunion, modal_reuniones });
            break;
        case 'btn_eliminarReunion':
            await pool.query('DELETE FROM reunion WHERE REU_ID = ?', [req.body.REU_ID]);
            req.flash('success', 'Reunion eliminada exitosamente');
            res.redirect('/reuniones');
            break;
        case 'btn_ingresarReunion':
            const newReunion = {
                COND_ID: req.user.COND_ID,
                REU_FECHA: req.body.REU_FECHA,
                REU_HORA: req.body.REU_HORA,
                REU_LUGAR: req.body.REU_LUGAR,
                REU_DATA: req.body.REU_DATA,
                REU_RESUMEN: req.body.REU_RESUMEN,
                REU_ESTADO: req.body.REU_ESTADO,
            };
            await pool.query('INSERT INTO reunion set ?', [newReunion]);
             // ---------------SEND-NOTIFICATION
             const usuarios = await pool.query('SELECT USU_TOKEN FROM usuario WHERE COND_ID=?', [req.user.COND_ID]);
             usuarios.forEach(element => {
                sendMessage('Una nueva reunion ha sido programada', req.body.REU_DATA, element.USU_TOKEN);
             });
             // ---------------SEND-NOTIFICATION
            req.flash('success', 'Reunion guardada exitosamente');
            res.redirect('/reuniones');
            break;
        case 'btn_modificarReunion':
            const updateReunion = {
                REU_FECHA: req.body.REU_FECHA,
                REU_HORA: req.body.REU_HORA,
                REU_LUGAR: req.body.REU_LUGAR,
                REU_DATA: req.body.REU_DATA,
                REU_RESUMEN: req.body.REU_RESUMEN,
                REU_ESTADO: req.body.REU_ESTADO
            };
            await pool.query('UPDATE reunion set ? WHERE REU_ID = ?', [updateReunion, req.body.REU_ID]);
            req.flash('success', 'Reunion modificada exitosamente');
             // ---------------SEND-NOTIFICATION
             const usuarios1 = await pool.query('SELECT USU_TOKEN FROM usuario WHERE COND_ID=?', [req.body.COND_ID]);
             usuarios1.forEach(element => {
                sendMessage('Reunion actualizada', req.body.REU_DATA, element.USU_TOKEN);
             });
             // ---------------SEND-NOTIFICATION
            res.redirect('/reuniones');
            break;
        case 'btn_cancelarReunion':
            res.redirect('/reuniones');
            break;
    }

});
module.exports = router;
