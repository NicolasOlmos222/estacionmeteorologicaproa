import React, { useState } from 'react';
import './Tabs.css';

const Presentacion = () => {
  const [activePillar, setActivePillar] = useState(null);

  const togglePillar = (index) => {
    setActivePillar(activePillar === index ? null : index);
  };

  const pilares = [
    { title: "Hardware y Sensores", desc: "Placas Arduino y ESP32 que leen datos del ambiente y controlan los mecanismos de la estación." },
    { title: "Backend", desc: "Recibe, procesa y guarda toda la información de los sensores de forma segura y estructurada." },
    { title: "Interfaz de Usuario (Frontend)", desc: "Esta página web donde puedes ver el clima en vivo, controlar mecanismos y descargar el historial (próximamente)." },
    { title: "Energía Solar", desc: "Funciona de forma aislada e independiente gracias a su panel solar y baterías de respaldo." }
  ];

  return (
    <div className="tab-content presentation-container">
      <h2>Estación Meteorológica Escolar ProA Técnica</h2>
      
      <div className="credits-card">
        <p><strong>Equipo:</strong> Ana Paula Duarte, Joaquín Leiva, Lucía Luque, Agostina Moyano y Pamela Peralta</p>
        <p><strong>Curso:</strong> 7° “B/F” | <strong>Materia:</strong> Laboratorio de Informática | <strong>Prof:</strong> Nicolás Olmos</p>
      </div>

      <div className="friendly-text">
        <h3>¿Por qué hicimos esto?</h3>
        <p>
        Los ciudadanos de la ciudad de San Francisco, Córdoba atraviesan problemáticas recurrentes referidas con las variaciones climáticas y las precipitaciones meteorológicas, como consecuencia los habitantes se ven afectados por el barro, las demoras en obras públicas, las calles anegadas y los desbordes de agua o cloacas. Uno de los principales problemas empieza a partir de la falta de información meteorológica local, la cual limita la capacidad de prevención de la comunidad frente a estas situaciones.
        </p>
        <p>
          Así nació este proyecto: la primera estación meteorológica de la escuela, creada por estudiantes para brindar información del clima <strong>gratis y en tiempo real</strong> a todos los vecinos.
        </p>

        <h3>Nuestro Objetivo</h3>
        <p>
          Queremos medir el clima usando un equipo 100% automático y potenciado con energía solar. Además de informar a la comunidad, la estación es un laboratorio vivo para que los alumnos aprendan ciencias y tecnología.
        </p>
      </div>

      <h3>¿Cómo funciona?</h3>
      <p>Toca cada pilar para conocer más sobre nuestro sistema:</p>
      
      <div className="accordion-container">
        {pilares.map((pilar, index) => (
          <div 
            key={index} 
            className={`accordion-item ${activePillar === index ? 'active' : ''}`}
            onClick={() => togglePillar(index)}
          >
            <div className="accordion-header">
              <h4>{pilar.title}</h4>
              <span className="accordion-icon">{activePillar === index ? '−' : '+'}</span>
            </div>
            {activePillar === index && (
              <div className="accordion-body">
                <p>{pilar.desc}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Presentacion;
