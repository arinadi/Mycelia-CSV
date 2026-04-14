# Module 1: Key Manager

**Estimated Complexity:** S  
**Estimated Files:** ~4  
**Key Risks:** API key must never touch localStorage or be logged

## Requirements
- Provider selector: Claude (Anthropic) or GPT-4o (OpenAI)
- API key text input (masked, type="password")
- Validate key by making a minimal test API call (1-token ping)
- Store validated key in `sessionStorage` only — auto-clears on tab close
- Visual status: validating spinner → valid ✅ / invalid ❌ with error reason
- "Clear key" button
- Key persists across prompts within the same session

## UI Structure

**Component:** `<KeyManager />` — rendered in top bar of main layout

Layout: horizontal bar at top of page
```
[Provider: Claude ▼]  [sk-ant-••••••••••••••••] [Validate] [✅ Valid]
```

- Provider dropdown: "Claude (Anthropic)" | "GPT-4o (OpenAI)"
- Key input: `type="password"`, placeholder "Paste your API key"
- Validate button: disabled while validating
- Status badge: hidden until validation attempted
- Clear button: appears only when key is set

## Data & API

References `ApiConfig` entity from modules.md.

**Zustand slice:**
```ts
interface ApiConfigSlice {
  provider: 'anthropic' | 'openai'
  apiKey: string
  isValid: boolean | null   // null = not yet validated
  setProvider: (p) => void
  setApiKey: (k: string) => void
  validate: () => Promise<void>
  clear: () => void
}
```

**sessionStorage key:** `csv_reporter_api_key` (write on validate success, clear on `clear()`)

**Validation ping:**
- Anthropic: `POST /v1/messages` with `max_tokens: 1`, model `claude-3-5-haiku-20241022`
- OpenAI: `POST /v1/chat/completions` with `max_tokens: 1`, model `gpt-4o-mini`
- Success = 200 response (even if content is empty)
- Failure = 401 → "Invalid key", 429 → "Rate limited — key is valid", network → "Cannot reach API"

## Technical Implementation

- Direct `fetch()` calls to Anthropic/OpenAI APIs (no SDK needed for ping — avoids bundle bloat in this module)
- SDK used in Module 4 for full query generation
- CSP headers in `next.config.js` must allow `https://api.anthropic.com` and `https://api.openai.com`

## Testing
✅ Entering a valid Anthropic key shows "Valid" badge  
✅ Entering an invalid key shows "Invalid key" error  
✅ Refreshing page clears the key (sessionStorage test)  
✅ Switching provider clears current validation status  
✅ Key is not visible in Network tab request bodies (only in Authorization header)  
✅ No key written to localStorage (verify in DevTools → Application → Local Storage)
