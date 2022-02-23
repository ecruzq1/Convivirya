const express = require('express');
const router = express.Router();
const md5 = require('md5');
const pool = require('../database');
const helpers = require('../lib/helpers');
const { isLoggedIn } = require('../lib/auth');

//ADMINISTRADORES---------------------------------------------------
router.get('/usuariodatos', isLoggedIn, async (req, res) => {

    res.render('links/usuariodatos');
});

router.post('/crud_usuariodatos', async (req, res) => {
    switch (req.body.accion) {
        case 'btn_modificarDatos':
            if(req.body.ADM_USUARIO.localeCompare(req.body.ADM_USUARIO_A)==0){
                if(req.body.ADM_CORREO.localeCompare(req.body.ADM_CORREO_A)==0){
                    if(req.body.ADM_CEDULA.localeCompare(req.body.ADM_CEDULA_A)==0){
                        const updateadmin = {
                            ADM_USUARIO: req.body.ADM_USUARIO,
                            COND_ID: req.body.COND_ID,
                            ADM_NOMBRE: req.body.ADM_NOMBRE,
                            ADM_APELLIDO: req.body.ADM_APELLIDO,
                            ADM_CEDULA: req.body.ADM_CEDULA,
                            ADM_CORREO: req.body.ADM_CORREO,
                            ADM_TELEFONO: req.body.ADM_TELEFONO,
                        };
                        await pool.query('UPDATE administrador set ? WHERE ADM_ID = ?', [updateadmin, req.body.ADM_ID]);
                        req.flash('success', 'Administrador modificado exitosamente');
                        res.redirect('/usuariodatos');
                        break;
                    }else{
                        const cont3=await pool.query('SELECT count(ADM_CEDULA) as cnt FROM administrador WHERE ADM_CEDULA=? AND ADM_ESTADO="ACTIVO"',[req.body.ADM_CEDULA]);
                        if(cont3[0].cnt>0){
                            req.flash('message', 'NO ACTUALIZADO. La cedula '+req.body.ADM_CEDULA +' ya esta registrada en el sistema');
                            res.redirect('/usuariodatos');
                            break;
                        }
                    }
                }else{
                    const cont2=await pool.query('SELECT count(ADM_CORREO) as cnt FROM administrador WHERE ADM_CORREO=? AND ADM_ESTADO="ACTIVO"',[req.body.ADM_CORREO]);
                    if(cont2[0].cnt>0){
                        req.flash('message', 'NO ACTUALIZADO. El correo '+req.body.ADM_CORREO +' ya esta registrado en el sistema');
                        res.redirect('/usuariodatos');
                        break;
                    }
                }
            }else{
                const cont=await pool.query('SELECT count(ADM_USUARIO) as cnt FROM administrador WHERE ADM_USUARIO=? AND ADM_ESTADO="ACTIVO"',[req.body.ADM_USUARIO]);
                if(cont[0].cnt>0){
                    req.flash('message', 'NO ACTUALIZADO. El usuario '+req.body.ADM_USUARIO +' ya esta registrado en el sistema');
                    res.redirect('/usuariodatos');
                    break;
                }
            }
            const updateadmin = {
                ADM_USUARIO: req.body.ADM_USUARIO,
                COND_ID: req.body.COND_ID,
                ADM_NOMBRE: req.body.ADM_NOMBRE,
                ADM_APELLIDO: req.body.ADM_APELLIDO,
                ADM_CEDULA: req.body.ADM_CEDULA,
                ADM_CORREO: req.body.ADM_CORREO,
                ADM_TELEFONO: req.body.ADM_TELEFONO,
            };
            await pool.query('UPDATE administrador set ? WHERE ADM_ID = ?', [updateadmin, req.body.ADM_ID]);
            req.flash('success', 'Administrador modificado exitosamente');
            res.redirect('/usuariodatos');
            break;

    }
});

module.exports = router;
