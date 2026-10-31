import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
    selector: 'app-panel-usuario',
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './panel-usuario.html',
    styleUrl: './panel-usuario.scss',
})
export class PanelUsuario {}
