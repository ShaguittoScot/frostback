import mongoose from "mongoose";

const urSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    nombre: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    tipoUsuario: {
        type: String,
        default: "Usuario"
    },
    password: {
        type: String,
        required: true
    },
    salt:{
        type: String,
        required: true
    },


},{timestamps: true});

export default mongoose.model("Usuario", urSchema);

