import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { UsuarioAutenticado } from '../../../../services/autenticacion.service';
import { UsuariosService } from '../../../../services/usuarios.service';
import {
    errorFormulario,
    fechaNacimientoValida,
    imagenPerfilValida,
    textoObligatorio,
} from '../../../../validators/auth.validators';
import { MensajeModal, Modal } from '../../../modal/modal';

@Component({
    selector: 'app-datos-perfil',
    imports: [DatePipe, ReactiveFormsModule, Modal],
    templateUrl: './datos-perfil.html',
    styleUrl: './datos-perfil.scss',
})
export class DatosPerfil {
    readonly usuario = input.required<UsuarioAutenticado>();
    readonly cantidadPublicaciones = input<number | null>(null);
    readonly actualizado = output<UsuarioAutenticado>();

    private readonly formularios = inject(NonNullableFormBuilder);
    private readonly usuariosService = inject(UsuariosService);
    private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly destroyRef = inject(DestroyRef);

    protected readonly editando = signal(false);
    protected readonly guardando = signal(false);
    protected readonly guardado = signal(false);
    protected readonly vistaPrevia = signal<string | null>(null);
    protected readonly mensajeModal = signal<MensajeModal | null>(null);

    protected readonly perfilForm = this.formularios.group({
        nombre: ['', textoObligatorio],
        apellido: ['', textoObligatorio],
        nombreUsuario: ['', textoObligatorio],
        fechaNacimiento: ['', [Validators.required, fechaNacimientoValida]],
        descripcion: ['', [textoObligatorio, Validators.maxLength(250)]],
        imagen: this.formularios.control<File | null>(null, imagenPerfilValida),
    });

    constructor() {
        this.destroyRef.onDestroy(() => this.liberarVistaPrevia());
    }

    protected editar(): void {
        const usuario = this.usuario();

        this.perfilForm.reset({
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            nombreUsuario: usuario.nombreUsuario,
            fechaNacimiento: usuario.fechaNacimiento.slice(0, 10),
            descripcion: usuario.descripcion,
            imagen: null,
        });

        this.guardado.set(false);
        this.editando.set(true);
    }

    protected cancelar(): void {
        if (this.guardando()) {
            return;
        }

        this.liberarVistaPrevia();
        this.perfilForm.reset();
        this.editando.set(false);
    }

    protected mensajeError(control: AbstractControl, obligatorio: string): string {
        return errorFormulario(control, obligatorio);
    }

    protected seleccionarImagen(evento: Event): void {
        const input = evento.target as HTMLInputElement;
        const imagen = this.perfilForm.controls.imagen;

        this.liberarVistaPrevia();
        imagen.setValue(input.files?.item(0) ?? null);
        imagen.markAsTouched();

        if (imagen.valid && imagen.value) {
            this.vistaPrevia.set(URL.createObjectURL(imagen.value));
        }
    }

    protected quitarImagenNueva(): void {
        this.liberarVistaPrevia();
        this.perfilForm.controls.imagen.reset();

        const input = this.elemento.nativeElement.querySelector<HTMLInputElement>('input[type="file"]');

        if (input) {
            input.value = '';
        }
    }

    protected guardar(): void {
        if (!this.editando() || this.guardando()) {
            return;
        }

        this.perfilForm.markAllAsTouched();

        if (this.perfilForm.invalid) {
            this.elemento.nativeElement.querySelector<HTMLElement>('input.ng-invalid, textarea.ng-invalid')?.focus();

            return;
        }

        const datos = this.perfilForm.getRawValue();
        const formulario = new FormData();

        formulario.append('nombre', datos.nombre.trim());
        formulario.append('apellido', datos.apellido.trim());
        formulario.append('nombreUsuario', datos.nombreUsuario.trim());
        formulario.append('fechaNacimiento', datos.fechaNacimiento);
        formulario.append('descripcion', datos.descripcion.trim());

        if (datos.imagen) {
            formulario.append('imagen', datos.imagen);
        }

        this.guardando.set(true);

        this.usuariosService.actualizarPerfil(this.usuario().id, formulario)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.guardando.set(false)),
            )
            .subscribe({
                next: usuarioActualizado => {
                    this.liberarVistaPrevia();
                    this.perfilForm.reset();
                    this.editando.set(false);
                    this.guardado.set(true);
                    this.actualizado.emit(usuarioActualizado);
                },
                error: (error: unknown) => this.mostrarError(error),
            });
    }

    private mostrarError(error: unknown): void {
        let mensaje = 'No pudimos guardar los cambios. Conservamos tus datos para que puedas volver a intentarlo.';

        if (error instanceof HttpErrorResponse) {
            const detalle: unknown = error.error?.message;

            if (error.status === 400 || error.status === 409 || error.status === 404) {
                if (typeof detalle === 'string') {
                    mensaje = detalle;
                } else if (Array.isArray(detalle) && detalle.every(item => typeof item === 'string')) {
                    mensaje = detalle.join(' ');
                }
            } else if (error.status === 413) {
                mensaje = 'La imagen es demasiado grande. Elegí un archivo de menos de 5 MiB.';
            } else if (error.status === 502) {
                mensaje = 'No pudimos subir la foto. Tus cambios siguen disponibles para reintentar.';
            }
        }

        this.mensajeModal.set({ tipo: 'error', titulo: 'No se pudo actualizar el perfil', mensaje });
    }

    private liberarVistaPrevia(): void {
        const url = this.vistaPrevia();

        if (url) {
            URL.revokeObjectURL(url);
        }

        this.vistaPrevia.set(null);
    }
}
