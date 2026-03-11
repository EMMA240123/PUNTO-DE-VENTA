setTimeout(() => { listarProductos(); }, 500);

function guardarProducto() {
    const id = document.getElementById("edit-id").value;
    const nombre = document.getElementById("nombreP").value;
    const precio = parseFloat(document.getElementById("precioP").value);
    const stock = parseInt(document.getElementById("stockP").value);

    // Validación: si falta algo, no guarda
    if (!nombre || isNaN(precio) || isNaN(stock)) {
        alert("Por favor llena Nombre, Precio y Stock");
        return;
    }

    const tx = db.transaction("productos", "readwrite");
    const store = tx.objectStore("productos");
    const producto = { nombre, precio, stock };
    if (id) producto.id = parseInt(id);

    store.put(producto);
    tx.oncomplete = () => {
        alert("¡Producto Guardado!");
        location.reload(); 
    };
}

function listarProductos() {
    const tx = db.transaction("productos", "readonly");
    const store = tx.objectStore("productos");
    store.getAll().onsuccess = (e) => {
        const productos = e.target.result;
        const tabla = document.getElementById("lista-tabla");
        tabla.innerHTML = productos.map(p => `
            <tr>
                <td>${p.nombre}</td>
                <td>$${p.precio.toFixed(2)}</td>
                <td>${p.stock}</td>
                <td>
                    <button onclick='prepararEdicion(${JSON.stringify(p)})'>📝</button>
                    <button onclick='eliminarProducto(${p.id})'>🗑️</button>
                </td>
            </tr>
        `).join('');
    };
}

function prepararEdicion(p) {
    document.getElementById("edit-id").value = p.id;
    document.getElementById("nombreP").value = p.nombre;
    document.getElementById("precioP").value = p.precio;
    document.getElementById("stockP").value = p.stock;
    document.getElementById("btn-guardar").innerText = "ACTUALIZAR";
}

function eliminarProducto(id) {
    if(confirm("¿Eliminar producto?")) {
        const tx = db.transaction("productos", "readwrite");
        tx.objectStore("productos").delete(id);
        tx.oncomplete = () => listarProductos();
    }
}