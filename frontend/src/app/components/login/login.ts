import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, switchMap } from 'rxjs';

import { AutenticacionService } from '../../services/autenticacion.service';
import { errorFormulario, passwordValida, patronCorreo } from '../../validators/auth.validators';
import { MensajeModal, Modal } from '../modal/modal';
import { Registro } from '../registro/registro';
import { Loader } from '../loader/loader';

@Component({
    imports: [ReactiveFormsModule, Registro, Modal, Loader],
    selector: 'app-login',
    styleUrl: './login.scss',
    templateUrl: './login.html',
})
export class Login {
    private readonly formularios = inject(NonNullableFormBuilder);
    private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly autenticacion = inject(AutenticacionService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    protected readonly enviando = signal(false);
    protected readonly registrando = signal(false);
    protected readonly cuentaCreada = signal(false);
    protected readonly intentandoEnviar = signal(false);
    protected readonly modo = signal<'login' | 'registro'>('login');
    protected readonly mensajeModal = signal<MensajeModal | null>(null);

    protected readonly loginForm = this.formularios.group({
        email: ['', [Validators.required, Validators.email, Validators.pattern(patronCorreo)]],
        password: ['', [Validators.required, passwordValida]],
    });

    protected mensajeError(control: AbstractControl): string {
        return errorFormulario(control, control === this.loginForm.controls.email
            ? 'Ingresá tu correo electrónico.'
            : 'Ingresá tu contraseña.');
    }

    protected cambiarModo(modo: 'login' | 'registro'): void {
        if (this.modo() === modo || this.enviando() || this.registrando()) {
            return;
        }

        this.modo.set(modo);
        this.loginForm.reset();
        this.intentandoEnviar.set(false);
        this.cuentaCreada.set(false);
    }

    protected completarRegistro(correo: string): void {
        this.cambiarModo('login');
        this.loginForm.controls.email.setValue(correo);
        this.cuentaCreada.set(true);
    }

    protected normalizarEmail(): void {
        const email = this.loginForm.controls.email;

        email.setValue(email.value.trim().toLowerCase());
    }

    protected enviarLogin(): void {
        if (this.enviando()) {
            return;
        }

        this.normalizarEmail();
        this.loginForm.markAllAsTouched();

        if (this.loginForm.invalid) {
            this.intentandoEnviar.set(true);
            this.elemento.nativeElement.querySelector<HTMLInputElement>('input.ng-invalid')?.focus();

            return;
        }

        const datos = this.loginForm.getRawValue();

        this.enviando.set(true);
        this.mensajeModal.set(null);

        this.autenticacion.login(datos.email, datos.password)
            .pipe(
                switchMap(() => {
                    this.loginForm.controls.password.reset();

                    return this.router.navigate(['/publicaciones']);
                }),
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.enviando.set(false)),
            )
            .subscribe({
                error: (error: unknown) => this.mostrarErrorLogin(error),
            });
    }

    private mostrarErrorLogin(error: unknown): void {
        let mensaje = 'No pudimos iniciar sesión. Intentá nuevamente.';

        if (error instanceof HttpErrorResponse) {
            if (error.status === 0) {
                mensaje = 'No pudimos conectar con el servidor. Revisá que el backend esté iniciado y que tengas conexión.';
            } else if (error.status === 401) {
                mensaje = 'El correo o la contraseña son incorrectos.';
            } else if (error.status === 400) {
                mensaje = 'Los datos enviados no son válidos. Revisá el correo y la contraseña.';
            }
        }

        this.mensajeModal.set({
            tipo: 'error',
            titulo: 'No se pudo iniciar sesión',
            mensaje,
        });
    }
}
