const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentsControllers');

router.post('/newComment', commentController.nuevoComentario);
router.get('/getComments/:juegoId',commentController.obtenerComentarios);
router.post('/respondComment', commentController.responderComentario);

module.exports = router;