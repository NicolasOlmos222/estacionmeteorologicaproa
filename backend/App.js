const express = require('express');
const cors = require('cors');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); 

// Variable global donde guardaremos la última lectura en tiempo real
let ultimosDatosClima = {
    temperatura: 0,
    humedad: 0,
    indiceDeCalor: 0
};

// --- FUNCIÓN DE PARSEO ---
function parsearDatosArduino(dataString) {
    const regex = /H([\d.]+)-T([\d.]+)-I([\d.]+)/;
    const coincidencia = dataString.match(regex);

    if (coincidencia) {
        return {
            humedad: parseFloat(coincidencia[1]),
            temperatura: parseFloat(coincidencia[2]),
            indiceDeCalor: parseFloat(coincidencia[3])
        };
    } else {
        throw new Error(`Formato no válido: "${dataString}"`);
    }
}

// --- ENDPOINT PARA EL FRONTEND ---
app.get('/api/clima', (req, res) => {
    // Cuando el frontend pida datos, le respondemos con el estado actual de la variable
    res.json(ultimosDatosClima);
});

// --- LÓGICA DE DETECCIÓN DE ARDUINO ---
async function findArduinoPort() {
    try {
        const ports = await SerialPort.list();
        const arduinoPort = ports.find(port => {
            const manufacturer = port.manufacturer?.toLowerCase() || '';
            const pnpId = port.pnpId?.toLowerCase() || '';
            return manufacturer.includes('arduino') || pnpId.includes('vid_2341');
        });
        return arduinoPort ? arduinoPort.path : null;
    } catch (error) {
        console.error('Error al listar los puertos:', error);
        return null;
    }
}

// --- INICIO DEL PUERTO SERIAL Y EL SERVIDOR ---
async function start() {
    console.log('Buscando puerto Arduino...');
    const portPath = await findArduinoPort();
    
    if (!portPath) {
        console.error('❌ No se encontró un puerto Arduino. Revisa la conexión USB.');
        // Iniciamos el servidor Express de todas formas para que no se caiga el backend
        iniciarServidorExpress();
        return;
    }
    
    console.log('✅ Puerto Arduino encontrado:', portPath);
    
    try {
        const port = new SerialPort({ path: portPath, baudRate: 9600 });
        const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

        port.on('open', () => {
            console.log('🔌 Conexión serial establecida con éxito.');
            iniciarServidorExpress(); // Iniciamos Express una vez que el puerto esté listo
        });

        parser.on('data', (rawData) => {
            const cleanData = rawData.trim();
            
            try {
                // Parseamos los datos entrantes del Arduino
                const datos = parsearDatosArduino(cleanData);
                
                // ACTUALIZAMOS LA VARIABLE GLOBAL
                ultimosDatosClima = datos;
                
                console.log('--- 🌡️ Nueva lectura guardada ---');
                console.log(`Humedad: ${datos.humedad}% | Temp: ${datos.temperatura}°C | Ín. Calor: ${datos.indiceDeCalor}°C`);
                
            } catch (error) {
                console.error('⚠️ Error al procesar esta lectura serial:', error.message);
            }
        });

        port.on('error', (err) => {
            console.error('❌ Error en el puerto serial:', err.message);
        });
        
    } catch (err) {
        console.error('❌ No se pudo abrir el puerto:', err.message);
        iniciarServidorExpress();
    }
}

function iniciarServidorExpress() {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor API corriendo en http://localhost:${PORT}`);
        console.log(`📡 Endpoint disponible en http://localhost:${PORT}/api/clima`);
    });
}

// Arrancar toda la aplicación
start();