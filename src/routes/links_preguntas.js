const express = require('express');
const router = express.Router();
const md5 = require('md5');
const pool = require('../database');
const helpers = require('../lib/helpers');
const { isLoggedIn } = require('../lib/auth');

Object.size = function (obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key))
            size++;
        return size;
    };
}

//preguntas-------------------------------------------------

router.get('/preguntas/:ENC_ID', isLoggedIn, async (req, res) => {
    const { ENC_ID } = req.params;
    const preguntas = await pool.query('SELECT *  FROM pregunta WHERE ENC_ID=?', [ENC_ID]);
    const row = await pool.query('SELECT *  FROM encuesta WHERE ENC_ID=?', [ENC_ID]);
    const encuesta = row[0];
    if(encuesta.COND_ID==req.user.COND_ID){
        res.render('links/preguntas', { preguntas, encuesta });
    }else{
        res.redirect("/");
    }
    
});

router.post('/crud_preguntas',isLoggedIn, async (req, res) => {
    switch (req.body.accion) {
        case 'btn_seleccionarPregunta':
            const row1 = await pool.query('SELECT *  FROM pregunta WHERE PRE_ID=?', [req.body.PRE_ID]);
            const row2 = await pool.query('SELECT *  FROM encuesta WHERE ENC_ID=?', [req.body.ENC_ID]);
            const preguntas = await pool.query('SELECT *  FROM pregunta WHERE ENC_ID=?', [req.body.ENC_ID]);
            const pregunta = row1[0];
            const encuesta = row2[0];
            if (pregunta.PRE_TIPO == "SINO") {
                const modal_preguntasn = true;
                res.render('links/preguntas', { preguntas, encuesta, pregunta, modal_preguntasn });
            } else {
                const modal_preguntamul = true;
                const opciones = await pool.query('SELECT *  FROM opcion WHERE PRE_ID=?', [req.body.PRE_ID]);
                res.render('links/preguntas', { preguntas, encuesta, pregunta, modal_preguntamul, opciones });
            }
            break;
        case 'btn_eliminarPregunta':
            await pool.query('DELETE FROM respuesta WHERE PRE_ID = ?', [req.body.PRE_ID]);
            await pool.query('DELETE FROM opcion WHERE PRE_ID = ?', [req.body.PRE_ID]);
            await pool.query('DELETE FROM pregunta WHERE PRE_ID = ?', [req.body.PRE_ID]);
            req.flash('success', 'Pregunta eliminada exitosamente');
            res.redirect('/preguntas/' + req.body.ENC_ID);
            break;
        case 'btn_ingresarPreguntasn':
            const newPreguntasn = {
                ENC_ID: req.body.ENC_ID,
                PRE_ENUNCIADO: req.body.PRE_ENUNCIADO,
                PRE_TIPO: req.body.PRE_TIPO
            };
            const OkPacket = await pool.query('INSERT INTO pregunta set ?', [newPreguntasn]);
            var newoptions = [
                {
                    PRE_ID: OkPacket.insertId,
                    OPC_DATO: "SI"
                },
                {
                    PRE_ID: OkPacket.insertId,
                    OPC_DATO: "NO"
                }
            ];
            await pool.query('INSERT INTO opcion set ?', [newoptions[0]]);
            await pool.query('INSERT INTO opcion set ?', [newoptions[1]]);
            req.flash('success', 'Pregunta guardada exitosamente');
            res.redirect('/preguntas/' + req.body.ENC_ID);
            break;
        case 'btn_ingresarPreguntamul':
            const newPreguntamul = {
                ENC_ID: req.body.ENC_ID,
                PRE_ENUNCIADO: req.body.PRE_ENUNCIADO,
                PRE_TIPO: req.body.PRE_TIPO
            };
            const OkPacketmul = await pool.query('INSERT INTO pregunta set ?', [newPreguntamul]);
            var elementos = JSON.parse(JSON.stringify(req.body));
            var count = Object.keys(elementos).length;
            for (var i = 0; i < count; i++) {
                if (typeof elementos[i] != "undefined") {
                    var newoption =
                    {
                        PRE_ID: OkPacketmul.insertId,
                        OPC_DATO: elementos[i]
                    };
                    await pool.query('INSERT INTO opcion set ?', [newoption]);
                }

            }
            res.redirect('/preguntas/' + req.body.ENC_ID);
            break;
        case 'btn_modificarPreguntasn':
            const updatePreguntasn = {
                PRE_ENUNCIADO: req.body.PRE_ENUNCIADO
            };
            await pool.query('UPDATE pregunta set ? WHERE PRE_ID = ?', [updatePreguntasn, req.body.PRE_ID]);
            req.flash('success', 'Pregunta modificada exitosamente');
            res.redirect('/preguntas/' + req.body.ENC_ID);
            break;
        case 'btn_modificarPreguntamul':
            const updatePreguntamul = {
                PRE_ENUNCIADO: req.body.PRE_ENUNCIADO
            };
            await pool.query('UPDATE pregunta set ? WHERE PRE_ID = ?', [updatePreguntamul, req.body.PRE_ID]);
            var elementos = JSON.parse(JSON.stringify(req.body));
            var row = await pool.query('SELECT OPC_ID FROM opcion ORDER BY OPC_ID DESC LIMIT 1');
            var count = row[0].OPC_ID;
            const opciones = await pool.query('SELECT* FROM  opcion WHERE PRE_ID=?', [req.body.PRE_ID]);
            for (var i = 0; i <= count; i++) {
                if (typeof elementos[i] != "undefined") {
                    var ind = false;
                    for (var j = 0; j < opciones.length; j++) {
                        if (opciones[j].OPC_ID == i) {
                            if (opciones[j].OPC_DATO != elementos[i]) {
                                const updateOpcion = {
                                    OPC_DATO: elementos[i]
                                };
                                await pool.query('UPDATE opcion set ? WHERE OPC_ID = ?', [updateOpcion, opciones[j].OPC_ID]);
                            } else {
                            }
                            opciones.splice(j, 1);
                            j--;
                            ind = true;
                        }
                    }

                    if (ind == false) {
                        const newOpcion = {
                            PRE_ID: req.body.PRE_ID,
                            OPC_DATO: elementos[i]
                        };
                        await pool.query('INSERT INTO opcion set ?', [newOpcion]);
                    }
                }

            }
            if (opciones.length != 0) {
                for (var i = 0; i < opciones.length; i++) {
                    await pool.query('DELETE FROM respuesta WHERE OPC_ID = ?', [opciones[i].OPC_ID]);
                    await pool.query('DELETE FROM opcion WHERE OPC_ID = ?', [opciones[i].OPC_ID]);
                }

            }
            res.redirect('/preguntas/' + req.body.ENC_ID);
            break;
        case 'btn_cancelarPregunta':
            res.redirect('/preguntas/' + req.body.ENC_ID);
            break;
    }

});
module.exports = router;
