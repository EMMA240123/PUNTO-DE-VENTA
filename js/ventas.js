// 1. IMPORTAR CONEXIÓN A LA NUBE
import { db_nube, collection, addDoc } from './firebase-config.js';

let todosProductos = [];
let carrito = [];
let totalVenta = 0;

// Cargar productos al iniciar
setTimeout(() => { cargarProductosVenta(); }, 500);

function cargarProductosVenta() {
    const tx = db.transaction("productos", "readonly");
    tx.objectStore("productos").getAll().onsuccess = (e) => {
        todosProductos = e.target.result;
        renderizarProductos(todosProductos);
    };
}

// BUSCADOR
function filtrarProductos() {
    const busqueda = document.getElementById("input-buscador").value.toLowerCase();
    const filtrados = todosProductos.filter(p => p.nombre.toLowerCase().includes(busqueda));
    renderizarProductos(filtrados);
}

// --- RENDERIZAR CON ALERTAS DE STOCK BAJO ---
function renderizarProductos(lista) {
    const contenedor = document.getElementById("lista-productos");
    contenedor.innerHTML = lista.map(p => {
        // Lógica de alerta para la tarjeta
        const esBajoStock = p.stock < 3;
        const agotado = p.stock <= 0;
        
        // Estilos dinámicos
        const estiloCard = esBajoStock ? 'border: 2px solid #ff4757; background: #fff5f5;' : '';
        const badgeAlerta = esBajoStock ? `<br><b style="color: #ff4757; font-size: 0.7rem;">${agotado ? 'AGOTADO ❌' : '¡POCO STOCK! ⚠️'}</b>` : '';

        return `
            <div class="card-producto" style="${estiloCard}">
                <h4>${p.nombre}</h4>
                <div class="precio">
                    $${p.precio.toFixed(2)} 
                    <br><small>Stock: ${p.stock}${badgeAlerta}</small>
                </div>
                <button class="btn-add" 
                    ${agotado ? 'disabled style="background:#ccc; cursor:not-allowed;"' : ''} 
                    data-id="${p.id}" 
                    data-nombre="${p.nombre}" 
                    data-precio="${p.precio}">
                    ${agotado ? 'SIN STOCK' : 'AGREGAR'}
                </button>
            </div>
        `;
    }).join('');

    // Agregar eventos a los nuevos botones
    document.querySelectorAll('.btn-add').forEach(btn => {
        btn.onclick = () => {
            if (btn.disabled) return;
            agregarAlCarrito(
                parseInt(btn.dataset.id), 
                btn.dataset.nombre, 
                parseFloat(btn.dataset.precio)
            );
        };
    });
}

// --- LÓGICA DEL CARRITO ---

function agregarAlCarrito(id, nombre, precio) {
    const item = { id, nombre, precio, unico: Date.now() };
    carrito.push(item);
    actualizarInterfazCarrito();
}

window.quitarDelCarrito = function(unicoId) {
    carrito = carrito.filter(item => item.unico !== unicoId);
    actualizarInterfazCarrito();
};

function actualizarInterfazCarrito() {
    const contenedor = document.getElementById("detalle-carrito");
    const totalTxt = document.getElementById("total-txt");
    
    if (carrito.length === 0) {
        contenedor.innerHTML = `<p style="margin: 0; font-size: 0.8rem; color: #999; text-align: center;">Carrito vacío 🛒</p>`;
        totalVenta = 0;
    } else {
        totalVenta = carrito.reduce((sum, item) => sum + item.precio, 0);
        
        contenedor.innerHTML = carrito.map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; background: white; padding: 8px; border-radius: 6px; border: 1px solid #eee; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="display: flex; flex-direction: column; flex: 1;">
                    <span style="font-size: 0.9rem; font-weight: bold; color: #2c3e50;">${item.nombre}</span>
                    <span style="font-size: 0.8rem; color: #27ae60; font-weight: 600;">$${item.precio.toFixed(2)}</span>
                </div>
                <button onclick="quitarDelCarrito(${item.unico})" 
                        style="background: #ff4757; color: white; border: none; border-radius: 6px; width: 30px; height: 30px; cursor: pointer;">
                    ✕
                </button>
            </div>
        `).join('');
    }
    
    totalTxt.innerText = `$${totalVenta.toFixed(2)}`;
    
    const metodo = document.getElementById('metodo-pago').value;
    if (metodo !== 'Efectivo') {
        const inputPaga = document.getElementById('paga-con');
        if(inputPaga) inputPaga.value = totalVenta.toFixed(2);
    }
    
    calcularCambio();
}

// --- FINALIZAR Y COBRAR (OPTIMIZADO PARA VELOCIDAD Y NUBE) ---

function finalizarVenta() {
    if (carrito.length === 0) {
        alert("⚠️ El carrito está vacío");
        return;
    }

    const metodoPago = document.getElementById("metodo-pago").value;
    const itemsParaGuardar = carrito.map(({id, nombre, precio}) => ({id, nombre, precio}));
    
    const ventaData = { 
        fecha: new Date().toISOString(), 
        total: totalVenta, 
        items: itemsParaGuardar,
        metodo: metodoPago 
    };

    // 1. GUARDAR EN LOCAL (IndexedDB)
    const tx = db.transaction(["ventas", "productos"], "readwrite");
    tx.objectStore("ventas").add(ventaData);

    // Descontar stock localmente
    carrito.forEach(item => {
        const p = todosProductos.find(prod => prod.id === item.id);
        if(p) {
            p.stock -= 1;
            tx.objectStore("productos").put(p);
        }
    });

    // 2. RESPALDO EN FIREBASE (Se lanza en segundo plano)
    addDoc(collection(db_nube, "ventas"), ventaData)
        .then(() => console.log("Respaldo en la nube exitoso ☁️"))
        .catch((e) => console.error("Error al subir a la nube: ", e));

    // 3. FINALIZAR AL COMPLETAR LOCAL
    tx.oncomplete = () => {
        alert(`¡Venta realizada con ${metodoPago}! ✅`);
        location.reload(); 
    };
}

// --- FUNCIONES DE APOYO ---

function calcularCambio() {
    const pagaConInput = document.getElementById("paga-con");
    const cambioTxt = document.getElementById("cambio-txt");
    if(!pagaConInput || !cambioTxt) return;

    const pagaCon = parseFloat(pagaConInput.value) || 0;
    
    if (pagaCon > 0 && pagaCon >= totalVenta) {
        const cambio = pagaCon - totalVenta;
        cambioTxt.innerText = cambio.toFixed(2);
    } else {
        cambioTxt.innerText = "0.00";
    }
}

// --- ESCUCHADORES DE EVENTOS ---

window.addEventListener('filtrar', () => filtrarProductos());
window.addEventListener('cambio', () => calcularCambio());

const btnFinalizar = document.getElementById('btn-finalizar-venta');
if(btnFinalizar) {
    btnFinalizar.addEventListener('click', () => finalizarVenta());
}