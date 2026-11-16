import { AfterViewInit, Component, ElementRef, output, signal, viewChild } from '@angular/core';

import { Registro } from '../../../registro/registro';

@Component({
    selector: 'app-crear-usuario',
    imports: [Registro],
    templateUrl: './crear-usuario.html',
    styleUrl: './crear-usuario.scss',
})
export class CrearUsuario implements AfterViewInit {
    readonly cerrado = output<void>();
    readonly creado = output<void>();

    private readonly dialogo = viewChild<ElementRef<HTMLDialogElement>>('dialogo');

    protected readonly enviando = signal(false);

    ngAfterViewInit(): void {
        this.dialogo()?.nativeElement.showModal();
    }

    protected cerrar(evento?: Event): void {
        evento?.preventDefault();

        if (this.enviando()) {
            return;
        }

        this.dialogo()?.nativeElement.close();
        this.cerrado.emit();
    }

    protected cerrarDesdeFondo(evento: MouseEvent): void {
        if (evento.target === evento.currentTarget) {
            this.cerrar();
        }
    }

    protected completarCreacion(): void {
        this.dialogo()?.nativeElement.close();
        this.creado.emit();
    }
}
