import { Directive, ElementRef, inject } from '@angular/core';
import { FormGroupDirective } from '@angular/forms';

@Directive({
    selector: 'form[formGroup][appEnfocarPrimerError]',
    host: {
        '(submit)': 'enfocarPrimerError()',
    },
})
export class EnfocarPrimerErrorDirective {
    private readonly elemento = inject<ElementRef<HTMLFormElement>>(ElementRef);
    private readonly formulario = inject(FormGroupDirective, { self: true });

    protected enfocarPrimerError(): void {
        if (!this.formulario.form.invalid) {
            return;
        }

        this.formulario.form.markAllAsTouched();

        const campos = this.elemento.nativeElement.querySelectorAll<HTMLElement>(
            'input.ng-invalid:not([disabled]):not([type="hidden"]), '
            + 'select.ng-invalid:not([disabled]), textarea.ng-invalid:not([disabled])',
        );

        for (const campo of campos) {
            if (campo.getClientRects().length > 0) {
                campo.focus();

                return;
            }
        }
    }
}
