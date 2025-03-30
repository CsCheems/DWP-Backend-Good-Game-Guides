const express = require('express');
const app = express();
const port = 5000;

const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const commentRoutes = require('./routes/commentsRoutes');
const recoveryRoutes = require('./routes/recoveryRoute');

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/comment', commentRoutes);
app.use('/api/recovery', recoveryRoutes);


app.listen(port, () =>{
    console.log(`Servidor iniciado en el puerto: ${port}`);
});