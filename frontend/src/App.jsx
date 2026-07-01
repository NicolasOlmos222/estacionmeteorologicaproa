import { useState, useEffect } from 'react';
import Temperatura from './components/temperatura';
import Humedad from './components/humedad';
import IndiceDeCalor from './components/sensacion';
import Historial from './components/historial';
import Lluvia from './components/lluvia';
import Viento from './components/viento';
import BotonTest from './components/botonTest'; 
import Presentacion from './components/Presentacion';
import GuiaDidactica from './components/GuiaDidactica';
import Luz from './components/luz';
import './App.css'; 

function App() {
    const [temperatura, setTemperatura] = useState(0);
    const [humedad, setHumedad] = useState(0);
    const [indiceDeCalor, setIndiceDeCalor] = useState(0);
    const [lluviaBool, setLluviaBool] = useState(false); 
    const [lluviaMm, setLluviaMm] = useState(0); 
    const [velocidadViento, setVelocidadViento] = useState(0);
    const [luz, setLuz] = useState(0);
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'presentacion', 'guia'

    const enviarComandoAlBackend = async (accion) => {
        try {
            const respuesta = await fetch('http://localhost:3000/api/clima/control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comando: accion })
            });
            const data = await respuesta.json();
            if (!respuesta.ok) alert(`Error: ${data.error}`);
            else console.log(data.mensaje);
        } catch (error) {
            console.error("Error al conectar con el servidor:", error);
        }
    };

    useEffect(() => {
        const obtenerDatos = () => {
            fetch('http://localhost:3000/api/clima')
                .then(res => res.json())
                .then(data => {
                    setTemperatura(data.temperatura);
                    setHumedad(data.humedad);
                    setIndiceDeCalor(data.indiceDeCalor);
                    setLluviaBool(data.lluviaBool);
                    setLluviaMm(data.nivelAgua || data.lluviaMm); 
                    setVelocidadViento(data.velocidadViento || 0);
                    setLuz(data.luz || 0);
                })
                .catch(err => console.error("Error en Fetch:", err));
        };
        
        obtenerDatos();
        const intervalo = setInterval(obtenerDatos, 2000); 
        return () => clearInterval(intervalo);
    }, []);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'presentacion':
                return <Presentacion />;
            case 'guia':
                return <GuiaDidactica />;
            case 'dashboard':
            default:
                return (
                    <>
                        <div className="main-layout">
                            <BotonTest alEnviarComando={enviarComandoAlBackend} />
                            
                            <div className="sensores-grid">
                                <Temperatura temperatura={temperatura}/>
                                <Humedad humedad={humedad}/>
                                <IndiceDeCalor indiceDeCalor={indiceDeCalor}/>
                                <Viento velocidadViento={velocidadViento}/>
                                <Lluvia lluviaBool={lluviaBool} lluviaMm={lluviaMm}/>
                                <Luz luz={luz}/>
                            </div>
                        </div>
                        <Historial/>
                    </>
                );
        }
    };

    return (
        <div className="app-container">
            <h1 className="titulo-principal">Estación Meteorológica</h1>
            
            <div className="tabs-container">
                <button 
                    className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    Panel Principal
                </button>
                <button 
                    className={`tab-button ${activeTab === 'presentacion' ? 'active' : ''}`}
                    onClick={() => setActiveTab('presentacion')}
                >
                    Presentación del Proyecto
                </button>
                <button 
                    className={`tab-button ${activeTab === 'guia' ? 'active' : ''}`}
                    onClick={() => setActiveTab('guia')}
                >
                    Guía Didáctica
                </button>
            </div>

            {renderTabContent()}
        </div>
    );
}

export default App;