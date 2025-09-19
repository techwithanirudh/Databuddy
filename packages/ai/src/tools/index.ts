import { analyzeBurnRateTool } from "./burn-rate";
import { executeSQLQueryTool } from "./execute-sql-query";

export const tools = {
    analyzeBurnRate: analyzeBurnRateTool,
    executeSQLQuery: executeSQLQueryTool,
};