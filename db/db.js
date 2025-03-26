import admin from "firebase-admin";
import dotenv from 'dotenv';
import { mensaje } from "../libs/mensajes.js";
dotenv.config();

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Aseguramos que Firebase solo se inicialice una vez
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  console.log("Firebase ya ha sido inicializado");
}

// Instancias de Firebase
const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

// Función para conectar a la base de datos (si es necesario)
export const connectDB = async () => {
  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Conexión establecida con Firebase");
      return mensaje(200, 'Conexión establecida con Firebase');
    } else {
      console.log("Firebase ya está conectado");
      return mensaje(200, 'Firebase ya está conectado');
    }
  } catch (error) {
    console.log("Error al conectar con Firebase");
    return mensaje(400, 'Error al conectar con Firebase', error);
  }
};

// Exportación de instancias necesarias
export { db, auth, storage };
