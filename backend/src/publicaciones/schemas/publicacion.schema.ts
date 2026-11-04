import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';
import type { HydratedDocument } from 'mongoose';

import { Usuario } from '../../usuarios/schemas/usuario.schema.js';

export type PublicacionDocument = HydratedDocument<Publicacion>;

@Schema({
    collection: 'publicaciones',
    timestamps: { createdAt: 'fechaCreacion', updatedAt: 'fechaActualizacion' },
})
export class Publicacion {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: Usuario.name, required: true })
    autor: Types.ObjectId;

    @Prop({ required: true, trim: true })
    titulo: string;

    @Prop({ required: true, trim: true })
    mensaje: string;

    @Prop()
    imagenUrl?: string;

    @Prop({ select: false })
    imagenPublicId?: string;

    @Prop({ required: true, default: true })
    activa: boolean;

    @Prop({ required: true, default: 0, min: 0 })
    meGusta: number;

    fechaCreacion: Date;

    fechaActualizacion: Date;
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);

PublicacionSchema.index({ activa: 1, fechaCreacion: -1, _id: -1 });
PublicacionSchema.index({ activa: 1, meGusta: -1, fechaCreacion: -1, _id: -1 });
PublicacionSchema.index({ activa: 1, autor: 1, fechaCreacion: -1, _id: -1 });
