import React, { useState } from 'react';
import './Tabs.css';

const GuiaDidactica = () => {
  const [activeSubject, setActiveSubject] = useState(null);

  const subjects = [
    { id: 1, title: "Matemáticas y Estadística", desc: "Descarga el histórico en Excel (próximamente) para calcular promedios, medianas y hacer gráficos reales con el clima de la escuela." },
    { id: 2, title: "Programación", desc: "Conéctate a nuestra API (JSON) para aprender a consumir datos en tiempo real y desarrollar tus propias apps." },
    { id: 3, title: "Ciencias Naturales", desc: "Estudia el ciclo del agua, las variaciones del clima y su impacto local con datos de nuestro propio patio." },
    { id: 4, title: "Electrónica y Energía", desc: "Analiza cómo funcionan los sensores y nuestro sistema de alimentación independiente con energía solar." }
  ];

  return (
    <div className="tab-content guide-container">
      <h2>Guía Didáctica</h2>
      
      <div className="guide-intro friendly-text">
        <p>
          ¡Bienvenidos! Esta estación no es solo para ver el clima, es un <strong>laboratorio vivo</strong> diseñado para aprender haciendo.
        </p>
      </div>

      <div className="guide-section">
        <h3>¿Cómo usarla en clase?</h3>
        <p>Haz clic en cada materia para ver ideas de cómo integrar nuestros datos en tus proyectos:</p>
        
        <div className="interactive-subjects">
          {subjects.map((sub, index) => (
            <div 
              key={sub.id} 
              className={`interactive-card ${activeSubject === index ? 'open' : ''}`}
              onClick={() => setActiveSubject(activeSubject === index ? null : index)}
            >
              <div className="card-header">
                <h4>{sub.title}</h4>
                <span className="toggle-icon">{activeSubject === index ? '▼' : '▶'}</span>
              </div>
              {activeSubject === index && (
                <div className="card-body">
                  <p>{sub.desc}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="guide-section instructions friendly-text">
        <h3>Primeros Pasos</h3>
        <ul>
          <li><strong>Panel Principal:</strong> Mira los datos en vivo.</li>
          <li><strong>Control:</strong> Enciende o apaga mecanismos a distancia.</li>
          <li><strong>Historial:</strong> Revisa y exporta (descarga próximamente) todos los registros pasados para trabajar sin internet.</li>
        </ul>
        <p className="highlight-box">
          ¡Anímate a explorar y proponer nuevas ideas usando los datos de nuestra estación!
        </p>
      </div>
    </div>
  );
};

export default GuiaDidactica;
