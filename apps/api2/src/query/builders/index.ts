import { SummaryBuilders } from "./summary";
import { PagesBuilders } from "./pages";
import { TrafficBuilders } from "./traffic";
import { DevicesBuilders } from "./devices";
import { GeoBuilders } from "./geo";
import { ErrorsBuilders } from "./errors";
import { PerformanceBuilders } from "./performance";
import { SessionsBuilders } from "./sessions";
import { CustomEventsBuilders } from "./custom-events";

export const QueryBuilders = {
    ...SummaryBuilders,
    ...PagesBuilders,
    ...TrafficBuilders,
    ...DevicesBuilders,
    ...GeoBuilders,
    ...ErrorsBuilders,
    ...PerformanceBuilders,
    ...SessionsBuilders,
    ...CustomEventsBuilders
};

export type QueryType = keyof typeof QueryBuilders; 