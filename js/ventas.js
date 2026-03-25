let todosProductos = [];
let carrito = [];
let totalVenta = 0;

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

function renderizarProductos(lista) {
    const contenedor = document.getElementById("lista-productos");
    contenedor.innerHTML = lista.map(p => `
        <div class="card-producto">
            <h4>${p.nombre}</h4>
            <div class="precio">$${p.precio} <br><small>Stock: ${p.stock}</small></div>
            <button class="btn-add" onclick="agregarAlCarrito(${p.id}, '${p.nombre}', ${p.precio})">AGREGAR</button>
        </div>
    `).join('');
}

// --- LÓGICA DEL CARRITO (ACTUALIZADA) ---

function agregarAlCarrito(id, nombre, precio) {
    // Usamos Date.now() como ID único para cada entrada en el carrito
    const item = { id, nombre, precio, unico: Date.now() };
    carrito.push(item);
    actualizarInterfazCarrito();
}

function quitarDelCarrito(unicoId) {
    // Filtramos el carrito para quitar solo el elemento con ese ID único
    carrito = carrito.filter(item => item.unico !== unicoId);
    actualizarInterfazCarrito();
}

function actualizarInterfazCarrito() {
    const contenedor = document.getElementById("detalle-carrito");
    const totalTxt = document.getElementById("total-txt");
    
    if (carrito.length === 0) {
        contenedor.innerHTML = `<p style="margin: 0; font-size: 0.8rem; color: #999; text-align: center;">Carrito vacío 🛒</p>`;
        totalVenta = 0;
    } else {
        totalVenta = carrito.reduce((sum, item) => sum + item.precio, 0);
        
        // Aquí generamos la lista con Nombre y Precio bien alineados
        contenedor.innerHTML = carrito.map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; background: white; padding: 8px; border-radius: 6px; border: 1px solid #eee; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="display: flex; flex-direction: column; flex: 1;">
                    <span style="font-size: 0.9rem; font-weight: bold; color: var(--oscuro);">${item.nombre}</span>
                    <span style="font-size: 0.8rem; color: var(--primario); font-weight: 600;">$${item.precio.toFixed(2)}</span>
                </div>
                <button onclick="quitarDelCarrito(${item.unico})" 
                        style="background: #ff4757; color: white; border: none; border-radius: 6px; width: 30px; height: 30px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                    ✕
                </button>
            </div>
        `).join('');
    }
    
    totalTxt.innerText = `$${totalVenta.toFixed(2)}`;
    
    // Actualizar input de pago si no es efectivo
    const metodo = document.getElementById('metodo-pago').value;
    if (metodo !== 'Efectivo') {
        document.getElementById('paga-con').value = totalVenta.toFixed(2);
    }
    
    calcularCambio();
}

// --- FINALIZAR Y COBRAR ---

function finalizarVenta() {
    if (carrito.length === 0) {
        alert("⚠️ El carrito está vacío");
        return;
    }

    const metodoPago = document.getElementById("metodo-pago").value;
    const tx = db.transaction(["ventas", "productos"], "readwrite");
    const storeVentas = tx.objectStore("ventas");
    const storeProd = tx.objectStore("productos");

    // Guardamos la venta (limpiamos el ID único antes de guardar para no ensuciar la DB)
    const itemsParaGuardar = carrito.map(({id, nombre, precio}) => ({id, nombre, precio}));
    
    const ventaData = { 
        fecha: new Date().toISOString(), 
        total: totalVenta, 
        items: itemsParaGuardar,
        metodo: metodoPago 
    };

    storeVentas.add(ventaData);

    // Descontar Stock
    carrito.forEach(item => {
        const p = todosProductos.find(prod => prod.id === item.id);
        if(p) {
            p.stock -= 1;
            storeProd.put(p);
        }
    });

    tx.oncomplete = () => {
        alert(`¡Venta realizada con ${metodoPago}! ✅`);
        location.reload();
    };
}

function calcularCambio() {
    const pagaCon = parseFloat(document.getElementById("paga-con").value) || 0;
    const cambioTxt = document.getElementById("cambio-txt");
    
    if (pagaCon > 0 && pagaCon >= totalVenta) {
        const cambio = pagaCon - totalVenta;
        cambioTxt.innerText = cambio.toFixed(2);
    } else {
        cambioTxt.innerText = "0.00";
    }
}

function ajustarInterfazPago() {
    const metodo = document.getElementById('metodo-pago').value;
    const seccionCambio = document.getElementById('seccion-cambio');
    const inputPagaCon = document.getElementById('paga-con');
    
    if (metodo !== 'Efectivo') {
        seccionCambio.style.opacity = "0.5";
        inputPagaCon.disabled = true;
        inputPagaCon.value = totalVenta.toFixed(2);
        document.getElementById('cambio-txt').innerText = "0.00";
    } else {
        seccionCambio.style.opacity = "1";
        inputPagaCon.disabled = false;
        inputPagaCon.value = "";
        document.getElementById('cambio-txt').innerText = "0.00";
    }
}