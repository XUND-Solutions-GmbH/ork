/**
 * ISO-639-1 codes for languages that are supported by the system, or being prepared to be supported.
 * In case of languages that have major differences between formal-informal versions the language code is extended with `-formal` postfix.
 *
 * !Important: Languages in this list are not necessarily finalized. This list also includes codes of languages that are being prepared to be supported
 *
 * `ISO-639-1` - informal. e.g: de
 * `ISO-639-1-formal` - formal. e.g: de-formal
 */
export const clientLanguages = ['en', 'de', 'de-formal', 'ru', 'hu', 'it', 'it-formal', 'nl', 'fr'] as const
export type ClientLanguage = (typeof clientLanguages)[number]

/**
 * List of finalized languages. These languages can be used by clients.
 */
export const finalizedClientLanguages: ClientLanguage[] = ['en', 'de', 'de-formal']
