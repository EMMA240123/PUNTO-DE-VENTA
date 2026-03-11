function iniciarTurno() {
    const usuario = document.getElementById("usuario").value;
    const cajaInput = document.getElementById("cajaInicial").value;
    const cajaInicial = parseFloat(cajaInput);

    if (cajaInput === "" || cajaInicial < 0) {
        alert("Por favor, ingresa un monto válido.");
        return;
    }

    const datosTurno = {
        usuario: usuario,
        cajaInicial: cajaInicial,
        fechaInicio: new Date().toISOString(),
        activo: true
    };

    // 1. Guardamos en localStorage (Memoria rápida para index y dashboard)
    localStorage.setItem("turno_activo", JSON.stringify(datosTurno));

    // 2. Intentamos guardar en la base de datos (Memoria lenta)
    if (typeof db !== 'undefined' && db) {
        try {
            let tx = db.transaction("turnos", "readwrite");
            let store = tx.objectStore("turnos");
            store.add(datosTurno);
            
            tx.oncomplete = () => {
                setTimeout(() => window.location.replace("dashboard.html"), 100);
            };
        } catch (e) {
            window.location.replace("dashboard.html");
        }
    } else {
        // Si la DB no está lista, entramos igual por LocalStorage
        window.location.replace("dashboard.html");
    }
}