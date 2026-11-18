import { AfterViewInit, Component, DestroyRef, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { finalize } from 'rxjs';

import {
    ComentariosPorPublicacion,
    PublicacionesPorUsuario,
    ResumenComentariosPorFecha,
} from '../../models/estadisticas';
import { PublicacionesService } from '../../services/publicaciones.service';
import { Navbar } from '../navbar/navbar';
import { PanelUsuario } from '../panel-usuario/panel-usuario';

Chart.register(...registerables);

type TipoGrafico = 'publicaciones' | 'comentarios-fecha' | 'comentarios-publicacion';

interface ColoresGraficos {
    fondo: string;
    tinta: string;
    principal: string;
    acento: string;
    porciones: string[];
}

function fechaParaInput(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
}

function obtenerPeriodoInicial() {
    const hasta = new Date();
    const desde = new Date(hasta);

    desde.setDate(desde.getDate() - 29);

    return {
        desde: fechaParaInput(desde),
        hasta: fechaParaInput(hasta),
    };
}

@Component({
    selector: 'app-estadisticas',
    imports: [Navbar, PanelUsuario, ReactiveFormsModule],
    templateUrl: './estadisticas.html',
    styleUrl: './estadisticas.scss',
})
export class Estadisticas implements AfterViewInit, OnDestroy {
    @ViewChild('grafico') private readonly lienzo!: ElementRef<HTMLCanvasElement>;

    private readonly formularios = inject(NonNullableFormBuilder);
    private readonly publicacionesService = inject(PublicacionesService);
    private readonly destroyRef = inject(DestroyRef);

    private grafico: Chart | null = null;

    protected readonly cargando = signal(false);
    protected readonly errorCarga = signal<string | null>(null);
    protected readonly graficoActivo = signal<TipoGrafico>('publicaciones');
    protected readonly sinDatos = signal(false);
    protected readonly totalComentarios = signal(0);

    protected readonly periodoForm = this.formularios.group({
        desde: new FormControl(obtenerPeriodoInicial().desde, {
            nonNullable: true,
            validators: Validators.required,
        }),
        hasta: new FormControl(obtenerPeriodoInicial().hasta, {
            nonNullable: true,
            validators: Validators.required,
        }),
    });

    ngAfterViewInit(): void {
        this.cargarEstadisticas();
    }

    ngOnDestroy(): void {
        this.grafico?.destroy();
    }

    protected seleccionarGrafico(tipo: TipoGrafico): void {
        if (this.cargando() || this.graficoActivo() === tipo) {
            return;
        }

        this.graficoActivo.set(tipo);
        this.cargarEstadisticas();
    }

    protected consultar(): void {
        if (this.cargando()) {
            return;
        }

        this.periodoForm.markAllAsTouched();

        if (this.periodoForm.invalid) {
            return;
        }

        const { desde, hasta } = this.periodoForm.getRawValue();

        if (desde > hasta) {
            this.errorCarga.set('La fecha desde no puede ser posterior a la fecha hasta.');

            return;
        }

        this.cargarEstadisticas();
    }

    private cargarEstadisticas(): void {
        const periodo = this.periodoForm.getRawValue();

        this.cargando.set(true);
        this.errorCarga.set(null);
        this.sinDatos.set(false);

        switch (this.graficoActivo()) {
            case 'publicaciones':
                this.cargarPublicacionesPorUsuario(periodo);
                break;
            case 'comentarios-fecha':
                this.cargarComentariosPorFecha(periodo);
                break;
            case 'comentarios-publicacion':
                this.cargarComentariosPorPublicacion(periodo);
                break;
        }
    }

    private cargarPublicacionesPorUsuario(periodo: { desde: string; hasta: string }): void {
        this.publicacionesService.obtenerPublicacionesPorUsuario(periodo)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.cargando.set(false)),
            )
            .subscribe({
                next: publicaciones => {
                    this.sinDatos.set(publicaciones.length === 0);
                    this.dibujarPublicacionesPorUsuario(publicaciones, this.obtenerColores());
                },
                error: () => this.mostrarError(),
            });
    }

    private cargarComentariosPorFecha(periodo: { desde: string; hasta: string }): void {
        this.publicacionesService.obtenerComentariosPorFecha(periodo)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.cargando.set(false)),
            )
            .subscribe({
                next: comentarios => {
                    this.totalComentarios.set(comentarios.total);
                    this.sinDatos.set(comentarios.total === 0);
                    this.dibujarComentariosPorFecha(comentarios, this.obtenerColores());
                },
                error: () => this.mostrarError(),
            });
    }

    private cargarComentariosPorPublicacion(periodo: { desde: string; hasta: string }): void {
        this.publicacionesService.obtenerComentariosPorPublicacion(periodo)
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.cargando.set(false)),
            )
            .subscribe({
                next: publicaciones => {
                    const publicacionesConComentarios = publicaciones.filter(publicacion => publicacion.cantidad > 0);

                    this.sinDatos.set(publicacionesConComentarios.length === 0);
                    this.dibujarComentariosPorPublicacion(publicacionesConComentarios, this.obtenerColores());
                },
                error: () => this.mostrarError(),
            });
    }

    private dibujarPublicacionesPorUsuario(publicaciones: PublicacionesPorUsuario[], colores: ColoresGraficos): void {
        this.destruirGraficoActual();

        this.grafico = new Chart(this.lienzo.nativeElement, {
            type: 'bar',
            data: {
                labels: publicaciones.map(usuario => `@${usuario.nombreUsuario}`),
                datasets: [{
                    label: 'Publicaciones',
                    data: publicaciones.map(usuario => usuario.cantidad),
                    backgroundColor: colores.principal,
                    borderColor: colores.tinta,
                    borderWidth: 1.5,
                    borderRadius: 6,
                }],
            },
            options: this.opcionesBarras(colores),
        });
    }

    private dibujarComentariosPorFecha(comentarios: ResumenComentariosPorFecha, colores: ColoresGraficos): void {
        this.destruirGraficoActual();

        this.grafico = new Chart(this.lienzo.nativeElement, {
            type: 'line',
            data: {
                labels: comentarios.comentarios.map(comentario => this.formatearFecha(comentario.fecha)),
                datasets: [{
                    label: 'Comentarios',
                    data: comentarios.comentarios.map(comentario => comentario.cantidad),
                    borderColor: colores.acento,
                    backgroundColor: colores.acento,
                    pointBackgroundColor: colores.acento,
                    pointBorderColor: colores.tinta,
                    pointBorderWidth: 1.5,
                    pointRadius: 4,
                    tension: 0.25,
                    fill: false,
                }],
            },
            options: this.opcionesLineas(colores),
        });
    }

    private dibujarComentariosPorPublicacion(publicaciones: ComentariosPorPublicacion[], colores: ColoresGraficos): void {
        this.destruirGraficoActual();

        this.grafico = new Chart(this.lienzo.nativeElement, {
            type: 'doughnut',
            data: {
                labels: publicaciones.map(publicacion => publicacion.titulo),
                datasets: [{
                    label: 'Comentarios',
                    data: publicaciones.map(publicacion => publicacion.cantidad),
                    backgroundColor: publicaciones.map((_, indice) => colores.porciones[indice % colores.porciones.length]),
                    borderColor: colores.fondo,
                    borderWidth: 3,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: colores.tinta,
                            font: { family: 'Epilogue', weight: 600 },
                            padding: 16,
                            usePointStyle: true,
                        },
                    },
                    tooltip: {
                        callbacks: {
                            label: contexto => `${contexto.label}: ${contexto.parsed} comentario${contexto.parsed === 1 ? '' : 's'}`,
                        },
                    },
                },
            },
        });
    }

    private destruirGraficoActual(): void {
        this.grafico?.destroy();
        this.grafico = null;
    }

    private mostrarError(): void {
        this.errorCarga.set('No se pudieron cargar las estadísticas. Intentá nuevamente.');
    }

    private opcionesBarras(colores: ColoresGraficos): ChartConfiguration<'bar'>['options'] {
        return {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: { color: colores.tinta, font: { family: 'Epilogue', weight: 600 } },
                    grid: { display: false },
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: colores.tinta, precision: 0, font: { family: 'Epilogue' } },
                    grid: { color: this.conOpacidad(colores.tinta, 0.16) },
                },
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: contexto => `${contexto.parsed.y} publicación${contexto.parsed.y === 1 ? '' : 'es'}`,
                    },
                },
            },
        };
    }

    private opcionesLineas(colores: ColoresGraficos): ChartConfiguration<'line'>['options'] {
        return {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: {
                        color: colores.tinta,
                        font: { family: 'Epilogue', weight: 600 },
                        maxRotation: 45,
                        minRotation: 45,
                    },
                    grid: { display: false },
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: colores.tinta, precision: 0, font: { family: 'Epilogue' } },
                    grid: { color: this.conOpacidad(colores.tinta, 0.16) },
                },
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: contexto => `${contexto.parsed.y} comentario${contexto.parsed.y === 1 ? '' : 's'}`,
                    },
                },
            },
        };
    }

    private obtenerColores(): ColoresGraficos {
        const estilos = getComputedStyle(document.documentElement);
        const color = (nombre: string) => estilos.getPropertyValue(nombre).trim();

        return {
            fondo: color('--color-surface'),
            tinta: color('--color-ink'),
            principal: color('--color-primary'),
            acento: color('--color-accent'),
            porciones: [
                color('--color-chart-1'),
                color('--color-chart-2'),
                color('--color-chart-3'),
                color('--color-chart-4'),
                color('--color-chart-5'),
                color('--color-chart-6'),
                color('--color-chart-7'),
            ],
        };
    }

    private formatearFecha(fecha: string): string {
        return new Intl.DateTimeFormat('es-AR', {
            day: '2-digit',
            month: '2-digit',
        }).format(new Date(`${fecha}T00:00:00`));
    }

    private conOpacidad(color: string, opacidad: number): string {
        const hexadecimal = color.replace('#', '');
        const rojo = Number.parseInt(hexadecimal.slice(0, 2), 16);
        const verde = Number.parseInt(hexadecimal.slice(2, 4), 16);
        const azul = Number.parseInt(hexadecimal.slice(4, 6), 16);

        return `rgb(${rojo} ${verde} ${azul} / ${opacidad})`;
    }
}
