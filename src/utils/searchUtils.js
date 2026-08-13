/**
 * Utility to safely normalize search inputs (strings, objects, numbers, null, etc.)
 * into a trimmed string to prevent runtime errors like:
 * "search.toLowerCase is not a function" or "search.trim is not a function"
 */
export function toSearchString(input) {
  if (input == null) return '';
  if (typeof input === 'string') return input.trim();
  if (typeof input === 'number') return String(input).trim();
  if (typeof input === 'object') {
    if (typeof input.search === 'string') return input.search.trim();
    if (typeof input.query === 'string') return input.query.trim();
    if (typeof input.q === 'string') return input.q.trim();
    if (typeof input.searchTerm === 'string') return input.searchTerm.trim();
  }
  return '';
}
