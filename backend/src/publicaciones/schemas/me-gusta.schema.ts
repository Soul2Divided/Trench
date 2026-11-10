import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';

import { Usuario } from '../../usuarios/schemas/usuario.schema.js';
import { Publicacion } from './publicacion.schema.js';

@Schema({ collection: 'me_gusta' })
export class MeGusta {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: Usuario.name, required: true })
    usuario: Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: Publicacion.name, required: true })
    publicacion: Types.ObjectId;
}

export const MeGustaSchema = SchemaFactory.createForClass(MeGusta);

MeGustaSchema.index({ usuario: 1, publicacion: 1 }, { unique: true });
MeGustaSchema.index({ publicacion: 1 });
