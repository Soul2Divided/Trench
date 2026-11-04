import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { AutenticacionService } from '../../services/autenticacion.service';
import { MensajeModal, Modal } from '../modal/modal';
import {
    contrasenasCoinciden,
    errorFormulario,
    fechaNacimientoValida,
    imagenPerfilValida,
    passwordValida,
    patronCorreo,
    textoObligatorio,
} from '../../validators/auth.validators';

@Component({
    selector: 'app-registro',
    imports: [ReactiveFormsModule, Modal],
    templateUrl: './registro.html',
    styleUrl: './registro.scss',
})
export class Registro {
    readonly registrado = output<string>();
    readonly cargando = output<boolean>();

    private readonly formularios = inject(NonNullableFormBuilder);
    private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly autenticacion = inject(AutenticacionService);
    private readonly destroyRef = inject(DestroyRef);

    protected readonly enviando = signal(false);
    protected readonly intentandoEnviar = signal(false);
    protected readonly mensajeModal = signal<MensajeModal | null>(null);
    protected readonly hoy = this.fechaHoy();

    protected readonly registroForm = this.formularios.group({
        nombre: ['', textoObligatorio],
        apellido: ['', textoObligatorio],
        email: ['', [Validators.required, Validators.email, Validators.pattern(patronCorreo)]],
        usuario: ['', textoObligatorio],
        password: ['', [Validators.required, passwordValida]],
        repetirPassword: ['', Validators.required],
        fechaNacimiento: ['', [Validators.required, fechaNacimientoValida]],
        descripcion: ['', [textoObligatorio, Validators.maxLength(250)]],
        imagen: this.formularios.control<File | null>(null, [Validators.required, imagenPerfilValida]),
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
        if (this.enviando()) {
            return;
        }

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

        const datos = this.registroForm.getRawValue();

        if (!datos.imagen) {
            return;
        }

        const formulario = new FormData();

        formulario.append('nombre', datos.nombre);
        formulario.append('apellido', datos.apellido);
        formulario.append('correo', datos.email);
        formulario.append('nombreUsuario', datos.usuario);
        formulario.append('contrasena', datos.password);
        formulario.append('repetirContrasena', datos.repetirPassword);
        formulario.append('fechaNacimiento', datos.fechaNacimiento);
        formulario.append('descripcion', datos.descripcion);
        formulario.append('imagen', datos.imagen);

        this.enviando.set(true);
        this.mensajeModal.set(null);
        this.cargando.emit(true);

        let cuentaCreada = false;

        this.autenticacion.registrar(formulario)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => {
                    this.enviando.set(false);

                    if (!this.destroyRef.destroyed) {
                        this.cargando.emit(false);

                        if (cuentaCreada) {
                            this.registrado.emit(datos.email);
                        }
                    }
                }),
            )
            .subscribe({
                next: () => {
                    this.registroForm.reset();
                    this.elemento.nativeElement.querySelector<HTMLFormElement>('form')?.reset();
                    this.intentandoEnviar.set(false);
                    cuentaCreada = true;
                },
                error: (error: unknown) => this.mostrarErrorRegistro(error),
            });
    }

    private mostrarErrorRegistro(error: unknown): void {
        let mensaje = 'No pudimos crear tu cuenta. Intentá nuevamente.';

        if (error instanceof HttpErrorResponse) {
            if (error.status === 0) {
                mensaje = 'No pudimos conectar con el servidor. Revisá que el backend esté iniciado y que tengas conexión.';
            } else if (error.status === 400 || error.status === 409) {
                const detalle: unknown = error.error?.message;

                mensaje = error.status === 409
                    ? 'El correo o el nombre de usuario ya está registrado.'
                    : 'Los datos enviados no son válidos. Revisá los campos y la imagen.';

                if (typeof detalle === 'string') {
                    mensaje = detalle;
                } else if (Array.isArray(detalle) && detalle.length > 0
                    && detalle.every(item => typeof item === 'string')) {
                    mensaje = detalle.join(' ');
                }
            } else if (error.status === 413) {
                mensaje = 'La imagen es demasiado grande. Elegí un archivo de menos de 5 MiB.';
            } else if (error.status === 502) {
                mensaje = 'No pudimos subir tu imagen de perfil. Intentá nuevamente.';
            }
        }

        this.mensajeModal.set({
            tipo: 'error',
            titulo: 'No se pudo crear la cuenta',
            mensaje,
        });
    }

    private fechaHoy(): string {
        const hoy = new Date();

        return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    }
}
