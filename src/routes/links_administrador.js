const express = require('express');
const router = express.Router();
const md5 = require('md5');
const pool = require('../database');
const helpers = require('../lib/helpers');
const { isLoggedIn } = require('../lib/auth');

//ADMINISTRADORES---------------------------------------------------
router.get('/admins', isLoggedIn, async (req, res) => {
    if(req.user.SADM_USUARIO){
        const administradores = await pool.query('SELECT * FROM administrador a, condominio c WHERE a.COND_ID=c.COND_ID AND ADM_ESTADO="ACTIVO"');
        const condominios = await pool.query('SELECT * FROM condominio WHERE COND_ESTADO="ACTIVO"');
        res.render('links/admins', { administradores, condominios });
    }else{
        res.redirect('/profile');
    }
   
});
router.post('/crud_admin',isLoggedIn, async (req, res) => {
    switch (req.body.accion) {
        case 'btn_seleccioanrAdmin':
            const row = await pool.query('SELECT * FROM administrador a, condominio c WHERE a.ADM_USUARIO= ?  AND a.ADM_ESTADO="ACTIVO" AND a.COND_ID=c.COND_ID', [req.body.ADM_USUARIO]);
            const administradores = await pool.query('SELECT * FROM administrador a, condominio c WHERE a.COND_ID=c.COND_ID AND ADM_ESTADO="ACTIVO"');
            const condominios = await pool.query('SELECT * FROM condominio WHERE COND_ESTADO="ACTIVO"');
            const admin = row[0];
            const modal_admin = true;
            res.render('links/admins', { administradores, condominios, admin, modal_admin });
            break;
        case 'btn_eliminarAdmin':
            const dropadmin = {
                ADM_ESTADO: "ELIMINADO"
            };
            await pool.query('UPDATE administrador set ? WHERE ADM_USUARIO = ?', [dropadmin, req.body.ADM_USUARIO]);
            req.flash('success', 'Administrador eliminado exitosamente');
            res.redirect('/admins');
            break;
        case 'btn_ingresarAdmin':
            const cont=await pool.query('SELECT count(ADM_USUARIO) as cnt FROM administrador WHERE ADM_USUARIO=? AND ADM_ESTADO="ACTIVO"',[req.body.ADM_USUARIO]);
            if(cont[0].cnt==0){
                const cont2=await pool.query('SELECT count(ADM_CORREO) as cnt FROM administrador WHERE ADM_CORREO=? AND ADM_ESTADO="ACTIVO"',[req.body.ADM_CORREO]);
                if(cont2[0].cnt==0){
                    const cont3=await pool.query('SELECT count(ADM_CEDULA) as cnt FROM administrador WHERE ADM_CEDULA=? AND ADM_ESTADO="ACTIVO"',[req.body.ADM_CEDULA]);
                    if(cont3[0].cnt==0){
                        const newAdmin = {
                            ADM_USUARIO: req.body.ADM_USUARIO,
                            COND_ID: req.body.COND_ID,
                            ADM_PASSWORD: await helpers.encryptPassword(req.body.ADM_CEDULA),
                            ADM_NOMBRE: req.body.ADM_NOMBRE,
                            ADM_APELLIDO: req.body.ADM_APELLIDO,
                            ADM_CEDULA: req.body.ADM_CEDULA,
                            ADM_CORREO: req.body.ADM_CORREO,
                            ADM_TELEFONO: req.body.ADM_TELEFONO,
                            ADM_ESTADO: req.body.ADM_ESTADO
                        };
                        await pool.query('INSERT INTO administrador set ?', [newAdmin]);
                        req.flash('success', 'Administrador guardado exitosamente');
                        res.redirect('/admins');
                        break;
                    }else{
                        req.flash('message', 'NO INGRESADO. La cédula '+req.body.ADM_CEDULA +' ya esta registrada en el sistema');
                        res.redirect('/admins');
                        break;
                    }
                }else{
                    req.flash('message', 'NO INGRESADO. El correo '+req.body.ADM_CORREO +' ya esta registrado en el sistema');
                    res.redirect('/admins');
                    break;
                }
            }else{
                req.flash('message', 'NO INGRESADO. El usuario '+req.body.ADM_USUARIO +' ya esta registrado en el sistema');
                res.redirect('/admins');
                break;
            }
           
            break;
        case 'btn_modificarAdmin':
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
                        res.redirect('/admins');
                        break;
                    }else{
                        const cont3=await pool.query('SELECT count(ADM_CEDULA) as cnt FROM administrador WHERE ADM_CEDULA=? AND ADM_ESTADO="ACTIVO"',[req.body.ADM_CEDULA]);
                        if(cont3[0].cnt>0){
                            req.flash('message', 'NO ACTUALIZADO. La cedula '+req.body.ADM_CEDULA +' ya esta registrada en el sistema');
                            res.redirect('/admins');
                            break;
                        }
                    }
                }else{
                    const cont2=await pool.query('SELECT count(ADM_CORREO) as cnt FROM administrador WHERE ADM_CORREO=? AND ADM_ESTADO="ACTIVO"',[req.body.ADM_CORREO]);
                    if(cont2[0].cnt>0){
                        req.flash('message', 'NO ACTUALIZADO. El correo '+req.body.ADM_CORREO +' ya esta registrado en el sistema');
                        res.redirect('/admins');
                        break;
                    }
                }
            }else{
                const cont=await pool.query('SELECT count(ADM_USUARIO) as cnt FROM administrador WHERE ADM_USUARIO=? AND ADM_ESTADO="ACTIVO"',[req.body.ADM_USUARIO]);
                if(cont[0].cnt>0){
                    req.flash('message', 'NO ACTUALIZADO. El usuario '+req.body.ADM_USUARIO +' ya esta registrado en el sistema');
                    res.redirect('/admins');
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
            res.redirect('/admins');
            break;
                    
        case 'btn_cancelarAdmin':
            res.redirect('/admins');
            break;
        case 'btn_reset':
            const updatePassword = {
                ADM_PASSWORD: await helpers.encryptPassword(req.body.ADM_CEDULA),
            };
            await pool.query('UPDATE administrador set ? WHERE ADM_ID = ?', [updatePassword, req.body.ADM_ID]);
            req.flash('success', 'Contraseña reseteada correctamente');
            res.redirect('/admins');
            break;
    }
});

module.exports = router;
