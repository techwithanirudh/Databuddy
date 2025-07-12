import type { SimpleQueryConfig } from "../types";

export const SummaryBuilders: Record<string, SimpleQueryConfig> = {
    summary_metrics: {
        table: 'analytics.events',
        fields: [
            'COUNT(*) as pageviews',
            'COUNT(DISTINCT anonymous_id) as unique_visitors',
            'COUNT(DISTINCT session_id) as sessions',
            'AVG(CASE WHEN is_bounce = 1 THEN 100 ELSE 0 END) as bounce_rate',
            'AVG(CASE WHEN time_on_page > 0 THEN time_on_page / 1000 ELSE NULL END) as avg_session_duration',
            'COUNT(*) as total_events'
        ],
        where: ['event_name = \'screen_view\''],
        timeField: 'time',
        allowedFilters: ['path', 'referrer', 'device_type', 'browser_name', 'country'],
        customizable: true
    },

    today_metrics: {
        table: 'analytics.events',
        fields: [
            'COUNT(*) as pageviews',
            'COUNT(DISTINCT anonymous_id) as visitors',
            'COUNT(DISTINCT session_id) as sessions',
            'AVG(CASE WHEN is_bounce = 1 THEN 100 ELSE 0 END) as bounce_rate'
        ],
        where: [
            'event_name = \'screen_view\'',
            'toDate(time) = today()'
        ],
        timeField: 'time',
        allowedFilters: ['path', 'referrer', 'device_type'],
        customizable: true
    },

    events_by_date: {
        table: 'analytics.events',
        fields: [
            'toDate(time) as date',
            'COUNT(*) as pageviews',
            'COUNT(DISTINCT anonymous_id) as visitors',
            'COUNT(DISTINCT session_id) as sessions',
            'AVG(CASE WHEN is_bounce = 1 THEN 100 ELSE 0 END) as bounce_rate',
            'AVG(CASE WHEN time_on_page > 0 THEN time_on_page / 1000 ELSE NULL END) as avg_session_duration'
        ],
        where: ['event_name = \'screen_view\''],
        groupBy: ['toDate(time)'],
        orderBy: 'date ASC',
        timeField: 'time',
        allowedFilters: ['path', 'referrer', 'device_type'],
        customizable: true
    },

    active_stats: {
        table: 'analytics.events',
        fields: [
            'COUNT(DISTINCT anonymous_id) as active_users',
            'COUNT(DISTINCT session_id) as active_sessions'
        ],
        where: [
            'event_name = \'screen_view\'',
            'time >= now() - INTERVAL 5 MINUTE'
        ],
        timeField: 'time',
        allowedFilters: ['path', 'referrer'],
        customizable: true
    }
}; 