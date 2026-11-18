import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { Role } from '../models/api.models';
import { AuthService } from '../services/auth.service';

/**
 * Structural directive — renders content only when the signed-in user has one of the given roles.
 *
 * ```html
 * <button *hasRole="'SUPER_ADMIN'">Admin only</button>
 * <button *hasRole="ELEVATED_ROLES">Admin or manager</button>
 * <div *hasRole="['SUPER_ADMIN', 'MANAGER', 'STAFF']">Everyone</div>
 * ```
 */
@Directive({ selector: '[hasRole]', standalone: true })
export class HasRoleDirective {
  private readonly auth = inject(AuthService);
  private readonly tpl = inject(TemplateRef<unknown>);
  private readonly vcr = inject(ViewContainerRef);

  readonly roles = input<Role | readonly Role[]>([], { alias: 'hasRole' });
  private embeddedRef: unknown = null;

  constructor() {
    effect(() => {
      const allowed = this.normalize(this.roles());
      const granted = this.auth.hasRole(...allowed);
      this.render(granted);
    });
  }

  private normalize(value: Role | readonly Role[]): Role[] {
    return Array.isArray(value) ? [...value] : [value as Role];
  }

  private render(granted: boolean): void {
    if (granted && !this.embeddedRef) {
      this.embeddedRef = this.vcr.createEmbeddedView(this.tpl);
    } else if (!granted && this.embeddedRef) {
      this.vcr.clear();
      this.embeddedRef = null;
    }
  }
}
