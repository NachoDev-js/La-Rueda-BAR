import { TestBed } from '@angular/core/testing';

import { Comanda } from './comanda';

describe('Comanda', () => {
  let service: Comanda;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Comanda);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
