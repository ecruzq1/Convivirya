const express = require('express');
const router = express.Router();
const md5 = require('md5');
const pool = require('../database');
const helpers = require('../lib/helpers');
const { isLoggedIn } = require('../lib/auth');

const path = require('path');
const fs = require('fs');
const uuid = require('uuid/v4');
const multer = require('multer');
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
                  click_action: "ComplaintActivity",
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
//PAGOS-------------------------------------------------

router.get('/quejas', isLoggedIn, async (req, res) => {
    const quejas = await pool.query('SELECT * FROM queja q, usuario u WHERE u.COND_ID = ? AND q.USU_ID=u.USU_ID  ', [req.user.COND_ID]);
    res.render('links/quejas', { quejas });
});

router.post('/crud_quejas', isLoggedIn, async (req, res) => {
    switch (req.body.accion) {
        case 'btn_seleccionarQueja':
            if (req.body.QJ_ESTADO == "ENVIADO") {
                const RECIBQueja = {
                    QJ_ESTADO: "RECIBIDO"
                };
                await pool.query('UPDATE queja set ? WHERE QJ_ID = ?', [RECIBQueja, req.body.QJ_ID]);
                 // ---------------SEND-NOTIFICATION
                 const usuario = await pool.query('SELECT USU_TOKEN FROM usuario WHERE USU_ID=?', [req.body.USU_ID]);
                 sendMessage('Su petición esta siendo atendida', req.body.QJ_ASUNTO, usuario[0].USU_TOKEN);
                 // ---------------SEND-NOTIFICATION

            }
            const row = await pool.query('SELECT * FROM  queja q, usuario u WHERE u.USU_ID =q.USU_ID  AND q.QJ_ID=? ', [req.body.QJ_ID]);
            const quejas = await pool.query('SELECT * FROM queja q, usuario u WHERE u.COND_ID = ? AND q.USU_ID=u.USU_ID  ', [req.user.COND_ID]);
            const queja = row[0];
            const modal_quejas = true;
            res.render('links/quejas', { queja, quejas, modal_quejas });
            break;
        case 'btn_eliminarQueja':
            await pool.query('DELETE FROM queja WHERE QJ_ID = ?', [req.body.QJ_ID]);
            req.flash('success', 'Petición eliminada exitosamente');
            res.redirect('/quejas');
            break;
        case 'btn_ingresarQueja':
            const newQueja = {
                USU_ID: req.body.USU_ID,
                QJ_ASUNTO: req.body.QJ_ASUNTO,
                QJ_MENSAJE: req.body.QJ_MENSAJE,
                QJ_ESTADO: req.body.QJ_ESTADO
            };
            await pool.query('INSERT INTO queja set ?', [newQueja]);
            req.flash('success', 'Queja guardado exitosamente');
            res.redirect('/quejas');
            break;
        case 'btn_modificarQueja':
            const updateQueja = {
                QJ_ESTADO: req.body.QJ_ESTADO
            };
            await pool.query('UPDATE queja set ? WHERE QJ_ID = ?', [updateQueja, req.body.QJ_ID]);
            req.flash('success', 'Petición modificada exitosamente');
             // ---------------SEND-NOTIFICATION
             const usuario = await pool.query('SELECT USU_TOKEN FROM usuario WHERE USU_ID=?', [req.body.USU_ID]);
             sendMessage('Su petición ha sido actualizada', req.body.QJ_ASUNTO, usuario[0].USU_TOKEN);
             // ---------------SEND-NOTIFICATION
            res.redirect('/quejas');
            break;
        case 'btn_cancelarQueja':
            res.redirect('/quejas');
            break;
    }

});
var storage = multer.diskStorage({
    destination: path.join(__dirname, '../public/quejas'),
    filename: function (req, file, cb) {
        cb(null, uuid()+'.png');
    }
  })

const update_queja = multer({ storage: storage })


router.post('/save_queja', update_queja.any(), async (req, res) => {
    res.end(req.files[0].filename);
});
router.get('/delete_img_queja/:QJ_PATH_EV', async (req, res) => {
    const { QJ_PATH_EV } = req.params;
    fs.unlink(path.resolve('./public/quejas/' + QJ_PATH_EV), (err) => {
        if (err) {
            console.log(err); throw err;
        }
    })
    res.end('ok');
});


module.exports = router;
