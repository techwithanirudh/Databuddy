import { analyzeBurnRateTool } from "./burn-rate";
import { executeSqlQueryTool } from "./execute-sql-query";

export const tools = {
    analyzeBurnRate: analyzeBurnRateTool,
    executeSqlQuery: executeSqlQueryTool,
};