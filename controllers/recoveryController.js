const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const db = require('../config/firebase');

exports.recoveryEmail = async (req, res) => {
    const { email } = req.body;

    console.log(email);

    if (!email) {
        return res.status(400).json({
            statusCode: 400,
            data: {
                message: "El campo email es necesario",
            }
        });
    }
    try {
        const usuarioRef = await db.collection('usuarios').where("email", "==", email).get();

        const userDoc = usuarioRef.docs[0];

        console.log(userDoc);

        if (usuarioRef.empty) {
            return res.status(404).json({
                statusCode: 404,
                data: {
                    message: "Usuario no encontrado",
                }
            });
        }

        const token = crypto.randomBytes(8).toString('hex');

        await userDoc.ref.update({
            resetToken: token,
            resetTokenExpiration: Date.now() + 300000,
        });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'warrido34@gmail.com',
                pass: 'fgyoqcjkqrsonyex'
            }
        });

        const mailOptions = {
            from: 'warrido34@gmail.com',
            to: email,
            subject: 'Restablecimiento de Contraseña',
            text: `Tu token de recuperacion es: ${token}`
        };

        // Enviamos el correo
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).json({
                    statusCode: 500,
                    data: {
                        message: "Error al enviar el correo",
                    }
                });
            }
            return res.status(200).json({
                statusCode: 200,
                intMessage: "Exito",
                data: {
                    message: 'Email enviado',
                }
            });
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            statusCode: 500,
            data: { message: "Error al generar el token" },
        });
    }
}

exports.validateToken = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({
            statusCode: 400,
            data: {
                message: "El token es necesario",
            }
        });
    }

    try{
        const usuarioRef = await db.collection('usuarios').where("resetToken", "==", token).get();

        if (usuarioRef.empty) {
            return res.status(404).json({
                statusCode: 404,
                data: {
                    message: "Token no válido o expirado",
                }
            });
        }

        const userDoc = usuarioRef.docs[0];
        const tokenExpiration = userDoc.data().resetTokenExpiration;

        if (Date.now() > tokenExpiration) {
            return res.status(400).json({
                statusCode: 400,
                data: {
                    message: "El token ha expirado",
                }
            });
        }

        return res.status(200).json({
            statusCode: 200,
            intMessage: "Exito",
            data: {
                message: 'Token validado',
            }
        });

    }catch(error){
        console.log(error);
        return res.status(500).json({
            statusCode: 500,
            data: { message: "Error al actualizar la contraseña" },
        });
    }
}

exports.updatePassword = async (req, res) => {
    const { password, email } = req.body;

    if (!password || !email) {
        return res.status(400).json({
            statusCode: 400,
            data: {
                message: "Password y correo necesarios",
            }
        });
    }

    try{
        const usuarioRef = await db.collection('usuarios').where("email", "==", email).get();

        if (usuarioRef.empty) {
            return res.status(404).json({
                statusCode: 404,
                data: {
                    message: "El correo no existe",
                }
            });
        }

        const userDoc = usuarioRef.docs[0];

        let hashPassword = await bcrypt.hash(password, 10);
        
        await userDoc.ref.update({
            password: hashPassword,
            resetToken: null, 
            resetTokenExpiration: null,
        })

        return res.status(200).json({
            statusCode: 200,
            intMessage: "Exito",
            data: {
                message: 'Contrasena actualizada',
            }
        });

    }catch(error){
        console.log(error);
        return res.status(500).json({
            statusCode: 500,
            data: { message: "Error al actualizar la contraseña" },
        });
    }
}