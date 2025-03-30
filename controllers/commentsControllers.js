const db = require('../config/firebase');
const moment = require('moment');

exports.nuevoComentario = async (req, res) => {
    const { username, comentario, juegoId } = req.body;

    if(!username || !comentario || !juegoId){
        return res.status(400).json({
            statusCode: 400,
            intMessage: "Datos Incompletos",
            data: { message: "Hay datos faltantes" },
        });
    }
    try {

        const comentarioFecha = moment().format('DD-MM-YYYY');

        const newComment = await db.collection('comentarios').add({
            autor: username,
            comentario: comentario,
            valoracion: 0,
            parentId: null,
            fecha: comentarioFecha,
            juego: juegoId
        });

        await newComment.update({comentarioId: newComment.id});

        return res.status(201).json({
            statusCode: 201,
            intMessage: "Creado",
            data: {
                message: "Comentario creado con exito",
            }
        });
    } catch (error) {
        return res.status(500).json({
            statusCode: 500,
            intMessage: "Error",
            data: { message: "Error al crear el comentario" },
        });
    }
}

exports.responderComentario = async (req, res) => {
    console.log('Entre al servicio responder');

    const { username, comentarioId, respuesta, juegoId } = req.body;

    console.log(username, comentarioId, respuesta, juegoId);

    if(!username || !comentarioId || !respuesta || !juegoId){
        return res.status(400).json({
            statusCode: 400,
            intMessage: "Datos Incompletos",
            data: { message: "Hay datos faltantes" },
        });
    }

    try {
        const comentarioFecha = moment().format('DD-MM-YYYY');

        const newResponse = await db.collection('comentarios').add({
            autor: username,
            comentario: respuesta,
            valoracion: 0,
            parentId: comentarioId,
            fecha: comentarioFecha,
            juego: juegoId
        });

        await newResponse.update({comentarioId: newResponse.id});

        return res.status(201).json({
            statusCode: 201,
            intMessage: "Creado",
            data: {
                message: "Respuesta creada con exito",
            }
        });

    } catch (error) {
        return res.status(500).json({
            statusCode: 500,
            intMessage: "Error",
            data: { message: "Error al crear el respuesta" },
        });
    }
}

exports.obtenerComentarios = async (req, res) => {
    let { juegoId } = req.params;
    console.log(juegoId);

    if (!juegoId) {
        return res.status(400).json({
            statusCode: 400,
            intMessage: "Datos Incompletos",
            data: { message: "ID del juego faltante" },
        });
    }

    //juegoId = Number(juegoId);

    try {
        const comentariosSnapshot = await db.collection('comentarios')
            .where('juego', '==', juegoId)
            .get();


        if (comentariosSnapshot.empty) {
            return res.status(404).json({
                statusCode: 404,
                intMessage: "No encontrado",
                data: { message: "No hay comentarios para este juego" },
            });
        }

        const comentarios = comentariosSnapshot.docs.map((doc) => {
            const data = doc.data();  // Obtiene los datos del documento
            return {
                comentarioId: doc.id,
                autor: data.autor,
                valoracion: data.valoracion,
                parentId: data.parentId,
                fecha: data.fecha,
                juego: data.juego,
                comentario: data.comentario,
            };
        });

        return res.status(200).json({
            statusCode: 200,
            intMessage: "Éxito",
            data: comentarios,
        });
    } catch (error) {
        console.error("Error al obtener los comentarios:", error);
        return res.status(500).json({
            statusCode: 500,
            intMessage: "Error",
            data: { message: "Error al obtener los comentarios" },
        });
    }
};
