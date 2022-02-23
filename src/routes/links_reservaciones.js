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
                  click_action: "ReservationActivity",
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

router.get('/reservaciones', isLoggedIn, async (req, res) => {
    const reservaciones = await pool.query('SELECT DATE_FORMAT(r.RES_DATE,"%Y-%m-%d %h:%m:%s") as RES_DATE, r.RES_ID, u.USU_NOMBRE, u.USU_ID, r.RES_DESCRIP, DATE_FORMAT(r.RES_FECHA,"%Y-%m-%d") as RES_FECHA, r.RES_HORA_INICIO, r.RES_HORA_FIN, r.RES_ESTADO  FROM reservacion r, usuario u WHERE u.COND_ID=? AND u.USU_ID=r.USU_ID', [req.user.COND_ID]);
    res.render('links/reservaciones', { reservaciones });
});


router.post('/crud_reservaciones',isLoggedIn, async (req, res) => {
    switch (req.body.accion) {
        case 'btn_seleccionarReservacion':
            if(req.body.RES_ESTADO=="ENVIADO"){
                const RECIBRservacion = {
                    RES_ESTADO: "EN PROCESO"
                };
                await pool.query('UPDATE reservacion set ? WHERE RES_ID = ?', [RECIBRservacion, req.body.RES_ID]);
                 // ---------------SEND-NOTIFICATION
                 const usuario = await pool.query('SELECT USU_TOKEN FROM usuario WHERE USU_ID=?', [req.body.USU_ID]);
                 sendMessage('Su reservación esta siendo atendida', "EN PROCESO", usuario[0].USU_TOKEN);
                 // ---------------SEND-NOTIFICATION
            }
           
            const row = await pool.query('SELECT * FROM reservacion r, usuario u WHERE u.USU_ID=r.USU_ID AND r.RES_ID= ? ', [req.body.RES_ID]);
            const reservaciones = await pool.query('SELECT DATE_FORMAT(r.RES_DATE,"%Y-%m-%d %h:%m:&s") as RES_DATE, r.RES_ID, u.USU_NOMBRE, r.RES_DESCRIP, DATE_FORMAT(r.RES_FECHA,"%Y-%m-%d") as RES_FECHA, r.RES_HORA_INICIO, r.RES_HORA_FIN, r.RES_ESTADO  FROM reservacion r, usuario u WHERE u.COND_ID=? AND u.USU_ID=r.USU_ID', [req.user.COND_ID]);
            const reservacion = row[0];
            reservacion.RES_FECHA = parseDate(reservacion.RES_FECHA);
            const modal_reservaciones = true;
            res.render('links/reservaciones', { reservaciones, reservacion, modal_reservaciones });
            break;
        case 'btn_eliminarReservacion':
            await pool.query('DELETE FROM reservacion WHERE RES_ID = ?', [req.body.RES_ID]);
            req.flash('success', 'Reservacion eliminada exitosamente');
            res.redirect('/reservaciones');
            break;

        case 'btn_modificarReservacion':
            const updateRservacion = {
                RES_ESTADO: req.body.RES_ESTADO
            };
            await pool.query('UPDATE reservacion set ? WHERE RES_ID = ?', [updateRservacion, req.body.RES_ID]);
            req.flash('success', 'Reservación modificada exitosamente');
             // ---------------SEND-NOTIFICATION
             const usuario = await pool.query('SELECT USU_TOKEN FROM usuario WHERE USU_ID=?', [req.body.USU_ID]);
             sendMessage('Su reservación ha sido actualizada', req.body.RES_ESTADO, usuario[0].USU_TOKEN);
             // ---------------SEND-NOTIFICATION
            res.redirect('/reservaciones');
            break;
        case 'btn_cancelarReservacion':
            res.redirect('/reservaciones');
            break;
    }

});
module.exports = router;
