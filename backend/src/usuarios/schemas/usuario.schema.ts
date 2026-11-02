import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type UsuarioDocument = HydratedDocument<Usuario>;

@Schema({ collection: 'usuarios' })
export class Usuario {
    @Prop({ required: true, trim: true })
    nombre: string;

    @Prop({ required: true, trim: true })
    apellido: string;

    @Prop({ required: true, unique: true, lowercase: true, trim: true })
    correo: string;

    @Prop({ required: true, unique: true, trim: true })
    nombreUsuario: string;

    @Prop({ required: true, select: false })
    contrasenaHash: string;

    @Prop({ required: true })
    fechaNacimiento: Date;

    @Prop({ required: true, trim: true })
    descripcion: string;

    @Prop({ required: true })
    imagenPerfilUrl: string;

    @Prop({ required: true })
    imagenPerfilPublicId: string;

    @Prop({ required: true, enum: ['usuario', 'administrador'], default: 'usuario' })
    perfil: 'usuario' | 'administrador';
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);
