/* ═══════════════════════════════════════════════════════════════
   NOTASAPP · Lógica principal
   Desarrollado por Rmatix (Rayhan Matteo Rojas Garcia) · 902
   ═══════════════════════════════════════════════════════════════ */

const MATERIAS_POR_CURSO = {
    '901': ['MATEMATICAS','ESPAÑOL','BIOLOGIA','SOCIALES','INGLES','ED. FISICA','TECNOLOGIA','MUSICA','CATEDRA'],
    '902': ['MATEMATICAS','ESPAÑOL','BIOLOGIA','SOCIALES','INGLES','ED. FISICA','TECNOLOGIA','MUSICA','CATEDRA'],
    'decimo': ['MATEMATICAS','ESPAÑOL','BIOLOGIA','FISICA','QUIMICA','SOCIALES','INGLES','ED. FISICA','TECNOLOGIA','FILOSOFIA','MUSICA','CATEDRA','C. ECONOMICA','C. POLITICA','TRIGONOMETRIA','CALCULO','ESTADISTICA'],
    'once': ['MATEMATICAS','ESPAÑOL','BIOLOGIA','FISICA','QUIMICA','SOCIALES','INGLES','ED. FISICA','TECNOLOGIA','FILOSOFIA','MUSICA','CATEDRA','C. ECONOMICA','C. POLITICA','CALCULO','ESTADISTICA','PRE-ICFES']
};

let currentUser = null;
let periodoActual = 2;
let datosApp = {};
let currentView = 'materias';

const authScreen = document.getElementById('authScreen');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const cardsGrid = document.getElementById('cardsGrid');
const emptyMaterias = document.getElementById('emptyMaterias');
const emptyResumen = document.getElementById('emptyResumen');
const resumenGrid = document.getElementById('resumenGrid');
const modalMateria = document.getElementById('modalMateria');
const modalInput = document.getElementById('modalInput');
const toast = document.getElementById('toast');
const sidebar = document.getElementById('sidebar');

function init() {
    cargarDatosGlobales();
    setupAuthTabs();
    setupEventListeners();
    const savedSession = localStorage.getItem('notasapp_session');
    if (savedSession) {
        currentUser = JSON.parse(savedSession);
        mostrarDashboard();
    }
}

function cargarDatosGlobales() {
    const saved = localStorage.getItem('notasapp_data');
    if (saved) {
        datosApp = JSON.parse(saved);
        Object.keys(datosApp).forEach(key => {
            ['2','3'].forEach(periodo => {
                if (datosApp[key] && datosApp[key][periodo] && Array.isArray(datosApp[key][periodo].materias)) {
                    datosApp[key][periodo].materias.forEach(m => {
                        if (!Array.isArray(m.puntosNegativos)) m.puntosNegativos = [];
                    });
                }
            });
        });
    } else {
        datosApp = {};
        guardarDatosGlobales();
    }
}

function guardarDatosGlobales() {
    localStorage.setItem('notasapp_data', JSON.stringify(datosApp));
}

function getEstudianteKey() {
    if (!currentUser) return null;
    return `${currentUser.nombre.trim().toUpperCase()}::${currentUser.curso}::${currentUser.fila}`;
}

function getMaterias() {
    const key = getEstudianteKey();
    if (!key) return [];
    if (!datosApp[key]) {
        datosApp[key] = { '2': { materias: [] }, '3': { materias: [] } };
        const cursoMaterias = MATERIAS_POR_CURSO[currentUser.curso] || MATERIAS_POR_CURSO['902'];
        cursoMaterias.forEach(nombre => {
            datosApp[key]['2'].materias.push(crearMateria(nombre));
            datosApp[key]['3'].materias.push(crearMateria(nombre));
        });
        guardarDatosGlobales();
    }
    return datosApp[key][String(periodoActual)].materias;
}

function crearMateria(nombre) {
    return {
        id: Date.now() + Math.random(),
        nombre: nombre.toUpperCase(),
        actividades: [],
        puntosExtra: [],
        puntosNegativos: [],
        autoevaluacion: null,
        trimestral: null,
        lectura: null,
        promedioFinal: null,
        notaFinal: null,
        calificacion: null
    };
}

function setupAuthTabs() {
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.dataset.tab;
            document.getElementById('loginForm').classList.toggle('active', target === 'login');
            document.getElementById('registerForm').classList.toggle('active', target === 'register');
        });
    });
}

function setupEventListeners() {
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('menuBtn').addEventListener('click', toggleSidebar);
    document.getElementById('sidebarToggle').addEventListener('click', toggleSidebarCollapse);
    document.getElementById('addMateriaBtn').addEventListener('click', abrirModalMateria);
    document.getElementById('modalCancel').addEventListener('click', cerrarModalMateria);
    document.getElementById('modalConfirm').addEventListener('click', agregarMateriaDesdeModal);
    modalInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') agregarMateriaDesdeModal();
        if (e.key === 'Escape') cerrarModalMateria();
    });
    modalMateria.addEventListener('click', e => {
        if (e.target === modalMateria) cerrarModalMateria();
    });
    document.querySelectorAll('.periodo-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            periodoActual = parseInt(btn.dataset.periodo);
            document.querySelectorAll('.periodo-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            render();
        });
    });
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            cambiarVista(item.dataset.view);
        });
    });
}

function handleLogin(e) {
    e.preventDefault();
    const nombre = document.getElementById('loginNombre').value.trim();
    const curso = document.getElementById('loginCurso').value;
    const fila = parseInt(document.getElementById('loginFila').value);
    if (!nombre) { showToast('⚠ Ingresa tu nombre'); return; }
    if (!curso) { showToast('⚠ Selecciona tu curso'); return; }
    if (!fila || fila < 1 || fila > 50) { showToast('⚠ Número de fila entre 1 y 50'); return; }
    currentUser = { nombre, curso, fila };
    localStorage.setItem('notasapp_session', JSON.stringify(currentUser));
    mostrarDashboard();
}

function handleRegister(e) {
    e.preventDefault();
    const nombre = document.getElementById('regNombre').value.trim();
    const curso = document.getElementById('regCurso').value;
    const fila = parseInt(document.getElementById('regFila').value);
    if (!nombre) { showToast('⚠ Ingresa tu nombre completo'); return; }
    if (!curso) { showToast('⚠ Selecciona tu curso'); return; }
    if (!fila || fila < 1 || fila > 50) { showToast('⚠ Número de fila entre 1 y 50'); return; }
    currentUser = { nombre, curso, fila };
    const key = getEstudianteKey();
    if (datosApp[key]) { showToast('⚠ Ya existe una cuenta con esos datos. Inicia sesión.'); return; }
    localStorage.setItem('notasapp_session', JSON.stringify(currentUser));
    mostrarDashboard();
    showToast('✅ Cuenta creada exitosamente');
}

function handleLogout() {
    if (confirm('¿Cerrar sesión? Tus datos se conservarán.')) {
        currentUser = null;
        localStorage.removeItem('notasapp_session');
        ocultarDashboard();
        document.getElementById('loginNombre').value = '';
        document.getElementById('loginCurso').value = '';
        document.getElementById('loginFila').value = '';
        document.getElementById('regNombre').value = '';
        document.getElementById('regCurso').value = '';
        document.getElementById('regFila').value = '';
    }
}

function mostrarDashboard() {
    authScreen.classList.add('hidden');
    dashboard.classList.add('active');
    document.getElementById('sidebarUserName').textContent = currentUser.nombre.split(' ')[0];
    document.getElementById('sidebarUserCurso').textContent = currentUser.curso.toUpperCase();
    document.getElementById('userAvatar').textContent = currentUser.nombre.charAt(0).toUpperCase();
    cambiarVista('materias');
    render();
}

function ocultarDashboard() {
    authScreen.classList.remove('hidden');
    dashboard.classList.remove('active');
    cardsGrid.innerHTML = '';
    resumenGrid.innerHTML = '';
}

function toggleSidebar() { sidebar.classList.toggle('open'); }
function toggleSidebarCollapse() { sidebar.classList.toggle('collapsed'); }

function cambiarVista(view) {
    currentView = view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const viewMap = {
        'materias': 'viewMaterias',
        'resumen': 'viewResumen',
        'guia': 'viewGuia',
        'creditos': 'viewCreditos',
        'soporte': 'viewSoporte'
    };
    const targetView = document.getElementById(viewMap[view]);
    if (targetView) targetView.classList.add('active');
    const navItem = document.querySelector(`.nav-item[data-view="${view}"]`);
    if (navItem) navItem.classList.add('active');
    document.getElementById('topbarTitle').textContent =
        view === 'materias' ? 'Mis Materias' : 
        view === 'resumen' ? 'Resumen del Período' : 
        view === 'guia' ? 'Guía de Uso' : 
        view === 'creditos' ? 'Créditos' : 
        view === 'soporte' ? 'Reportar Bug' : '';
    if (view === 'resumen') renderResumen();
    if (window.innerWidth <= 768) sidebar.classList.remove('open');
}

function render() {
    if (!currentUser) return;
    const materias = getMaterias();
    if (!materias.length) {
        cardsGrid.innerHTML = '';
        emptyMaterias.classList.remove('hidden');
    } else {
        emptyMaterias.classList.add('hidden');
        cardsGrid.innerHTML = materias.map((m, idx) => renderCard(m, idx)).join('');
    }
    if (currentView === 'resumen') renderResumen();
}

function renderCard(m, idx) {
    const calif = getCalif(m.notaFinal);
    const colorFinal = getColorNota(m.notaFinal);
    const filas = m.actividades.map((a, ai) => {
        const c = getColorNota(a.nota);
        return `<tr><td class="act-nombre" title="${esc(a.nombre)}">${esc(a.nombre)}</td><td class="act-fecha">${a.fecha || '—'}</td><td class="act-nota" style="color:${c}">${a.nota.toFixed(1)}</td><td class="act-del" onclick="eliminarActividad(${idx},${ai})">✕</td></tr>`;
    }).join('');
    const promBase = m.actividades.length ? m.actividades.reduce((s, a) => s + a.nota, 0) / m.actividades.length : null;
    const totalExtra = m.puntosExtra.reduce((s, e) => s + e.puntos, 0);
    const totalNegativos = m.puntosNegativos.reduce((s, n) => s + n.puntos, 0);
    let promAjustado = promBase;
    if (promBase !== null) {
        promAjustado = Math.max(0, promBase - totalNegativos) + totalExtra;
        promAjustado = Math.min(5, promAjustado);
    }
    const extrasHtml = m.puntosExtra.map((e, ei) => `
        <div class="extra-item"><span class="extra-nombre" title="${esc(e.nombre)}">${esc(e.nombre)}</span><span class="extra-pts">+${e.puntos % 1 === 0 ? e.puntos : e.puntos.toFixed(2)}</span><span class="extra-del" onclick="eliminarExtra(${idx},${ei})">✕</span></div>`).join('');
    const negativosHtml = m.puntosNegativos.map((n, ni) => `
        <div class="negativo-item"><span class="negativo-nombre" title="${esc(n.nombre)}">${esc(n.nombre)}</span><span class="negativo-pts">−${n.puntos % 1 === 0 ? n.puntos : n.puntos.toFixed(2)}</span><span class="negativo-del" onclick="eliminarNegativo(${idx},${ni})">✕</span></div>`).join('');

    return `
    <div class="materia-card">
        <div class="card-header"><div class="materia-nombre">${m.nombre}</div><div class="btn-icon" onclick="eliminarMateria(${idx})" title="Eliminar materia">✕</div></div>
        <div class="card-body">
            <div class="nota-section">
                <div class="nota-label">ACTIVIDADES / PROMEDIO <span class="pct-badge">60%</span></div>
                ${m.actividades.length ? `<table class="actividades-table"><thead><tr><th>ACTIVIDAD</th><th>FECHA</th><th>NOTA</th><th></th></tr></thead><tbody>${filas}</tbody></table>` : `<div class="empty-acts">Sin actividades aún</div>`}
                <div class="add-act-form">
                    <input class="act-input" type="text" id="act-nom-${idx}" placeholder="Nombre actividad" maxlength="40"/>
                    <input class="nota-input-sm" type="number" id="act-nota-${idx}" min="0" max="5" step="0.1" placeholder="0–5" onkeydown="if(event.key==='Enter')agregarActividad(${idx})"/>
                    <input class="date-input" type="date" id="act-fecha-${idx}"/>
                    <button class="btn-add-nota" onclick="agregarActividad(${idx})">+ AGREGAR</button>
                </div>
                ${promBase !== null ? `<div class="prom-display"><span>Promedio base: <span class="prom-val">${promBase.toFixed(2)}</span></span>${(totalExtra > 0 || totalNegativos > 0) ? `<span>Ajustes: ${totalExtra > 0 ? `+${totalExtra.toFixed(2)} extras` : ''}${totalNegativos > 0 ? ` −${totalNegativos.toFixed(2)} negativos` : ''} = <span class="prom-val">${promAjustado.toFixed(2)}</span></span>` : ''}${m.promedioFinal !== null ? `<span class="prom-aporte">▸ Aporte 60%: <b>${m.promedioFinal.toFixed(2)}</b></span>` : ''}</div>` : ''}
            </div>
            <hr class="divider">
            <div class="nota-section">
                <div class="nota-label" style="color:var(--extra)">PUNTOS EXTRA <span class="pct-badge" style="color:var(--extra)">SE SUMAN AL PROMEDIO</span></div>
                ${m.puntosExtra.length ? `<div class="extras-list">${extrasHtml}</div>` : ''}
                <div class="add-extra-form">
                    <input class="act-input" type="text" id="ext-nom-${idx}" placeholder="Descripción del extra" maxlength="40" onkeydown="if(event.key==='Enter')agregarExtra(${idx})"/>
                    <input class="nota-input-sm" type="number" id="ext-pts-${idx}" min="0" max="5" step="0.01" placeholder="pts" onkeydown="if(event.key==='Enter')agregarExtra(${idx})"/>
                    <button class="btn-add-nota" style="background:var(--extra)" onclick="agregarExtra(${idx})">+ EXTRA</button>
                </div>
                ${totalExtra > 0 ? `<div class="extra-total">Total extras acumulados: <span>+${totalExtra.toFixed(2)}</span></div>` : ''}
            </div>
            <hr class="divider">
            <div class="nota-section">
                <div class="nota-label" style="color:var(--red)">PUNTOS NEGATIVOS <span class="pct-badge" style="color:var(--red)">RESTAN DEL PROMEDIO</span></div>
                ${m.puntosNegativos.length ? `<div class="negativos-list">${negativosHtml}</div>` : ''}
                <div class="add-negativo-form">
                    <input class="act-input" type="text" id="neg-nom-${idx}" placeholder="Motivo del negativo" maxlength="40" onkeydown="if(event.key==='Enter')agregarNegativo(${idx})"/>
                    <input class="nota-input-sm" type="number" id="neg-pts-${idx}" min="0" max="5" step="0.01" placeholder="pts" onkeydown="if(event.key==='Enter')agregarNegativo(${idx})"/>
                    <button class="btn-add-negativo" onclick="agregarNegativo(${idx})">− NEGATIVO</button>
                </div>
                ${totalNegativos > 0 ? `<div class="negativo-total">Total negativos acumulados: <span>−${totalNegativos.toFixed(2)}</span></div>` : ''}
            </div>
            <hr class="divider">
            <div class="nota-section"><div class="nota-label">AUTOEVALUACIÓN <span class="pct-badge">10%</span></div><div class="single-nota-row"><input class="nota-input-sm" type="number" id="auto-${idx}" min="0" max="5" step="0.1" placeholder="0–5" value="${m.autoevaluacion !== null ? m.autoevaluacion : ''}" onchange="setSingle(${idx},'autoevaluacion',this.value)"/>${m.autoevaluacion !== null ? `<span class="single-nota-display">→ ${(m.autoevaluacion*0.1).toFixed(2)}</span>` : ''}</div></div>
            <hr class="divider">
            <div class="nota-section"><div class="nota-label">TRIMESTRAL <span class="pct-badge">20%</span></div><div class="single-nota-row"><input class="nota-input-sm" type="number" id="trim-${idx}" min="0" max="5" step="0.1" placeholder="0–5" value="${m.trimestral !== null ? m.trimestral : ''}" onchange="setSingle(${idx},'trimestral',this.value)"/>${m.trimestral !== null ? `<span class="single-nota-display">→ ${(m.trimestral*0.2).toFixed(2)}</span>` : ''}</div></div>
            <hr class="divider">
            <div class="nota-section"><div class="nota-label">LECTURA CRÍTICA <span class="pct-badge">10%</span></div><div class="single-nota-row"><input class="nota-input-sm" type="number" id="lect-${idx}" min="0" max="5" step="0.1" placeholder="0–5" value="${m.lectura !== null ? m.lectura : ''}" onchange="setSingle(${idx},'lectura',this.value)"/>${m.lectura !== null ? `<span class="single-nota-display">→ ${(m.lectura*0.1).toFixed(2)}</span>` : ''}</div></div>
            ${m.notaFinal !== null ? `
            <hr class="divider">
            <div>
                <div class="resultado-row"><span class="resultado-label">PROMEDIO MATERIA × 0.6</span><span class="resultado-val">${m.promedioFinal !== null ? m.promedioFinal.toFixed(2) : '—'}</span></div>
                <div class="resultado-row"><span class="resultado-label">AUTOEVALUACIÓN × 0.1</span><span class="resultado-val">${m.autoevaluacion !== null ? (m.autoevaluacion*0.1).toFixed(2) : '—'}</span></div>
                <div class="resultado-row"><span class="resultado-label">TRIMESTRAL × 0.2</span><span class="resultado-val">${m.trimestral !== null ? (m.trimestral*0.2).toFixed(2) : '—'}</span></div>
                <div class="resultado-row"><span class="resultado-label">LECTURA × 0.1</span><span class="resultado-val">${m.lectura !== null ? (m.lectura*0.1).toFixed(2) : '—'}</span></div>
            </div>
            <div class="nota-final-grande"><span class="nota-final-label">NOTA DEL TRIMESTRE</span><div style="display:flex;align-items:center;gap:10px">${calif.cls ? `<span class="calif-badge ${calif.cls}">${calif.label}</span>` : ''}<span class="nota-final-num" style="color:${colorFinal}">${m.notaFinal.toFixed(2)}</span></div></div>` : ''}
        </div>
        <div class="card-footer">
            <button class="btn-finalizar btn-calc-promedio" onclick="finalizarPromedio(${idx})">✓ FINALIZAR NOTA MATERIA</button>
            <button class="btn-finalizar btn-calc-final" onclick="calcularFinal(${idx})">▶ NOTA DEL TRIMESTRE</button>
        </div>
    </div>`;
}

function getCalif(nota) {
    if (nota === null || nota === undefined) return { label: '—', cls: '' };
    if (nota <= 1) return { label: 'DEFICIENTE', cls: 'calif-deficiente' };
    if (nota <= 2.9) return { label: 'MALO', cls: 'calif-malo' };
    if (nota <= 3.9) return { label: 'ACEPTABLE', cls: 'calif-aceptable' };
    return { label: 'SOBRESALIENTE', cls: 'calif-sobresaliente' };
}

function getColorNota(nota) {
    if (nota === null) return 'var(--muted)';
    if (nota <= 1) return 'var(--deficiente)';
    if (nota <= 2.9) return 'var(--malo)';
    if (nota <= 3.9) return 'var(--aceptable)';
    return 'var(--sobresaliente)';
}

function agregarActividad(idx) {
    const nomEl = document.getElementById(`act-nom-${idx}`);
    const notaEl = document.getElementById(`act-nota-${idx}`);
    const fechaEl = document.getElementById(`act-fecha-${idx}`);
    const nombre = nomEl.value.trim();
    const nota = parseFloat(notaEl.value);
    const fecha = fechaEl.value ? formatFecha(fechaEl.value) : '';
    if (!nombre) { showToast('⚠ Escribe el nombre de la actividad'); return; }
    if (isNaN(nota) || nota < 0 || nota > 5) { showToast('⚠ Nota entre 0 y 5'); return; }
    getMaterias()[idx].actividades.push({ nombre, fecha, nota: Math.round(nota * 100) / 100 });
    getMaterias()[idx].promedioFinal = null;
    nomEl.value = ''; notaEl.value = ''; fechaEl.value = '';
    guardarDatosGlobales(); render();
    showToast(`"${nombre}" agregada → ${nota.toFixed(1)}`);
}

function eliminarActividad(idx, ai) {
    getMaterias()[idx].actividades.splice(ai, 1);
    getMaterias()[idx].promedioFinal = null;
    guardarDatosGlobales(); render();
}

function agregarExtra(idx) {
    const nomEl = document.getElementById(`ext-nom-${idx}`);
    const ptsEl = document.getElementById(`ext-pts-${idx}`);
    const nombre = nomEl.value.trim();
    const puntos = parseFloat(ptsEl.value);
    if (!nombre) { showToast('⚠ Escribe la descripción del extra'); return; }
    if (isNaN(puntos) || puntos <= 0) { showToast('⚠ Puntos deben ser mayor a 0'); return; }
    getMaterias()[idx].puntosExtra.push({ nombre, puntos: Math.round(puntos * 1000) / 1000 });
    getMaterias()[idx].promedioFinal = null;
    nomEl.value = ''; ptsEl.value = '';
    guardarDatosGlobales(); render();
    showToast(`Extra "+${puntos}" agregado`);
}

function eliminarExtra(idx, ei) {
    getMaterias()[idx].puntosExtra.splice(ei, 1);
    getMaterias()[idx].promedioFinal = null;
    guardarDatosGlobales(); render();
}

function agregarNegativo(idx) {
    const nomEl = document.getElementById(`neg-nom-${idx}`);
    const ptsEl = document.getElementById(`neg-pts-${idx}`);
    const nombre = nomEl.value.trim();
    const puntos = parseFloat(ptsEl.value);
    if (!nombre) { showToast('⚠ Escribe el motivo del negativo'); return; }
    if (isNaN(puntos) || puntos <= 0) { showToast('⚠ Puntos deben ser mayor a 0'); return; }
    getMaterias()[idx].puntosNegativos.push({ nombre, puntos: Math.round(puntos * 1000) / 1000 });
    getMaterias()[idx].promedioFinal = null;
    nomEl.value = ''; ptsEl.value = '';
    guardarDatosGlobales(); render();
    showToast(`Negativo "−${puntos}" agregado`);
}

function eliminarNegativo(idx, ni) {
    getMaterias()[idx].puntosNegativos.splice(ni, 1);
    getMaterias()[idx].promedioFinal = null;
    guardarDatosGlobales(); render();
}

function setSingle(idx, campo, val) {
    const v = parseFloat(val);
    getMaterias()[idx][campo] = (isNaN(v) || v < 0 || v > 5) ? null : Math.round(v * 100) / 100;
    getMaterias()[idx].notaFinal = null;
    guardarDatosGlobales(); render();
}

function finalizarPromedio(idx) {
    const m = getMaterias()[idx];
    if (!m.actividades.length) { showToast('⚠ Agrega al menos una actividad'); return; }
    const base = m.actividades.reduce((s, a) => s + a.nota, 0) / m.actividades.length;
    const extra = m.puntosExtra.reduce((s, e) => s + e.puntos, 0);
    const negativos = m.puntosNegativos.reduce((s, n) => s + n.puntos, 0);
    const conAjuste = Math.max(0, base - negativos) + extra;
    const conExtra = Math.min(5, conAjuste);
    m.promedioFinal = Math.round(conExtra * 0.6 * 10000) / 10000;
    guardarDatosGlobales(); render();
    showToast(`Base ${base.toFixed(2)} − ${negativos.toFixed(2)} negativos + ${extra.toFixed(2)} extras = ${conExtra.toFixed(2)} → Aporte 60%: ${m.promedioFinal.toFixed(2)}`);
}

function calcularFinal(idx) {
    const m = getMaterias()[idx];
    if (m.promedioFinal === null) { showToast('⚠ Primero presiona "FINALIZAR NOTA MATERIA"'); return; }
    if (m.autoevaluacion === null) { showToast('⚠ Falta Autoevaluación'); return; }
    if (m.trimestral === null) { showToast('⚠ Falta Trimestral'); return; }
    if (m.lectura === null) { showToast('⚠ Falta Lectura Crítica'); return; }
    const total = m.promedioFinal + (m.autoevaluacion * 0.1) + (m.trimestral * 0.2) + (m.lectura * 0.1);
    m.notaFinal = Math.round(total * 100) / 100;
    const c = getCalif(m.notaFinal);
    m.calificacion = c.label;
    guardarDatosGlobales(); render();
    showToast(`${m.nombre}: ${m.notaFinal.toFixed(2)} — ${c.label}`);
}

function eliminarMateria(idx) {
    if (!confirm('¿Eliminar esta materia y todas sus notas?')) return;
    getMaterias().splice(idx, 1);
    guardarDatosGlobales(); render();
}

function renderResumen() {
    const materias = getMaterias();
    const conNota = materias.filter(m => m.notaFinal !== null);
    if (!conNota.length) {
        resumenGrid.innerHTML = '';
        emptyResumen.classList.remove('hidden');
    } else {
        emptyResumen.classList.add('hidden');
        resumenGrid.innerHTML = conNota.map(m => {
            const color = getColorNota(m.notaFinal);
            return `<div class="resumen-item"><span class="resumen-materia">${m.nombre}</span><span class="resumen-nota" style="color:${color}">${m.notaFinal.toFixed(2)}</span></div>`;
        }).join('');
    }
}

function abrirModalMateria() { modalMateria.classList.add('open'); modalInput.value = ''; setTimeout(() => modalInput.focus(), 100); }
function cerrarModalMateria() { modalMateria.classList.remove('open'); }
function agregarMateriaDesdeModal() {
    const nombre = modalInput.value.trim().toUpperCase();
    if (!nombre) { showToast('⚠ Escribe el nombre'); return; }
    const materias = getMaterias();
    if (materias.find(m => m.nombre === nombre)) { showToast('Esa materia ya existe'); return; }
    materias.push(crearMateria(nombre));
    guardarDatosGlobales(); cerrarModalMateria(); render();
    showToast(`${nombre} agregada`);
}

function formatFecha(iso) { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y.slice(2)}`; }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

let toastTimer;
function showToast(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 3000); }

document.addEventListener('DOMContentLoaded', init);
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && e.target !== document.getElementById('menuBtn')) sidebar.classList.remove('open');
    }
});