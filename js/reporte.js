setTimeout(() => {
    generarReporte();
}, 600);

function generarReporte() {
    const tx = db.transaction("ventas", "readonly");
    const store = tx.objectStore("ventas");
    const peticion = store.getAll();

    peticion.onsuccess = () => {
        const ventas = peticion.result;
        let totalDinero = 0;
        const historial = document.getElementById("historial-ventas");

        // Ordenar por fecha (más reciente primero)
        ventas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        historial.innerHTML = ventas.map(v => {
            totalDinero += v.total;
            return `
                <div class="card-producto" style="text-align:left; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>Ticket #${v.id}</strong><br>
                        <small>${new Date(v.fecha).toLocaleTimeString()}</small>
                    </div>
                    <span style="font-weight:bold; color:var(--primario);">$${v.total.toFixed(2)}</span>
                </div>
            `;
        }).join('');

        document.getElementById("gran-total").innerText = `$${totalDinero.toFixed(2)}`;
    };
}