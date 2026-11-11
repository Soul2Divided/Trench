import { AfterViewInit, afterNextRender, Component, DestroyRef, ElementRef, inject, Injector, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';

import { EstadoMeGusta, OrdenPublicaciones, Publicacion } from '../../models/publicacion';
import { PublicacionesService } from '../../services/publicaciones.service';
import { CrearPublicacion } from './components/crear-publicacion/crear-publicacion';
import { Navbar } from '../navbar/navbar';
import { PanelUsuario } from '../panel-usuario/panel-usuario';
import { TarjetaPublicacion } from '../tarjeta-publicacion/tarjeta-publicacion';

@Component({
    imports: [CrearPublicacion, Navbar, PanelUsuario, TarjetaPublicacion],
    selector: 'app-publicaciones',
    styleUrl: './publicaciones.scss',
    templateUrl: './publicaciones.html',
})
export class Publicaciones implements OnInit, AfterViewInit {
    private readonly publicacionesService = inject(PublicacionesService);
    private readonly destroyRef = inject(DestroyRef);
    private readonly injector = inject(Injector);
    private readonly finListado = viewChild<ElementRef<HTMLElement>>('finListado');

    private readonly limite = 5;
    private readonly margenCarga = 200;

    private offset = 0;
    private total = 0;
    private observador: IntersectionObserver | null = null;
    private peticion: Subscription | null = null;

    protected readonly publicaciones = signal<Publicacion[]>([]);
    protected readonly orden = signal<OrdenPublicaciones>('fecha');
    protected readonly cargando = signal(false);
    protected readonly hayMas = signal(true);
    protected readonly errorCarga = signal<string | null>(null);
    protected readonly scrollAutomatico = signal(typeof IntersectionObserver !== 'undefined');

    ngOnInit(): void {
        this.cargarMas();
    }

    ngAfterViewInit(): void {
        const referencia = this.finListado()?.nativeElement;

        if (referencia && typeof IntersectionObserver !== 'undefined') {
            this.observador = new IntersectionObserver(entradas => {
                if (entradas.some(entrada => entrada.isIntersecting)) { // indica si el elemento está dentro de la zona observada.
                    this.cargarMas();
                }
            }, { rootMargin: `${this.margenCarga}px` }); // indica el margen de la zona observada, en este caso 240px por encima y por debajo del viewport.

            this.observador.observe(referencia); // pertenece a IntersectionObserver, le indica al observador qué elemento tiene que vigilar.
        }

        this.destroyRef.onDestroy(() => this.observador?.disconnect());
    }

    protected cargarMas(): void {
        if (this.cargando() || !this.hayMas() || this.errorCarga()) {
            return;
        }

        this.cargando.set(true);

        this.peticion = this.publicacionesService.listar({
            offset: this.offset,
            limit: this.limite,
            orden: this.orden(),
        })
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.cargando.set(false)),
            )
            .subscribe({
                next: pagina => {
                    this.offset += pagina.publicaciones.length;
                    this.total = pagina.total;

                    this.publicaciones.update(actuales => {
                        const ids = new Set(actuales.map(publicacion => publicacion.id));
                        const nuevas = pagina.publicaciones.filter(publicacion => !ids.has(publicacion.id));

                        return [...actuales, ...nuevas];
                    });

                    this.hayMas.set(pagina.publicaciones.length > 0 && this.offset < this.total);
                    this.comprobarFinListado();
                },
                error: () => {
                    this.errorCarga.set('No pudimos cargar las publicaciones. Intentá nuevamente.');
                },
            });
    }

    protected cambiarOrden(evento: Event): void {
        const valor = (evento.target as HTMLSelectElement).value;

        if ((valor !== 'fecha' && valor !== 'meGusta') || valor === this.orden()) {
            return;
        }

        this.orden.set(valor);
        this.reiniciarListado();
    }

    protected reiniciarListado(): void {
        this.peticion?.unsubscribe();
        this.publicaciones.set([]);
        this.offset = 0;
        this.total = 0;
        this.hayMas.set(true);
        this.errorCarga.set(null);
        this.cargarMas();
    }

    protected reintentar(): void {
        this.errorCarga.set(null);
        this.cargarMas();
    }

    protected actualizarMeGusta(estado: EstadoMeGusta & { id: string }): void {
        this.publicaciones.update(actuales => actuales.map(publicacion => {
            if (publicacion.id !== estado.id) {
                return publicacion;
            }

            return { ...publicacion, meGusta: estado.meGusta, meGustaDelUsuario: estado.meGustaDelUsuario };
        }));
    }

    protected actualizarComentarios(estado: { id: string; comentarios: number }): void {
        this.publicaciones.update(actuales => actuales.map(publicacion => {
            return publicacion.id === estado.id ? { ...publicacion, comentarios: estado.comentarios } : publicacion;
        }));
    }

    protected quitarPublicacion(id: string): void {
        if (!this.publicaciones().some(publicacion => publicacion.id === id)) {
            return;
        }

        this.peticion?.unsubscribe();
        this.publicaciones.update(actuales => actuales.filter(publicacion => publicacion.id !== id));
        this.offset = Math.max(0, this.offset - 1);
        this.total = Math.max(0, this.total - 1);
        this.hayMas.set(this.offset < this.total);
        this.comprobarFinListado();
    }

    private comprobarFinListado(): void {
        if (!this.scrollAutomatico()) {
            return;
        }

        afterNextRender(() => {
            if (this.destroyRef.destroyed) {
                return;
            }

            const posicion = this.finListado()?.nativeElement.getBoundingClientRect(); // devuelve su tamaño y posición respecto de la ventana visible del navegador.

            if (posicion && posicion.top <= window.innerHeight + this.margenCarga && posicion.bottom >= 0) {
                this.cargarMas();
            }
        }, { injector: this.injector }); //Es un requisito de Angular para usar afterNextRender desde ese método
    }
}
