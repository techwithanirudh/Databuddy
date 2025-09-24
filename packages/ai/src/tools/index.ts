import { analyzeBurnRateTool } from './get-data-analysis';
import { executeSQLQueryTool } from './execute-sql-query';

export const tools = {
	analyzeBurnRate: analyzeBurnRateTool,
	executeSQLQuery: executeSQLQueryTool
};
