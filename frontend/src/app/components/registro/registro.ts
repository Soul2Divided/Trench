import { Component, ElementRef, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MensajeModal, Modal } from '../modal/modal';
import {
    contrasenasCoinciden,
    errorFormulario,
    fechaNacimientoValida,
    imagenPerfilValida,
    passwordValida,
    textoObligatorio,
} from '../../validators/auth.validators';

@Component({
    selector: 'app-registro',
    imports: [ReactiveFormsModule, Modal],
    templateUrl: './registro.html',
    styleUrl: './registro.scss',
})
export class Registro {
    private readonly formularios = inject(NonNullableFormBuilder);
    private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);

    protected readonly intentandoEnviar = signal(false);
    protected readonly mensajeModal = signal<MensajeModal | null>(null);
    protected readonly hoy = this.fechaHoy();

    protected readonly registroForm = this.formularios.group({
        nombre: ['', textoObligatorio],
        apellido: ['', textoObligatorio],
        email: ['', [Validators.required, Validators.email]],
        usuario: ['', textoObligatorio],
        password: ['', [Validators.required, passwordValida]],
        repetirPassword: ['', Validators.required],
        fechaNacimiento: ['', [Validators.required, fechaNacimientoValida]],
        descripcion: ['', [textoObligatorio, Validators.maxLength(250)]],
        imagen: this.formularios.control<File | null>(null, imagenPerfilValida),
        perfil: this.formularios.control<'usuario'>('usuario'),
    }, { validators: contrasenasCoinciden });

    protected mensajeError(control: AbstractControl, obligatorio: string): string {
        const error = errorFormulario(control, obligatorio);

        if (error) {
            return error;
        }

        if (control === this.registroForm.controls.repetirPassword && control.touched
            && this.registroForm.hasError('contrasenas')) {
            return 'Las contraseñas no coinciden.';
        }

        return '';
    }

    protected normalizarEmail(): void {
        const email = this.registroForm.controls.email;

        email.setValue(email.value.trim().toLowerCase());
    }

    protected seleccionarImagen(evento: Event): void {
        const input = evento.target as HTMLInputElement;
        const imagen = this.registroForm.controls.imagen;

        imagen.setValue(input.files?.item(0) ?? null);
        imagen.markAsDirty();
        imagen.markAsTouched();
    }

    protected enviarRegistro(): void {
        this.normalizarEmail();
        this.registroForm.markAllAsTouched();

        if (this.registroForm.invalid) {
            this.intentandoEnviar.set(true);

            const campos = this.elemento.nativeElement.querySelectorAll<HTMLInputElement>('input, textarea');
            const primerError = Array.from(campos).find(campo => {
                const control = this.registroForm.get(campo.getAttribute('name') ?? '');

                return control?.invalid || (campo.name === 'repetirPassword' && this.registroForm.hasError('contrasenas'));
            });

            primerError?.focus();

            return;
        }

        this.mensajeModal.set({
            tipo: 'info',
            titulo: 'El registro todavía no está disponible',
            mensaje: 'Los datos tienen un formato válido. La creación de tu cuenta estará disponible cuando se conecte el servicio de registro.',
        });
    }

    private fechaHoy(): string {
        const hoy = new Date();

        return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    }
}
