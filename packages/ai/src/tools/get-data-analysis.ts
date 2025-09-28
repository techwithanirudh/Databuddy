'use server'
import { generateObject, generateText, smoothStream, streamText, tool } from "ai";
import { dataAnalysisArtifact } from "../artifacts/data-analysis";
import { getContext } from "../context";
import { safeValue } from "../utils/safe-value";
import { getDataAnalysisSchema } from "./schema";
import { provider } from "../providers";
import { validateSQL } from "../utils/execute-sql-query";
import { systemPrompt } from "../prompts";
import { z } from "zod";
import { type Row } from "@databuddy/db";
import { chQuery } from "@databuddy/db";
import { ChartSpec, sanitizeChartSpec, summarizeSchema } from "../artifacts/charts";
import { chartPrompt } from "../prompts/chart-prompt";

function buildSqlUserPrompt(input: z.infer<typeof getDataAnalysisSchema>) {
  const lines: string[] = [];
  lines.push(`Question: ${input.question}`);
  if (input.from) lines.push(`From: ${input.from}`);
  if (input.to) lines.push(`To: ${input.to}`);
  if (input.maxRows) lines.push(`Row cap: ${input.maxRows}`);
  lines.push(`Output: a single ClickHouse SELECT or WITH query with LIMIT`);
  return lines.join("\n");
}

export const getDataAnalysisTool = tool({
  description:
    "Generate comprehensive burn rate analysis with interactive visualizations, spending trends, runway projections, and actionable insights. Use this tool when users want detailed financial analysis, visual charts, spending breakdowns, or need to understand their business's financial health and future projections.",
  inputSchema: getDataAnalysisSchema.omit({ showCanvas: true }), // Remove showCanvas since this always shows canvas
  execute: async function* (input: z.infer<typeof getDataAnalysisSchema>) {
    try {
      const context = getContext();
      const userFirstName = safeValue(context?.user.name?.split(" ")[0]) || "there";

      // Always create canvas for analysis tool
      const analysis = dataAnalysisArtifact.stream({
        stage: "loading",
        toast: {
          visible: true,
          currentStep: 0,
          totalSteps: 4,
          currentLabel: "Loading data",
          stepDescription: "Preparing analysis and generating SQL",
        },
      });

      // Generate a contextual initial message based on the analysis request
      const initialMessageStream = streamText({
        model: provider.languageModel("artifact-model"),
        temperature: 0.2,
        system: `You are an assistant generating a brief initial message for a data analysis. 

The user has requested a data analysis. Create a message that:
- Explains what you're currently doing (preparing analysis and generating SQL)
- Mentions the specific insights they'll receive
- Uses a warm, personal tone while staying professional
- Uses the user's first name (${userFirstName}) when appropriate
- Avoids generic phrases like "Got it! Let's dive into..." or "Thanks for reaching out"
- Keep it concise (1-2 sentences max)

Example format: "I'm analyzing your data to show your [xyz]"`,
        messages: [
          {
            role: "user",
            content: `Generate a brief initial message for a data analysis request.`,
          },
        ],
        experimental_transform: smoothStream({ chunking: "word" }),
      });

      let completeMessage = "";
      for await (const chunk of initialMessageStream.textStream) {
        completeMessage += chunk;
        yield { text: completeMessage };
      }
      completeMessage += "\n";
      yield { text: completeMessage };

      const { object: sqlObject } = await generateObject({
        model: provider.languageModel("artifact-model"),
        system: systemPrompt({
          selectedChatModel: "artifact-model",
          requestHints: {
            websiteId: context.websiteId,
            websiteHostname: context.websiteHostname,
            timestamp: new Date().toISOString(),
          },
        }),
        schema: z.object({
          sql: z.string().describe("The SQL query to execute"),
        }),
        messages: [{ role: "user", content: buildSqlUserPrompt(input) }],
      });

      const sql = sqlObject.sql;
      console.log("sql", sql);
      if (!validateSQL(sql)) {
        console.log("sql validation failed", sql);
        await analysis.update({
          stage: "analysis_ready",
          chart: { spec: null, series: [] },
          tablePreview: [],
          analysis: {
            summary: "The generated SQL did not pass safety validation.",
            recommendations: [
              "Rephrase your request to focus on SELECT based analytics",
              "Specify the table and time window you want to analyze",
            ],
          },
          toast: {
            visible: false,
            currentStep: 4,
            totalSteps: 4,
            currentLabel: "Validation failed",
            stepDescription: "Query blocked by safety rules",
            completed: true,
            completedMessage: "Validation failed",
          },
        });

        return {
          ok: false,
          reason: "SQL validation failed",
        };
      }

      // 3) Update canvas to show we are about to query
      await analysis.update({
        stage: "query_ready",
        sqlPreview: sql.length > 800 ? sql.slice(0, 800) + " ..." : sql,
        toast: {
          visible: true,
          currentStep: 1,
          totalSteps: 4,
          currentLabel: "Running query",
          stepDescription: "Executing read-only SQL on ClickHouse",
        },
      });
      yield { text: completeMessage };

      // Execute query
      let rows: Row[] = [];
      const qStart = Date.now();
      try {
        console.log("executing query", sql);
        const result = await chQuery(sql);
        console.log("query result", result);
        rows = Array.isArray(result) ? result : [];
      } catch (err) {
        console.error("query error", err);
        await analysis.update({
          stage: "analysis_ready",
          chart: { spec: null, series: [] },
          tablePreview: [],
          analysis: {
            summary: "Query execution failed.",
            recommendations: [
              "Check column names or joins",
              "Try a smaller window or fewer fields"
            ]
          },
          toast: {
            visible: false,
            currentStep: 5,
            totalSteps: 5,
            currentLabel: "Query failed",
            stepDescription: "Database error",
            completed: true,
            completedMessage: "Query failed"
          }
        });
        return { ok: false, reason: "query error" };
      }
      const execTime = Date.now() - qStart;

      if (rows.length === 0) {
        await analysis.update({
          stage: "analysis_ready",
          chart: { spec: null, series: [] },
          tablePreview: [],
          metrics: { executionTimeMs: execTime, rowCount: 0 },
          analysis: {
            summary: "No rows returned.",
            recommendations: [
              "Widen the date range",
              "Relax filters or groupings",
              "Verify the source has data"
            ]
          },
          toast: {
            visible: false,
            currentStep: 5,
            totalSteps: 5,
            currentLabel: "No data",
            stepDescription: "Empty result",
            completed: true,
            completedMessage: "No data returned"
          }
        });
        return { ok: true, rowCount: 0, executionTime: execTime };
      }
      // Schema summary for chart generation
      const schema = summarizeSchema(rows);

      await analysis.update({
        stage: "chart_planning",
        metrics: { executionTimeMs: execTime, rowCount: rows.length },
        tablePreview: rows.slice(0, 20),
        schemaPreview: schema,
        toast: {
          visible: true,
          currentStep: 2,
          totalSteps: 5,
          currentLabel: "Choosing chart",
          stepDescription: "Selecting encodings and chart type"
        }
      });
      yield { text: completeMessage };

      // Ask model to produce a ChartSpec JSON
      const chartUserPayload = {
        question: input.question,
        preferredChartKind: input.preferredChartKind ?? null,
        chartHints: input.chartHints ?? [],
        schema,
        // we do not send the full dataset to avoid bloat
        sample: rows.slice(0, 50)
      };

      const { object: chartGen } = await generateObject({
        model: provider.languageModel("artifact-model"),
        system: chartPrompt(context.websiteId, context.websiteHostname),
        schema: ChartSpec,
        messages: [
          {
            role: "user",
            content: JSON.stringify(chartUserPayload)
          }
        ],
      });


      const safeSpec = sanitizeChartSpec(chartGen);
      await analysis.update({
        stage: "chart_ready",
        chart: { spec: safeSpec, series: [] },
        tablePreview: rows.slice(0, 100),
        toast: {
          visible: true,
          currentStep: 3,
          totalSteps: 5,
          currentLabel: "Rendering",
          stepDescription: `Rendering ${safeSpec.kind} chart`
        }
      });
      yield { text: completeMessage };

      // Concise insights
      const numericKeys = Object.entries(schema.types)
        .filter(([, t]) => t === "number")
        .map(([k]) => k);

      const timeKey = Object.entries(schema.types).find(([, t]) => t === "date")?.[0] ?? null;

      const insightPrompt = [
        "Summarize in 2 sentences based only on sample rows and schema.",
        "If a time field exists, mention overall direction briefly.",
        "Then give 2 or 3 compact next steps."
      ].join("\n");

      const summaryGen = await generateText({
        model: provider.languageModel("artifact-model"),
        system: insightPrompt,
        messages: [
          {
            role: "user",
            content: JSON.stringify({
              schema,
              sample: rows.slice(0, 50),
              rowCount: rows.length,
              timeKey,
              numericKeys
            })
          }
        ],
        temperature: 0.2
      });

      const lines = summaryGen.text.split("\n").map(s => s.trim()).filter(Boolean);
      const summary = lines[0] || "Analysis ready.";
      const recommendations = lines.slice(1, 4).map(x => x.replace(/^[-*•]\s*/, ""));

      await analysis.update({
        stage: "metrics_ready",
        metrics: { executionTimeMs: execTime, rowCount: rows.length },
        analysis: { summary, recommendations },
        toast: {
          visible: true,
          currentStep: 4,
          totalSteps: 5,
          currentLabel: "Generating insights",
          stepDescription: "Writing a short summary"
        }
      });
      yield { text: completeMessage };

      // Final body stream
      const responseStream = streamText({
        model: provider.languageModel("artifact-model"),
        system: `
You are producing ONLY the analysis body for the canvas.
Sections:
## Data Snapshot
## Key Metrics
## Trends and Insights
## What To Explore Next
Keep it tight. No greeting.
`.trim(),
        messages: [
          {
            role: "user",
            content: JSON.stringify({
              rowCount: rows.length,
              executionTimeMs: execTime,
              hasTimeSeries: Boolean(timeKey),
              metrics: numericKeys.slice(0, 3),
              recommendations
            })
          }
        ],
        experimental_transform: smoothStream({ chunking: "word" })
      });

      let body = "";
      for await (const chunk of responseStream.textStream) {
        body += chunk;
        yield { text: completeMessage + body };
      }
      completeMessage += body;

      await analysis.update({
        stage: "analysis_ready",
        metrics: { executionTimeMs: execTime, rowCount: rows.length },
        analysis: { summary, recommendations },
        toast: {
          visible: false,
          currentStep: 5,
          totalSteps: 5,
          currentLabel: "Analysis complete",
          stepDescription: "Done",
          completed: true,
          completedMessage: "Data analysis complete"
        }
      });

      yield { text: completeMessage, forceStop: true };
      return { ok: true, rowCount: rows.length, executionTime: execTime };
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
});