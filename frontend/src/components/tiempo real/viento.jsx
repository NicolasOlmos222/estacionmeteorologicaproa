import React from 'react';

function Viento({ velocidadViento }) {
    return (
        <div className="sensor-card">
            <h1>Viento: {velocidadViento || 0} m/s</h1>
        </div>
    );
}

export default Viento;