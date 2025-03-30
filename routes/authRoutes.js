const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers');

router.post('/registroUsuario', authController.registro);
router.post('/login', authController.login);
router.post('/generateQR', authController.generarQR);
router.post('/activate2FA', authController.activar2FA);
router.post('/deactivate2FA', authController.desactivar2FA);
router.post('/verify2FA', authController.verificar2FA);

module.exports = router;