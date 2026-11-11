import { DatePipe } from '@angular/common';
import { AfterViewInit, Component, ElementRef, input, output, viewChild } from '@angular/core';

import { Publicacion } from '../../models/publicacion';
import { ComentariosPublicacion } from '../comentarios-publicacion/comentarios-publicacion';

@Component({
    selector: 'app-modal-publicacion',
    imports: [DatePipe, ComentariosPublicacion],
    templateUrl: './modal-publicacion.html',
    styleUrl: './modal-publicacion.scss',
})
export class ModalPublicacion implements AfterViewInit {
    readonly publicacion = input.required<Publicacion>();
    readonly cerrado = output<void>();
    readonly comentariosActualizados = output<number>();

    private readonly dialogo = viewChild<ElementRef<HTMLDialogElement>>('dialogo');

    ngAfterViewInit(): void {
        this.dialogo()?.nativeElement.showModal();
    }

    protected cerrar(evento?: Event): void {
        evento?.preventDefault();
        this.dialogo()?.nativeElement.close();
        this.cerrado.emit();
    }

    protected cerrarDesdeFondo(evento: MouseEvent): void {
        if (evento.target === evento.currentTarget) {
            this.cerrar();
        }
    }
}
