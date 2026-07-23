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
                    setHasMore(false);
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

    const restablecerVistaInicial = () => {
        setSemanas([]);
        setPagina(0);
        setHasMore(true);
        setSemanasExpandidas({});
    };

    useEffect(() => {
        cargarSemanas();
    }, []);

    const toggleSemana = (id) => {
        setSemanasExpandidas(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    return (
        <div style={{
            marginTop: '30px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            backgroundColor: '#121212',
            color: '#ffffff',
            padding: '20px',
            borderRadius: '12px'
        }}>
            <h2 style={{ color: '#ffffff', borderBottom: '2px solid #333333', paddingBottom: '10px' }}>
                Historial de Clima por Semanas
            </h2>

            {pagina > 1 && (
                <button 
                    onClick={restablecerVistaInicial}
                    style={{
                        padding: '10px 18px',
                        backgroundColor: '#ff5252',
                        color: '#000000',
                        border: '2px solid #ffffff',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        marginBottom: '20px'
                    }}
                >
                    Cerrar / Restablecer
                </button>
            )}

            {semanas.length === 0 && !cargando ? (
                <p style={{ color: '#b0bec5' }}>No hay registros semanales consolidados todavía.</p>
            ) : (
                semanas.map((semana, index) => {
                    const esUltimaSemana = index === 0;
                    const estaExpandida = semanasExpandidas[semana.id] ?? esUltimaSemana;

                    return (
                        <div key={semana.id} style={{
                            border: esUltimaSemana ? '2px solid #ffd600' : '1px solid #333333',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            padding: '15px',
                            backgroundColor: esUltimaSemana ? '#1e1e24' : '#181818',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                        }}>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer'
                            }} onClick={() => toggleSemana(semana.id)}>
                                <h4 style={{ margin: 0, color: esUltimaSemana ? '#ffd600' : '#ffffff', fontSize: '1.1rem' }}>
                                    {esUltimaSemana ? 'Última Semana Reciente: ' : `Semana Anterior (ID: ${semana.id}): `} 
                                    <span style={{ fontWeight: 'normal', color: '#e0e0e0' }}>
                                        {new Date(semana.fecha_inicio).toLocaleDateString()} al {new Date(semana.fecha_fin).toLocaleDateString()}
                                    </span>
                                </h4>
                                <button style={{
                                    padding: '6px 14px',
                                    backgroundColor: 'transparent',
                                    color: esUltimaSemana ? '#ffd600' : '#00e676',
                                    border: `2px solid ${esUltimaSemana ? '#ffd600' : '#00e676'}`,
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}>
                                    {estaExpandida ? 'Colapsar' : 'Expandir'}
                                </button>
                            </div>

                            {estaExpandida && (
                                <div style={{ marginTop: '15px', overflowX: 'auto' }}>
                                    <table cellPadding="10" style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        textAlign: 'center',
                                        fontSize: '14px',
                                        backgroundColor: '#121212',
                                        border: '1px solid #333333'
                                    }}>
                                        <thead>
                                            <tr style={{ backgroundColor: '#262626', color: '#ffffff', borderBottom: '2px solid #444444' }}>
                                                <th style={{ border: '1px solid #333333' }}>Fecha</th>
                                                <th style={{ border: '1px solid #333333' }}>Temp Máx</th>
                                                <th style={{ border: '1px solid #333333' }}>Temp Mín</th>
                                                <th style={{ border: '1px solid #333333' }}>Sensación Máx</th>
                                                <th style={{ border: '1px solid #333333' }}>Sensación Mín</th>
                                                <th style={{ border: '1px solid #333333' }}>Humedad Promedio</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {semana.dias.map((dia) => (
                                                <tr key={dia.id} style={{ borderBottom: '1px solid #2a2a2a' }}>
                                                    <td style={{ border: '1px solid #333333', color: '#ffffff' }}>
                                                        {new Date(dia.fecha).toLocaleDateString()}
                                                    </td>
                                                    <td style={{ border: '1px solid #333333', color: '#ff5252', fontWeight: 'bold' }}>
                                                        {dia.temperatura_max}°C
                                                    </td>
                                                    <td style={{ border: '1px solid #333333', color: '#40c4ff', fontWeight: 'bold' }}>
                                                        {dia.temperatura_min}°C
                                                    </td>
                                                    <td style={{ border: '1px solid #333333', color: '#ff8a80' }}>
                                                        {dia.sensacion_max}°C
                                                    </td>
                                                    <td style={{ border: '1px solid #333333', color: '#80d8ff' }}>
                                                        {dia.sensacion_min}°C
                                                    </td>
                                                    <td style={{ border: '1px solid #333333', color: '#b9f6ca', fontWeight: 'bold' }}>
                                                        {Number(dia.humedad_prom).toFixed(1)}%
                                                    </td>
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

            <div style={{ textAlign: 'center', marginTop: '25px', marginBottom: '40px' }}>
                {cargando && <p style={{ color: '#ffd600', fontWeight: 'bold' }}>Cargando más semanas...</p>}
                
                {!cargando && hasMore && (
                    <button onClick={cargarSemanas} style={{
                        padding: '12px 24px',
                        fontSize: '16px',
                        backgroundColor: '#00e676',
                        color: '#000000',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}>
                        Cargar más
                    </button>
                )}

                {!hasMore && semanas.length > 0 && (
                    <p style={{ color: '#808080', fontStyle: 'italic' }}>Fin del historial. No hay más semanas registradas.</p>
                )}
            </div>
        </div>
    );
}

export default Historial;