// Configuración central de la experiencia.
//
// TODO: el nombre de la experiencia sigue siendo provisional. Cuando la
// autora lo decida, se cambia solo aqui.

// Nombre provisional de la experiencia, centralizado en un único punto.
export const EXPERIENCE_NAME = "The Moon's Blessing";

/** Idiomas disponibles en los datos de lore. */
export type Language = 'en' | 'es';

/**
 * Idioma de la interfaz.
 *
 * TODO: hay una incoherencia sin resolver. La etiqueta de la landing esta en
 * ingles ("The Moon remembers the night you were born") mientras que el resto
 * de la interfaz esta en español ("Tu fase lunar", "Continuar"). Hay que
 * elegir un idioma antes de publicar.
 */
export const LANGUAGE: Language = 'es';
