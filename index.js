import express from "express";
const PORT = process.env.PORT || 3000;
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./db/db.js";
import usuariosRutas from "./routes/UsuariosRutas.js";
import dotenv from 'dotenv';
dotenv.config();  // Cargar las variables de entorno

const app = express();

// Función para manejar la conexión a la base de datos antes de iniciar el servidor
async function conexionDB() {
    const mensajeDB = await connectDB();  // Esperamos la conexión a Firebase
    console.log(mensajeDB.status,mensajeDB.mensajeUsuario);  // Mostramos el mensaje de la conexión
}

conexionDB();  // Ejecutamos la conexión antes de iniciar el servidor

// Configuración de CORS
app.use(cors({
    origin: 'http://localhost:3001',  // Asegúrate de que este sea el origen correcto de tu frontend
    credentials: true,  // Permitir el uso de cookies
}));

// Middleware
app.use(cookieParser());
app.use(express.json());

// Rutas de la API
app.use("/appi", usuariosRutas);

// Iniciar el servidor después de establecer la conexión con la base de datos
app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});
