import type { ParameterBuilder } from '../types'
import { createQueryBuilder } from '../builder-utils'

const buildPageViewQuery = createQueryBuilder('analytics.events', [`event_name = 'pageview'`])

export const pageBuilders: Record<string, ParameterBuilder> = {
  top_pages: (websiteId, startDate, endDate, limit, offset, granularity, timezone, filters) =>
    buildPageViewQuery(websiteId, startDate, endDate, limit, offset, {
      select: `
        path,
        COUNT(*) as pageviews,
        uniq(session_id) as visitors
      `,
      groupBy: 'path',
      orderBy: 'pageviews DESC',
    }, filters),

  page_trends: (websiteId, startDate, endDate, limit, offset, granularity, timezone, filters) =>
    buildPageViewQuery(websiteId, startDate, endDate, limit, offset, {
      select: `
        toDate(timestamp) as date,
        COUNT(*) as pageviews,
        uniq(session_id) as visitors
      `,
      groupBy: 'date',
      orderBy: 'date ASC',
    }, filters),
}