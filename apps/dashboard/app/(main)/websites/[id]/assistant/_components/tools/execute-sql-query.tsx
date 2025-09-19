import React from 'react'
import type { QueryResult } from '@databuddy/ai/tools/execute-sql-query'
import { SqlHighlighter } from '@/app/(main)/observability/database/[id]/performance/_components/sql-highlighter'

export function ExecuteSQLQuery({ output }: { output: QueryResult }) {
  return (
    <div>
        {JSON.stringify(output, null, 2)}
    </div>
  )
}
