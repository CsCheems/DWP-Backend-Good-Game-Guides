const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/firebase');
const moment = require('moment');
const SECRET = '8fJr9qZL6yDgM1bNpXvW2sT7V3oKbF5C';
const speakeasy = require('speakeasy');


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
            rol: roleId,
            mfaActivo: false
        });

        await nuevoUsuario.update({usuarioId: nuevoUsuario.id});

        return res.status(201).json({
            statusCode: 201,
            intMessage: "Creado",
            data: {
                message: 'Registro exitoso',
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
  
      if (!validPassword) {
        return res.status(401).json({
          statusCode: 200,
          intMessage: 'No autorizado',
          data: { message: 'Contraseña incorrecta' },
        });
      }

      if(user.mfaEnabled){
        console.log('requiere 2FA');
        return res.status(200).json({
          statusCode: 202,
          intMessage: '2FA requerido',
          resutl: {
            message: 'Se requiere el codigo de autenticacion',
            mfaReq: true,
            usuario: user.usuario,
          }
        })
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
        dob: user.fechaNacimiento, 
        mfa: user.mfaEnabled,
      }, SECRET, 
      { 
          expiresIn: '1h' 
      });
  
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
      return res.status(500).json({
        statusCode: 500,
        intMessage: "Error",
        data: { message: "Error en la respuesta del servidor" },
    });
    }
}

exports.verificar2FA = async(req, res) => {

  const {username, code} = req.body;

  console.log(username, code);

  if (!username || !code) {
    return res.status(400).json({
        statusCode: 400,
        intMessage: 'Datos Incompletos',
        data: { message: 'Usuario y código requeridos' },
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

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
    });

    if (!verified) {
      return res.status(401).json({
          statusCode: 401,
          intMessage: 'Código incorrecto',
          data: { message: 'Código de autenticación inválido' },
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
        dob: user.fechaNacimiento, 
        mfa: user.mfaEnabled,
      }, SECRET, 
      { 
          expiresIn: '1h' 
      }
    );
  
    const lastLogin = moment().format('DD-MM-YYYY HH:mm:ss');
    await document.ref.update({ last_login: lastLogin });

    return res.status(200).json({
      statusCode: 200,
      intMessage: '2FA exitoso',
      result: {
          message: 'Código verificado',
          token: token,
      },
  });
    

  } catch (error) {
    return res.status(500).json({
      statusCode: 500,
      intMessage: "Error",
      data: { message: "Error al verificar 2FA" },
  });
  }

}

exports.generarQR = async (req, res) => {
  const {username} = req.body;

  if (!username) {
      return res.status(400).json({
          statusCode: 400,
          intMessage: "Datos Incompletos",
          data: { message: "El nombre de usuario es requerido" },
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

      if (user.mfaEnabled) {
          return res.status(400).json({
              statusCode: 400,
              intMessage: "2FA ya está habilitado",
              data: { message: "La autenticación de dos factores ya está habilitada para este usuario" },
          });
      }

      const secret = speakeasy.generateSecret({ length: 20 });
      await document.ref.update({
          mfaSecret: secret.base32, 
          mfaEnabled: false,
      });

      return res.status(200).json({
          statusCode: 200,
          intMessage: "QR generado",
          data: { 
              message: "El QR ha sido generado con exito",
              mfaUrl: secret.otpauth_url,
          },
      });
  } catch (error) {
      return res.status(500).json({
          statusCode: 500,
          intMessage: "Error",
          data: { message: "Error al activar 2FA" },
      });
  }
};

exports.activar2FA = async (req, res) => {
  const {username, code} = req.body;

  console.log(username, code);

  if (!username || !code) {
      return res.status(400).json({
          statusCode: 400,
          intMessage: "Datos Incompletos",
          data: { message: "El nombre de usuario y el token son requeridos" },
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

    if (user.mfaEnabled) {
      return res.status(400).json({
        statusCode: 400,
        intMessage: '2FA ya está habilitado',
        data: { message: 'La autenticación de dos factores ya está habilitada para este usuario' },
      });
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
    });

    if (verified) {
      await document.ref.update({
        mfaEnabled: true,
      });

      user.mfaEnabled = true;

      const updatedToken = jwt.sign(
        {
          usuario: user.usuario,
          usuarioId: user.userId,
          rol: user.rol,
          email: user.email,
          phone: user.telefono,
          dob: user.fechaNacimiento, 
          mfa: user.mfaEnabled,
        },
        SECRET,
        { expiresIn: '1h' }
      );

      return res.status(200).json({
        statusCode: 200,
        intMessage: "2FA activado correctamente",
        result: { 
          message: "La autenticación de dos factores ha sido habilitada correctamente.",
          token: updatedToken
         },
      });
    } else {
      return res.status(400).json({
        statusCode: 400,
        intMessage: "Código incorrecto",
        data: { message: "El código ingresado no es válido." },
      });
    }
  } catch (error) {
      return res.status(500).json({
          statusCode: 500,
          intMessage: "Error",
          data: { message: "Error al verificar 2FA" },
      });
  }
}

exports.desactivar2FA = async (req, res) => {
  const {username, code} = req.body;
  console.log(username, code);
  if (!username || !code) {
      return res.status(400).json({
          statusCode: 400,
          intMessage: "Datos Incompletos",
          data: { message: "El nombre de usuario es requerido" },
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

      if (!user.mfaEnabled) {
          return res.status(400).json({
              statusCode: 400,
              intMessage: "2FA ya está deshabilitado",
              data: { message: "La autenticación de dos factores ya está deshabilitada para este usuario" },
          });
      }

      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: code
      });

      if (!verified) {
        return res.status(400).json({
          statusCode: 400,
          intMessage: "Código incorrecto",
          data: { message: "El código de verificación 2FA es incorrecto" },
        });
      }

      await document.ref.update({ 
          mfaEnabled: false, 
      });

      user.mfaEnabled = false;

      const updatedToken = jwt.sign(
        {
          usuario: user.usuario,
          usuarioId: user.userId,
          rol: user.rol,
          email: user.email,
          phone: user.telefono,
          dob: user.fechaNacimiento, 
          mfa: user.mfaEnabled
        },
        SECRET, 
        { expiresIn: '1h' } 
      );

      return res.status(200).json({
          statusCode: 200,
          intMessage: "2FA desactivado",
          data: { 
              message: "La autenticación de dos factores ha sido inhabilitada",
              token: updatedToken
          },
      });
  } catch (error) {
      return res.status(500).json({
          statusCode: 500,
          intMessage: "Error",
          data: { message: "Error al desactivar 2FA" },
      });
  }
};



