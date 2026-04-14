import { useAppStore } from './store';

interface QueryContext {
  columns: { name: string; type: string }[];
  sampleRows: Record<string, unknown>[];
}

export async function generateSQL(prompt: string, context: QueryContext): Promise<string> {
  const { provider, apiKey, baseUrl, selectedModelId } = useAppStore.getState();

  const systemPrompt = `You are a SQL expert. The user has a CSV file loaded into DuckDB as a table called \`data\`.

Table schema:
${JSON.stringify(context.columns, null, 2)}

Sample rows (first 20):
${JSON.stringify(context.sampleRows, null, 2)}

Rules:
- Write ONLY a single DuckDB-compatible SQL SELECT query
- Do NOT use Python, pandas, or any non-SQL syntax
- Do NOT wrap in markdown code blocks
- The table name is always \`data\`
- Return ONLY the SQL query, nothing else`;

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
      return data.candidates[0].content.parts[0].text.trim().replace(/^```sql\n?|```$/g, '');
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
      return data.choices[0].message.content.trim().replace(/^```sql\n?|```$/g, '');
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
      return data.content[0].text.trim().replace(/^```sql\n?|```$/g, '');
    }

    throw new Error(`Unsupported provider: ${provider}`);
  } catch (error) {
    console.error('AI Service Error:', error);
    throw error;
  }
}
