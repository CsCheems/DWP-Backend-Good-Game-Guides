const express = require('express');
const app = express();
const port = 5000;

const cors = require('cors');

const authRoutes = require('./routes/authRoutes');

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.listen(port, () =>{
    console.log(`Servidor iniciado en el puerto: ${port}`);
});