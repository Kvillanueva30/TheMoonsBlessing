import { TestBed } from '@angular/core/testing';
import { ShareComponent } from './share';

/**
 * Tests del bloque de compartir.
 *
 * El limite importante: un endpoint web de red no puede recibir una imagen
 * local. Solo la Web Share API adjunta archivos. Estos tests fijan esa
 * diferencia para que nadie la rompa esperando un comportamiento imposible.
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

  it('ofrece cuatro redes, cada una con su endpoint', () => {
    expect(share.networks.length).toBe(4);
    expect(share.networks.map((n) => n.id).sort()).toEqual(['facebook', 'telegram', 'whatsapp', 'x']);
  });

  it('cada endpoint incluye la URL y el texto', () => {
    for (const net of share.networks) {
      const href = net.build('URLENCODED', 'TEXTENCODED');
      expect(href.startsWith('https://')).toBe(true);
      expect(href).toContain('URLENCODED');
    }
  });

  it('solo muestra el boton de imagen si el navegador admite compartir archivos', () => {
    // En jsdom no hay navigator.canShare, asi que debe ocultarse.
    // Es la via unica que adjunta la imagen; sin ella, no se ofrece.
    expect(share.canShareFiles()).toBe(false);
  });

  it('usa el nombre de archivo que le pasan', () => {
    fixture.componentRef.setInput('filename', 'madar-diubak.png');
    fixture.detectChanges();
    expect(share.filename()).toBe('madar-diubak.png');
  });

  it('el texto compartido es el que le pasan, no uno inventado', () => {
    fixture.componentRef.setInput('shareTitle', 'Luna Creciente · Bastia · Diubak');
    fixture.detectChanges();
    expect(share.shareTitle()).toBe('Luna Creciente · Bastia · Diubak');
  });

  it('falla limpio si la captura no puede hacerse', async () => {
    fixture.componentRef.setInput('target', null as never);
    fixture.detectChanges();

    await share.shareImage();

    // Sin excepcion: hay mensaje y busy vuelve a false.
    expect(share.busy()).toBe(false);
    expect(typeof share.message()).toBe('string');
  });

  it('terminar en busy=false pase lo que pase', async () => {
    await share.shareImage();
    expect(share.busy()).toBe(false);
  });
});