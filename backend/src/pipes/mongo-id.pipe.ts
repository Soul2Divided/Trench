import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { isObjectIdOrHexString } from 'mongoose';

@Injectable()
export class MongoIdPipe implements PipeTransform<string, string> {
    transform(id: string): string {
        if (!isObjectIdOrHexString(id)) {
            throw new BadRequestException('El identificador no es válido.');
        }

        return id;
    }
}
