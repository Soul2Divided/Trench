import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';

import { Usuario } from '../../usuarios/schemas/usuario.schema.js';
import { Publicacion } from './publicacion.schema.js';

export type ComentarioDocument = HydratedDocument<Comentario>;

@Schema({
    collection: 'comentarios',
    timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
})
export class Comentario {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: Publicacion.name, required: true })
    publicacion: Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: Usuario.name, required: true })
    autor: Types.ObjectId;

    @Prop({ required: true, trim: true })
    mensaje: string;

    @Prop({ required: true, default: false })
    editado: boolean;

    fechaCreacion: Date;

    fechaActualizacion: Date;
}

export const ComentarioSchema = SchemaFactory.createForClass(Comentario);

ComentarioSchema.index({ publicacion: 1, fechaCreacion: -1, _id: -1 });
