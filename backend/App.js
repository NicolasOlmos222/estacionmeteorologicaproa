const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
app.use(express.json());
const PORT = 3000;
app.use(cors()); 

// Instancia global para el puerto serial
let arduinoPortInstance = null;

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'emep_tec',
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0
});

// Estructura corregida según lo que realmente envía el Arduino
let ultimosDatosClima = {
    temperatura: 0,
    humedad: 0,
    indiceDeCalor: 0,
    lluviaBool: 0,
    nivelAgua: 0,
    direccionViento: 0,
    velocidadViento: 0
};

// Expresión regular corregida para capturar el formato exacto del Arduino (Incluido -V)
function parsearDatosArduino(dataString) {
    // Ejemplo esperado: H45.0-T24.0-I25.2-L0-A150-D180.0-V12.5
    const regex = /H([\d.]+)-T([\d.]+)-I([\d.]+)-L([01])-A([\d.]+)-D([\d.]+)-V([\d.]+)/;
    const coincidencia = dataString.match(regex);

    if (coincidencia) {
        return {
            humedad: parseFloat(coincidencia[1]),
            temperatura: parseFloat(coincidencia[2]),
            indiceDeCalor: parseFloat(coincidencia[3]),
            lluviaBool: parseInt(coincidencia[4]),     // 0 o 1
            nivelAgua: parseFloat(coincidencia[5]),     // Valor analógico del agua
            direccionViento: parseFloat(coincidencia[6]), // Grados MPU6050
            velocidadViento: parseFloat(coincidencia[7]) // Velocidad del anemómetro
        };
    } else {
        throw new Error(`Formato no válido o incompleto: "${dataString}"`);
    }
}

// ==========================================
//   ENDPOINTS PARA EL FRONTEND (API GET)
// ==========================================

// 1. Obtener la última lectura en tiempo real
app.get('/api/clima', (req, res) => {
    res.json(ultimosDatosClima);
});

// 2. Obtener el historial completo
app.get('/api/clima/historial', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT id, temperatura, humedad, sensacion, lluvia, lluvia_mm AS nivel_agua, viento AS direccion_viento, velocidad_viento, fecha 
            FROM clima 
            ORDER BY fecha DESC;
        `);

        const climaEstructurado = rows.map(row => ({
            id: row.id,
            temperatura: row.temperatura,
            humedad: row.humedad,
            indiceDeCalor: row.sensacion,
            lluviaBool: row.lluvia,
            nivelAgua: row.nivel_agua, 
            direccionViento: row.direccion_viento,
            velocidadViento: row.velocidad_viento || 0,
            fecha: row.fecha
        }));

        res.json(climaEstructurado);
    } catch (err) {
        console.error("Error al consultar el historial de clima:", err);
        res.status(500).json({ error: err.message });
    }
});

// 3. CONTROLAR EL ARDUINO DESDE EL FRONTEND
// Envía comandos como {"comando": "R1"}, {"comando": "TEST1"}, etc.
app.post('/api/clima/control', (req, res) => {
    const { comando } = req.body;
    const comandosValidos = ["R1", "R0", "TEST1", "TEST0"];

    if (!comandosValidos.includes(comando)) {
        return res.status(400).json({ error: "Comando no válido. Use R1, R0, TEST1 o TEST0" });
    }

    if (!arduinoPortInstance || !arduinoPortInstance.isOpen) {
        return res.status(503).json({ error: "El puerto serial con Arduino no está disponible en este momento." });
    }

    arduinoPortInstance.write(`${comando}\n`, (err) => {
        if (err) {
            console.error("Error escribiendo en el puerto serial:", err.message);
            return res.status(500).json({ error: "No se pudo enviar el comando al Arduino" });
        }
        res.json({ mensaje: `Comando [${comando}] enviado con éxito al Arduino` });
    });
});

// 4. Procesar el cierre del día (Cron o trigger del frontend)
app.post('/api/clima/procesar-dia', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [lecturas] = await connection.query(`
            SELECT temperatura, humedad, sensacion, lluvia, lluvia_mm, viento 
            FROM clima 
            WHERE fecha >= NOW() - INTERVAL 1 DAY
        `);

        if (lecturas.length === 0) {
            connection.release();
            return res.status(400).json({ error: "No hay lecturas suficientes en las últimas 24 horas para procesar." });
        }

        const temperaturas = lecturas.map(l => l.temperatura);
        const humedades = lecturas.map(l => l.humedad);
        const sensaciones = lecturas.map(l => l.sensacion);

        const tempMax = Math.max(...temperaturas);
        const tempMin = Math.min(...temperaturas);
        const sensMax = Math.max(...sensaciones);
        const sensMin = Math.min(...sensaciones);
        const humProm = humedades.reduce((acc, h) => acc + h, 0) / humedades.length;

        const [resultadoDia] = await connection.query(`
            INSERT INTO dia (temperatura_max, temperatura_min, sensacion_max, sensacion_min, humedad_prom, fecha)
            VALUES (?, ?, ?, ?, ?, CURDATE())
        `, [tempMax, tempMin, sensMax, sensMin, humProm]);

        const nuevoDiaId = resultadoDia.insertId;

        // Verificar bloque de 7 días para agrupar semanas
        const [diasLibres] = await connection.query(`
            SELECT id, fecha FROM dia 
            WHERE id NOT IN (SELECT dia_id FROM semana_dias)
            ORDER BY fecha ASC 
            LIMIT 7
        `);

        if (diasLibres.length === 7) {
            const fechaInicio = diasLibres[0].fecha;
            const fechaFin = diasLibres[6].fecha;

            const [resultadoSemana] = await connection.query(`
                INSERT INTO semana (fecha_inicio, fecha_fin) VALUES (?, ?)
            `, [fechaInicio, fechaFin]);

            const nuevaSemanaId = resultadoSemana.insertId;

            for (const d of diasLibres) {
                await connection.query(`
                    INSERT INTO semana_dias (semana_id, dia_id) VALUES (?, ?)
                `, [nuevaSemanaId, d.id]);
            }
            console.log(`🎉 ¡Semana N° ${nuevaSemanaId} completada!`);
        }

        await connection.commit();
        res.status(201).json({ mensaje: "Día procesado correctamente.", diaId: nuevoDiaId });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: "Error al procesar el cierre del día", details: error.message });
    } finally {
        connection.release();
    }
});

// 5. Historial de semanas paginado
app.get('/api/clima/historial-semanas', async (req, res) => {
    const page = parseInt(req.query.page) || 0;
    const limit = 4;
    const offset = page * limit;

    try {
        const [semanas] = await pool.query(`
            SELECT id, fecha_inicio, fecha_fin 
            FROM semana 
            ORDER BY fecha_fin DESC 
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        if (semanas.length === 0) {
            return res.json([]);
        }

        const historialCompleto = await Promise.all(semanas.map(async (semana) => {
            const [dias] = await pool.query(`
                SELECT d.* FROM dia d
                JOIN semana_dias sd ON d.id = sd.dia_id
                WHERE sd.semana_id = ?
                ORDER BY d.fecha ASC
            `, [semana.id]);

            return {
                id: semana.id,
                fecha_inicio: semana.fecha_inicio,
                fecha_fin: semana.fecha_fin,
                dias: dias
            };
        }));

        res.json(historialCompleto);
    } catch (err) {
        console.error("Error al obtener el historial por semanas:", err);
        res.status(500).json({ error: err.message });
    }
});

// Guardado automático en Base de Datos al recibir lectura serial válida
async function guardarLecturaEnBD(datos) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        // NOTA: Asegúrate de que tu tabla 'clima' posea la columna 'velocidad_viento' o remuévela del query.
        await connection.query(
            'INSERT INTO clima (temperatura, humedad, sensacion, lluvia, lluvia_mm, viento) VALUES (?, ?, ?, ?, ?, ?)',
            [datos.temperatura, datos.humedad, datos.indiceDeCalor, datos.lluviaBool, datos.nivelAgua, datos.direccionViento]
        );
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error("⚠️ No se pudo auto-guardar la lectura serial en la BD:", error.message);
    } finally {
        connection.release();
    }
}

// ==========================================
//        CONEXIÓN SERIAL CON ARDUINO
// ==========================================
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
        console.error('❌ No se encontró un puerto Arduino. Revisa la conexión USB.');
        iniciarServidorExpress();
        return;
    }
    
    console.log('✅ Puerto Arduino encontrado:', portPath);
    
    try {
        const port = new SerialPort({ path: portPath, baudRate: 9600 });
        const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
        arduinoPortInstance = port; // Guardamos la referencia para usar write()

        port.on('open', () => {
            console.log('🔌 Conexión serial establecida con éxito.');
            iniciarServidorExpress(); 
        });

        parser.on('data', async (rawData) => {
            const cleanData = rawData.trim();
            
            // Omitir logs informativos del Arduino para que no rompan el parser
            if (cleanData.startsWith(">>>") || cleanData.length === 0 || cleanData === "1" || cleanData === "0") {
                console.log(`[Arduino Log]: ${cleanData}`);
                return;
            }

            try {
                const datos = parsearDatosArduino(cleanData);
                ultimosDatosClima = datos; // Actualizamos la variable en tiempo real para el Front
                
                console.log('--- 🌡️ Nueva lectura procesada ---');
                console.log(`Temp: ${datos.temperatura}°C | Hum: ${datos.humedad}% | Viento: ${datos.velocidadViento} u.`);
                
                // Guardar automáticamente en la Base de Datos
                await guardarLecturaEnBD(datos);
                
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
    });
}

start();