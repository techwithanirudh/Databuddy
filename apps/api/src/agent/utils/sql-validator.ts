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
	'GRANT',
	'REVOKE',
	'SHOW GRANTS',
	'SHOW USERS',
	'SYSTEM',
	'ATTACH',
	'DETACH',
	'OPTIMIZE',
	'CHECK',
	'REPAIR',
	'ANALYZE',
] as const;

const DANGEROUS_PATTERNS = [
	/--/,           // SQL comments
	/\/\*/,         // Multi-line comments start
	/\*\//,         // Multi-line comments end
	/;/,            // Statement terminators
	/\bINTO\s+OUTFILE\b/i,  // File operations
	/\bLOAD_FILE\b/i,       // File reading
	/\bINTO\s+DUMPFILE\b/i, // File writing
	/\bSHOW\s+PROCESSLIST\b/i, // Process information
	/\bINFORMATION_SCHEMA\b/i,  // Schema inspection
	/\bMYSQL\b/i,               // MySQL database access
	/\bPG_/i,                   // PostgreSQL functions
	/\bUNION\s+(ALL\s+)?SELECT\b/i, // Union-based injection attempts
] as const;

export function validateSQL(sql: string): boolean {
	if (!sql || typeof sql !== 'string') {
		return false;
	}

	const upperSQL = sql.toUpperCase();
	const trimmed = upperSQL.trim();

	// Check length limit to prevent resource exhaustion
	if (sql.length > 10000) {
		return false;
	}

	// Check for dangerous keyword patterns
	for (const keyword of FORBIDDEN_SQL_KEYWORDS) {
		if (upperSQL.includes(keyword)) {
			return false;
		}
	}

	// Check for dangerous patterns
	for (const pattern of DANGEROUS_PATTERNS) {
		if (pattern.test(sql)) {
			return false;
		}
	}

	// Must start with SELECT or WITH (for CTEs)
	if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('WITH')) {
		return false;
	}

	// Additional validation: Ensure no stacked queries
	const statements = sql.split(';').filter(s => s.trim());
	if (statements.length > 1) {
		return false;
	}

	return true;
}
