// Reasonable appearances of non-english languages in source code (eg. tests)
const nonEnglishWords = []

// Names of compaines/technologies/etc... not in default cspell dictionaries
const names = ['xund', 'ork', 'doktor', 'asciinema']

// Miscellaneous words cspell can't recognize
const miscFalsePositives = ['uuidv', 'xsid', 'xaut', 'xauthz']

module.exports = {
  // Version of the setting file.  Always 0.2
  version: '0.2',
  // language - current active spelling languages
  language: 'en_US,en_GB',
  // words - list of words to be always considered correct (case insensitive)
  words: [...nonEnglishWords, ...names, ...miscFalsePositives],
  // flagWords - list of words to be always considered incorrect
  // This is useful for offensive words and common spelling errors.
  // For example "hte" should be "the"
  flagWords: ['hte'],
  // allowCompoundWords - allow words like 'bodypart' and 'bodypartSelector
  allowCompoundWords: true,
  // import - make cspell use additional external dictionaries downloaded from npm packages (like @cspell/dict-de-de)
  import: ['@cspell/dict-en-gb/cspell-ext.json'],
}
