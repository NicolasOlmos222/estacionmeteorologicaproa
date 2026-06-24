import { useState, useEffect } from 'react';
import Temperatura from './components/temperatura';
import Humedad from './components/humedad';
import IndiceDeCalor from './components/sensacion';
import Historial from './components/historial';


function App() {
    const [temperatura, setTemperatura] = useState(0);
    const [humedad, setHumedad] = useState(0);
    const [indiceDeCalor, setIndiceDeCalor] = useState(0);

    useEffect(() => {
        const obtenerDatos = () => {
            fetch('http://localhost:3000/api/clima')
                .then(res => res.json())
                .then(data => {
                    setTemperatura(data.temperatura);
                    setHumedad(data.humedad);
                    setIndiceDeCalor(data.indiceDeCalor);
                })
                .catch(err => console.error("Error en Fetch:", err));
        };
        obtenerDatos();

        const intervalo = setInterval(obtenerDatos, 3600000);
        return () => clearInterval(intervalo);
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <Temperatura temperatura={temperatura}/>
                <Humedad humedad={humedad}/>
                <IndiceDeCalor indiceDeCalor={indiceDeCalor}/>
            </div>
            <Historial />
        </div>
    );
}

export default App;