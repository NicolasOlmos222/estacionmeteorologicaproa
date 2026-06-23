function parsearDatosArduino(dataString) {
    // Expresión regular para capturar los valores numéricos de H, T e I
    const regex = /H([\d.]+)-T([\d.]+)-I([\d.]+)/;
    const coincidencia = dataString.match(regex);

    if (coincidencia) {
        // coincidencia[0] es todo el string original
        // coincidencia[1], [2], [3] corresponden a los grupos entre paréntesis ()
        const humedad = parseFloat(coincidencia[1]);
        const temperatura = parseFloat(coincidencia[2]);
        const indiceDeCalor = parseFloat(coincidencia[3]);

        return {
            humedad,
            temperatura,
            indiceDeCalor
        };
    } else {
        throw new Error("El formato del string recibido no es válido.");
    }
}

try {
    const datos = parsearDatosArduino(data);
    console.log(datos);
    console.log(`La humedad actual es del ${datos.humedad}%`);
    console.log(`La temperatura actual es del ${datos.temperatura}%`);
    console.log(`La sensación térmica actual es del ${datos.indiceDeCalor}%`);
} catch (error) {
    console.error(error.message);
}