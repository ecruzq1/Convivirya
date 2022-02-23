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
              click_action: "FinesActivity",
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

//multas--------------------------------------
const storage_image = multer.diskStorage({
    destination: path.join(__dirname, '../public/multas'),
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



router.get('/multas', isLoggedIn, async (req, res) => {
    const multas = await pool.query('SELECT * FROM multa m, usuario u WHERE m.USU_ID=u.USU_ID AND u.COND_ID=?', [req.user.COND_ID]);
    const usuarios = await pool.query('SELECT * FROM usuario WHERE COND_ID =? AND USU_ESTADO="ACTIVO"', [req.user.COND_ID]);
    res.render('links/multas', { multas, usuarios });
});

router.post('/crud_multas', update_image,isLoggedIn, async (req, res) => {
    switch (req.body.accion) {
        case 'btn_seleccionarMulta':
            const row = await pool.query('SELECT * FROM multa m, usuario u WHERE MUL_ID= ? AND m.USU_ID=u.USU_ID', [req.body.MUL_ID]);
            const multas = await pool.query('SELECT * FROM multa m, usuario u WHERE m.USU_ID=u.USU_ID AND u.COND_ID=?', [req.user.COND_ID]);
            const multa = row[0];
            const usuarios = await pool.query('SELECT * FROM usuario WHERE COND_ID =? AND USU_ESTADO="ACTIVO"', [req.user.COND_ID]);
            const modal_multas = true;
            res.render('links/multas', { usuarios, multa, modal_multas, multas });
            break;
        case 'btn_eliminarMulta':
            if(req.body.MUL_PATH_IMG!=""){
                fs.unlink(path.resolve('./public/multas/' + req.body.MUL_PATH_IMG), (err) => {
                    if (err) {
                        console.log(err); throw err;
                    }
                })
            }
            await pool.query('DELETE FROM multa WHERE MUL_ID = ?', [req.body.MUL_ID]);
            req.flash('success', 'Multa eliminada exitosamente');
            res.redirect('/multas');
            break;
        case 'btn_ingresarMulta':
            if(req.body.MUL_ABONO==""){
                req.body.MUL_ABONO="0";
            }
            const newMulta = {
                USU_ID: req.body.USU_ID,
                MUL_CAUSA: req.body.MUL_CAUSA,
                MUL_MENSAJE: req.body.MUL_MENSAJE,
                MUL_VALOR: req.body.MUL_VALOR,
                MUL_ESTADO: req.body.MUL_ESTADO,
                MUL_ABONO:req.body.MUL_ABONO
            };
            if (req.file) {
                newMulta.MUL_PATH_IMG=req.file.filename;
            }
            await pool.query('INSERT INTO multa set ?', [newMulta]);
             // ---------------SEND-NOTIFICATION
             const usuario = await pool.query('SELECT USU_TOKEN FROM usuario WHERE USU_ID=?', [req.body.USU_ID]);
             sendMessage('Tiene una nueva multa',req.body.MUL_CAUSA,usuario[0].USU_TOKEN);
             // ---------------SEND-NOTIFICATION
            req.flash('success', 'Multa guardada exitosamente');
            res.redirect('/multas');
            break;
        case 'btn_modificarMulta':
            if(req.body.MUL_ABONO==""){
                req.body.MUL_ABONO="0";
            }
            const updateMulta = {
                MUL_CAUSA: req.body.MUL_CAUSA,
                MUL_MENSAJE: req.body.MUL_MENSAJE,
                MUL_VALOR: req.body.MUL_VALOR,
                MUL_ESTADO: req.body.MUL_ESTADO,
                MUL_ABONO:req.body.MUL_ABONO
            };
            await pool.query('UPDATE multa set ? WHERE MUL_ID = ?', [updateMulta, req.body.MUL_ID]);
            // ---------------SEND-NOTIFICATION
            const usuario1 = await pool.query('SELECT USU_TOKEN FROM usuario WHERE USU_ID=?', [req.body.USU_ID]);
            sendMessage('Su multa ha sido actualizada',req.body.MUL_CAUSA,usuario1[0].USU_TOKEN);
            // ---------------SEND-NOTIFICATION
            req.flash('success', 'Multa modificada exitosamente');
            res.redirect('/multas');
            break;
        case 'btn_cancelarMulta':
            res.redirect('/multas');
            break;
    }

});

module.exports = router;

