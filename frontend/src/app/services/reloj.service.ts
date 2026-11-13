import { Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, timer } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RelojService {
    readonly ahora = toSignal(timer(0, 60000).pipe(map(() => Date.now())), {
        initialValue: Date.now(),
    });
}
