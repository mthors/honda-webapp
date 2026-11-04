/**
 * PostgREST Search Input Escaper
 *
 * PostgREST parses the argument to `.or()` and `.and()` filter methods as a raw grammar string:
 * - Commas (,) delimit logical conditions.
 * - Parentheses ( ) delimit logical sub-groups.
 * - Double quotes (") delimit string literals.
 * - Backslashes (\) are escape characters in both PostgREST and PostgreSQL.
 *
 * By enclosing filter values in PostgREST double quotes (`"..."`), punctuation characters
 * such as commas (,), parentheses ( ), colons (:), periods (.), and hyphens (-) are safely
 * treated as literal characters within the operand and will not break the `.or()` logic tree.
 *
 * To ensure safe execution across JavaScript, PostgREST, and PostgreSQL:
 * 1. Backslashes are escaped as `\\\\` (delivering `\\` to PostgREST -> `\` to PostgreSQL).
 * 2. Double quotes are escaped as `\"` to prevent terminating the PostgREST string literal.
 * 3. Wildcards `%` and `_` are escaped as `\\%` and `\\_` so PostgreSQL ILIKE treats them
 *    as literal characters rather than pattern wildcards.
 */

/**
 * Escapes a user-supplied search term for safe interpolation into double-quoted PostgREST filter clauses.
 * Preserves legitimate punctuation while neutralizing quotes, backslashes, and SQL wildcards.
 */
export function escapePostgrestSearchTerm(rawTerm: string | null | undefined): string {
  if (!rawTerm) {
    return '';
  }

  const trimmed = rawTerm.trim();
  if (!trimmed) {
    return '';
  }

  // 1. Backslash: \\\\ in replacement produces \\ on the wire -> \ in PostgreSQL
  // 2. Double-quote: \" avoids premature string termination in PostgREST
  // 3. Percent sign: \\% produces \% in PostgreSQL ILIKE (literal %)
  // 4. Underscore: \\_ produces \_ in PostgreSQL ILIKE (literal _)
  return trimmed
    .replace(/\\/g, '\\\\\\\\')
    .replace(/"/g, '\\"')
    .replace(/%/g, '\\\\%')
    .replace(/_/g, '\\\\_');
}

/**
 * Alias for backward compatibility.
 */
export const sanitizePostgrestSearchTerm = escapePostgrestSearchTerm;
