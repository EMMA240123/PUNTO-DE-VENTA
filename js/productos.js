// 1. IMPORTAR CONEXIÓN A LA NUBE
import { db_nube, collection, addDoc } from './firebase-config.js';

// Cargar productos al iniciar
setTimeout(() => { listarProductos(); }, 500);

// --- FUNCIÓN PARA GUARDAR CON VALIDACIÓN DE DUPLICADOS ---
function guardarProducto() {
    const id = document.getElementById("edit-id").value;
    const nombreInput = document.getElementById("nombreP").value.trim();
    const precio = parseFloat(document.getElementById("precioP").value);
    const stock = parseInt(document.getElementById("stockP").value);

    if (!nombreInput || isNaN(precio) || isNaN(stock)) {
        alert("Por favor llena Nombre, Precio y Stock");
        return;
    }

    // --- VALIDACIÓN DE NOMBRE DUPLICADO ---
    const txCheck = db.transaction("productos", "readonly");
    const storeCheck = txCheck.objectStore("productos");
    
    storeCheck.getAll().onsuccess = (e) => {
        const productosExistentes = e.target.result;
        
        // Buscamos si el nombre ya existe (ignorando mayúsculas/minúsculas)
        // Pero permitimos guardar si estamos EDITANDO el mismo producto (por su ID)
        const duplicado = productosExistentes.find(p => 
            p.nombre.toLowerCase() === nombreInput.toLowerCase() && p.id !== parseInt(id)
        );

        if (duplicado) {
            alert(`⚠️ El producto "${nombreInput}" ya existe en tu inventario.`);
            return; 
        }

        // Si no es duplicado, procedemos a guardar
        ejecutarGuardado(id, nombreInput, precio, stock);
    };
}

// Función interna para procesar el guardado una vez validado
function ejecutarGuardado(id, nombre, precio, stock) {
    const producto = { 
        nombre: nombre, 
        precio: precio, 
        stock: stock,
        fecha_registro: new Date().toISOString()
    };
    
    if (id) producto.id = parseInt(id);

    // 1. GUARDAR LOCAL
    const tx = db.transaction("productos", "readwrite");
    tx.objectStore("productos").put(producto);

    // 2. RESPALDO NUBE
    addDoc(collection(db_nube, "productos_catalogo"), producto)
        .then(() => {
            alert("¡Producto Guardado con éxito! ✅");
            location.reload(); 
        })
        .catch((e) => {
            console.error("Error nube:", e);
            alert("Guardado localmente. Error al sincronizar.");
        });
}

// --- FUNCIÓN PARA LISTAR (CON ALERTAS DE STOCK BAJO) ---
function listarProductos() {
    const tx = db.transaction("productos", "readonly");
    const store = tx.objectStore("productos");
    store.getAll().onsuccess = (e) => {
        const productos = e.target.result;
        const tabla = document.getElementById("lista-tabla");
        if (!tabla) return;

        tabla.innerHTML = productos.map(p => {
            // LÓGICA DE ALERTA: Si el stock es menor a 3, aplicamos estilo rojo
            const esBajoStock = p.stock < 3;
            const estiloFila = esBajoStock ? 'style="background-color: #fff5f5; color: #c0392b; font-weight: bold;"' : '';
            const avisoHTML = esBajoStock ? '<br><small style="color: #e74c3c;">⚠️ REABASTECER</small>' : '';

            return `
                <tr ${estiloFila}>
                    <td>${p.nombre}</td>
                    <td>$${p.precio.toFixed(2)}</td>
                    <td>${p.stock} ${avisoHTML}</td>
                    <td>
                        <button class="btn-edit" data-p='${JSON.stringify(p)}' style="cursor:pointer; background:none; border:none; font-size:1.2rem;">📝</button>
                        <button class="btn-delete" data-id="${p.id}" style="cursor:pointer; background:none; border:none; font-size:1.2rem;">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');

        // Volver a asignar eventos a los botones generados
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.onclick = () => prepararEdicion(JSON.parse(btn.dataset.p));
        });

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
    
    const btn = document.getElementById("btn-guardar-producto");
    if(btn) btn.innerText = "ACTUALIZAR PRODUCTO";
}

function eliminarProducto(id) {
    if(confirm("¿Eliminar producto?")) {
        const tx = db.transaction("productos", "readwrite");
        tx.objectStore("productos").delete(id);
        tx.oncomplete = () => {
            alert("Eliminado");
            listarProductos();
        };
    }
}

const btnGuardar = document.getElementById('btn-guardar-producto');
if(btnGuardar) {
    btnGuardar.addEventListener('click', guardarProducto);
}