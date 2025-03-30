const express = require('express');
const router = express.Router();
const recoveryController = require('../controllers/recoveryController');

router.post('/recoverPassword', recoveryController.recoveryEmail);
router.post('/validateToken', recoveryController.validateToken);
router.post('/resetPassword', recoveryController.updatePassword);


module.exports = router;