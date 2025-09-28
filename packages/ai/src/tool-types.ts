import type { InferUITools } from "ai";
import { getContext } from "./context";
import { getDataAnalysisTool } from "./tools/get-data-analysis";
import { getDataTool } from "./tools/get-data";

export const createToolRegistry = () => {
    const context = getContext();

    return {
        getDataAnalysis: getDataAnalysisTool,
        getData: getDataTool,
    };
};

// Infer the UI tools type from the registry
export type UITools = InferUITools<ReturnType<typeof createToolRegistry>>;