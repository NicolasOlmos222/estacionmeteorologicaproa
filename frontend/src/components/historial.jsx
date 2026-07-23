import { useState, useEffect } from 'react';

function Historial() {
    const [semanas, setSemanas] = useState([]);
    const [pagina, setPagina] = useState(0);
    const [cargando, setCargando] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [semanasExpandidas, setSemanasExpandidas] = useState({});
    
    // Estados para exportación a Excel (sin emojis)
    const [mesExportar, setMesExportar] = useState(() => {
        const hoy = new Date();
        const anio = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        return `${anio}-${mes}`;
    });
    const [exportando, setExportando] = useState(false);
    const [mensajeError, setMensajeError] = useState('');

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

    // Restablecer la vista inicial del historial (para solucionar crash del botón Cerrar)
    const restablecerVistaInicial = () => {
        setSemanas([]);
        setPagina(0);
        setHasMore(true);
        setCargando(true);
        fetch(`http://localhost:3000/api/clima/historial-semanas?page=0`)
            .then(res => res.json())
            .then(data => {
                if (data.length < 4) {
                    setHasMore(false);
                }
                setSemanas(data);
                setPagina(1);
                setCargando(false);
            })
            .catch(err => {
                console.error("Error al restablecer:", err);
                setCargando(false);
            });
    };

    // Función para descargar reporte mensual en Excel
    const descargarExcel = async () => {
        setExportando(true);
        setMensajeError('');
        try {
            const respuesta = await fetch(`http://localhost:3000/api/clima/exportar?mes=${mesExportar}`);
            if (!respuesta.ok) {
                const data = await respuesta.json();
                throw new Error(data.error || 'Error al descargar el archivo.');
            }
            
            const blob = await respuesta.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `historial_clima_${mesExportar}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error al exportar Excel:", error);
            setMensajeError(error.message);
        } finally {
            setExportando(false);
        }
    };

    return (
        <div style={{ marginTop: '30px', fontFamily: 'sans-serif' }}>
            <h2>Historial de Clima por Semanas</h2>

            <div style={{
                backgroundColor: 'var(--bg-tarjeta)',
                border: '1px solid var(--borde)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '20px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ margin: '0 0 10px 0', color: 'var(--texto-principal)', fontSize: '1.2rem', fontWeight: 500 }}>Descargar Reporte Mensual</h3>
                <p style={{ margin: '0 0 15px 0', color: 'var(--texto-secundario)', fontSize: '0.95rem' }}>
                    Seleccione un mes para exportar el historial de lecturas climáticas a un archivo Excel.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <input 
                        type="month" 
                        value={mesExportar}
                        onChange={(e) => setMesExportar(e.target.value)}
                        style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid var(--borde)',
                            fontSize: '0.95rem',
                            fontFamily: 'inherit',
                            backgroundColor: 'var(--bg-principal)',
                            color: 'var(--texto-principal)',
                            outline: 'none'
                        }}
                    />
                    <button 
                        onClick={descargarExcel}
                        disabled={exportando}
                        style={{
                            padding: '10px 18px',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            backgroundColor: exportando ? '#29292e' : 'var(--color-accento)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: exportando ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease-in-out'
                        }}
                    >
                        {exportando ? 'Generando archivo...' : 'Descargar Excel'}
                    </button>
                </div>
                {mensajeError && (
                    <p style={{ margin: '12px 0 0 0', color: '#f75a68', fontSize: '0.95rem', fontWeight: '600' }}>
                        {mensajeError}
                    </p>
                )}
            </div>

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