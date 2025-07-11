import type { Filters, Params, QueryWithParams } from './types'

function applyFilters(sql: string, params: Params, filters?: Filters): { sql: string, params: Params } {
    if (!filters || Object.keys(filters).length === 0) {
        return { sql, params }
    }

    const filterClauses: string[] = []
    const newParams: Params = { ...params }

    for (const [key, value] of Object.entries(filters)) {
        const paramName = key.replace(/[^a-zA-Z0-9_]/g, '')
        if (Array.isArray(value)) {
            filterClauses.push(`${key} IN {${paramName}:Array(String)}`)
            newParams[paramName] = value
        } else {
            filterClauses.push(`${key} = {${paramName}:String}`)
            newParams[paramName] = value
        }
    }

    const whereClause = `WHERE ${filterClauses.join(' AND ')}`

    if (sql.includes('WHERE')) {
        const newSql = sql.replace('WHERE', `${whereClause} AND`)
        return { sql: newSql, params: newParams }
    }

    const insertionPoints = ['GROUP BY', 'ORDER BY', 'LIMIT']
    for (const point of insertionPoints) {
        if (sql.includes(point)) {
            const newSql = sql.replace(point, `${whereClause} ${point}`)
            return { sql: newSql, params: newParams }
        }
    }

    return { sql: `${sql} ${whereClause}`, params: newParams }
}

interface QueryOptions {
    select: string
    groupBy?: string
    orderBy?: string
    where?: string
}

export function createQueryBuilder(table: string, baseWhere: string[] = []) {
    return (
        websiteId: string,
        startDate: string,
        endDate: string,
        limit: number,
        offset: number,
        options: QueryOptions,
        filters?: Filters
    ): QueryWithParams => {
        const allWheres = [
            'website_id = {websiteId:UUID}',
            'timestamp >= {startDate:DateTime}',
            'timestamp <= {endDate:DateTime}',
            ...baseWhere
        ];

        if (options.where) {
            allWheres.push(options.where)
        }

        const sqlParts = [
            'SELECT',
            `  ${options.select}`,
            `FROM ${table}`,
            `WHERE ${allWheres.join(' AND ')}`,
        ]

        if (options.groupBy) {
            sqlParts.push(`GROUP BY ${options.groupBy}`)
        }
        if (options.orderBy) {
            sqlParts.push(`ORDER BY ${options.orderBy}`)
        }

        sqlParts.push('LIMIT {limit:UInt64}', 'OFFSET {offset:UInt64}')

        const sql = sqlParts.join('\n')

        const initialParams: Params = {
            websiteId,
            startDate,
            endDate,
            limit,
            offset,
        };

        const { sql: finalSql, params: finalParams } = applyFilters(sql, initialParams, filters);

        return {
            query: finalSql.trim(),
            params: finalParams
        }
    }
} 