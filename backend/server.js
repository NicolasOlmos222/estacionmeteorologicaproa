import express from 'express';

const app = express();

const PORT = 3000;

app.get('/', (req, res) => {
    res.send('Hola mundo');
});

app.get('/saludo/:nombre', (req, res) => {
    const nombreUsuario = req.params.nombre;
    
    res.send(`¡Hola ${nombreUsuario}!`);
});

app.get('/saludo2', (req, res) => {
    http://localhost:3000/saludo2?nombre=Nico
    const nombreUsuario = req.query.nombre;

    res.send(`¡Hola ${nombreUsuario}!`);
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo con éxito en http://localhost:${PORT}`);
});