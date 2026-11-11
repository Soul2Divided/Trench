import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';

import { AutenticacionService } from './services/autenticacion.service';
import { Loader } from './components/loader/loader';
import { MensajeModal, Modal } from './components/modal/modal';

@Component({
    imports: [RouterOutlet, Loader, Modal],
    selector: 'app-root',
    styleUrl: './app.scss',
    templateUrl: './app.html',
})
export class App {
    protected readonly autenticacion = inject(AutenticacionService);
    private readonly destroyRef = inject(DestroyRef);

    protected readonly renovando = signal(false);
    protected readonly errorRenovacion = signal(false);

    protected readonly mensajeSesion: MensajeModal = {
        tipo: 'info',
        titulo: 'Tu sesión está por vencer',
        mensaje: '¿Querés extender la sesión para seguir en Trench?',
        textoBoton: 'Cerrar sesión',
        textoConfirmar: 'Extender sesión',
        textoProcesando: 'Renovando…',
    };

    protected readonly mensajeError: MensajeModal = {
        ...this.mensajeSesion,
        tipo: 'error',
        titulo: 'No pudimos extender la sesión',
        mensaje: 'Intentá nuevamente antes de que venza tu sesión.',
        textoConfirmar: 'Reintentar',
    };

    constructor() {
        this.autenticacion.validarSesion()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();

        effect(() => {
            if (!this.autenticacion.mostrarAviso()) {
                this.errorRenovacion.set(false);
            }
        });
    }

    protected extenderSesion(): void {
        if (this.renovando()) {
            return;
        }

        this.renovando.set(true);
        this.errorRenovacion.set(false);

        this.autenticacion.refrescar().pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.renovando.set(false)),
        ).subscribe({
            error: () => this.errorRenovacion.set(true),
        });
    }
}
