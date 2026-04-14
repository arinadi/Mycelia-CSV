import { safeStringify } from './utils';

interface QueryContext {
  columns: { name: string; type: string }[];
  sampleRows: Record<string, unknown>[];
}

export interface AiConfig {
  provider: 'openai' | 'anthropic' | 'gemini';
  apiKey: string;
  baseUrl: string;
  selectedModelId: string;
}

function cleanSql(text: string): string {
  // 1. Try to find the first SQL block
  const sqlMatch = text.match(/```sql\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
  if (sqlMatch) return sqlMatch[1].trim();
  
  // 2. Fallback: Strip any remaining backticks and trim
  return text.replace(/```sql|```/g, '').trim();
}

export function getSystemPrompt(context: QueryContext): string {
  return `CRITICAL: RETURN ONLY RAW SQL. NO MARKDOWN. NO EXPLANATIONS. NO CHAT.
If you include anything else, the system will CRASH.
ONLY ONE QUERY IS ALLOWED. NO ALTERNATIVES.

### DuckDB SQL Dialect & Rules:
1. **PostgreSQL Compatibility**: Use standard PostgreSQL syntax.
2. **Aggregates & Filtering**: Aggregates MUST NOT be in WHERE. Use HAVING/Subqueries.
3. **COMPLEX FORMAT DETECTION**:
   - **JSON**: Extract with \`json_extract(col, '$.key')\`.
   - **PHP SERIALIZED**: Since DuckDB lacks native PHP unserialize, use REGEXP:
     - KEY PATTERN: \`s:[0-9]+:"key_name";\`
     - STRING VALUE PATTERN: \`s:[0-9]+:"([^"]+)"\`
     - INT VALUE PATTERN: \`i:([0-9]+)\`
     - EXAMPLE: To extract 'device_id' (string): \`regexp_extract(col, 's:[0-9]+:"device_id";s:[0-9]+:"([^"]+)"', 1)\`
     - NOTE: Use \`[0-9]+\` instead of \`\\d+\` to avoid escape confusion.
4. **Dates & Schema Authority**: 
   - **IMPORTANT**: The schema 'type' is the absolute truth.
   - If column type is **TIMESTAMP** or **DATE**: It is already a native DuckDB object. **DO NOT divide by 1000**. Just use \`strftime(col, '%Y-%m-%d %H:%M')\`.
   - If column type is **BIGINT** and contains Unix ms: Use \`strftime(to_timestamp(col / 1000), '%Y-%m-%d %H:%M')\`.
   - If column type is **VARCHAR**: Use \`strftime(strptime(col, '%Y-%m-%dT%H:%M:%Z'), '%Y-%m-%d %H:%M')\`.
   - **MANDATORY**: Always format output date/time columns to readable strings proactively.
5. **Context**: Table is 'data'.
   - Note: Sample data may show numeric timestamps (e.g. 1713076200000) for columns that DuckDB has already inferred as TIMESTAMP. Always treat them as TIMESTAMP objects if the schema says so.

### SAMPLE DATA REFERENCE:
${safeStringify(context.sampleRows, 2)}`;
}

export async function generateSQL(
  prompt: string, 
  context: QueryContext,
  config: AiConfig
): Promise<string> {
  const { provider, apiKey, baseUrl, selectedModelId } = config;
  const systemPrompt = getSystemPrompt(context);

  try {
    if (provider === 'gemini') {
      const url = `${baseUrl}/models/${selectedModelId}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\nUser request: ${prompt}` }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500,
          }
        })
      });

      if (!response.ok) throw new Error(`Gemini API error: ${response.statusText}`);
      const data = await response.json();
      return cleanSql(data.candidates[0].content.parts[0].text);
    }

    if (provider === 'openai') {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: selectedModelId,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
        })
      });

      if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);
      const data = await response.json();
      return cleanSql(data.choices[0].message.content);
    }

    if (provider === 'anthropic') {
      const response = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: selectedModelId,
          max_tokens: 500,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) throw new Error(`Anthropic API error: ${response.statusText}`);
      const data = await response.json();
      return cleanSql(data.content[0].text);
    }

    throw new Error(`Unsupported provider: ${provider}`);
  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
}
