import { Component, DestroyRef, ElementRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { Publicacion } from '../../../../models/publicacion';
import { AutenticacionService } from '../../../../services/autenticacion.service';
import { PublicacionesService } from '../../../../services/publicaciones.service';
import { errorFormulario, imagenPerfilValida, textoObligatorio } from '../../../../validators/auth.validators';
import { MensajeModal, Modal } from '../../../modal/modal';

@Component({
    selector: 'app-crear-publicacion',
    imports: [ReactiveFormsModule, Modal],
    templateUrl: './crear-publicacion.html',
    styleUrl: './crear-publicacion.scss',
})
export class CrearPublicacion {
    readonly publicada = output<Publicacion>();

    private readonly formularios = inject(NonNullableFormBuilder);
    private readonly autenticacion = inject(AutenticacionService);
    private readonly publicacionesService = inject(PublicacionesService);
    private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly destroyRef = inject(DestroyRef);

    protected readonly usuario = this.autenticacion.usuarioActual;
    protected readonly enviando = signal(false);
    protected readonly vistaPrevia = signal<string | null>(null);
    protected readonly mensajeModal = signal<MensajeModal | null>(null);

    protected readonly publicacionForm = this.formularios.group({
        titulo: ['', textoObligatorio],
        mensaje: ['', textoObligatorio],
        imagen: this.formularios.control<File | null>(null, imagenPerfilValida),
    });

    constructor() {
        this.destroyRef.onDestroy(() => this.liberarVistaPrevia());
    }

    protected mensajeError(control: AbstractControl, obligatorio: string): string {
        return errorFormulario(control, obligatorio);
    }

    protected seleccionarImagen(evento: Event): void {
        const input = evento.target as HTMLInputElement;
        const imagen = this.publicacionForm.controls.imagen;

        this.liberarVistaPrevia();
        imagen.setValue(input.files?.item(0) ?? null);
        imagen.markAsTouched();

        if (imagen.valid && imagen.value) {
            this.vistaPrevia.set(URL.createObjectURL(imagen.value));
        }
    }

    protected quitarImagen(): void {
        this.liberarVistaPrevia();
        this.publicacionForm.controls.imagen.reset();

        const input = this.elemento.nativeElement.querySelector<HTMLInputElement>('input[type="file"]');

        if (input) {
            input.value = '';
        }
    }

    protected publicar(): void {
        if (this.enviando() || !this.usuario()) {
            return;
        }

        this.publicacionForm.markAllAsTouched();

        if (this.publicacionForm.invalid) {
            this.elemento.nativeElement.querySelector<HTMLElement>('input.ng-invalid, textarea.ng-invalid')?.focus();

            return;
        }

        const datos = this.publicacionForm.getRawValue();
        const formulario = new FormData();

        formulario.append('titulo', datos.titulo.trim());
        formulario.append('mensaje', datos.mensaje.trim());

        if (datos.imagen) {
            formulario.append('imagen', datos.imagen);
        }

        this.enviando.set(true);

        this.publicacionesService.crear(formulario)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.enviando.set(false)),
            )
            .subscribe({
                next: publicacion => {
                    this.publicacionForm.reset();
                    this.quitarImagen();
                    this.publicada.emit(publicacion);
                    this.mensajeModal.set({
                        tipo: 'success',
                        titulo: 'Publicación creada',
                        mensaje: 'Tu publicación ya está disponible.',
                    });
                },
                error: () => {
                    this.mensajeModal.set({
                        tipo: 'error',
                        titulo: 'No se pudo publicar',
                        mensaje: 'Conservamos lo que escribiste para que puedas volver a intentarlo.',
                    });
                },
            });
    }

    private liberarVistaPrevia(): void {
        const url = this.vistaPrevia();

        if (url) {
            URL.revokeObjectURL(url);
        }

        this.vistaPrevia.set(null);
    }
}
