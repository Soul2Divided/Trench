import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AutenticacionService } from '../../services/autenticacion.service';
import { errorFormulario, passwordValida } from '../../validators/auth.validators';
import { MensajeModal, Modal } from '../modal/modal';
import { Registro } from '../registro/registro';

@Component({
    imports: [ReactiveFormsModule, RouterLink, Registro, Modal],
    selector: 'app-login',
    styleUrl: './login.scss',
    templateUrl: './login.html',
})
export class Login {
    private readonly formularios = inject(NonNullableFormBuilder);
    private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
    private readonly autenticacion = inject(AutenticacionService);
    private readonly router = inject(Router);

    protected readonly enviando = signal(false);
    protected readonly intentandoEnviar = signal(false);
    protected readonly modo = signal<'login' | 'registro'>('login');
    protected readonly mensajeModal = signal<MensajeModal | null>(null);

    protected readonly loginForm = this.formularios.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, passwordValida]],
    });

    protected mensajeError(control: AbstractControl): string {
        return errorFormulario(control, control === this.loginForm.controls.email
            ? 'Ingresá tu correo electrónico.'
            : 'Ingresá tu contraseña.');
    }

    protected cambiarModo(modo: 'login' | 'registro'): void {
        if (this.modo() === modo || this.enviando()) {
            return;
        }

        this.modo.set(modo);
        this.loginForm.reset();
        this.intentandoEnviar.set(false);
    }

    protected normalizarEmail(): void {
        const email = this.loginForm.controls.email;

        email.setValue(email.value.trim().toLowerCase());
    }

    protected async enviarLogin(): Promise<void> {
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

        try {
            await this.autenticacion.login(datos.email, datos.password);

            this.loginForm.controls.password.reset();
            await this.router.navigate(['/publicaciones']);
        } catch (error: unknown) {
            this.mostrarErrorLogin(error);
        } finally {
            this.enviando.set(false);
        }
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
