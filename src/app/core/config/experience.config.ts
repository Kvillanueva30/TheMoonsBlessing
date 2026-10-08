// Configuración central de la experiencia.
//
// Aqui vive el copy de marca: el nombre y la frase principal. No van en los
// componentes porque asi no se duplican, ni en data/ porque son branding y no
// lore, y asi el heroe se ve sin esperar a la red.

// Nombre provisional de la experiencia, centralizado en un único punto.
export const EXPERIENCE_NAME = 'La bendición de la Diosa Luna';

/**
 * Frase principal del landing.
 *
 * Acompaña al título: "La bendición de la Diosa Luna / Descubre tu lugar en Madar,
 * bajo la mirada de la Diosa." Así ambas líneas se leen como una sola frase.
 */
export const EXPERIENCE_TAGLINE = 'Descubre tu lugar en Madar, bajo la mirada de la Diosa.';

/** Texto del boton que entra en la experiencia. */
export const CTA_LABEL = 'Descubre tu verdad';

/** Idiomas disponibles en los datos de lore. */
export type Language = 'en' | 'es';

/**
 * Idioma de la interfaz.
 *
 * TODO: el titulo de la novela y el nombre de la experiencia estan en ingles,
 * mientras que el boton y los metadatos estan en español. Hay que elegir un
 * idioma antes de publicar.
 */
export const LANGUAGE: Language = 'es';
