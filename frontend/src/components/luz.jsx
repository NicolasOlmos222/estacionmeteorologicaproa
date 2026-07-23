import React from 'react';

function Luz({ luz }) {
    // Calcular categoría dividiendo por 32. Mayor valor posible es 1024.
    // 1024 / 32 = 32 categorías (de 0 a 31).
    const categoria = Math.min(31, Math.max(0, Math.floor(luz / 32)));
    
    // clock_00 es nivel de luz más alto (categoría 31), clock_31 es el más oscuro (categoría 0)
    const clockIndex = 31 - categoria;
    
    // Formatear a dos dígitos, ej: "00", "01", ..., "31"
    const formattedIndex = String(clockIndex).padStart(2, '0');
    
    // Carga dinámica de imágenes compatible con Vite
    const clockImage = new URL(`../assets/clock_${formattedIndex}.png`, import.meta.url).href;

    return (
        <div className="sensor-card">
            <h1>Luz: {luz}</h1>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '15px' }}>
                <img 
                    src={clockImage} 
                    alt={`Reloj nivel ${formattedIndex}`} 
                    style={{ 
                        height: '64px', 
                        width: '64px', 
                        imageRendering: 'pixelated',
                        display: 'block'
                    }} 
                />
            </div>
        </div>
    );
}

export default Luz;
