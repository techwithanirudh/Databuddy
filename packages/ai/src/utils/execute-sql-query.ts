export interface QueryResult {
    data: unknown[];
    executionTime: number;
    rowCount: number;
}

const FORBIDDEN_SQL_KEYWORDS = [
    'INSERT INTO',
    'UPDATE SET',
    'DELETE FROM',
    'DROP TABLE',
    'DROP DATABASE',
    'CREATE TABLE',
    'CREATE DATABASE',
    'ALTER TABLE',
    'EXEC ',
    'EXECUTE ',
    'TRUNCATE',
    'MERGE',
    'BULK',
    'RESTORE',
    'BACKUP',
] as const;

export function validateSQL(sql: string): boolean {
    const upperSQL = sql.toUpperCase();
    const trimmed = upperSQL.trim();

    for (const keyword of FORBIDDEN_SQL_KEYWORDS) {
        if (upperSQL.includes(keyword)) {
            return false;
        }
    }

    return trimmed.startsWith('SELECT') || trimmed.startsWith('WITH');
}

export function ensureLimit(sql: string, defaultLimit = 2000): string {
    const upper = sql.toUpperCase();
    // If the outer query ends with LIMIT already, keep it.
    // Simple heuristic: look for " LIMIT " not inside a subquery closing right at end
    // When in doubt, append LIMIT to the end safely.
    if (/\sLIMIT\s+\d+\s*$/i.test(sql)) return sql;
    // If SQL ends with a trailing semicolon, strip it before appending LIMIT.
    const cleaned = sql.trim().replace(/;+\s*$/g, "");
    return `${cleaned} LIMIT ${defaultLimit}`;
}