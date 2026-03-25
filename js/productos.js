// 1. IMPORTAR CONEXIÓN A LA NUBE
import { db_nube, collection, addDoc } from './firebase-config.js';

// Cargar productos al iniciar
setTimeout(() => { listarProductos(); }, 500);

// Función para guardar (con respaldo en la nube)
async function guardarProducto() {
    const id = document.getElementById("edit-id").value;
    const nombre = document.getElementById("nombreP").value;
    const precio = parseFloat(document.getElementById("precioP").value);
    const stock = parseInt(document.getElementById("stockP").value);

    // Validación
    if (!nombre || isNaN(precio) || isNaN(stock)) {
        alert("Por favor llena Nombre, Precio y Stock");
        return;
    }

    const producto = { nombre, precio, stock };
    if (id) producto.id = parseInt(id);

    // --- GUARDAR EN LOCAL (IndexedDB) ---
    const tx = db.transaction("productos", "readwrite");
    const store = tx.objectStore("productos");
    store.put(producto);

    // --- RESPALDO EN FIREBASE (Nube) ---
    try {
        // Guardamos una copia en la colección "productos_catalogo"
        await addDoc(collection(db_nube, "productos_catalogo"), producto);
        console.log("Producto respaldado en la nube ☁️");
    } catch (e) {
        console.error("Error al respaldar producto: ", e);
    }

    tx.oncomplete = () => {
        alert("¡Producto Guardado en Local y Nube! ✅");
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
                    <button class="btn-edit" data-p='${JSON.stringify(p)}'>📝</button>
                    <button class="btn-delete" data-id="${p.id}">🗑️</button>
                </td>
            </tr>
        `).join('');

        // Eventos para botones de editar
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.onclick = () => prepararEdicion(JSON.parse(btn.dataset.p));
        });

        // Eventos para botones de eliminar
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.onclick = () => eliminarProducto(parseInt(btn.dataset.id));
        });
    };
}

function prepararEdicion(p) {
    document.getElementById("edit-id").value = p.id;
    document.getElementById("nombreP").value = p.nombre;
    document.getElementById("precioP").value = p.precio;
    document.getElementById("stockP").value = p.stock;
    document.getElementById("btn-guardar-producto").innerText = "ACTUALIZAR";
}

function eliminarProducto(id) {
    if(confirm("¿Eliminar producto?")) {
        const tx = db.transaction("productos", "readwrite");
        tx.objectStore("productos").delete(id);
        tx.oncomplete = () => listarProductos();
    }
}

// --- CONECTAR EL BOTÓN DEL HTML ---
// Usamos el ID que pusimos en el HTML anterior
const btnGuardar = document.getElementById('btn-guardar-producto');
if(btnGuardar) {
    btnGuardar.addEventListener('click', guardarProducto);
}