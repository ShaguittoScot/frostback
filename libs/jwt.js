import jwt from 'jsonwebtoken';
import 'dotenv/config'
import { mensaje } from './mensajes.js';


export function creartoken(dato) {
    return new Promise((resolve, reject) => {
        jwt.sign(
            dato, 
            process.env.SECRET_KEY, 
            {expiresIn: '1d'},
            (error, token) => {
                if (error) {
                    reject(mensaje(400,"error al generar token",error));
            }
            resolve(token);
        });
    });
}

