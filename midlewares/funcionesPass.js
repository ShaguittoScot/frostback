import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { isAdminAutorizado } from '../db/usuariosDB.js';

// para verificar token
export const verificarToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ mensaje: "No autorizado, token no encontrado" });
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ mensaje: "Token no válido" });
        }
        req.user = user; 
        next(); 
    });
};

// Middleware para verificar si el usuario es administrador
export const adminAutorizado = async (req, res, next) => {
    try {
        const esAdmin = await isAdminAutorizado(req.user._id);

        if (!esAdmin) {
            return res.status(403).json({ mensaje: "Admin no autorizado" });
        }

        next();
    } catch (error) {
        console.error("Error en adminAutorizado:", error);
        return res.status(500).json({ mensaje: "Error al verificar permisos de administrador" });
    }
};



export function encriptarPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex'); 
    const hash = crypto.scryptSync(password, salt, 64, 'sha512').toString('hex');
    return { salt, hash };
}

export function validarPassword(password, salt, hash) {
    const hashEvaluar = crypto.scryptSync(password, salt, 64, 'sha512').toString('hex');
    return hashEvaluar === hash;
}



// Función que verifica si el usuario está logeado y es administrador


  


/*
const{salt,hash}=encriptarPassword('abcd');
console.log('salt:',salt);
console.log('hash: ',hash);
const aprobado = validarPassword("abc",salt,hash);
console.log("Aprobado;",aprobado);
*/