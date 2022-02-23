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
                  click_action: "MessageActivity",
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


//FUNCIONES
function fecha_actual() {
    var hoy = new Date();
    var dd = hoy.getDate();
    var mm = hoy.getMonth() + 1; //hoy es 0!
    var yyyy = hoy.getFullYear();

    if (dd < 10) {
        dd = '0' + dd
    }

    if (mm < 10) {
        mm = '0' + mm
    }
    hoy = yyyy + '/' + mm + '/' + dd;
    return hoy;
}

const storage_image = multer.diskStorage({
    destination: path.join(__dirname, '../public/mensajes'),
    filename: (req, file, cb) => {
        cb(null, uuid() + path.extname(file.originalname).toLocaleLowerCase());
    }
})
const update_image = multer({
    storage: storage_image,
    fileFilter: function (req, file, cb) {
        var filetypes = /jpeg|jpg|png|gif/;
        var mimetype = filetypes.test(file.mimetype);
        var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb("Error: Solo son permitidos los archivos de tipo imagen:  - " + filetypes);
    },
}).single('image');
//MENSAJES------------------------------------------------------------------
router.get('/mensajes', isLoggedIn, async (req, res) => {
    const mensajes = await pool.query('select DISTINCT mxu.MEN_ID, m.MEN_ASUNTO, m.MEN_MENSAJE, m.MEN_ESTADO, DATE_FORMAT(m.MEN_FECHA,"%Y-%m-%d") as MEN_FECHA from usuario u, men_x_usu mxu, mensaje m WHERE u.COND_ID=? AND mxu.USU_ID=u.USU_ID AND m.MEN_ID=mxu.MEN_ID AND m.MEN_ESTADO="ACTIVO"', [req.user.COND_ID]);
    const usuarios = await pool.query('SELECT * FROM usuario WHERE COND_ID= ? AND USU_ESTADO="ACTIVO" ', [req.user.COND_ID]);


    res.render('links/mensajes', { mensajes, usuarios });
});

router.post('/crud_mensajes',update_image, isLoggedIn, async (req, res) => {
    switch (req.body.accion) {
        case 'btn_seleccionarMensaje':
            const mensajes = await pool.query('select DISTINCT mxu.MEN_ID, m.MEN_ASUNTO, m.MEN_MENSAJE, m.MEN_ESTADO, DATE_FORMAT(m.MEN_FECHA,"%Y-%m-%d") as MEN_FECHA from usuario u, men_x_usu mxu, mensaje m WHERE u.COND_ID=? AND mxu.USU_ID=u.USU_ID AND m.MEN_ID=mxu.MEN_ID AND m.MEN_ESTADO="ACTIVO"', [req.user.COND_ID]);
            const destinatarios = await pool.query('SELECT * FROM men_x_usu mxu, usuario u, mensaje m WHERE m.MEN_ID=? AND m.MEN_ID=mxu.MEN_ID AND mxu.USU_ID=u.USU_ID AND USU_ESTADO="ACTIVO" ', [req.body.MEN_ID]);
            const usuarios = await pool.query('SELECT * FROM usuario WHERE COND_ID= ? AND USU_ESTADO="ACTIVO" ', [req.user.COND_ID]);
            const row = await pool.query('SELECT * FROM mensaje WHERE MEN_ID= ? AND MEN_ESTADO="ACTIVO" ', [req.body.MEN_ID]);
            const modal_mensajes = true;
            const mensaje = row[0];
            res.render('links/mensajes', { usuarios, mensajes, modal_mensajes, mensaje, destinatarios });
            break;
        case 'btn_eliminarMensaje':
            const dropmsg = {
                MEN_ESTADO: "ELIMINADO"
            };
            if(req.body.MEN_PATH_IMG!=""){
                fs.unlink(path.resolve('./public/mensajes/' + req.body.MEN_PATH_IMG), (err) => {
                    if (err) {
                        console.log(err); throw err;
                    }
                })
                dropmsg.MEN_PATH_IMG=null;
            }
            await pool.query('UPDATE mensaje set ? WHERE MEN_ID = ?', [dropmsg, req.body.MEN_ID]);
            await pool.query('DELETE FROM men_x_usu WHERE MEN_ID = ?', [req.body.MEN_ID]);
            req.flash('success', 'Mensaje eliminado exitosamente');
            res.redirect('/mensajes');

            break;
        case 'btn_ingresarMensaje':
            const newmessage = {
                MEN_ASUNTO: req.body.MEN_ASUNTO,
                MEN_MENSAJE: req.body.MEN_MENSAJE,
                MEN_FECHA: fecha_actual(),
                MEN_ESTADO: req.body.MEN_ESTADO,
            };
            if (req.file) {
                newmessage.MEN_PATH_IMG=req.file.filename;
            }
            const result = await pool.query('INSERT INTO mensaje set ?', [newmessage]);
            if (Array.isArray(req.body.USU_ID)) {
                req.body.USU_ID.forEach(async (element) => {
                    const newmxu = {
                        MEN_ID: result.insertId,
                        USU_ID: element
                    };
                    await pool.query('INSERT INTO men_x_usu set ?', [newmxu]);
                    // ---------------SEND-NOTIFICATION
                    const usuario = await pool.query('SELECT USU_TOKEN FROM usuario WHERE USU_ID=?', [element]);
                    sendMessage('Tiene un nuevo mensaje', req.body.MEN_ASUNTO, usuario[0].USU_TOKEN);
                    // ---------------SEND-NOTIFICATION
                });
            } else {
                const newmxu = {
                    MEN_ID: result.insertId,
                    USU_ID: req.body.USU_ID
                };
                await pool.query('INSERT INTO men_x_usu set ?', [newmxu]);
                // ---------------SEND-NOTIFICATION
                const usuario = await pool.query('SELECT USU_TOKEN FROM usuario WHERE USU_ID=?', [req.body.USU_ID]);
                sendMessage('Tiene un nuevo mensaje', req.body.MEN_ASUNTO, usuario[0].USU_TOKEN);
                // ---------------SEND-NOTIFICATION
            }

            req.flash('success', 'Mensaje enviado exitosamente');
            res.redirect('/mensajes');
            break;
        case 'btn_cancelarMensaje':
            res.redirect('/mensajes');
            break;
    }

});






module.exports = router;
