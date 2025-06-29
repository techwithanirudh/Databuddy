/**
 * AI Assistant API
 * 
 * Provides AI-powered analytics assistant with streaming responses and SQL query generation.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { chQuery, db, member, eq, and } from '@databuddy/db';
import type { AppVariables } from '../../types';
import { authMiddleware } from '../../middleware/auth';
import { websiteAuthHook } from '../../middleware/website';
import { logger } from '../../lib/logger';
import OpenAI from 'openai';
import { Autumn as autumn } from "autumn-js";
import { cacheable } from '@databuddy/redis';
import { AIResponseJsonSchema, enhancedAnalysisPrompt } from '../../prompts/assistant';

const openai = new OpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

export interface StreamingUpdate {
  type: 'thinking' | 'progress' | 'complete' | 'error';
  content: string;
  data?: any;
  debugInfo?: Record<string, any>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets the billing customer ID for autumn tracking
 * Uses organization owner ID if in organization context, otherwise user ID
 */
async function getBillingCustomerId(userId: string, organizationId?: string | null): Promise<string> {
  if (!organizationId) return userId;

  if (!userId) {
    throw new Error('User ID is required for billing customer ID');
  }

  const orgOwnerId = await getOrganizationOwnerId(organizationId);
  return orgOwnerId || userId;
}

/**
 * Handles autumn limit checking and tracking
 */
async function handleAutumnLimits(customerId: string, action: 'check' | 'track', value: number = 1) {
  if (!customerId) {
    logger.warn('[Assistant API] No customer ID provided for autumn limits');
    return action === 'check' ? { allowed: true, data: null } : { success: false };
  }

  try {
    if (action === 'check') {
      const { data } = await autumn.check({
        customer_id: customerId,
        feature_id: 'assistant_message',
      });

      if (data && !data.allowed) {
        return { allowed: false, error: "Assistant message limit exceeded" };
      }

      return { allowed: true, data };
    } else {
      await autumn.track({
        customer_id: customerId,
        feature_id: 'assistant_message',
        value,
      });
      return { success: true };
    }
  } catch (error) {
    logger.error(`[Assistant API] Error with autumn ${action}:`, { error });
    // Continue without autumn if service is unavailable
    return action === 'check' ? { allowed: true, data: null } : { success: false };
  }
}

async function _getOrganizationOwnerId(organizationId: string): Promise<string | null> {
  if (!organizationId) return null;

  try {
    const orgMember = await db.query.member.findFirst({
      where: and(
        eq(member.organizationId, organizationId),
        eq(member.role, 'owner'),
      ),
      columns: { userId: true },
    });

    return orgMember?.userId || null;
  } catch (error) {
    logger.error('[Assistant API] Error fetching organization owner:', { error, organizationId });
    return null;
  }
}

const getOrganizationOwnerId = cacheable(_getOrganizationOwnerId, {
  expireInSec: 300,
  prefix: 'org_owner',
  staleWhileRevalidate: true,
  staleTime: 60
});

function validateSQL(sql: string): boolean {
  // Only block truly dangerous operations - don't block safe keywords like CASE, WHEN, etc.
  const forbiddenKeywords = [
    'INSERT INTO', 'UPDATE SET', 'DELETE FROM', 'DROP TABLE', 'DROP DATABASE',
    'CREATE TABLE', 'CREATE DATABASE', 'ALTER TABLE', 'EXEC ', 'EXECUTE ',
    'TRUNCATE', 'MERGE', 'BULK', 'RESTORE', 'BACKUP'
  ];
  const upperSQL = sql.toUpperCase();

  // Check for dangerous keyword patterns
  for (const keyword of forbiddenKeywords) {
    if (upperSQL.includes(keyword)) return false;
  }

  // Block standalone UNION that could be used for injection (but allow UNION in subqueries/CTEs)
  if (upperSQL.match(/\bUNION\s+(ALL\s+)?SELECT/)) {
    return false;
  }

  // Must start with SELECT or WITH (for CTEs)
  const trimmed = upperSQL.trim();
  return trimmed.startsWith('SELECT') || trimmed.startsWith('WITH');
}

function debugLog(step: string, data: any) {
  logger.info(`🔍 [AI-Assistant] ${step}`, { step, data });
}

function createThinkingStep(step: string): string {
  return `🧠 ${step}`;
}

export const assistantRouter = new Hono<{ Variables: AppVariables }>();

assistantRouter.use('*', authMiddleware);
assistantRouter.use('*', websiteAuthHook({ website: ["read"] }));

/**
 * Process AI request with streaming updates
 * POST /assistant/stream
 */
assistantRouter.post('/stream', async (c) => {
  const { message, website_id, context } = await c.req.json();
  const website = c.get('website');
  const user = c.get('user');

  if (!website || !website.id) {
    return c.json({ error: 'Website not found' }, 404);
  }

  // Check rate limit
  if (!user) {
    return c.json({ error: 'User not found' }, 401);
  }

  // Check assistant message limits with autumn
  try {
    const customerId = await getBillingCustomerId(user.id, (website as any).organizationId);
    const limitCheck = await handleAutumnLimits(customerId, 'check');

    if (!limitCheck.allowed) {
      return c.json({
        error: limitCheck.error || "Assistant message limit exceeded",
        code: 'ASSISTANT_LIMIT_EXCEEDED'
      }, 429);
    }
  } catch (error) {
    logger.error('[Assistant API] Error checking autumn limits:', { error });
    // Continue without autumn if service is unavailable
  }

  // const rateLimitPassed = await checkRateLimit(user.id);
  // if (!rateLimitPassed) {
  //   return c.json({ 
  //     error: 'Rate limit exceeded. Please wait before making another request.',
  //     code: 'RATE_LIMIT_EXCEEDED' 
  //   }, 429);
  // }

  const websiteHostname = website.domain;
  const startTime = Date.now();
  const debugInfo: Record<string, any> = {};

  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (update: StreamingUpdate) => {
        const data = `data: ${JSON.stringify(update)}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
      };

      try {
        debugLog("✅ Input validated", { message, website_id, websiteHostname });
        if ((user as any).role === 'ADMIN') {
          debugInfo.validatedInput = { message, website_id, websiteHostname };
        }

        const aiStart = Date.now();

        const fullPrompt = enhancedAnalysisPrompt(message, website_id, websiteHostname, context?.previousMessages);

        const completion = await openai.chat.completions.create({
          model: 'google/gemini-2.0-flash-001',
          messages: [
            {
              role: 'system',
              content: fullPrompt
            }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        });

        const aiResponseText = completion.choices[0]?.message?.content || '';
        const aiTime = Date.now() - aiStart;

        debugLog("📝 Raw AI JSON response", { aiResponseText, timeTaken: `${aiTime}ms` });

        let parsedAiJson: z.infer<typeof AIResponseJsonSchema>;
        try {
          const cleanedResponse = aiResponseText.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
          debugLog("🧹 Cleaned AI response", { cleanedResponse });

          const jsonParsed = JSON.parse(cleanedResponse);
          debugLog("📋 JSON parsed successfully", { jsonParsed });

          parsedAiJson = AIResponseJsonSchema.parse(jsonParsed);
          debugLog("✅ AI JSON response parsed", parsedAiJson);
        } catch (parseError) {
          debugLog("❌ AI JSON parsing failed", {
            error: parseError,
            rawText: aiResponseText,
            errorMessage: parseError instanceof Error ? parseError.message : 'Unknown error'
          });
          sendUpdate({
            type: 'error',
            content: "AI response parsing failed. Please try rephrasing.",
            debugInfo: (user as any).role === 'ADMIN' ? {
              ...debugInfo,
              parseError: parseError instanceof Error ? parseError.message : 'Unknown error',
              rawResponse: aiResponseText
            } : undefined
          });
          controller.close();
          return;
        }

        if (parsedAiJson.thinking_steps && parsedAiJson.thinking_steps.length > 0) {
          for (const step of parsedAiJson.thinking_steps) {
            sendUpdate({
              type: 'thinking',
              content: createThinkingStep(step),
            });
            // A short delay to make the steps appear sequentially
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        if (parsedAiJson.response_type === 'text') {
          // Track successful assistant message usage
          try {
            const customerId = await getBillingCustomerId(user.id, (website as any).organizationId);
            await handleAutumnLimits(customerId, 'track', 1);
          } catch (error) {
            logger.error('[Assistant API] Error tracking autumn usage:', { error });
          }

          sendUpdate({
            type: 'complete',
            content: parsedAiJson.text_response || "Here's the answer to your question.",
            data: {
              hasVisualization: false,
              responseType: 'text'
            },
            debugInfo: (user as any).role === 'ADMIN' ? debugInfo : undefined
          });
          controller.close();
          return;
        }

        if (parsedAiJson.response_type === 'metric') {
          if (parsedAiJson.sql) {
            const sql = parsedAiJson.sql;
            console.log('Metric SQL:', sql);
            if (!validateSQL(sql)) {
              sendUpdate({
                type: 'error',
                content: "Generated query failed security validation.",
                debugInfo: (user as any).role === 'ADMIN' ? debugInfo : undefined
              });
              controller.close();
              return;
            }

            try {
              const queryStart = Date.now();
              const queryData = await chQuery(sql);
              const queryTime = Date.now() - queryStart;

              let metricValue = parsedAiJson.metric_value;
              if (queryData.length > 0 && queryData[0]) {
                const firstRow = queryData[0];
                const valueKey = Object.keys(firstRow).find(key => typeof firstRow[key] === 'number') ||
                  Object.keys(firstRow)[0];
                if (valueKey) {
                  metricValue = firstRow[valueKey];
                }
              }

              // Track successful assistant message usage
              try {
                const customerId = await getBillingCustomerId(user.id, (website as any).organizationId);
                await handleAutumnLimits(customerId, 'track', 1);
              } catch (error) {
                logger.error('[Assistant API] Error tracking autumn usage:', { error });
              }

              sendUpdate({
                type: 'complete',
                content: parsedAiJson.text_response || `${parsedAiJson.metric_label || 'Result'}: ${typeof metricValue === 'number' ? metricValue.toLocaleString() : metricValue}`,
                data: {
                  hasVisualization: false,
                  responseType: 'metric',
                  metricValue: metricValue,
                  metricLabel: parsedAiJson.metric_label
                },
                debugInfo: (user as any).role === 'ADMIN' ? debugInfo : undefined
              });

            } catch (queryError: any) {
              debugLog("❌ Metric SQL execution error", { error: queryError.message, sql });

              // Track successful assistant message usage (even with SQL error, we provided a response)
              try {
                const customerId = await getBillingCustomerId(user.id, (website as any).organizationId);
                await handleAutumnLimits(customerId, 'track', 1);
              } catch (error) {
                logger.error('[Assistant API] Error tracking autumn usage:', { error });
              }

              sendUpdate({
                type: 'complete',
                content: parsedAiJson.text_response || `${parsedAiJson.metric_label || 'Result'}: ${typeof parsedAiJson.metric_value === 'number' ? parsedAiJson.metric_value.toLocaleString() : parsedAiJson.metric_value}`,
                data: {
                  hasVisualization: false,
                  responseType: 'metric',
                  metricValue: parsedAiJson.metric_value,
                  metricLabel: parsedAiJson.metric_label
                },
                debugInfo: (user as any).role === 'ADMIN' ? debugInfo : undefined
              });
            }
          } else {
            // Track successful assistant message usage
            try {
              const customerId = await getBillingCustomerId(user.id, (website as any).organizationId);
              await handleAutumnLimits(customerId, 'track', 1);
            } catch (error) {
              logger.error('[Assistant API] Error tracking autumn usage:', { error });
            }

            sendUpdate({
              type: 'complete',
              content: parsedAiJson.text_response || `${parsedAiJson.metric_label || 'Result'}: ${typeof parsedAiJson.metric_value === 'number' ? parsedAiJson.metric_value.toLocaleString() : parsedAiJson.metric_value}`,
              data: {
                hasVisualization: false,
                responseType: 'metric',
                metricValue: parsedAiJson.metric_value,
                metricLabel: parsedAiJson.metric_label
              },
              debugInfo: (user as any).role === 'ADMIN' ? debugInfo : undefined
            });
          }
          controller.close();
          return;
        }

        if (parsedAiJson.response_type === 'chart' && parsedAiJson.sql) {
          const sql = parsedAiJson.sql;
          console.log(sql);
          if (!validateSQL(sql)) {
            sendUpdate({
              type: 'error',
              content: "Generated query failed security validation.",
              debugInfo: (user as any).role === 'ADMIN' ? debugInfo : undefined
            });
            controller.close();
            return;
          }

          try {
            const queryStart = Date.now();
            const queryData = await chQuery(sql);
            const queryTime = Date.now() - queryStart;
            const totalTime = Date.now() - startTime;

            debugLog("✅ Query executed successfully", {
              resultCount: queryData.length,
              timeTaken: `${queryTime}ms`,
              totalTime: `${totalTime}ms`,
              sampleData: queryData.slice(0, 3)
            });

            if ((user as any).role === 'ADMIN') {
              debugInfo.processing = { aiTime, queryTime, totalTime };
            }

            const finalContent = queryData.length > 0
              ? `Found ${queryData.length} data points. Displaying as a ${parsedAiJson.chart_type?.replace(/_/g, ' ') || 'chart'}.`
              : "No data found for your query.";

            // Track successful assistant message usage
            try {
              const customerId = await getBillingCustomerId(user.id, (website as any).organizationId);
              await handleAutumnLimits(customerId, 'track', 1);
            } catch (error) {
              logger.error('[Assistant API] Error tracking autumn usage:', { error });
            }

            sendUpdate({
              type: 'complete',
              content: finalContent,
              data: {
                hasVisualization: queryData.length > 0,
                chartType: parsedAiJson.chart_type,
                data: queryData,
                responseType: 'chart'
              },
              debugInfo: (user as any).role === 'ADMIN' ? debugInfo : undefined
            });

          } catch (queryError: any) {
            debugLog("❌ SQL execution error", { error: queryError.message, sql });
            sendUpdate({
              type: 'error',
              content: "Database query failed. The data might not be available.",
              debugInfo: (user as any).role === 'ADMIN' ? debugInfo : undefined
            });
          }
        } else {
          sendUpdate({
            type: 'error',
            content: "Invalid response format from AI.",
            debugInfo: (user as any).role === 'ADMIN' ? debugInfo : undefined
          });
        }

        controller.close();

      } catch (error: any) {
        debugLog("💥 Processing error", { error: error.message });
        if (error.name === 'ZodError') {
          sendUpdate({
            type: 'error',
            content: `Invalid input: ${error.errors?.map((e: any) => e.message).join(', ')}`,
            debugInfo: (user as any).role === 'ADMIN' ? debugInfo : undefined
          });
        } else {
          sendUpdate({
            type: 'error',
            content: "An unexpected error occurred.",
            debugInfo: (user as any).role === 'ADMIN' ? { error: error.message } : undefined
          });
        }
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
});

export default assistantRouter; 