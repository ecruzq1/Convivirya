const express = require('express');
const router = express.Router();
const md5 = require('md5');
const pool = require('../database');
const helpers = require('../lib/helpers');
const { isLoggedIn } = require('../lib/auth');

//--FIREBASE-------------
const firebase=require('../firebase');
function sendMessage(title, body, token){
    if (token) {
    var message = {
        notification: {
            title: title,
            body: body,
        },
        token: token,
        android: {
            notification: {
              click_action: "PaymentsActivity",
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
        var mm = date.getMonth() + 1;
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
//PAGOS-------------------------------------------------

router.get('/pagos', isLoggedIn, async (req, res) => {
    const pagos = await pool.query('SELECT p.PAG_ID, p.USU_ID, DATE_FORMAT(p.PAG_FECH_EMISION,"%Y-%m-%d") as PAG_FECH_EMISION , DATE_FORMAT(p.PAG_FECH_CANCELACION,"%Y-%m-%d") as PAG_FECH_CANCELACION , p.PAG_DESCRIP, p.PAG_ESTADO,p.PAG_VALOR, u.USU_NOMBRE, p.PAG_ABONO   FROM pago p, usuario u WHERE u.COND_ID = ? AND p.USU_ID=u.USU_ID  ', [req.user.COND_ID]);
    const usuarios = await pool.query('SELECT * FROM usuario WHERE COND_ID =?', [req.user.COND_ID]);
    res.render('links/pagos', { pagos, usuarios });
});

router.post('/crud_pagos', isLoggedIn, async (req, res) => {
    switch (req.body.accion) {
        case 'btn_seleccionarPago':
            const row = await pool.query('SELECT * FROM pago p, usuario u WHERE PAG_ID= ? AND p.USU_ID=u.USU_ID ', [req.body.PAG_ID]);
            const pagos = await pool.query('SELECT p.PAG_ID, p.USU_ID, DATE_FORMAT(p.PAG_FECH_EMISION,"%Y-%m-%d") as PAG_FECH_EMISION , DATE_FORMAT(p.PAG_FECH_CANCELACION,"%Y-%m-%d") as PAG_FECH_CANCELACION , p.PAG_DESCRIP, p.PAG_ESTADO,p.PAG_VALOR, u.USU_NOMBRE, p.PAG_ABONO   FROM pago p, usuario u WHERE u.COND_ID = ? AND p.USU_ID=u.USU_ID  ', [req.user.COND_ID]);
            const usuarios = await pool.query('SELECT * FROM usuario WHERE COND_ID =?', [req.user.COND_ID]);
            const pago = row[0];
            const modal_pagos = true;
            pago.PAG_FECH_EMISION = parseDate(pago.PAG_FECH_EMISION);
            pago.PAG_FECH_CANCELACION = parseDate(pago.PAG_FECH_CANCELACION);
            res.render('links/pagos', { usuarios, pago, modal_pagos, pagos });
            break;
        case 'btn_eliminarPago':
            await pool.query('DELETE FROM pago WHERE PAG_ID = ?', [req.body.PAG_ID]);
            req.flash('success', 'PAGO eliminado exitosamente');
            res.redirect('/pagos');
            break;
        case 'btn_ingresarPago':
            if (req.body.PAG_FECH_CANCELACION == "") {
                req.body.PAG_FECH_CANCELACION = "0000-00-00";
            }
            if (req.body.PAG_ABONO == "") {
                req.body.PAG_ABONO = "0";
            }
            if (Array.isArray(req.body.USU_ID)) {
                req.body.USU_ID.forEach(async (element) => {
                    const newPago = {
                        USU_ID: element,
                        PAG_FECH_EMISION: req.body.PAG_FECH_EMISION,
                        PAG_FECH_CANCELACION: req.body.PAG_FECH_CANCELACION,
                        PAG_DESCRIP: req.body.PAG_DESCRIP,
                        PAG_ESTADO: req.body.PAG_ESTADO,
                        PAG_VALOR: req.body.PAG_VALOR,
                        PAG_ABONO: req.body.PAG_ABONO
                    };
                    await pool.query('INSERT INTO pago set ?', [newPago]);
                    // ---------------SEND-NOTIFICATION
                    const usuario = await pool.query('SELECT USU_TOKEN FROM usuario WHERE USU_ID=?', [element]);
                    sendMessage('Tiene un nuevo Pago',req.body.PAG_DESCRIP,usuario[0].USU_TOKEN);
                    // ---------------SEND-NOTIFICATION

                });
            } else {
                const newPago = {
                    USU_ID: req.body.USU_ID,
                    PAG_FECH_EMISION: req.body.PAG_FECH_EMISION,
                    PAG_FECH_CANCELACION: req.body.PAG_FECH_CANCELACION,
                    PAG_DESCRIP: req.body.PAG_DESCRIP,
                    PAG_ESTADO: req.body.PAG_ESTADO,
                    PAG_VALOR: req.body.PAG_VALOR,
                    PAG_ABONO: req.body.PAG_ABONO
                };
                await pool.query('INSERT INTO pago set ?', [newPago]);
                // ---------------SEND-NOTIFICATION
                const usuario = await pool.query('SELECT USU_TOKEN FROM usuario WHERE USU_ID=?', [req.body.USU_ID]);
                sendMessage('Tiene un nuevo Pago',req.body.PAG_DESCRIP,usuario[0].USU_TOKEN);
                // ---------------SEND-NOTIFICATION
            }
            req.flash('success', 'Pago guardado exitosamente');
            res.redirect('/pagos');
            break;
        case 'btn_modificarPago':
            if (req.body.PAG_FECH_CANCELACION == "") {
                req.body.PAG_FECH_CANCELACION = "0000-00-00";
            }
            if (req.body.PAG_ABONO == "") {
                req.body.PAG_ABONO = "0";
            }
            const updatePago = {
                PAG_FECH_EMISION: req.body.PAG_FECH_EMISION,
                PAG_FECH_CANCELACION: req.body.PAG_FECH_CANCELACION,
                PAG_DESCRIP: req.body.PAG_DESCRIP,
                PAG_ESTADO: req.body.PAG_ESTADO,
                PAG_VALOR: req.body.PAG_VALOR,
                PAG_ABONO: req.body.PAG_ABONO
            };
            await pool.query('UPDATE pago set ? WHERE PAG_ID = ?', [updatePago, req.body.PAG_ID]);
             // ---------------SEND-NOTIFICATION
             const usuario = await pool.query('SELECT USU_TOKEN FROM usuario WHERE USU_ID=?', [req.body.USU_ID]);
             sendMessage('Su pago ha sido actualizado',req.body.PAG_DESCRIP,usuario[0].USU_TOKEN);
             // ---------------SEND-NOTIFICATION
            req.flash('success', 'Pago modificado exitosamente');
            res.redirect('/pagos');
            break;
        case 'btn_cancelarPago':
            res.redirect('/pagos');
            break;
    }

});
module.exports = router;

