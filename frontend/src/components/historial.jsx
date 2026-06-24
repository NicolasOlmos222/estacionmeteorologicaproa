import { useState, useEffect } from 'react';

function Historial() {
    const [semanas, setSemanas] = useState([]);
    const [pagina, setPagina] = useState(0);
    const [cargando, setCargando] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [semanasExpandidas, setSemanasExpandidas] = useState({});

    // Cargar bloques de 4 semanas
    const cargarSemanas = () => {
        if (cargando || !hasMore) return;
        setCargando(true);

        fetch(`http://localhost:3000/api/clima/historial-semanas?page=${pagina}`)
            .then(res => res.json())
            .then(data => {
                if (data.length < 4) {
                    setHasMore(false); // Ya no hay más semanas en la BD
                }
                if (data.length > 0) {
                    setSemanas([...semanas, ...data]);
                    setPagina(pagina + 1);
                }
                setCargando(false);
            })
            .catch(err => {
                console.error("Error al cargar semanas:", err);
                setCargando(false);
            });
    };

    // Cargar el primer bloque al iniciar
    useEffect(() => {
        cargarSemanas();
    }, []);

    // Alternar la vista expandida de una semana específica
    const toggleSemana = (id) => {
        setSemanasExpandidas(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    return (
        <div style={{ marginTop: '30px', fontFamily: 'sans-serif' }}>
            <h2>Historial de Clima por Semanas</h2>

                {pagina > 1 && (
                    <button 
                        onClick={restablecerVistaInicial}
                        style={{
                            padding: '8px 15px',
                            backgroundColor: '#2855a7',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        Cerrar
                    </button>
                )}
            {semanas.length === 0 && !cargando ? (
                <p>No hay registros semanales consolidados todavía.</p>
            ) : (
                semanas.map((semana, index) => {
                    const esUltimaSemana = index === 0;
                    const estaExpandida = semanasExpandidas[semana.id] ?? esUltimaSemana; // La primera viene expandida por defecto

                    return (
                        <div key={semana.id} style={{
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            marginBottom: '15px',
                            padding: '15px',
                            backgroundColor: esUltimaSemana ? '#f9f9f9' : '#fff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer'
                            }} onClick={() => toggleSemana(semana.id)}>
                                <h4 style={{ margin: 0 }}>
                                    {esUltimaSemana ? '✨ Última Semana Reciente: ' : `Semana Anterior (ID: ${semana.id}): `} 
                                    <span style={{ fontWeight: 'normal' }}>
                                        {new Date(semana.fecha_inicio).toLocaleDateString()} al {new Date(semana.fecha_fin).toLocaleDateString()}
                                    </span>
                                </h4>
                                <button style={{
                                    padding: '5px 10px',
                                    backgroundColor: esUltimaSemana ? '#0275d8' : '#6c757d',
                                    color: '#white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}>
                                    {estaExpandida ? '▲ Colapsar' : '▼ Expandir'}
                                </button>
                            </div>

                            {estaExpandida && (
                                <div style={{ marginTop: '15px', overflowX: 'auto' }}>
                                    <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '14px' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#f2f2f2' }}>
                                                <th>Fecha</th>
                                                <th>Temp Máx</th>
                                                <th>Temp Mín</th>
                                                <th>Sensación Máx</th>
                                                <th>Sensación Mín</th>
                                                <th>Humedad Promedio</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {semana.dias.map((dia) => (
                                                <tr key={dia.id}>
                                                    <td>{new Date(dia.fecha).toLocaleDateString()}</td>
                                                    <td style={{ color: '#d9534f', fontWeight: 'bold' }}>{dia.temperatura_max}°C</td>
                                                    <td style={{ color: '#0275d8', fontWeight: 'bold' }}>{dia.temperatura_min}°C</td>
                                                    <td>{dia.sensacion_max}°C</td>
                                                    <td>{dia.sensacion_min}°C</td>
                                                    <td>{Number(dia.humedad_prom).toFixed(1)}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })
            )}

            <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '40px' }}>
                {cargando && <p>Cargando más semanas...</p>}
                
                {!cargando && hasMore && (
                    <button onClick={cargarSemanas} style={{
                        padding: '10px 20px',
                        fontSize: '16px',
                        backgroundColor: '#2855a7',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}>
                        Cargar más
                    </button>
                )}

                {!hasMore && semanas.length > 0 && (
                    <p style={{ color: '#777', italic: 'true' }}>Fin del historial. No hay más semanas registradas.</p>
                )}
            </div>
        </div>
    );
}

export default Historial;