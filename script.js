// script.js
const jugadoresInput = document.getElementById('jugadores');
const nombresEquiposInput = document.getElementById('nombresEquipos');
const crearEquiposBtn = document.getElementById('crearEquipos');
const equiposDiv = document.getElementById('equipos');
const sortearBtn = document.getElementById('sortear');
const descargarResultadosBtn = document.getElementById('descargarResultados');
const descargarPDFBtn = document.getElementById('descargarPDF');
const iniciarTorneoLink = document.getElementById('iniciarTorneoLink');

let equipos = [];
let jugadoresDisponibles = [];
let equipoActualIndex = 0;
let sorteoEnProgreso = false;
let jugadoresPorEquipoDistribucion = [];

// Número exacto de equipos permitido
const NUMERO_EQUIPOS_REQUERIDO = 10;

// Número exacto de jugadores requerido (4 jugadores por equipo x 10 equipos = 40 jugadores)
const JUGADORES_REQUERIDOS = NUMERO_EQUIPOS_REQUERIDO * 4;

// Obtener jsPDF desde el objeto global (cargado desde el CDN)
const { jsPDF } = window.jspdf;

// Función para calcular la distribución de jugadores por equipo (fija: 4 jugadores por equipo)
function calcularDistribucionJugadores(totalJugadores, numEquipos) {
  console.log(`Calculando distribución: totalJugadores=${totalJugadores}, numEquipos=${numEquipos}`);

  // Validar que el número total de jugadores sea suficiente
  if (totalJugadores < JUGADORES_REQUERIDOS) {
    throw new Error(`No hay suficientes jugadores. Se necesitan exactamente ${JUGADORES_REQUERIDOS} jugadores para ${numEquipos} equipos (4 jugadores por equipo). Actualmente hay ${totalJugadores} jugadores.`);
  }

  // Si hay más de 40 jugadores, seleccionaremos solo 40
  if (totalJugadores > JUGADORES_REQUERIDOS) {
    console.log(`Hay más de ${JUGADORES_REQUERIDOS} jugadores (${totalJugadores}). Seleccionando solo ${JUGADORES_REQUERIDOS} jugadores.`);
    const jugadoresMezclados = [...jugadoresDisponibles].sort(() => Math.random() - 0.5);
    jugadoresDisponibles.length = 0;
    jugadoresDisponibles.push(...jugadoresMezclados.slice(0, JUGADORES_REQUERIDOS));
    totalJugadores = JUGADORES_REQUERIDOS;
    console.log('Jugadores seleccionados:', jugadoresDisponibles);
  }

  // Crear la distribución: 4 jugadores por equipo
  const distribucion = Array(numEquipos).fill(4);

  let totalAsignados = distribucion.reduce((sum, num) => sum + num, 0);
  if (totalAsignados !== totalJugadores) {
    throw new Error(`La distribución no suma el total de jugadores. Total asignados: ${totalAsignados}, Total real: ${totalJugadores}`);
  }

  console.log('Distribución calculada:', distribucion);
  return distribucion;
}

// Función para guardar el estado en localStorage
function guardarEstado() {
  console.log('Guardando estado...');
  const estado = {
    equipos: equipos.map(equipo => ({
      nombre: equipo.nombre,
      jugadores: Array.from(equipo.lista.children).map(li => li.textContent)
    })),
    jugadoresDisponibles: jugadoresDisponibles,
    equipoActualIndex: equipoActualIndex,
    sorteoEnProgreso: sorteoEnProgreso,
    jugadoresPorEquipoDistribucion: jugadoresPorEquipoDistribucion,
    nombresEquiposInput: nombresEquiposInput.value,
    jugadoresInput: jugadoresInput.value
  };
  localStorage.setItem('sorteoEstado', JSON.stringify(estado));
  console.log('Estado guardado:', estado);
}

// Función para restaurar el estado desde localStorage
function restaurarEstado() {
  console.log('Restaurando estado...');
  const estadoGuardado = localStorage.getItem('sorteoEstado');
  if (!estadoGuardado) {
    console.log('No se encontraron datos guardados.');
    return false;
  }

  const estado = JSON.parse(estadoGuardado);
  console.log('Estado restaurado:', estado);

  nombresEquiposInput.value = estado.nombresEquiposInput || '';
  jugadoresInput.value = estado.jugadoresInput || '';

  jugadoresDisponibles = estado.jugadoresDisponibles || [];
  equipoActualIndex = estado.equipoActualIndex || 0;
  sorteoEnProgreso = estado.sorteoEnProgreso || false;
  jugadoresPorEquipoDistribucion = estado.jugadoresPorEquipoDistribucion || [];

  if (estado.equipos && estado.equipos.length > 0) {
    equiposDiv.innerHTML = '';
    equipos = [];
    estado.equipos.forEach((equipoData, index) => {
      const equipoDiv = document.createElement('div');
      equipoDiv.classList.add('equipo');
      const tituloEquipo = document.createElement('h2');
      tituloEquipo.textContent = equipoData.nombre;
      const listaJugadores = document.createElement('ul');
      listaJugadores.id = `equipo${index + 1}`;
      equipoData.jugadores.forEach(jugador => {
        const li = document.createElement('li');
        li.textContent = jugador;
        li.classList.add('mostrar');
        listaJugadores.appendChild(li);
      });
      equipoDiv.appendChild(tituloEquipo);
      equipoDiv.appendChild(listaJugadores);
      equiposDiv.appendChild(equipoDiv);
      equipos.push({
        lista: listaJugadores,
        nombre: equipoData.nombre
      });
    });

    if (equipoActualIndex < equipos.length) {
      sortearBtn.textContent = `Sortear Equipo ${equipoActualIndex + 1}`;
    } else {
      sortearBtn.textContent = 'Sortear';
      descargarResultadosBtn.style.display = 'inline-block';
      descargarPDFBtn.style.display = 'inline-block';
      iniciarTorneoLink.style.display = 'inline-block';
    }

    if (sorteoEnProgreso) {
      sortearBtn.disabled = true;
    }
  }

  return true;
}

// Función para limpiar el estado guardado
function limpiarEstado() {
  console.log('Limpiando estado...');
  localStorage.removeItem('sorteoEstado');
  equiposDiv.innerHTML = '';
  equipos = [];
  jugadoresDisponibles = [];
  equipoActualIndex = 0;
  sorteoEnProgreso = false;
  jugadoresPorEquipoDistribucion = [];
  sortearBtn.textContent = 'Sortear';
  descargarResultadosBtn.style.display = 'none';
  descargarPDFBtn.style.display = 'none';
  iniciarTorneoLink.style.display = 'none';
  nombresEquiposInput.value = '';
  jugadoresInput.value = '';
}

// Al cargar la página, intentar restaurar el estado
document.addEventListener('DOMContentLoaded', () => {
  console.log('Página cargada, intentando restaurar estado...');
  if (restaurarEstado()) {
    if (confirm('Se encontraron datos guardados de un sorteo anterior. ¿Quieres continuar con el sorteo guardado? Si eliges "No", se eliminarán los datos y podrás empezar de nuevo.')) {
      console.log('Usuario eligió continuar con el sorteo guardado.');
    } else {
      console.log('Usuario eligió limpiar los datos.');
      limpiarEstado();
    }
  } else {
    console.log('No se restauró ningún estado, comenzando desde cero.');
  }
});

crearEquiposBtn.addEventListener('click', () => {
  console.log('Creando equipos...');
  const nombresEquipos = nombresEquiposInput.value.split('\n').filter(nombre => nombre.trim() !== '');

  if (nombresEquipos.length === 0) {
    console.log('Error: No se ingresaron nombres de equipos.');
    alert('Por favor, ingresa al menos un nombre de equipo.');
    return;
  }

  if (nombresEquipos.length !== NUMERO_EQUIPOS_REQUERIDO) {
    console.log(`Error: Número de equipos incorrecto. Se esperaban ${NUMERO_EQUIPOS_REQUERIDO}, pero se ingresaron ${nombresEquipos.length}.`);
    alert(`Debes ingresar exactamente ${NUMERO_EQUIPOS_REQUERIDO} equipos.`);
    return;
  }

  equiposDiv.innerHTML = '';
  equipos = [];
  equipoActualIndex = 0;
  sortearBtn.textContent = 'Sortear';
  descargarResultadosBtn.style.display = 'none';
  descargarPDFBtn.style.display = 'none';
  iniciarTorneoLink.style.display = 'none';

  jugadoresDisponibles = jugadoresInput.value.split('\n').filter(jugador => jugador.trim() !== '');
  console.log('Jugadores disponibles:', jugadoresDisponibles);

  if (jugadoresDisponibles.length === 0) {
    console.log('Error: No se ingresaron jugadores.');
    alert('Por favor, ingresa al menos un jugador para sortear.');
    return;
  }

  try {
    jugadoresPorEquipoDistribucion = calcularDistribucionJugadores(jugadoresDisponibles.length, nombresEquipos.length);
    console.log('Distribución de jugadores por equipo:', jugadoresPorEquipoDistribucion);
  } catch (error) {
    console.error('Error al calcular la distribución:', error.message);
    alert(error.message);
    return;
  }

  nombresEquipos.forEach((nombre, index) => {
    const equipoDiv = document.createElement('div');
    equipoDiv.classList.add('equipo');
    const tituloEquipo = document.createElement('h2');
    tituloEquipo.textContent = nombre;
    const listaJugadores = document.createElement('ul');
    listaJugadores.id = `equipo${index + 1}`;
    equipoDiv.appendChild(tituloEquipo);
    equipoDiv.appendChild(listaJugadores);
    equiposDiv.appendChild(equipoDiv);
    equipos.push({ lista: listaJugadores, nombre });
  });

  console.log('Equipos creados:', equipos);
  guardarEstado();
});

sortearBtn.addEventListener('click', () => {
  console.log('Iniciando sorteo...');
  console.log('Equipos:', equipos);
  console.log('Equipo actual index:', equipoActualIndex);

  if (equipos.length === 0) {
    console.log('Error: No hay equipos creados.');
    alert('Por favor, crea al menos un equipo antes de sortear.');
    return;
  }

  if (equipoActualIndex >= equipos.length) {
    console.log('Todos los equipos ya han sido sorteados, preguntando si reiniciar...');
    if (confirm('¿Quieres reiniciar el sorteo? Esto limpiará los equipos y restaurará la lista de jugadores.')) {
      equipoActualIndex = 0;
      equipos.forEach(equipo => {
        equipo.lista.innerHTML = '';
      });
      descargarResultadosBtn.style.display = 'none';
      descargarPDFBtn.style.display = 'none';
      iniciarTorneoLink.style.display = 'none';
      sortearBtn.textContent = 'Sortear Equipo 1';

      jugadoresDisponibles = jugadoresInput.value.split('\n').filter(jugador => jugador.trim() !== '');
      console.log('Jugadores disponibles después de reiniciar:', jugadoresDisponibles);

      if (jugadoresDisponibles.length === 0) {
        console.log('Error: No se ingresaron jugadores después de reiniciar.');
        alert('Por favor, ingresa al menos un jugador para sortear.');
        return;
      }

      try {
        jugadoresPorEquipoDistribucion = calcularDistribucionJugadores(jugadoresDisponibles.length, equipos.length);
        console.log('Distribución de jugadores por equipo (reinicio):', jugadoresPorEquipoDistribucion);
      } catch (error) {
        console.error('Error al calcular la distribución (reinicio):', error.message);
        alert(error.message);
        return;
      }
    } else {
      console.log('Usuario canceló el reinicio del sorteo.');
      return;
    }
  }

  console.log('Jugadores por equipo distribución:', jugadoresPorEquipoDistribucion);
  console.log('Equipo actual index (después de validaciones):', equipoActualIndex);
  const jugadoresPorEquipo = jugadoresPorEquipoDistribucion[equipoActualIndex];
  console.log(`Jugadores por equipo para el equipo ${equipoActualIndex + 1}: ${jugadoresPorEquipo}`);

  if (jugadoresDisponibles.length === 0 || jugadoresPorEquipo === 0) {
    console.log('Error: No hay suficientes jugadores disponibles o jugadoresPorEquipo es 0.');
    console.log('Jugadores disponibles:', jugadoresDisponibles);
    console.log('Jugadores por equipo:', jugadoresPorEquipo);
    alert('No hay suficientes jugadores disponibles para sortear el equipo actual.');
    return;
  }

  if (sorteoEnProgreso) {
    console.log('Sorteo en progreso, ignorando clic.');
    return;
  }

  sortearBtn.disabled = true;
  sorteoEnProgreso = true;
  console.log(`Sorteando equipo ${equipoActualIndex + 1}...`);

  equipos[equipoActualIndex].lista.innerHTML = '';

  let jugadorIndex = 0;
  const duracionPorJugador = 1500;

  function asignarJugadorEquipo() {
    if (jugadorIndex < jugadoresPorEquipo && jugadoresDisponibles.length > 0) {
      const indiceAleatorio = Math.floor(Math.random() * jugadoresDisponibles.length);
      const jugador = jugadoresDisponibles.splice(indiceAleatorio, 1)[0];
      console.log(`Asignando jugador ${jugador} al equipo ${equipoActualIndex + 1}`);

      const nombreAnimado = document.createElement('div');
      nombreAnimado.textContent = jugador;
      nombreAnimado.classList.add('nombre-jugador-animado');
      document.body.appendChild(nombreAnimado);

      setTimeout(() => {
        nombreAnimado.classList.add('visible');
      }, 10);

      setTimeout(() => {
        const li = document.createElement('li');
        li.textContent = jugador;
        equipos[equipoActualIndex].lista.appendChild(li);
        setTimeout(() => li.classList.add('mostrar'), 10);

        nombreAnimado.classList.remove('visible');
        setTimeout(() => {
          document.body.removeChild(nombreAnimado);
        }, 1500 );

        jugadorIndex++;
        asignarJugadorEquipo();
      }, duracionPorJugador);
    } else {
      equipoActualIndex++;
      sorteoEnProgreso = false;
      sortearBtn.disabled = false;
      console.log(`Sorteo del equipo ${equipoActualIndex} completado. Equipo actual index ahora es ${equipoActualIndex}.`);

      if (equipoActualIndex < equipos.length) {
        sortearBtn.textContent = `Sortear Equipo ${equipoActualIndex + 1}`;
      } else {
        sortearBtn.textContent = 'Sortear';
        descargarResultadosBtn.style.display = 'inline-block';
        descargarPDFBtn.style.display = 'inline-block';
        iniciarTorneoLink.style.display = 'inline-block';
      }

      guardarEstado();
    }
  }

  asignarJugadorEquipo();
});

descargarResultadosBtn.addEventListener('click', () => {
  console.log('Descargando CSV...');
  exportarCSV();
});

descargarPDFBtn.addEventListener('click', () => {
  console.log('Descargando PDF...');
  exportarPDF();
});

function exportarCSV() {
  let csvContent = "data:text/csv;charset=utf-8,";
  const nombresEquipos = equipos.map(equipo => equipo.nombre);

  csvContent += nombresEquipos.map(nombre => `"${nombre}"`).join(",") + "\r\n";

  let maxJugadores = 0;
  equipos.forEach(equipo => {
    maxJugadores = Math.max(maxJugadores, equipo.lista.children.length);
  });

  for (let i = 0; i < maxJugadores; i++) {
    let row = "";
    equipos.forEach(equipo => {
      row += equipo.lista.children[i] ? `"${equipo.lista.children[i].textContent}"` + "," : ",";
    });
    csvContent += row + "\r\n";
  }

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "resultados_sorteo.csv");
  document.body.appendChild(link);
  link.click();
}

function exportarPDF() {
  html2canvas(document.getElementById('equipos')).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgProps = doc.getImageProperties(imgData);
    const pdfWidth = doc.internal.pageSize.getWidth() - 20;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    doc.setFontSize(16);
    doc.text('Resultados del Sorteo de Equipos', 10, 10);
    doc.addImage(imgData, 'PNG', 10, 20, pdfWidth, pdfHeight);
    doc.save('resultados_sorteo.pdf');
  });
}