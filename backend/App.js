const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
app.use(express.json());
const PORT = 3000;
app.use(cors()); 

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'emep_tec',
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0
});

let ultimosDatosClima = {
    temperatura: 0,
    humedad: 0,
    indiceDeCalor: 0
};

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

app.get('/api/clima', (req, res) => {
    res.json(ultimosDatosClima);
});

app.post('/api/clima', async (req, res) => {
    const { temperatura, humedad, indiceDeCalor } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const [climaActual] = await connection.query(
            'INSERT INTO clima (temperatura, humedad, sensacion) VALUES (?, ?, ?)',
            [temperatura, humedad, indiceDeCalor]
        );
        
        await connection.commit();

        res.status(201).json({
            mensaje: "Datos guardados correctamente",
            id: climaActual.insertId
        });

    } catch (error) {
        await connection.rollback();
        
        console.error("Error en la transacción de guardado:", error);
        res.status(500).json({ 
            error: "Fallo interno al guardar la información. Se restauró el estado de la BD.", 
            details: error.message 
        });

    } finally {
        connection.release();
    }
});

app.get('/api/clima/historial', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT id, temperatura, humedad, sensacion, fecha 
            FROM clima 
            ORDER BY fecha DESC;
        `);

        const climaEstructurado = rows.map(row => ({
            id: row.id,
            temperatura: row.temperatura,
            humedad: row.humedad,
            indiceDeCalor: row.sensacion,
            fecha: row.fecha
        }));

        res.json(climaEstructurado);
    } catch (err) {
        console.error("Error al consultar el historial de clima:", err);
        res.status(500).json({ error: err.message });
    }
});
app.post('/api/clima/procesar-dia', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [lecturas] = await connection.query(`
            SELECT temperatura, humedad, sensacion 
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

        // 4. Verificar si se completaron 7 días consecutivos sin semana asignada
        // Buscamos los últimos 7 días registrados que no estén ya en 'semana_dias'
        const [diasLibres] = await connection.query(`
            SELECT id, fecha FROM dia 
            WHERE id NOT IN (SELECT dia_id FROM semana_dias)
            ORDER BY fecha ASC 
            LIMIT 7
        `);

        // Si juntamos exactamente 7 días consecutivos pendientes de agrupar...
        if (diasLibres.length === 7) {
            const fechaInicio = diasLibres[0].fecha;
            const fechaFin = diasLibres[6].fecha;

            // Insertamos la nueva semana
            const [resultadoSemana] = await connection.query(`
                INSERT INTO semana (fecha_inicio, fecha_fin) VALUES (?, ?)
            `, [fechaInicio, fechaFin]);

            const nuevaSemanaId = resultadoSemana.insertId;

            // Vinculamos esos 7 días a la nueva semana en la tabla intermedia
            for (const d of diasLibres) {
                await connection.query(`
                    INSERT INTO semana_dias (semana_id, dia_id) VALUES (?, ?)
                `, [nuevaSemanaId, d.id]);
            }
            console.log(`🎉 ¡Semana N° ${nuevaSemanaId} completada y guardada con éxito!`);
        }

        await connection.commit();
        res.status(201).json({ mensaje: "Día procesado y guardado correctamente.", diaId: nuevoDiaId });

    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: "Error al procesar el cierre del día", details: error.message });
    } finally {
        connection.release();
    }
});

// GET: Obtener semanas paginadas con sus respectivos días (De 4 en 4)
app.get('/api/clima/historial-semanas', async (req, res) => {
    // Obtenemos la página desde los parámetros de la URL (por defecto la página 0)
    const page = parseInt(req.query.page) || 0;
    const limit = 4;
    const offset = page * limit;

    try {
        // 1. Buscar las semanas correspondientes al bloque (ordenadas de la más reciente a la más antigua)
        const [semanas] = await pool.query(`
            SELECT id, fecha_inicio, fecha_fin 
            FROM semana 
            ORDER BY fecha_fin DESC 
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        if (semanas.length === 0) {
            return res.json([]);
        }

        // 2. Por cada semana del bloque, traer sus 7 días guardados
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

        port.on('open', () => {
            console.log('🔌 Conexión serial establecida con éxito.');
            iniciarServidorExpress(); 
        });

        parser.on('data', (rawData) => {
            const cleanData = rawData.trim();
            
            try {
                const datos = parsearDatosArduino(cleanData);
                
                ultimosDatosClima = datos;
                
                console.log('--- 🌡️ Nueva lectura recibida ---');
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
        console.log(`📡 Endpoints: GET http://localhost:${PORT}/api/clima | POST http://localhost:${PORT}/api/clima`);
    });
}

start();