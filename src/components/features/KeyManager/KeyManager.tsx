import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import type { ApiProvider } from '@/lib/types';

interface KeyManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMandatory?: boolean;
}

export function KeyManagerModal({ isOpen, onClose, isMandatory = false }: KeyManagerModalProps) {
  const { 
    provider, 
    baseUrl,
    apiKey, 
    availableModels,
    selectedModelId,
    isValid, 
    validationError, 
    setProvider, 
    setBaseUrl,
    setApiKey, 
    setSelectedModelId,
    validate, 
    clear, 
    initSession 
  } = useAppStore();
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    initSession();
  }, [initSession]);

  const handleValidate = async () => {
    setIsValidating(true);
    await validate();
    setIsValidating(false);
  };

  const hasKey = apiKey.trim().length > 0;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Configure AI API Key"
      hideClose={isMandatory}
      preventBackdropClick={isMandatory}
    >
      <div className="space-y-6">
        {isMandatory && (
          <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent flex-shrink-0">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <div className="flex flex-col">
              <p className="text-sm font-bold text-text">Configuration Required</p>
              <p className="text-xs text-muted">Please provide a valid API key to enable AI-powered natural language analysis.</p>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="provider-select" className="block text-sm font-medium text-muted mb-2">AI Provider</label>
          <Select
            id="provider-select"
            value={provider}
            onChange={(e) => setProvider(e.target.value as ApiProvider)}
            className="w-full"
          >
            <option value="anthropic">Claude (Anthropic)</option>
            <option value="openai">GPT-4o (OpenAI)</option>
            <option value="gemini">Gemini (Google)</option>
          </Select>
        </div>

        <div>
          <label htmlFor="base-url-input" className="block text-sm font-medium text-muted mb-2">Base URL</label>
          <Input
            id="base-url-input"
            placeholder="e.g. https://api.openai.com/v1"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="api-key-input" className="block text-sm font-medium text-muted mb-2">API Key</label>
          <Input
            id="api-key-input"
            type="password"
            placeholder={`Paste your ${provider === 'anthropic' ? 'Anthropic' : provider === 'openai' ? 'OpenAI' : 'Gemini'} API key`}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="mt-2 text-xs text-muted">
            Your key never leaves your browser. It&apos;s stored in session memory only.
          </p>
        </div>

        {isValid === true && availableModels.length > 0 && (
          <div>
            <label htmlFor="model-select" className="block text-sm font-medium text-muted mb-2">Model</label>
            <Select
              id="model-select"
              value={selectedModelId || ''}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-full"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || m.id} {m.description ? m.description : ''}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <Button
            onClick={handleValidate}
            disabled={isValidating || !hasKey}
            className="flex-1"
          >
            {isValidating ? 'Validating...' : 'Validate Key'}
          </Button>

          {hasKey && !isMandatory && (
            <Button variant="ghost" onClick={clear}>
              Clear
            </Button>
          )}
        </div>

        {isValid === true && (
          <div className="flex justify-center">
            <Badge variant="success">✅ Key is valid</Badge>
          </div>
        )}
        
        {isValid === false && (
          <div className="flex justify-center">
            <Badge variant="danger">❌ {validationError || 'Invalid Key'}</Badge>
          </div>
        )}
      </div>
    </Modal>
  );
}
