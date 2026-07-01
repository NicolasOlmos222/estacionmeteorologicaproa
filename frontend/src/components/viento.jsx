import React from 'react';

function Viento({ velocidadViento }) {
    return (
        <div className="viento-simple">
            <h2>Velocidad del Viento: {velocidadViento || 0} m/s</h2>
        </div>
    );
}

export default Viento;