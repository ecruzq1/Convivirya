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

const storage_image = multer.diskStorage({
    destination: path.join(__dirname, '../public/uploads'),
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
const storage_logo = multer.diskStorage({
    destination: path.join(__dirname, '../public/logos'),
    filename: (req, file, cb) => {
        cb(null, uuid() + path.extname(file.originalname).toLocaleLowerCase());
    }
})
const update_logo = multer({
    storage: storage_logo,
    fileFilter: function (req, file, cb) {
        var filetypes = /jpeg|jpg|png|gif/;
        var mimetype = filetypes.test(file.mimetype);
        var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb("Error: Solo son permitidos los archivos de tipo imagen:  - " + filetypes);
    },
}).single('logo');



//info---------------------------------------------------------------
router.get('/info', isLoggedIn, async (req, res) => {
    const rows = await pool.query('SELECT * FROM condominio WHERE COND_ID=? AND COND_ESTADO="ACTIVO"', [req.user.COND_ID]);
    const imagenes = await pool.query('SELECT * FROM imagen WHERE COND_ID=?', [req.user.COND_ID]);
    const condominio = rows[0];
    res.render('links/info', { imagenes, condominio });
});

router.post('/update_info', isLoggedIn, update_logo, async (req, res) => {
    switch (req.body.accion) {
        case 'btn_modificarInfo':
            const updateCond = {
                COND_NOMBRE: req.body.COND_NOMBRE,
                COND_DIRECCION: req.body.COND_DIRECCION,
                COND_REGLAMENTO: req.body.COND_REGLAMENTO,
                COND_MISION: req.body.COND_MISION,
                COND_VISION: req.body.COND_VISION,
		COND_LINK: req.body.COND_LINK,
            };
            if (req.file) {
                if (req.body.COND_INFORMACION != "") {
                    fs.unlink(path.resolve('./public/' + req.body.COND_INFORMACION), (err) => {
                        if (err) {
                            console.log(err); throw err;
                        }
                    })
                    updateCond.COND_INFORMACION = 'logos/' + req.file.filename
                } else {
                    updateCond.COND_INFORMACION = 'logos/' + req.file.filename
                }

            }
            await pool.query('UPDATE condominio set ? WHERE COND_ID = ?', [updateCond, req.user.COND_ID]);
            req.flash('success', 'Inmueble modificado exitosamente');
            res.redirect('/info');
            break;
        case 'btn_eliminarlogo':
            fs.unlink(path.resolve('./public/' + req.body.COND_INFORMACION), (err) => {
                if (err) {
                    console.log(err); throw err;
                }
            })
            const droplogoCond = {
                COND_INFORMACION: ""
            };
            await pool.query('UPDATE condominio set ? WHERE COND_ID = ?', [droplogoCond, req.user.COND_ID]);
            req.flash('success', 'Logo eliminado exitosamente');
            res.redirect('/info');
            break
    }
});

router.post('/eliminar_imagen',isLoggedIn, async (req, res) => {
    await pool.query('DELETE FROM imagen WHERE IMG_ID = ?', [req.body.IMG_ID]);
    fs.unlink(path.resolve('./public/' + req.body.IMG_NOMB), (err) => {
        if (err) {
            console.log(err); throw err;
        }
    })


    req.flash('success', 'Imagen eliminada exitosamente');
    res.redirect('/info');

});

router.post('/update_image',isLoggedIn, update_image, async (req, res) => {
    if (req.file) {
        const newImg = {
            COND_ID: req.user.COND_ID,
            IMG_PATH: req.file.path,
            IMG_NOMB: 'uploads/' + req.file.filename
        };
        await pool.query('INSERT INTO imagen set ?', [newImg]);
        req.flash('success', 'Imagen guardada exitosamente');

    } else {
        req.flash('success', 'Seleccione una Imagen');
    }
    res.redirect('/info');
});


module.exports = router;

