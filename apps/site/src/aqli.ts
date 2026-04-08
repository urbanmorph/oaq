// AQLI (Air Quality Life Index) — Greenstone & Fan, U Chicago EPIC.
// Based on Ebenstein et al. 2017 PNAS "New evidence on the impact of sustained
// exposure to air pollution on life expectancy from China's Huai River Policy"
// (https://doi.org/10.1073/pnas.1616784114), Chen et al. 2013 PNAS
// (https://doi.org/10.1073/pnas.1300018110), and WHO Global Air Quality
// Guidelines 2021 (5 µg/m³ annual PM2.5 baseline).
//
// Relationship established by Ebenstein et al.: an additional 10 µg/m³ of
// sustained PM2.5 reduces life expectancy by 0.98 years → 0.098 yr per µg/m³.
// AQLI applies this linearly above the 5 µg/m³ WHO guideline threshold.

export const AQLI_COEF = 0.098; // years of life lost per µg/m³ of PM2.5
export const WHO_PM25_GUIDELINE = 5; // µg/m³ annual, WHO 2021

/**
 * Estimated years of life expectancy lost if this PM2.5 level persisted as
 * the annual average. Returns null if pm25 is undefined/invalid.
 */
export function lifeYearsLost(pm25: number | undefined | null): number | null {
  if (pm25 === null || pm25 === undefined || !Number.isFinite(pm25)) return null;
  const excess = Math.max(0, pm25 - WHO_PM25_GUIDELINE);
  return +(excess * AQLI_COEF).toFixed(2);
}

/**
 * Same, but relative to India's NAAQS annual standard (40 µg/m³) instead of
 * the WHO guideline. Useful for a "would India's own standard be met?" framing.
 */
export const INDIA_NAAQS_PM25 = 40;
export function lifeYearsLostVsIndia(pm25: number | undefined | null): number | null {
  if (pm25 === null || pm25 === undefined || !Number.isFinite(pm25)) return null;
  const excess = Math.max(0, pm25 - INDIA_NAAQS_PM25);
  return +(excess * AQLI_COEF).toFixed(2);
}
