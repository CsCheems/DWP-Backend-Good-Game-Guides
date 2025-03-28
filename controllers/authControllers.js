const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/firebase');
const moment = require('moment');
const SECRET = '8fJr9qZL6yDgM1bNpXvW2sT7V3oKbF5C';

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

    console.log('Entre al servicio de login');
    const {username, password} = req.body;

    if(!username || !password){
        return res.status(400).json({
            statusCode: 400,
            intMessage: "Datos Incompletos",
            data: { message: "Todos los campos son requeridos" },
          });
    }
    try {
        
        const userQuery = await db.collection('usuarios')
        .where('usuario', '==', username)
        .get();
  
      if (userQuery.empty) {
        return res.status(404).json({
          statusCode: 404,
          intMessage: 'Usuario no encontrado',
          data: { message: 'El usuario no existe' },
        });
      }
  
      const document = userQuery.docs[0];
      const user = document.data();
      const validPassword = await bcrypt.compare(password, user.password);

      console.log(validPassword);
  
      if (!validPassword) {
        return res.status(401).json({
          statusCode: 401,
          intMessage: 'No autorizado',
          data: { message: 'Contraseña incorrecta' },
        });
      }
  
      const roleDoc = await db.collection('roles').doc(user.rol).get();
      if (!roleDoc.exists) {
        return res.status(404).json({
          statusCode: 404,
          intMessage: 'Rol no encontrado',
          data: { message: 'El rol asociado al usuario no existe' },
        });
      }
  
      const rol = roleDoc.data();
  
      const token = jwt.sign(
      {
        roleName: rol.rolName,
        usuario: user.usuario,
        usuarioId: user.userId,
        rol: user.rol,
        email: user.email,
        phone: user.telefono,
        dob: user.fechaNacimiento
      }, SECRET, 
      { 
          expiresIn: '1h' 
      });

      console.log(token);
  
      const lastLogin = moment().format('DD-MM-YYYY HH:mm:ss');
      await document.ref.update({ last_login: lastLogin });
      
      return res.status(200).json({
        statusCode: 200,
        intMessage: 'Autorizado',
        result: 
        { 
          message: '¡Credenciales correctas!',
          token: token,
        },
      });
    } catch (error) {
        
    }
}