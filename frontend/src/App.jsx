import { useState, useEffect } from 'react' // Quitamos useRef ya que no se usa

function App() {
    const [temperatura, setTemperatura] = useState(0);
    const [humedad, setHumedad] = useState(0);
    const [indiceDeCalor, setIndiceDeCalor] = useState(0);

    useEffect(() => {
    fetch('http://localhost:3000/api/clima')
        .then(res => res.json())
        .then(data => {
            // Aquí 'data' sí existe y trae todo el objeto de golpe
            setTemperatura(data.temperatura);
            setHumedad(data.humedad);
            setIndiceDeCalor(data.indiceDeCalor);
        })
        .catch(err => console.error("Error:", err));
}, []);

    return (
        <div>
            <h1>Temperatura: {temperatura} °C</h1>
            <h1>Humedad: {humedad} %</h1>
            <h1>Índice de calor: {indiceDeCalor} °C</h1>
        </div>
    );
}

export default App;