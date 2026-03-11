function registrarMovimiento(tipo, monto, motivo) {
    // tipo: "entrada" o "salida"
    const tx = db.transaction("turnos", "readwrite");
    const store = tx.objectStore("turnos");

    const movimiento = {
        tipo,
        monto: parseFloat(monto),
        motivo,
        fecha: new Date().toISOString()
    };

    store.add(movimiento);
    alert("Movimiento de caja registrado");
}