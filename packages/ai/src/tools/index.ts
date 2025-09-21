import { analyzeBurnRateTool } from './burn-rate';
import {
	areaChartTool,
	barChartTool,
	lineChartTool,
	pieChartTool,
	radarChartTool,
	radialChartTool,
} from './charts';
import { executeSQLQueryTool } from './execute-sql-query';

export const tools = {
	analyzeBurnRate: analyzeBurnRateTool,
	executeSQLQuery: executeSQLQueryTool,
	barChart: barChartTool,
	lineChart: lineChartTool,
	areaChart: areaChartTool,
	pieChart: pieChartTool,
	radarChart: radarChartTool,
	radialChart: radialChartTool,
};
