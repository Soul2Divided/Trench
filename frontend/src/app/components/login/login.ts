import { Component, ElementRef, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

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
        if (this.modo() === modo) {
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

    protected enviarLogin(): void {
        this.normalizarEmail();
        this.loginForm.markAllAsTouched();

        if (this.loginForm.invalid) {
            this.intentandoEnviar.set(true);
            this.elemento.nativeElement.querySelector<HTMLInputElement>('input.ng-invalid')?.focus();

            return;
        }

        this.mensajeModal.set({
            tipo: 'info',
            titulo: 'El acceso todavía no está disponible',
            mensaje: 'Los datos tienen un formato válido. El inicio de sesión estará disponible cuando se conecte el servicio de autenticación.',
        });
    }
}
