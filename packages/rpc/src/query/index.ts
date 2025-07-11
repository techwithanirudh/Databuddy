import { chQuery } from '@databuddy/db'
import type { ParameterBuilder, Filters, QueryWithParams } from './types'
import { errorBuilders } from './builders/errors'
import { pageBuilders } from './builders/pages'

const allBuilders = {
    ...errorBuilders,
    ...pageBuilders,
}

export async function executeQuery(
    name: string,
    websiteId: string,
    startDate: string,
    endDate: string,
    limit: number,
    offset: number,
    filters?: Filters,
    groupBy?: string,
) {
    const builder: ParameterBuilder | undefined = allBuilders[name]

    if (!builder) {
        throw new Error(`Query builder not found for: ${name}`)
    }

    const { query, params }: QueryWithParams = builder(websiteId, startDate, endDate, limit, offset, undefined, undefined, filters, groupBy)

    try {
        const results = await chQuery(query, params)
        return results
    } catch (error) {
        console.error(`Error executing query: ${name}`, error)
        throw new Error('Query execution failed')
    }
} 