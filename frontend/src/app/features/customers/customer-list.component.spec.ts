import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { CustomerListComponent } from './customer-list.component';
import { CatalogService } from '../../core/services/catalog.service';
import { of } from 'rxjs';

describe('CustomerListComponent save', () => {
  let createSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    createSpy = vi.fn(() => of({ _id: 'c1', customerNumber: 'CUS-1' }));
    await TestBed.configureTestingModule({
      imports: [CustomerListComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideRouter([]),
        {
          provide: CatalogService,
          useValue: {
            listCustomers: () => of([]),
            createCustomer: createSpy,
            updateCustomer: vi.fn(() => of({})),
            setCustomerStatus: vi.fn(() => of({})),
            deleteCustomer: vi.fn(() => of({})),
          },
        },
      ],
    }).compileComponents();
  });

  it('enables Save when required fields are filled and calls createCustomer', async () => {
    const fixture = TestBed.createComponent(CustomerListComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    fixture.componentInstance.openCreate();
    fixture.detectChanges();
    await fixture.whenStable();

    const root: HTMLElement = fixture.nativeElement;
    const form = root.querySelector<HTMLFormElement>('form')!;
    const firstName = root.querySelector<HTMLInputElement>('input[name="firstName"]')!;
    const lastName = root.querySelector<HTMLInputElement>('input[name="lastName"]')!;
    const saveBtn = root.querySelector<HTMLButtonElement>('button[type="submit"]')!;

    expect(saveBtn).toBeTruthy();
    expect(form).toBeTruthy();

    // Zoneless: flush CD until NgForm marks empty required fields invalid.
    for (let i = 0; i < 5 && !saveBtn.disabled; i++) {
      fixture.detectChanges();
      await fixture.whenStable();
    }
    expect(saveBtn.disabled).toBe(true);

    firstName.value = 'John';
    firstName.dispatchEvent(new Event('input', { bubbles: true }));
    firstName.dispatchEvent(new Event('change', { bubbles: true }));
    lastName.value = 'Doe';
    lastName.dispatchEvent(new Event('input', { bubbles: true }));
    lastName.dispatchEvent(new Event('change', { bubbles: true }));

    for (let i = 0; i < 5 && saveBtn.disabled; i++) {
      fixture.detectChanges();
      await fixture.whenStable();
    }
    expect(saveBtn.disabled).toBe(false);

    saveBtn.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(createSpy).toHaveBeenCalledTimes(1);
    const payload = createSpy.mock.calls[0][0];
    expect(payload.firstName).toBe('John');
    expect(payload.lastName).toBe('Doe');
  });
});
