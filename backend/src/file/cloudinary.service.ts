import { BadGatewayException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import type { ConfigOptions, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
    constructor(private readonly configService: ConfigService) { }

    /**
     * Envía el contenido del archivo a Cloudinary sin guardarlo en el disco local.
     *
     * @returns La URL HTTPS y el identificador de la imagen subida.
     */
    subirImagen(buffer: Buffer, carpeta = 'trench/perfiles'): Promise<Pick<UploadApiResponse, 'secure_url' | 'public_id'>> {
        const configuracion = this.obtenerConfiguracion();

        return new Promise((resolve, reject) => {
            const subida = cloudinary.uploader.upload_stream(
                {
                    ...configuracion,
                    resource_type: 'image',
                    folder: carpeta,
                },
                (error, resultado) => {
                    if (error || !resultado) {
                        reject(new BadGatewayException('No se pudo subir la imagen.'));
                        return;
                    }

                    resolve({
                        secure_url: resultado.secure_url,
                        public_id: resultado.public_id,
                    });
                },
            );

            subida.on('error', () => {
                reject(new BadGatewayException('No se pudo enviar la imagen.'));
            });

            subida.end(buffer);
        });
    }

    /** Elimina una imagen cuando falla el guardado de los datos asociados. */
    async eliminarImagen(publicId: string): Promise<void> {
        const configuracion = this.obtenerConfiguracion();

        await cloudinary.uploader.destroy(publicId, {
            ...configuracion,
            resource_type: 'image',
        });
    }

    private obtenerConfiguracion(): ConfigOptions {
        const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
        const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
        const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

        if (!cloudName || !apiKey || !apiSecret) {
            throw new InternalServerErrorException('Falta configurar el almacenamiento de imágenes.');
        }

        return {
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
            secure: true,
        };
    }
}
