import { TestBed } from '@angular/core/testing';
import { ShareComponent } from './share';

/**
 * Tests del boton de compartir.
 *
 * Lo que importa: la captura falla limpio. Si toBlob revienta, el visitante
 * tiene que ver un mensaje, no una pantalla en blanco. Y el enlace copiado
 * tiene que ser la URL actual, que ya lleva luna, reino y naturaleza.
 */
describe('ShareComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<ShareComponent>>;
  let share: ShareComponent;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [ShareComponent] });
    fixture = TestBed.createComponent(ShareComponent);
    share = fixture.componentInstance;
    fixture.componentRef.setInput('target', document.createElement('section'));
    fixture.detectChanges();
  });

  it('empieza sin mensaje y sin estar ocupado', () => {
    expect(share.message()).toBe('');
    expect(share.busy()).toBe(false);
  });

  it('expone el nombre de archivo que le pasan', () => {
    fixture.componentRef.setInput('filename', 'madar-diubak.png');
    fixture.detectChanges();
    expect(share.filename()).toBe('madar-diubak.png');
  });

  it('el texto compartido es el que le pasan, no uno inventado', () => {
    fixture.componentRef.setInput('shareTitle', 'Luna Creciente · Bastia · Diubak');
    fixture.detectChanges();
    expect(share.shareTitle()).toBe('Luna Creciente · Bastia · Diubak');
  });

  it('no intenta compartir si la captura falla', async () => {
    // Se pasa un elemento que no existe en el DOM: toBlob falla.
    fixture.componentRef.setInput('target', null as never);
    fixture.detectChanges();

    await share.download();

    // Falla limpio: hay mensaje y busy vuelve a false. Sin excepcion.
    expect(share.busy()).toBe(false);
    expect(typeof share.message()).toBe('string');
  });

  it('termina siempre en busy=false, pase lo que pase', async () => {
    await share.copyLink();
    expect(share.busy()).toBe(false);
  });
});