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

function agregarAlCarrito(id, nombre, precio) {
    carrito.push({ id, nombre, precio });
    totalVenta += precio;
    document.getElementById("total-txt").innerText = `$${totalVenta.toFixed(2)}`;
}

function finalizarVenta() {
    if (carrito.length === 0) return;

    const tx = db.transaction(["ventas", "productos"], "readwrite");
    const storeVentas = tx.objectStore("ventas");
    const storeProd = tx.objectStore("productos");

    // Guardar venta
    storeVentas.add({ fecha: new Date().toISOString(), total: totalVenta, items: carrito });

    // Descontar Stock
    carrito.forEach(item => {
        const p = todosProductos.find(prod => prod.id === item.id);
        if(p) {
            p.stock -= 1;
            storeProd.put(p);
        }
    });

    tx.oncomplete = () => {
        alert("Venta guardada y stock descontado ✅");
        location.reload();
    };
}
function calcularCambio() {
    const pagaCon = parseFloat(document.getElementById("paga-con").value) || 0;
    const cambioTxt = document.getElementById("cambio-txt");
    
    // totalVenta es la variable que ya tienes donde sumas los productos
    if (pagaCon > 0 && pagaCon >= totalVenta) {
        const cambio = pagaCon - totalVenta;
        cambioTxt.innerText = cambio.toFixed(2);
    } else {
        cambioTxt.innerText = "0.00";
    }
}