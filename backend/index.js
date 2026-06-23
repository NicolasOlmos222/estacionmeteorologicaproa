const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

function parsearDatosArduino(dataString) {
    const regex = /H([\d.]+)-T([\d.]+)-I([\d.]+)/;
    const coincidencia = dataString.match(regex);

    if (coincidencia) {
        return {
            humedad: parseFloat(coincidencia[1]),
            temperatura: parseFloat(coincidencia[2]),
            indiceDeCalor: parseFloat(coincidencia[3])
            //devolver como un solo endpoint
        };
    } else {
        throw new Error(`Formato no válido: "${dataString}"`);
    }
}
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
async function start() {
    console.log('Buscando puerto Arduino...');
    const portPath = await findArduinoPort();
    
    if (!portPath) {
        console.error('No se encontró un puerto Arduino autónomamente.');
        return;
    }
    
    console.log('Puerto Arduino encontrado:', portPath);
    
    try {
        const port = new SerialPort({ path: portPath, baudRate: 9600 });
        const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

        port.on('open', () => {
            console.log('Conexión serial establecida con éxito.');
        });

        parser.on('data', (rawData) => {
            const cleanData = rawData.trim();
            console.log('--- Nueva lectura recibida ---');
            console.log('Raw:', cleanData);

            try {
                // Pasamos los datos que acaban de llegar a tu función de parseo
                const datos = parsearDatosArduino(cleanData);
                
                // Ya puedes usar las variables libremente aquí adentro
                console.log(`Humedad: ${datos.humedad}%`);
                console.log(`Temperatura: ${datos.temperatura}°C`);
                console.log(`Sensación térmica: ${datos.indiceDeCalor}°C`);
                
            } catch (error) {
                console.error('Error al procesar esta lectura:', error.message);
            }
        });

        port.on('error', (err) => {
            console.error('Error en el puerto serial:', err.message);
        });
        
    } catch (err) {
        console.error('No se pudo abrir el puerto:', err.message);
    }
}

start();