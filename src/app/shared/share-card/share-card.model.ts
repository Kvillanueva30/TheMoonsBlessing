// Datos que la tarjeta de compartir necesita. Los calcula result.ts a partir
// de lo que YA esta en pantalla. No inventa nada del lore.
export interface ShareCardData {
  readonly natureLabel: string;
  readonly natureMeaning: string;
  readonly kingdomName: string | null;
  readonly founderName: string | null;
  readonly moonLabel: string | null;
  readonly reason: string;
  readonly url: string;
}