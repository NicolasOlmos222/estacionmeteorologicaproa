import { useState, useEffect } from 'react';

function App() {
    const [temperatura, setTemperatura] = useState(0);
    const [humedad, setHumedad] = useState(0);
    const [indiceDeCalor, setIndiceDeCalor] = useState(0);

    useEffect(() => {
        // 1. Declaramos la función para que React sepa qué es "obtenerDatos"
        const obtenerDatos = () => {
            fetch('http://localhost:3000/api/clima') // Asegúrate de mantener la ruta /api/clima
                .then(res => res.json())
                .then(data => {
                    setTemperatura(data.temperatura);
                    setHumedad(data.humedad);
                    setIndiceDeCalor(data.indiceDeCalor);
                })
                .catch(err => console.error("Error en Fetch:", err));
        };

        // 2. La llamamos inmediatamente al cargar la página
        obtenerDatos();

        // 3. Dejamos el intervalo corriendo cada 5 segundos
        const intervalo = setInterval(obtenerDatos, 5000);

        // 4. Limpieza del intervalo
        return () => clearInterval(intervalo);
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>Temperatura: {temperatura} °C</h1>
            <h1>Humedad: {humedad} %</h1>
            <h1>Índice de calor: {indiceDeCalor} °C</h1>
        </div>
    );
}

export default App;