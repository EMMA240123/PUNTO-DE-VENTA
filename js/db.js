let db;
// Subimos a versión 2 para actualizar la estructura
const request = indexedDB.open("ElitePOS_DB", 2);

request.onupgradeneeded = function(e) {
    db = e.target.result;
    if (!db.objectStoreNames.contains("productos")) {
        db.createObjectStore("productos", { keyPath: "id", autoIncrement: true });
    }
    if (!db.objectStoreNames.contains("ventas")) {
        db.createObjectStore("ventas", { keyPath: "id", autoIncrement: true });
    }
    if (!db.objectStoreNames.contains("turnos")) {
        db.createObjectStore("turnos", { keyPath: "id", autoIncrement: true });
    }
};

request.onsuccess = function(e) {
    db = e.target.result;
    console.log("Base de datos lista.");
};