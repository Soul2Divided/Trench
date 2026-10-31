import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const textoObligatorio: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    return typeof control.value === 'string' && control.value.trim() ? null : { required: true };
};

export const passwordValida: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value as string;

    if (!valor) {
        return null;
    }

    return valor.length >= 8 && /[A-Z]/.test(valor) && /[0-9]/.test(valor)
        ? null
        : { password: true };
};

export const fechaNacimientoValida: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
        return null;
    }

    const valor = control.value as string;
    const fecha = new Date(`${valor}T00:00:00`);
    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor) || Number.isNaN(fecha.getTime())) {
        return { fecha: true };
    }

    const [anio, mes, dia] = valor.split('-').map(Number);

    return anio > 0 && fecha.getFullYear() === anio && fecha.getMonth() === mes - 1
        && fecha.getDate() === dia && fecha < hoy
        ? null
        : { fecha: true };
};

export const contrasenasCoinciden: ValidatorFn = (grupo: AbstractControl): ValidationErrors | null => {
    const password = grupo.get('password')?.value;
    const repetida = grupo.get('repetirPassword')?.value;

    return password && repetida && password !== repetida ? { contrasenas: true } : null;
};

export const imagenPerfilValida: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const archivo = control.value as File | null;

    if (!archivo) {
        return null;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) {
        return { formatoImagen: true };
    }

    return archivo.size > 0 && archivo.size <= 5 * 1024 * 1024 ? null : { tamanoImagen: true };
};

export function errorFormulario(control: AbstractControl, obligatorio: string): string {
    if (!control.touched || control.valid) {
        return '';
    }

    if (control.hasError('required')) {
        return obligatorio;
    }

    if (control.hasError('email')) {
        return 'Ingresá un correo electrónico válido, por ejemplo: nombre@dominio.com.';
    }

    if (control.hasError('password')) {
        return 'Usá al menos 8 caracteres, una mayúscula y un número.';
    }

    if (control.hasError('fecha')) {
        return 'Ingresá una fecha de nacimiento válida, anterior a hoy.';
    }

    if (control.hasError('maxlength')) {
        return `Usá hasta ${control.getError('maxlength').requiredLength} caracteres.`;
    }

    if (control.hasError('formatoImagen')) {
        return 'Elegí una imagen JPG, PNG o WebP.';
    }

    if (control.hasError('tamanoImagen')) {
        return 'Elegí una imagen que no esté vacía y pese hasta 5 MB.';
    }

    return '';
}
