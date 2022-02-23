const express = require('express');
const router = express.Router();
const md5 = require('md5');
const pool = require('../database');
const helpers = require('../lib/helpers');
const { isLoggedIn } = require('../lib/auth');

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

//USUARIOS------------------------------------------------------------------
router.get('/usuarios', isLoggedIn, async (req, res) => {
    const usuarios = await pool.query('SELECT * FROM usuario WHERE COND_ID= ? AND USU_ESTADO="ACTIVO" ', [req.user.COND_ID]);
    res.render('links/usuarios', { usuarios });
});

router.post('/crud_usuarios', async (req, res) => {
    switch (req.body.accion) {
        case 'btn_seleccionarUser':
            const row = await pool.query('SELECT * FROM usuario WHERE USU_ID= ?  AND USU_ESTADO="ACTIVO"', [req.body.USU_ID]);
            const usuarios = await pool.query('SELECT * FROM usuario WHERE COND_ID= ?  AND USU_ESTADO="ACTIVO"', [req.user.COND_ID]);
            const user = row[0];
            const modal_user = true;
            res.render('links/usuarios', { usuarios, user, modal_user });
            break;
        case 'btn_eliminarUser':
            const dropuser = {
                USU_ESTADO: "ELIMINADO"
            };
            await pool.query('UPDATE usuario set ? WHERE USU_ID = ?', [dropuser, req.body.USU_ID]);
            req.flash('success', 'Usuario eliminado exitosamente');
            res.redirect('/usuarios');
            break;
        case 'btn_ingresarUser':

            const cont2 = await pool.query('SELECT count(USU_CORREO) as cnt FROM usuario WHERE USU_CORREO=? AND USU_ESTADO="ACTIVO"', [req.body.USU_CORREO]);
            if (cont2[0].cnt == 0) {
                const cont3 = await pool.query('SELECT count(USU_CEDULA) as cnt FROM usuario WHERE USU_CEDULA=? AND USU_ESTADO="ACTIVO"', [req.body.USU_CEDULA]);
                if (cont3[0].cnt == 0) {
                    const cont = await pool.query('SELECT COUNT(*) c FROM usuario');
                    const newLink = {
                        USU_ID: 'USU' + (cont[0].c + 1),
                        COND_ID: req.user.COND_ID,
                        USU_CEDULA: req.body.USU_CEDULA,
                        USU_PASSWORD: md5(req.body.USU_CEDULA),
                        USU_NOMBRE: req.body.USU_NOMBRE,
                        USU_UBICACION: req.body.USU_UBICACION,
                        USU_TELEFONO: req.body.USU_TELEFONO,
                        USU_EDAD: req.body.USU_EDAD,
                        USU_CORREO: req.body.USU_CORREO,
                        USU_FECHA_REG: fecha_actual(),
                        USU_TIPO: req.body.USU_TIPO,
                        USU_ESTADO: req.body.USU_ESTADO,
                    };
                    await pool.query('INSERT INTO usuario set ?', [newLink]);
                    req.flash('success', 'Usuario guardado exitosamente');
                    res.redirect('/usuarios');
                    break;
                } else {
                    req.flash('message', 'NO INGRESADO. La cédula ' + req.body.USU_CEDULA + ' ya esta registrada en el sistema');
                    res.redirect('/usuarios');
                    break;
                }
            } else {
                req.flash('message', 'NO INGRESADO. El correo ' + req.body.USU_CORREO + ' ya esta registrado en el sistema');
                res.redirect('/usuarios');
                break;
            }

        case 'btn_modificarUser':
            if (req.body.USU_CORREO.localeCompare(req.body.USU_CORREO_A) == 0) {
                if (req.body.USU_CEDULA.localeCompare(req.body.USU_CEDULA_A) == 0) {
                    const updateuser = {
                        USU_CEDULA: req.body.USU_CEDULA,
                        USU_NOMBRE: req.body.USU_NOMBRE,
                        USU_UBICACION: req.body.USU_UBICACION,
                        USU_TELEFONO: req.body.USU_TELEFONO,
                        USU_EDAD: req.body.USU_EDAD,
                        USU_CORREO: req.body.USU_CORREO,
                        USU_TIPO: req.body.USU_TIPO
                    };
                    await pool.query('UPDATE usuario set ? WHERE USU_ID = ?', [updateuser, req.body.USU_ID]);
                    req.flash('success', 'Usuario modificado exitosamente');
                    res.redirect('/usuarios');
                    break;
                } else {

                    const cont3 = await pool.query('SELECT count(USU_CEDULA) as cnt FROM usuario WHERE USU_CEDULA=? AND USU_ESTADO="ACTIVO"', [req.body.USU_CEDULA]);
                    if (cont3[0].cnt > 0) {
                        req.flash('message', 'NO ACTUALIZADO. La cédula ' + req.body.USU_CEDULA + ' ya esta registrada en el sistema');
                        res.redirect('/usuarios');
                        break;
                    }
                }
            } else {
                const cont2 = await pool.query('SELECT count(USU_CORREO) as cnt FROM usuario WHERE USU_CORREO=? AND USU_ESTADO="ACTIVO"', [req.body.USU_CORREO]);
                if (cont2[0].cnt > 0) {
                    req.flash('message', 'NO ACTUALIZADO. El correo ' + req.body.USU_CORREO + ' ya esta registrado en el sistema');
                    res.redirect('/usuarios');
                    break;
                }
            }
            const updateuser = {
                USU_CEDULA: req.body.USU_CEDULA,
                USU_NOMBRE: req.body.USU_NOMBRE,
                USU_UBICACION: req.body.USU_UBICACION,
                USU_TELEFONO: req.body.USU_TELEFONO,
                USU_EDAD: req.body.USU_EDAD,
                USU_CORREO: req.body.USU_CORREO,
                USU_TIPO: req.body.USU_TIPO
            };
            await pool.query('UPDATE usuario set ? WHERE USU_ID = ?', [updateuser, req.body.USU_ID]);
            req.flash('success', 'Usuario modificado exitosamente');
            res.redirect('/usuarios');
            break;
        case 'btn_cancelarUser':
            res.redirect('/usuarios');
            break;
        case 'btn_reset':
            const updatePassword = {
                USU_PASSWORD: md5(req.body.USU_CEDULA),
                USU_TOKEN:null
            };
            await pool.query('UPDATE usuario set ? WHERE USU_ID = ?', [updatePassword, req.body.USU_ID]);
            req.flash('success', 'Contraseña reseteada correctamente');
            res.redirect('/usuarios');
            break;
    }

});
module.exports = router;
