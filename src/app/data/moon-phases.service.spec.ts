import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LANGUAGE } from '../core/config/experience.config';
import { MoonPhasesService } from './moon-phases.service';
import { MOON_PHASE_IDS } from '../core/services/moon.service';
import { assetUrl } from './asset-url';

describe('MoonPhasesService', () => {
  let http: HttpTestingController;

  /** El servicio se construye bajo demanda: su URL se resuelve al crearse. */
  const getService = () => TestBed.inject(MoonPhasesService);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const flushLore = () =>
    http.expectOne((r) => r.url.endsWith('data/moon/moon-phases.json')).flush({
      phases: [
        { id: 'new-moon', name: { en: 'New Moon', es: 'Luna Nueva' }, narrative: null, ceremonyNote: null },
        { id: 'full-moon', name: { en: 'Full Moon', es: 'Luna Llena' }, narrative: null, ceremonyNote: null },
      ],
    });

  describe('resolucion del asset', () => {
    it('incluye el subpath cuando el proyecto vive en un subdirectorio', () => {
      // En GitHub Pages el proyecto queda bajo /<repositorio>/. Una ruta
      // absoluta como '/data/...' resolveria contra la raiz del dominio y
      // devolveria 404. Comprobado en el sitio real:
      //   /TheMoonsBlessing/data/... -> 200
      //   /data/...                  -> 404
      const base = document.createElement('base');
      base.setAttribute('href', '/TheMoonsBlessing/');
      document.head.appendChild(base);
      try {
        getService().phases();
        const expected = new URL('data/moon/moon-phases.json', document.baseURI).toString();
        expect(expected).toContain('/TheMoonsBlessing/data/moon/moon-phases.json');
        http.expectOne(expected).flush({ phases: [] });
      } finally {
        base.remove();
      }
    });

    it('usa assetUrl y no una ruta absoluta', () => {
      getService().phases();
      const req = http.expectOne((r) => r.url.endsWith('data/moon/moon-phases.json'));
      expect(req.request.url).toBe(assetUrl('data/moon/moon-phases.json'));
      req.flush({ phases: [] });
    });
  });

  describe('nombres de las fases', () => {
    it('vienen del archivo de datos, en el idioma configurado', () => {
      expect(LANGUAGE).toBe('es');
      const service = getService();
      service.phases();
      flushLore();

      expect(service.labelFor('new-moon')).toBe('Luna Nueva');
      expect(service.labelFor('full-moon')).toBe('Luna Llena');
    });

    it('devuelven null si el archivo no define esa fase', () => {
      const service = getService();
      service.phases();
      flushLore();

      expect(service.labelFor('last-quarter')).toBeNull();
      expect(service.narrativeFor('new-moon')).toBeNull();
    });

    it('respeta el orden del archivo', () => {
      const service = getService();
      service.phases();
      flushLore();

      expect(service.phases().map((p) => p.id)).toEqual(['new-moon', 'full-moon']);
    });

    it('no acepta fases que el algoritmo no conoce', () => {
      const service = getService();
      service.phases();
      flushLore();

      for (const phase of service.phases()) {
        expect(MOON_PHASE_IDS).toContain(phase.id);
      }
    });
  });
});

describe('assetUrl', () => {
  it('resuelve contra el base href del documento', () => {
    expect(assetUrl('data/x.json')).toBe(new URL('data/x.json', document.baseURI).toString());
  });

  it('rechaza rutas absolutas', () => {
    expect(() => assetUrl('/data/x.json')).toThrow(/ruta relativa/);
  });
});
