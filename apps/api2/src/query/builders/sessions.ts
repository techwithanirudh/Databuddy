import type { SimpleQueryConfig } from "../types";

export const SessionsBuilders: Record<string, SimpleQueryConfig> = {
    session_metrics: {
        table: 'analytics.events',
        fields: [
            'COUNT(DISTINCT session_id) as total_sessions',
            'AVG(CASE WHEN time_on_page > 0 THEN time_on_page / 1000 ELSE NULL END) as avg_session_duration',
            'AVG(CASE WHEN is_bounce = 1 THEN 100 ELSE 0 END) as bounce_rate',
            'COUNT(*) as total_events'
        ],
        where: ['event_name = \'screen_view\''],
        timeField: 'time',
        allowedFilters: ['path', 'referrer', 'device_type', 'browser_name', 'country'],
        customizable: true
    },

    session_duration_distribution: {
        table: 'analytics.events',
        fields: [
            'CASE ' +
            'WHEN time_on_page < 30 THEN \'0-30s\' ' +
            'WHEN time_on_page < 60 THEN \'30s-1m\' ' +
            'WHEN time_on_page < 300 THEN \'1m-5m\' ' +
            'WHEN time_on_page < 900 THEN \'5m-15m\' ' +
            'WHEN time_on_page < 3600 THEN \'15m-1h\' ' +
            'ELSE \'1h+\' ' +
            'END as duration_range',
            'COUNT(DISTINCT session_id) as sessions',
            'COUNT(DISTINCT anonymous_id) as visitors'
        ],
        where: ['event_name = \'screen_view\'', 'time_on_page > 0'],
        groupBy: ['duration_range'],
        orderBy: 'sessions DESC',
        timeField: 'time',
        allowedFilters: ['path', 'referrer', 'device_type'],
        customizable: true
    },

    sessions_by_device: {
        table: 'analytics.events',
        fields: [
            'device_type as name',
            'COUNT(DISTINCT session_id) as sessions',
            'COUNT(DISTINCT anonymous_id) as visitors',
            'AVG(CASE WHEN time_on_page > 0 THEN time_on_page / 1000 ELSE NULL END) as avg_session_duration'
        ],
        where: ['event_name = \'screen_view\'', 'device_type != \'\''],
        groupBy: ['device_type'],
        orderBy: 'sessions DESC',
        timeField: 'time',
        allowedFilters: ['device_type', 'path', 'referrer'],
        customizable: true
    },

    sessions_by_browser: {
        table: 'analytics.events',
        fields: [
            'browser_name as name',
            'COUNT(DISTINCT session_id) as sessions',
            'COUNT(DISTINCT anonymous_id) as visitors',
            'AVG(CASE WHEN time_on_page > 0 THEN time_on_page / 1000 ELSE NULL END) as avg_session_duration'
        ],
        where: ['event_name = \'screen_view\'', 'browser_name != \'\''],
        groupBy: ['browser_name'],
        orderBy: 'sessions DESC',
        limit: 100,
        timeField: 'time',
        allowedFilters: ['browser_name', 'path', 'device_type'],
        customizable: true
    },

    sessions_time_series: {
        table: 'analytics.events',
        fields: [
            'toDate(time) as date',
            'COUNT(DISTINCT session_id) as sessions',
            'COUNT(DISTINCT anonymous_id) as visitors',
            'AVG(CASE WHEN time_on_page > 0 THEN time_on_page / 1000 ELSE NULL END) as avg_session_duration'
        ],
        where: ['event_name = \'screen_view\''],
        groupBy: ['toDate(time)'],
        orderBy: 'date ASC',
        timeField: 'time',
        allowedFilters: ['path', 'referrer', 'device_type'],
        customizable: true
    },

    session_flow: {
        table: 'analytics.events',
        fields: [
            'path as name',
            'COUNT(DISTINCT session_id) as sessions',
            'COUNT(DISTINCT anonymous_id) as visitors'
        ],
        where: ['event_name = \'screen_view\'', 'path != \'\''],
        groupBy: ['path'],
        orderBy: 'sessions DESC',
        limit: 100,
        timeField: 'time',
        allowedFilters: ['path', 'referrer', 'device_type'],
        customizable: true
    }
}; 