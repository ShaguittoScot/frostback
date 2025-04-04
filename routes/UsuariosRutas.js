import { Router } from "express";
import {
    register, login, mostrarUsuarios,
    buscarUsuario,
    borrarUsuario,
    editarUsuario,
    obtenerProductos,
    obtenerTemperatura,
    obtenerFrutasyV,
    eliminarProducto
} from "../db/usuariosDB.js";
import { adminAutorizado, verificarToken } from "../midlewares/funcionesPass.js";
import { mensaje } from "../libs/mensajes.js";
const router = Router();
import axios from 'axios';

router.post("/register", async (req, res) => {
    console.log(req.body);
    const respuesta = await register(req.body);
    res.cookie('token', respuesta.token, {
        httpOnly: true,  // Evita acceso desde JavaScript del cliente
        secure: false,   // Cambia a `true` si usas HTTPS
        sameSite: "lax", // Permite el envío de cookies en peticiones de diferente origen
        path: "/",       // Asegura que la cookie esté disponible en toda la API        
    }).status(respuesta.status).json(respuesta.mensajeUsuario);
});


router.get("/obtenerTemp", async (req, res) => {
    console.log("Obteniendo temperatura...");
    const respuesta = await obtenerTemperatura();

    res.status(respuesta.status).json({
        mensajeUsuario: respuesta.mensajeUsuario, // Mensaje amigable para el usuario
        datos: respuesta.mensajeOriginal // Aquí enviamos los datos obtenidos de la base de datos
    });
});


router.post("/login", async (req, res) => {
    console.log("estas en login");
    console.log(req.body);
    const respuesta = await login(req.body);
    console.log(respuesta);

    res.cookie('token', respuesta.token, {
        httpOnly: true,  // Evita acceso desde JavaScript del cliente
        secure: false,   // Cambia a `true` si usas HTTPS
        sameSite: "lax",// Permite el envío de cookies en peticiones de diferente origen
        path: "/",       // Asegura que la cookie esté disponible en toda la API        
    }).status(respuesta.status).json({
        mensajeUsuario: 'Bienvenido ' + respuesta.usuario,
        mensajeOriginal: respuesta.mensajeOriginal,
        //token: respuesta.token, // Asegúrate de devolverlo también en el cuerpo
    });
});



router.get("/usuarioslogeados", verificarToken, (req, res) => {
    console.log('Usuario logeado:', req.user);
    res.json({ success: true, usuario: req.user });
});

// Ruta protegida solo para administradores
router.get("/Administradores", verificarToken, adminAutorizado, (req, res) => {

    res.status(200).json({ mensaje: "Bienvenido, Administrador", usuario: req.user });
});


router.get('/usuariosBusc', verificarToken, async (req, res) => {
    try {
        const userId = req.user._id; // Extrae el ID desde `req.user`
        const respuesta = await buscarUsuario(userId);

        res.status(respuesta.status).json({
            Mensaje: respuesta.mensajeUsuario,
            Usuarios: respuesta.mensajeOriginal
        });
    } catch (error) {
        res.status(500).json({ Mensaje: "Error al buscar usuario", Error: error.message });
    }
});




router.delete('/usuarioBorr/:id', async (req, res) => {
    console.log(req.params.id);
    const respuesta = await borrarUsuario(req.params.id);
    res.status(respuesta.status).json(respuesta.mensajeUsuario);
});

router.put('/usuarioEdi/:id', async (req, res) => {
    const respuesta = await editarUsuario(req.params.id, req.body,);
    res.status(respuesta.status).json(respuesta.mensajeUsuario);
});

router.get("/cualquierUsuario", async (req, res) => {
    res.json("estas en no importa si estas logeado")
});

router.get("/salir", async (req, res) => {
    try {
        res.cookie('token', '', { expires: new Date(0), httpOnly: true, secure: true, sameSite: 'strict' });
        return res.status(200).json({ mensaje: "Cerraste sesión correctamente" });
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        return res.status(500).json({ mensaje: "Error al cerrar sesión" });
    }
});

router.get("/usuariosMost", async (req, res) => {
    const respuesta = await mostrarUsuarios();
    res.status(respuesta.status).json({
        Mensaje: respuesta.mensajeUsuario,
        Usuarios: respuesta.mensajeOriginal
    });
});

router.get("/inventario", async (req, res) => {
    try {
        const respuesta = await obtenerProductos();
        return res.status(respuesta.status).json({
            mensaje: respuesta.mensajeUsuario,
            Productos: respuesta.mensajeOriginal
        });
    } catch (error) {
        return res.status(500).json({
            mensaje: "Error al obtener los productos"
        })
    }
});


router.get("/obtenerFrutasyV", async (req, res) => {
    try {
        const respuesta = await obtenerFrutasyV();

        const frutasConNombreEImagen = await Promise.all(
            respuesta.mensajeOriginal.map(async (item) => {
                const nombre = obtenerNombreSimple(item.prediccion); // "Banana fresca" → "Banana"
                const imagen = await obtenerImagenDesdeOFF(nombre);

                return {
                    ...item,
                    nombre, // nuevo campo con el nombre simple
                    imagen  // imagen obtenida de Open Food Facts
                };
            })
        );

        return res.status(respuesta.status).json({
            mensaje: respuesta.mensajeUsuario,
            FrutasyV: frutasConNombreEImagen
        });

    } catch (error) {
        return res.status(500).json({
            mensaje: "Error al obtener los productos",
            Error: error.message
        });
    }
});

function obtenerNombreSimple(prediccion) {
    // Retorna solo la primera palabra en mayúscula
    if (!prediccion) return "Fruta";
    const primeraPalabra = prediccion.trim().split(" ")[0];
    return primeraPalabra.charAt(0).toUpperCase() + primeraPalabra.slice(1).toLowerCase();
}

async function obtenerImagenDesdeOFF(nombre) {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(nombre)}&json=1`;

    try {
        const respuesta = await axios.get(url);
        const productos = respuesta.data.products;

        if (productos.length > 0 && productos[0].image_url) {
            return productos[0].image_url;
        } else {
            return "https://upload.wikimedia.org/wikipedia/commons/6/6f/Fruit_and_vegetables.jpg"; // Imagen por defecto
        }
    } catch (error) {
        console.error("Error obteniendo imagen de OFF:", error.message);
        return "https://upload.wikimedia.org/wikipedia/commons/6/6f/Fruit_and_vegetables.jpg";
    }
}


router.get("/recetas", async (req, res) => {
    try {
        const { ingredientes } = req.query;

        if (!ingredientes) {
            return res.status(400).json({
                mensaje: "Debes proporcionar ingredientes en la consulta"
            });
        }

        const API_KEY = process.env.SPOONACULAR_API_KEY; // Usa tu API Key de Spoonacular
        const response = await axios.get(`https://api.spoonacular.com/recipes/findByIngredients`, {
            params: {
                ingredients: ingredientes,
                number: 5,  // Máximo 5 recetas
                ranking: 1, // Prioriza el uso máximo de ingredientes dados
                ignorePantry: true, // Ignorar ingredientes básicos
                apiKey: API_KEY
            }
        });

        return res.status(200).json({
            mensaje: "Recetas encontradas",
            recetas: response.data
        });

    } catch (error) {
        console.error("Error al obtener recetas:", error);
        return res.status(500).json({
            mensaje: "Error al obtener recetas"
        });
    }
});


router.get("/recetabusc/:id", async (req, res) => {
    try {
        const { id } = req.params;  // Capturamos el ID de la URL

        if (!id) {
            return res.status(400).json({
                mensaje: "Debes proporcionar un ID de receta válido"
            });
        }

        const API_KEY = process.env.SPOONACULAR_API_KEY;
        const response = await axios.get(`https://api.spoonacular.com/recipes/${id}/information`, {
            params: {
                apiKey: API_KEY
            }
        });

        return res.status(200).json({
            mensaje: "Receta encontrada",
            receta: response.data
        });

    } catch (error) {
        console.error("Error al obtener receta:", error);
        return res.status(500).json({
            mensaje: "Error al obtener receta"
        });
    }
});


router.delete("/eliminarProducto/:id", async (req, res) => {
    try {
        const { id } = req.params;  // Capturamos el ID de la URL

        if (!id) {
            return res.status(400).json({
                mensaje: "Debes proporcionar un ID de producto válido"
            });
        }

        const respuesta = await eliminarProducto(id);

        return res.status(respuesta.status).json({
            mensaje: respuesta.mensajeUsuario,
            productoEliminado: respuesta.mensajeOriginal
        });
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        return res.status(500).json({
            mensaje: "Error al eliminar producto"
        });
    }
});


export default router;