// js/corte.js
async function realizarCorteCaja() {
    // 1. Confirmación para evitar cierres accidentales
    if (!confirm("¿Deseas finalizar el turno? Se descargará el reporte PDF y se limpiará la sesión.")) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Recuperamos los datos del turno actual
    const sesion = JSON.parse(localStorage.getItem("turno_activo"));
    if (!sesion) {
        alert("No se encontró una sesión activa.");
        return;
    }

    // 2. Encabezado del Reporte
    doc.setFontSize(22);
    doc.setTextColor(40);
    doc.text("CORTE DE CAJA", 10, 20);
    
    doc.setFontSize(12);
    doc.text(`Cajero: ${sesion.usuario}`, 10, 35);
    doc.text(`Fecha y Hora: ${new Date().toLocaleString()}`, 10, 42);
    doc.text(`Apertura de Caja: $${sesion.cajaInicial.toFixed(2)}`, 10, 49);

    // 3. Consultar ventas en la base de datos
    const tx = db.transaction("ventas", "readonly");
    const store = tx.objectStore("ventas");
    const request = store.getAll();

    request.onsuccess = function() {
        const ventas = request.result;
        let totalVendido = 0;

        // Formateamos las filas para la tabla del PDF
        const filas = ventas.map(v => {
            totalVendido += v.total;
            return [
                new Date(v.fecha).toLocaleTimeString(),
                `$${v.total.toFixed(2)}`
            ];
        });

        // 4. Crear la tabla en el PDF
        doc.autoTable({
            startY: 60,
            head: [['Hora de Venta', 'Importe']],
            body: filas,
            headStyles: { fillColor: [44, 62, 80] }, // Color oscuro para el encabezado
            theme: 'striped'
        });

        // 5. Totales Finales
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(14);
        doc.text(`VENTAS TOTALES: $${totalVendido.toFixed(2)}`, 10, finalY);
        doc.setFontSize(16);
        doc.setTextColor(0, 128, 0); // Color verde para el dinero en caja
        doc.text(`EFECTIVO ESTIMADO EN CAJA: $${(totalVendido + sesion.cajaInicial).toFixed(2)}`, 10, finalY + 12);

        // 6. Descargar el archivo
        const nombreArchivo = `Corte_${sesion.usuario}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`;
        doc.save(nombreArchivo);

        // 7. LIMPIEZA TOTAL PARA EL SIGUIENTE TURNO
        // Borramos las ventas de la DB para que no se sumen al reporte del siguiente turno
        const txClear = db.transaction("ventas", "readwrite");
        txClear.objectStore("ventas").clear();

        txClear.oncomplete = () => {
            // Borramos la sesión del localStorage
            localStorage.removeItem("turno_activo");
            alert("Corte realizado. Redirigiendo al inicio...");
            window.location.replace("login.html");
        };
    };
}