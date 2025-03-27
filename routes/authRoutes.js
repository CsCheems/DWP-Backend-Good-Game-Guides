const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers');

router.post('/registroUsuario', authController.registro);

module.exports = router;