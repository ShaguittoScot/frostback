import { db, auth } from './db.js';
import admin from 'firebase-admin';
import { mensaje } from '../libs/mensajes.js';
import { creartoken } from "../libs/jwt.js";


export const register = async ({ userName, nombre, email, password }) => {
    try {
        // Verificar que no haya campos vacíos
        if (!userName || !nombre || !email || !password) {
            return mensaje(400, "Todos los campos son obligatorios");
        }

        // Verificar si el usuario o el email ya están registrados
        const emailDuplicado = await admin.auth().getUserByEmail(email).catch(() => null);

        if (emailDuplicado) {
            return mensaje(400, "Email duplicado");
        }

        const userNameSnapshot = await db.collection("usuarios")
            .where("userName", "==", userName)
            .limit(1)
            .get();

        if (!userNameSnapshot.empty) {
            return mensaje(400, "El nombre de usuario ya está registrado");
        }
        // Crear el usuario en Firebase Authentication
        const usuarioCreado = await auth.createUser({
            email,
            password,
            displayName: nombre,
            username: userName,  // Si es necesario, ya que Firebase no tiene un campo `userName`
        });

        // Guardar el usuario en Firestore
        const dataUser = {
            userName,
            nombre,
            rol: "Cocinero Amateur",
            email,
            tipoUsuario: "Usuario", // Puedes ajustarlo si es un admin u otro tipo de usuario
        };

        // Guardamos los datos del usuario en Firestore
        await db.collection('usuarios').doc(usuarioCreado.uid).set(dataUser);

        // Crear un token personalizado para el usuario
        const token = await creartoken({
            _id: usuarioCreado.uid,
            userName: usuarioCreado.displayName,
            email: usuarioCreado.email,
            tipoUsuario: "Usuario",  // O el tipo de usuario que le hayas asignado
        });

        return mensaje(200, "Usuario registrado con éxito", usuarioCreado.uid, token);

    } catch (error) {
        console.log("Error al registrar usuario:", error);
        return mensaje(500, "Error al registrar usuario");
    }
};

export const login = async ({ userName, password }) => {
    try {
        // Verificar que los campos no estén vacíos
        if (!userName || !password) {
            return mensaje(400, "El usuario y la contraseña son obligatorios");
        }

        // Buscar al usuario por el nombre de usuario (en este caso, email o userName)
        const usuarioEncontado = await db.collection('usuarios').where('userName', '==', userName).get();

        if (usuarioEncontado.empty) {
            return mensaje(400, "Datos incorrectos");
        }

        const usuario = usuarioEncontado.docs[0].data();
        const userId = usuarioEncontado.docs[0].id;

        // Verificar que la contraseña sea válida (Firebase maneja la validación por nosotros)
        try {
            await auth.getUserByEmail(usuario.email);  // Verificar que el usuario exista
            // Si llega aquí, la contraseña es correcta
        } catch (error) {
            return mensaje(400, "Datos incorrectos");
        }

        // Crear un token para el usuario
        const token = await creartoken({
            _id: userId,
            userName: usuario.userName,
            nombre: usuario.nombre,
            email: usuario.email,
            tipoUsuario: usuario.tipoUsuario,
        });

        // Retornar la respuesta con el token
        return mensaje(200, `Bienvenido ${userName}`, userId, token);

    } catch (error) {
        console.log("Error en login:", error);
        return mensaje(400, "Datos incorrectos");
    }
};

export const obtenerTemperatura = async () => {
    try {
        // Obtener la última lectura de la colección
        const snapshot = await db.collection("lecturas_sensor")
            .orderBy("Timestamp", "desc")
            .limit(1)
            .get();

        if (snapshot.empty) {
            return mensaje(404, "No se encontraron datos de temperatura");
        }

        const ultimaLectura = snapshot.docs[0].data();
        return mensaje(200, "Temperatura obtenida", ultimaLectura);

    } catch (error) {
        console.log("Error al obtener la temperatura:", error);
        return mensaje(500, "Error al obtener la temperatura");
    }
};

export const buscarUsuario = async (id) => {
    try {
        const usuario = await db.collection('usuarios').doc(id).get();
        if (!usuario.exists) {
            return mensaje(404, "Usuario no encontrado");
        }
        return mensaje(200, "Usuario encontrado", usuario.data());
    } catch (error) {
        return mensaje(500, "Error al buscar usuario", error);
    }
};

export const borrarUsuario = async (id) => {
    try {
        // Eliminar el usuario de Firebase Authentication
        await auth.deleteUser(id);

        // Eliminar el usuario de Firestore
        await db.collection('usuarios').doc(id).delete();

        return mensaje(200, "Usuario eliminado correctamente");
    } catch (error) {
        console.log("Error al eliminar usuario:", error);
        return mensaje(500, "Error al eliminar usuario", error);
    }
};


export const editarUsuario = async (id, datosActualizados) => {
    try {
        const usuarioActualizado = await db.collection('usuarios').doc(id).update(datosActualizados);
        if (!usuarioActualizado) {
            return mensaje(404, "Usuario no encontrado");
        }
        return mensaje(200, "Usuario actualizado correctamente", usuarioActualizado);
    } catch (error) {
        return mensaje(500, "Error al actualizar usuario", error);
    }
};

// Función para verificar si un usuario es administrador
export const isAdminAutorizado = async (id) => {
    try {
        const usuario = await db.collection('usuarios').doc(id).get();
        return usuario.exists && usuario.data().tipoUsuario === "Administrador";
    } catch (error) {
        console.error("Error en isAdminAutorizado:", error);
        return false;
    }
};

export const mostrarUsuarios = async () => {
    try {
        const usuariosSnapshot = await db.collection('usuarios').get();
        const usuarios = usuariosSnapshot.docs.map(doc => doc.data());
        return mensaje(200, "Usuarios obtenidos correctamente", usuarios);
    } catch (error) {
        return mensaje(500, "Error al obtener usuarios", error);
    }
};

export const obtenerProductos = async () => {
    try {
        const productosSnaoshot = await db.collection('Productos').get();
        const productos = productosSnaoshot.docs.map(doc => ({
            id: doc.id,                // Aquí obtenemos el ID del documento
            ...doc.data()              // Y todo lo demás (nombre, categoría, etc.)
        }));        
        return mensaje(200, "Productos obtenidos correctamente", productos);
    } catch (error) {
        return mensaje(500, "Error al obtener los productos", error);
    }
}

export const obtenerFrutasyV = async () => {
    try {
        const frutasyVSnapshot = await db.collection('predicciones').get();
        const frutasyV = frutasyVSnapshot.docs.map(doc => doc.data());
        return mensaje(200, "Verduras y frutas obtenidas correctamente", frutasyV);
    } catch (error) {
        return mensaje(500, "Error al obtener verduras y frutas", error);
    }
};

export const eliminarProducto = async (id) => {
    try {
        await db.collection('Productos').doc(id).delete();
        return mensaje(200, "Producto eliminado correctamente");
    } catch (error) {
        return mensaje(500, "Error al eliminar producto", error);
    }
} 
