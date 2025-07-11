import type { Query } from '@databuddy/db'

export type Granularity = 'hour' | 'day' | 'week' | 'month'

export interface QueryDateRange {
    from: string
    to: string
}

export interface QueryFilters {
    [key: string]: string | number | string[] | number[]
}

export interface QueryParams {
    [key: string]: string | number | string[] | number[] | undefined;
}

export type QueryBuilder = (
    websiteId: string,
    dateRange: QueryDateRange,
    filters?: QueryFilters,
    params?: QueryParams,
) => Query

export interface QueryBuilderGroup {
    [key: string]: QueryBuilder
}

export type Filters = Record<string, string | number | string[] | number[]>
export type Params = Record<string, unknown>

export interface QueryWithParams {
    query: string
    params: Params
}

export type ParameterBuilder = (
    websiteId: string,
    startDate: string,
    endDate: string,
    limit: number,
    offset: number,
    granularity?: Granularity,
    timezone?: string,
    filters?: Filters,
    groupBy?: string,
) => QueryWithParams 