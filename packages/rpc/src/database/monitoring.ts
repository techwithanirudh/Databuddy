import { Client } from 'pg';

export interface DatabaseStats {
	// Database info
	databaseName: string;
	databaseSize: string;

	// Connection info
	maxConnections: number;
	activeConnections: number;

	// Activity stats
	totalQueries: number;
	totalInserts: number;
	totalUpdates: number;
	totalDeletes: number;

	// Performance metrics
	hitRatio: number; // Cache hit ratio percentage
	indexUsage: number; // Index usage percentage
}

export interface TableStats {
	tableName: string;
	schemaName: string;
	rowCount: number;
	totalSize: string;
	indexSize: string;
	lastVacuum?: string;
	lastAnalyze?: string;
	sequentialScans: number;
	indexScans: number;
	deadTuples: number;
}

export interface ExtensionInfo {
	name: string;
	version: string;
	schema: string;
	description: string;
	installed: boolean;
	availableVersion?: string;
	needsUpdate: boolean;
	hasStatefulData: boolean;
	requiresRestart: boolean;
	dependencies: string[];
}

export interface AvailableExtension {
	name: string;
	defaultVersion: string;
	description: string;
	comment: string;
	requiresRestart: boolean;
	category: string;
}

export interface ExtensionDependency {
	name: string;
	type: 'view' | 'function' | 'table' | 'trigger' | 'other';
	schema: string;
	dependentObject: string;
}

export interface ExtensionSafetyCheck {
	canSafelyDrop: boolean;
	canSafelyUpdate: boolean;
	warnings: string[];
	dependencies: ExtensionDependency[];
	hasStatefulData: boolean;
	requiresRestart: boolean;
	suggestedAction: 'update' | 'reset' | 'drop_cascade' | 'manual_review';
}

/**
 * Get basic database statistics using a readonly connection
 */
export async function getDatabaseStats(
	connectionUrl: string
): Promise<DatabaseStats> {
	const client = new Client({
		connectionString: connectionUrl,
		connectionTimeoutMillis: 10_000,
		query_timeout: 30_000,
	});

	try {
		await client.connect();

		// Get database basic info
		const dbInfoResult = await client.query(`
			SELECT 
				current_database() as database_name,
				pg_size_pretty(pg_database_size(current_database())) as database_size
		`);

		// Get connection stats
		const connectionResult = await client.query(`
			SELECT 
				setting as max_connections
			FROM pg_settings 
			WHERE name = 'max_connections'
		`);

		const activeConnectionsResult = await client.query(`
			SELECT count(*) as active_connections
			FROM pg_stat_activity
			WHERE state = 'active'
		`);

		// Get database activity stats
		const activityResult = await client.query(`
			SELECT 
				SUM(xact_commit + xact_rollback) as total_queries,
				SUM(tup_inserted) as total_inserts,
				SUM(tup_updated) as total_updates,
				SUM(tup_deleted) as total_deletes
			FROM pg_stat_database
			WHERE datname = current_database()
		`);

		// Get cache hit ratio
		const hitRatioResult = await client.query(`
			SELECT 
				ROUND(
					100.0 * SUM(blks_hit) / NULLIF(SUM(blks_hit + blks_read), 0), 
					2
				) as hit_ratio
			FROM pg_stat_database
			WHERE datname = current_database()
		`);

		// Get index usage ratio
		const indexUsageResult = await client.query(`
			SELECT 
				ROUND(
					100.0 * SUM(idx_scan) / NULLIF(SUM(seq_scan + idx_scan), 0), 
					2
				) as index_usage
			FROM pg_stat_user_tables
		`);

		const dbInfo = dbInfoResult.rows[0];
		const connectionInfo = connectionResult.rows[0];
		const activeConnections = activeConnectionsResult.rows[0];
		const activity = activityResult.rows[0];
		const hitRatio = hitRatioResult.rows[0];
		const indexUsage = indexUsageResult.rows[0];

		return {
			databaseName: dbInfo.database_name,
			databaseSize: dbInfo.database_size,
			maxConnections: Number.parseInt(connectionInfo.max_connections, 10),
			activeConnections: Number.parseInt(
				activeConnections.active_connections,
				10
			),
			totalQueries: Number.parseInt(activity.total_queries || '0', 10),
			totalInserts: Number.parseInt(activity.total_inserts || '0', 10),
			totalUpdates: Number.parseInt(activity.total_updates || '0', 10),
			totalDeletes: Number.parseInt(activity.total_deletes || '0', 10),
			hitRatio: Number.parseFloat(hitRatio.hit_ratio || '0'),
			indexUsage: Number.parseFloat(indexUsage.index_usage || '0'),
		};
	} finally {
		await client.end();
	}
}

/**
 * Get table statistics using a readonly connection
 */
export async function getTableStats(
	connectionUrl: string,
	limit?: number
): Promise<TableStats[]> {
	const client = new Client({
		connectionString: connectionUrl,
		connectionTimeoutMillis: 10_000,
		query_timeout: 30_000,
	});

	try {
		await client.connect();

		const query = `
			SELECT 
				schemaname as schema_name,
				relname as table_name,
				n_live_tup as row_count,
				pg_size_pretty(pg_total_relation_size(quote_ident(schemaname)||'.'||quote_ident(relname))) as total_size,
				pg_size_pretty(pg_indexes_size(quote_ident(schemaname)||'.'||quote_ident(relname))) as index_size,
				last_vacuum,
				last_analyze,
				seq_scan as sequential_scans,
				idx_scan as index_scans,
				n_dead_tup as dead_tuples
			FROM pg_stat_user_tables 
			ORDER BY pg_total_relation_size(quote_ident(schemaname)||'.'||quote_ident(relname)) DESC
			${limit ? 'LIMIT $1' : ''}
		`;

		const result = limit
			? await client.query(query, [limit])
			: await client.query(query);

		return result.rows.map((row) => ({
			tableName: row.table_name,
			schemaName: row.schema_name,
			rowCount: Number.parseInt(row.row_count || '0', 10),
			totalSize: row.total_size,
			indexSize: row.index_size,
			lastVacuum: row.last_vacuum
				? new Date(row.last_vacuum).toISOString()
				: undefined,
			lastAnalyze: row.last_analyze
				? new Date(row.last_analyze).toISOString()
				: undefined,
			sequentialScans: Number.parseInt(row.sequential_scans || '0', 10),
			indexScans: Number.parseInt(row.index_scans || '0', 10),
			deadTuples: Number.parseInt(row.dead_tuples || '0', 10),
		}));
	} finally {
		await client.end();
	}
}

/**
 * Get PostgreSQL extensions information
 */
export async function getExtensions(
	connectionUrl: string
): Promise<ExtensionInfo[]> {
	const client = new Client({
		connectionString: connectionUrl,
		connectionTimeoutMillis: 10_000,
		query_timeout: 30_000,
	});

	try {
		await client.connect();

		const result = await client.query(`
			SELECT 
				e.extname as name,
				e.extversion as version,
				n.nspname as schema,
				COALESCE(c.description, 'No description available') as description,
				true as installed
			FROM pg_extension e
			LEFT JOIN pg_namespace n ON n.oid = e.extnamespace
			LEFT JOIN pg_description c ON c.objoid = e.oid AND c.classoid = 'pg_extension'::regclass
			ORDER BY e.extname
		`);

		// Get available versions for update checking
		const availableResult = await client.query(
			`
			SELECT name, default_version 
			FROM pg_available_extensions 
			WHERE name = ANY($1)
		`,
			[result.rows.map((row) => row.name)]
		);

		const availableVersions = new Map();
		for (const row of availableResult.rows) {
			availableVersions.set(row.name, row.default_version);
		}

		return result.rows.map((row) => ({
			name: row.name,
			version: row.version,
			schema: row.schema,
			description: row.description,
			installed: row.installed,
			availableVersion: availableVersions.get(row.name),
			needsUpdate:
				availableVersions.get(row.name) &&
				availableVersions.get(row.name) !== row.version,
			hasStatefulData: isStatefulExtension(row.name),
			requiresRestart: requiresRestartExtension(row.name),
			dependencies: [], // Will be populated by separate query if needed
		}));
	} finally {
		await client.end();
	}
}

/**
 * Helper function to determine if extension has stateful data
 */
function isStatefulExtension(extensionName: string): boolean {
	const statefulExtensions = [
		'pg_stat_statements',
		'pg_stat_monitor',
		'pg_buffercache',
		'pg_prewarm',
		'pg_cron',
		'pglogical',
		'timescaledb',
	];
	return statefulExtensions.includes(extensionName.toLowerCase());
}

/**
 * Helper function to determine if extension requires PostgreSQL restart
 */
function requiresRestartExtension(extensionName: string): boolean {
	const restartExtensions = [
		'pg_stat_statements',
		'pg_stat_monitor',
		'pg_cron',
		'pglogical',
		'timescaledb',
		'pg_audit',
		'auto_explain',
	];
	return restartExtensions.includes(extensionName.toLowerCase());
}

/**
 * Get extension category for organization
 */
function getExtensionCategory(extensionName: string): string {
	const categoryMap: Record<string, string> = {
		pg_stat_statements: 'Monitoring',
		pg_stat_monitor: 'Monitoring',
		pg_buffercache: 'Monitoring',
		'uuid-ossp': 'Data Types',
		pgcrypto: 'Security',
		hstore: 'Data Types',
		ltree: 'Data Types',
		pg_trgm: 'Search',
		fuzzystrmatch: 'Search',
		unaccent: 'Search',
		postgis: 'GIS',
		timescaledb: 'Time Series',
		pg_cron: 'Scheduling',
		plpgsql: 'Languages',
		plpython3u: 'Languages',
		tablefunc: 'Utilities',
		dblink: 'Connectivity',
		postgres_fdw: 'Connectivity',
	};
	return categoryMap[extensionName.toLowerCase()] || 'Other';
}

/**
 * Check extension dependencies and safety for operations
 */
export async function checkExtensionSafety(
	connectionUrl: string,
	extensionName: string
): Promise<ExtensionSafetyCheck> {
	const client = new Client({
		connectionString: connectionUrl,
		connectionTimeoutMillis: 10_000,
		query_timeout: 30_000,
	});

	try {
		await client.connect();

		// Check for dependent objects
		const dependencyResult = await client.query(
			`
			WITH extension_objects AS (
				SELECT 
					d.objid,
					d.classid,
					pg_describe_object(d.classid, d.objid, d.objsubid) as object_name
				FROM pg_depend d
				JOIN pg_extension e ON d.refobjid = e.oid
				WHERE e.extname = $1
				AND d.deptype = 'e'
			),
			dependents AS (
				SELECT DISTINCT
					pg_describe_object(d.classid, d.objid, d.objsubid) as dependent_object,
					CASE 
						WHEN c.relkind = 'v' THEN 'view'
						WHEN c.relkind = 'r' THEN 'table'
						WHEN p.proname IS NOT NULL THEN 'function'
						WHEN t.tgname IS NOT NULL THEN 'trigger'
						ELSE 'other'
					END as object_type,
					COALESCE(n.nspname, '') as schema_name
				FROM pg_depend d
				JOIN extension_objects eo ON d.refobjid = eo.objid
				LEFT JOIN pg_class c ON d.classid = c.tableoid AND d.objid = c.oid
				LEFT JOIN pg_proc p ON d.classid = p.tableoid AND d.objid = p.oid
				LEFT JOIN pg_trigger t ON d.classid = t.tableoid AND d.objid = t.oid
				LEFT JOIN pg_namespace n ON c.relnamespace = n.oid OR p.pronamespace = n.oid
				WHERE d.deptype IN ('n', 'a')  -- normal or auto dependency
				AND d.classid != (SELECT oid FROM pg_class WHERE relname = 'pg_extension')
			)
			SELECT * FROM dependents
			WHERE dependent_object IS NOT NULL
			LIMIT 10
		`,
			[extensionName]
		);

		const dependencies: ExtensionDependency[] = dependencyResult.rows.map(
			(row) => ({
				name: extensionName,
				type: row.object_type,
				schema: row.schema_name,
				dependentObject: row.dependent_object,
			})
		);

		const hasStatefulData = isStatefulExtension(extensionName);
		const requiresRestart = requiresRestartExtension(extensionName);
		const canSafelyDrop = dependencies.length === 0;
		const canSafelyUpdate = true; // Updates are generally safe

		const warnings: string[] = [];
		let suggestedAction: ExtensionSafetyCheck['suggestedAction'] = 'update';

		if (hasStatefulData) {
			warnings.push(
				'Extension contains stateful data that will be lost if dropped'
			);
			if (extensionName === 'pg_stat_statements') {
				warnings.push(
					'Consider using pg_stat_statements_reset() instead of dropping'
				);
				suggestedAction = 'reset';
			}
		}

		if (requiresRestart) {
			warnings.push(
				'Extension requires PostgreSQL restart and shared_preload_libraries configuration'
			);
		}

		if (dependencies.length > 0) {
			warnings.push(
				`${dependencies.length} dependent objects will be affected`
			);
			suggestedAction =
				dependencies.length > 5 ? 'manual_review' : 'drop_cascade';
		}

		return {
			canSafelyDrop,
			canSafelyUpdate,
			warnings,
			dependencies,
			hasStatefulData,
			requiresRestart,
			suggestedAction,
		};
	} finally {
		await client.end();
	}
}

/**
 * Get available PostgreSQL extensions that can be installed
 */
export async function getAvailableExtensions(
	connectionUrl: string
): Promise<AvailableExtension[]> {
	const client = new Client({
		connectionString: connectionUrl,
		connectionTimeoutMillis: 10_000,
		query_timeout: 30_000,
	});

	try {
		await client.connect();

		const result = await client.query(`
			SELECT 
				name,
				default_version,
				comment
			FROM pg_available_extensions
			WHERE name NOT IN (
				SELECT extname FROM pg_extension
			)
			ORDER BY name
		`);

		return result.rows.map((row) => ({
			name: row.name,
			defaultVersion: row.default_version,
			description: row.comment || 'No description available',
			comment: row.comment || '',
			requiresRestart: requiresRestartExtension(row.name),
			category: getExtensionCategory(row.name),
		}));
	} finally {
		await client.end();
	}
}

/**
 * Reset extension statistics (safe alternative to drop/recreate)
 */
export async function resetExtensionStats(
	connectionUrl: string,
	extensionName: string
): Promise<void> {
	const client = new Client({
		connectionString: connectionUrl,
		connectionTimeoutMillis: 10_000,
		query_timeout: 30_000,
	});

	try {
		await client.connect();

		switch (extensionName) {
			case 'pg_stat_statements': {
				await client.query('SELECT pg_stat_statements_reset()');
				break;
			}
			case 'pg_stat_monitor': {
				await client.query('SELECT pg_stat_monitor_reset()');
				break;
			}
			default: {
				throw new Error(
					`Stats reset not supported for extension: ${extensionName}`
				);
			}
		}
	} finally {
		await client.end();
	}
}

/**
 * Update an extension to the latest version (safe operation)
 */
export async function updateExtension(
	connectionUrl: string,
	extensionName: string
): Promise<void> {
	const client = new Client({
		connectionString: connectionUrl,
		connectionTimeoutMillis: 10_000,
		query_timeout: 30_000,
	});

	try {
		await client.connect();

		// Check if extension exists and needs updating
		const versionCheck = await client.query(
			`
			SELECT 
				e.extversion as current_version,
				av.default_version as available_version
			FROM pg_extension e
			JOIN pg_available_extensions av ON e.extname = av.name
			WHERE e.extname = $1
		`,
			[extensionName]
		);

		if (versionCheck.rows.length === 0) {
			throw new Error(`Extension ${extensionName} is not installed`);
		}

		const { current_version, available_version } = versionCheck.rows[0];
		if (current_version === available_version) {
			return; // Already up to date
		}

		// Use ALTER EXTENSION UPDATE instead of DROP/CREATE
		await client.query(`ALTER EXTENSION "${extensionName}" UPDATE`);
	} finally {
		await client.end();
	}
}

/**
 * Safely install a PostgreSQL extension with pre-flight checks
 */
export async function safeInstallExtension(
	connectionUrl: string,
	extensionName: string,
	schema?: string,
	force = false
): Promise<{ success: boolean; warnings: string[] }> {
	const client = new Client({
		connectionString: connectionUrl,
		connectionTimeoutMillis: 10_000,
		query_timeout: 30_000,
	});

	const warnings: string[] = [];

	try {
		await client.connect();

		// Check if extension is available
		const availableCheck = await client.query(
			`
			SELECT name, default_version, comment
			FROM pg_available_extensions 
			WHERE name = $1
		`,
			[extensionName]
		);

		if (availableCheck.rows.length === 0) {
			return {
				success: false,
				warnings: [
					`Extension ${extensionName} is not available in this PostgreSQL installation`,
				],
			};
		}

		// Check if already installed
		const installedCheck = await client.query(
			`
			SELECT extversion, nspname
			FROM pg_extension e
			JOIN pg_namespace n ON e.extnamespace = n.oid
			WHERE e.extname = $1
		`,
			[extensionName]
		);

		if (installedCheck.rows.length > 0) {
			return {
				success: false,
				warnings: [
					`Extension ${extensionName} is already installed (version ${installedCheck.rows[0].extversion})`,
				],
			};
		}

		// Add warnings for special extensions
		if (requiresRestartExtension(extensionName)) {
			warnings.push(
				`Extension ${extensionName} requires adding to shared_preload_libraries and PostgreSQL restart`
			);
			if (!force) {
				return { success: false, warnings };
			}
		}

		// Install the extension
		let query = `CREATE EXTENSION "${extensionName}"`;
		if (schema) {
			query += ` WITH SCHEMA "${schema}"`;
		}

		await client.query(query);

		return { success: true, warnings };
	} finally {
		await client.end();
	}
}

/**
 * Safely drop a PostgreSQL extension with dependency checking
 */
export async function safeDropExtension(
	connectionUrl: string,
	extensionName: string,
	cascade = false
): Promise<{ success: boolean; warnings: string[] }> {
	const client = new Client({
		connectionString: connectionUrl,
		connectionTimeoutMillis: 10_000,
		query_timeout: 30_000,
	});

	const warnings: string[] = [];

	try {
		await client.connect();

		// Check if extension exists
		const extensionCheck = await client.query(
			`
			SELECT extname, extversion
			FROM pg_extension 
			WHERE extname = $1
		`,
			[extensionName]
		);

		if (extensionCheck.rows.length === 0) {
			return {
				success: false,
				warnings: [`Extension ${extensionName} is not installed`],
			};
		}

		// Get safety information
		const safetyCheck = await checkExtensionSafety(
			connectionUrl,
			extensionName
		);

		if (safetyCheck.hasStatefulData) {
			warnings.push('Extension contains stateful data that will be lost');
		}

		if (safetyCheck.dependencies.length > 0 && !cascade) {
			warnings.push(
				`Cannot drop extension: ${safetyCheck.dependencies.length} dependent objects exist. Use CASCADE to force removal.`
			);
			return { success: false, warnings };
		}

		if (safetyCheck.requiresRestart) {
			warnings.push(
				'Extension may require PostgreSQL configuration changes after removal'
			);
		}

		// Drop the extension
		let query = `DROP EXTENSION "${extensionName}"`;
		if (cascade && safetyCheck.dependencies.length > 0) {
			query += ' CASCADE';
			warnings.push(
				`Dropping ${safetyCheck.dependencies.length} dependent objects`
			);
		}

		await client.query(query);

		return { success: true, warnings };
	} finally {
		await client.end();
	}
}
