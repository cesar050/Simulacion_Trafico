// Configuración del Canvas
const canvas = document.getElementById('miRedondel');
const ctx = canvas.getContext('2d');

// Configuración del Redondel y el Carro
const centroX = canvas.width / 2;
const centroY = canvas.height / 2;
const radioRedondel = 280;
const anchoCarretera = 80;

// Estado de los carros
let numCarros = 10;
const METROS_POR_PIXEL = 0.03;

// Utilidades de conversión
function pixelesAMetros(px) { return px * METROS_POR_PIXEL; }
function metrosAPixeles(m) { return m / METROS_POR_PIXEL; }
function metrosAAngulo(m) { return metrosAPixeles(m) / radioRedondel; } // theta = s_px / r_px

// Reglas de seguridad y espaciado inicial
const distanciaMinimaMetros = 3;
const distanciaInicialMetros = 5;
const distanciaSeguridad = metrosAAngulo(distanciaMinimaMetros); // en radianes
let angulos = [];
let velocidades = [];

// Variables de configuración
let duracionParadaSegundos = 3;
let duracionParada = duracionParadaSegundos * 60;

// Registro de paradas
let registroParadas = {};

const velocidadNormal = 0.01; 
let animacionId; 
let ejecutando = false; 
let carroDetenido = -1; 
let tiempoParada = 0; 
let tiempoInicioParada = 0; 

// Colores para los carros
const coloresCarros = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A"];

// Inicializar los ángulos equidistantes y velocidades
function inicializarCarros() {
    angulos = [];
    velocidades = [];
    registroParadas = {}; // Resetear registro al cambiar número de carros
    // Espaciado inicial basado en metros, no en división uniforme del círculo
    const anguloInicial = metrosAAngulo(distanciaInicialMetros);
    for (let i = 0; i < numCarros; i++) {
        angulos.push(i * anguloInicial);
        velocidades.push(velocidadNormal);
        // Inicializar registro
        registroParadas[i] = {veces: 0, tiempoTotal: 0};
    }
}

// Función para dibujar el escenario (Fondo y Redondel)
function dibujarEscenario() {
    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Dibujar el asfalto (Círculo grande)
    ctx.beginPath();
    ctx.arc(centroX, centroY, radioRedondel + anchoCarretera/2, 0, Math.PI * 2);
    ctx.fillStyle = "#555"; // Gris oscuro
    ctx.fill();
    ctx.closePath();

    // 2. Dibujar la isla central (Círculo pequeño hueco)
    ctx.beginPath();
    ctx.arc(centroX, centroY, radioRedondel - anchoCarretera/2, 0, Math.PI * 2);
    ctx.fillStyle = "#8BC34A"; // Verde (césped)
    ctx.fill();
    ctx.strokeStyle = "#FFF";
    ctx.stroke();
    ctx.closePath();
    
    // 3. Dibujar línea divisoria (opcional, para estética)
    ctx.beginPath();
    ctx.arc(centroX, centroY, radioRedondel, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.setLineDash([5, 15]); // Línea punteada
    ctx.stroke();
    ctx.setLineDash([]); // Resetear línea punteada
    ctx.closePath();
}

// Función para dibujar los carros (los puntos)
function dibujarCarros() {
    for (let i = 0; i < numCarros; i++) {
        // Calcular posición X e Y basándonos en el ángulo actual de cada carro
        // Fórmula: x = centro + cos(angulo) * radio
        const x = centroX + Math.cos(angulos[i]) * radioRedondel;
        const y = centroY + Math.sin(angulos[i]) * radioRedondel;

        // Dibujar el punto
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2); // Radio del punto: 12px (más grande)
        ctx.fillStyle = coloresCarros[i % coloresCarros.length];
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
        
        // Si es el carro detenido, dibujar indicador
        if (i === carroDetenido) {
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, Math.PI * 2);
            ctx.strokeStyle = "red";
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.closePath();
            
            // Dibujar texto "STOP"
            ctx.fillStyle = "red";
            ctx.font = "bold 14px Arial";
            ctx.fillText("STOP", x - 20, y - 25);
        }
        
        // Calcular y mostrar distancia al siguiente carro
        const siguienteIndex = (i + 1) % numCarros;
        const distancia = distanciaAngular(angulos[i], angulos[siguienteIndex]);
        // Longitud de arco en píxeles y conversión a metros
        const arcoPx = distancia * radioRedondel;
        const distanciaMetros = pixelesAMetros(arcoPx).toFixed(1);
        
        // Calcular punto medio entre los dos carros para mostrar la distancia
        const anguloMedio = angulos[i] + distancia / 2;
        const xMedio = centroX + Math.cos(anguloMedio) * (radioRedondel - 35);
        const yMedio = centroY + Math.sin(anguloMedio) * (radioRedondel - 35);
        
        // Dibujar la distancia
        ctx.fillStyle = "white";
        ctx.font = "bold 11px Arial";
        ctx.strokeStyle = "black";
        ctx.lineWidth = 3;
        ctx.strokeText(distanciaMetros + "m", xMedio - 15, yMedio);
        ctx.fillText(distanciaMetros + "m", xMedio - 15, yMedio);
    }
}

// Función para calcular la distancia angular entre dos carros
function distanciaAngular(angulo1, angulo2) {
    let diff = (angulo2 - angulo1) % (Math.PI * 2);
    if (diff < 0) diff += Math.PI * 2;
    return diff;
}

// Bucle de animación principal
function bucle() {
    if (!ejecutando) return;

    dibujarEscenario();
    dibujarCarros();

    // Manejar tiempo de parada
    if (carroDetenido !== -1) {
        tiempoParada++;
        if (tiempoParada >= duracionParada) {
            // Registrar la parada
            const tiempoParadaReal = duracionParadaSegundos;
            registroParadas[carroDetenido].veces++;
            registroParadas[carroDetenido].tiempoTotal += tiempoParadaReal;
            actualizarTablaRegistro();
            
            // Terminar la parada
            carroDetenido = -1;
            tiempoParada = 0;
            document.getElementById('infoParada').textContent = '';
            // Reactivar todos los carros
            for (let i = 0; i < numCarros; i++) {
                velocidades[i] = velocidadNormal;
            }
        }
    }

    // Actualizar velocidad de cada carro según detección de colisión
    for (let i = 0; i < numCarros; i++) {
        // Si este carro es el detenido, velocidad = 0
        if (i === carroDetenido) {
            velocidades[i] = 0;
            continue;
        }
        
        // Verificar si hay un carro delante muy cerca
        let debeDetenerse = false;
        
        for (let j = 0; j < numCarros; j++) {
            if (i === j) continue;
            
            // Calcular distancia al carro j (que está delante)
            let distancia = distanciaAngular(angulos[i], angulos[j]);
            
            // Si está muy cerca y delante
            if (distancia > 0 && distancia < distanciaSeguridad) {
                // Verificar si el carro de adelante está detenido o más lento
                if (velocidades[j] < velocidadNormal) {
                    debeDetenerse = true;
                    break;
                }
            }
        }
        
        // Ajustar velocidad
        if (debeDetenerse) {
            velocidades[i] = 0;
        } else if (carroDetenido === -1) {
            // Solo reactivar si no hay parada activa
            velocidades[i] = velocidadNormal;
        }
    }

    // Incrementar el ángulo de cada carro según su velocidad
    for (let i = 0; i < numCarros; i++) {
        angulos[i] += velocidades[i];
    }

    // Solicitar el siguiente frame
    animacionId = requestAnimationFrame(bucle);
}

// Función para parar un carro aleatorio
function pararCarroAleatorio() {
    if (!ejecutando) {
        alert('Primero debes iniciar la simulación');
        return;
    }
    
    if (carroDetenido !== -1) {
        alert('Ya hay un carro detenido. Espera a que continúe.');
        return;
    }
    
    // Seleccionar carro aleatorio
    carroDetenido = Math.floor(Math.random() * numCarros);
    tiempoParada = 0;
    tiempoInicioParada = Date.now();
    velocidades[carroDetenido] = 0;
    
    // Mostrar información
    const colorCarro = coloresCarros[carroDetenido % coloresCarros.length];
    document.getElementById('infoParada').innerHTML = 
        `🚨 Parada de emergencia: Carro <span style="color: ${colorCarro};">●</span> ${carroDetenido + 1} (${duracionParadaSegundos}s)`;
}

// Función para actualizar la tabla de registro
function actualizarTablaRegistro() {
    const tbody = document.getElementById('tablaRegistro');
    tbody.innerHTML = '';
    
    // Convertir objeto a array y ordenar por número de veces
    const registrosArray = Object.keys(registroParadas).map(carroId => ({
        id: parseInt(carroId),
        ...registroParadas[carroId]
    })).filter(r => r.veces > 0).sort((a, b) => b.veces - a.veces);
    
    if (registrosArray.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #999;">Sin registros aún</td></tr>';
        return;
    }
    
    registrosArray.forEach(registro => {
        const row = document.createElement('tr');
        const colorCarro = coloresCarros[registro.id % coloresCarros.length];
        row.innerHTML = `
            <td><span style="color: ${colorCarro}; font-size: 18px;">●</span> Carro ${registro.id + 1}</td>
            <td>${registro.tiempoTotal.toFixed(2)}s</td>
            <td>${registro.veces}</td>
        `;
        tbody.appendChild(row);
    });
}

// Función para aplicar configuración
function aplicarConfiguracion() {
    if (ejecutando) {
        alert('Detén la simulación antes de cambiar la configuración');
        return;
    }
    
    // Obtener valores del formulario
    const nuevoTiempo = parseFloat(document.getElementById('tiempoParada').value);
    const nuevoNumCarros = parseInt(document.getElementById('numCarros').value);
    
    // Validar valores
    if (isNaN(nuevoTiempo) || nuevoTiempo < 0.1 || nuevoTiempo > 20) {
        alert('El tiempo de parada debe estar entre 0.1 y 20 segundos');
        return;
    }
    
    if (isNaN(nuevoNumCarros) || nuevoNumCarros < 1 || nuevoNumCarros > 20) {
        alert('El número de carros debe estar entre 1 y 20');
        return;
    }
    
    // Aplicar configuración
    duracionParadaSegundos = nuevoTiempo;
    duracionParada = Math.round(duracionParadaSegundos * 60); // Convertir a frames y redondear
    numCarros = nuevoNumCarros;
    
    // Reinicializar carros
    inicializarCarros();
    
    // Actualizar tabla de registro
    actualizarTablaRegistro();
    
    // Redibujar escenario
    dibujarEscenario();
    dibujarCarros();
    
    console.log(`Configuración aplicada: ${numCarros} carros, ${duracionParadaSegundos}s de parada (${duracionParada} frames)`);
    alert(`Configuración aplicada: ${numCarros} carros, ${duracionParadaSegundos}s de parada`);
}

// Control del botón
function alternarSimulacion() {
    const btn = document.getElementById('btnIniciar');
    
    if (!ejecutando) {
        // Iniciar
        ejecutando = true;
        btn.textContent = "Detener Simulación";
        btn.classList.add("active");
        bucle();
    } else {
        // Detener
        ejecutando = false;
        btn.textContent = "Iniciar Simulación";
        btn.classList.remove("active");
        cancelAnimationFrame(animacionId);
    }
}

// Inicialización al cargar la página
function init() {
    inicializarCarros();
    dibujarEscenario();
    dibujarCarros();
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
