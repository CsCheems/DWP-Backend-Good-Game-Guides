const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/firebase');
const moment = require('moment');

exports.registro = async (req, res) => {
    const {email, phone, dob, username, password} = req.body;

    if(!email || !phone || !dob || !username || !password){
        return res.status(400).json({
            statusCode: 400,
            intMessage: "Datos Incompletos",
            data: { message: "Todos los campos son requeridos" },
          });
    }

    const roleId = 'divEXH8fhzEdMw0wwS4y';
    
    try{
        let userQuery = await db
        .collection('usuarios')
        .where('usuario', '==', username)
        .get();

        if(!userQuery.empty){
            return res.status(409).json({
                statusCode: 409,
                intMessage: "Conflicto",
                data: { message: "El usuario ya existe" },
              });
        }

        userQuery = await db
        .collection("users")
        .where("email", "==", email)
        .get();

        if (!userQuery.empty) {
            return res.status(409).json({
                statusCode: 409,
                intMessage: "Conflicto",
                data: { message: "El email ya esta en uso" },
            });
        }

        let hashPassword = await bcrypt.hash(password, 10);

        const fecha = new Intl.DateTimeFormat('es-ES').format(new Date(dob));
        
        const nuevoUsuario = await db.collection('usuarios').add({
            usuario: username,
            password: hashPassword,
            email: email,
            telefono: phone,
            fechaNacimiento: fecha,
            last_login: '',
            rol: roleId
        });

        await nuevoUsuario.update({usuarioId: nuevoUsuario.id});

        return res.status(201).json({
            statusCode: 201,
            intMessage: "Creado",
            data: {
                message: 'Registro exitoso'
            }
        });

    }catch(error){
        return res.status(500).json({
            statusCode: 500,
            intMessage: "Error",
            data: { message: "Error al crear el usuario" },
        });
    }
}

exports.login = async(req, res) => {
    
}