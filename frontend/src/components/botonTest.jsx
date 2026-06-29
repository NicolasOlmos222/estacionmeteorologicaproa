import React from 'react';

function BotonTest({ alEnviarComando }) {
  return (
    <section className="panel-control">
      
      {/* Grupo de Control del Relé */}
      <div className="control-group">
        <h2>Actuador (Relé)</h2>
        <div className="botones-flex">
          <button 
            className="btn-control btn-on" 
            onClick={() => alEnviarComando('R1')}
          >
            Encender
          </button>
          <button 
            className="btn-control btn-off" 
            onClick={() => alEnviarComando('R0')}
          >
            Apagar
          </button>
        </div>
      </div>

      {/* Grupo de Control del Modo Test */}
      <div className="control-group">
        <h2>Modo Simulación (Test)</h2>
        <div className="botones-flex">
          <button 
            className="btn-control btn-test-on" 
            onClick={() => alEnviarComando('TEST1')}
          >
            Activar Test
          </button>
          <button 
            className="btn-control btn-test-off" 
            onClick={() => alEnviarComando('TEST0')}
          >
            Modo Real
          </button>
        </div>
      </div>

    </section>
  );
}

export default BotonTest;