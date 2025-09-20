import { analyzeBurnRateTool } from "./burn-rate";
import { executeSQLQueryTool } from "./execute-sql-query";
import { barChartTool, lineChartTool, areaChartTool, pieChartTool, radarChartTool, radialChartTool } from "./charts";

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