"use client";

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
}

export function KeyManagerModal({ isOpen, onClose }: KeyManagerModalProps) {
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
    <Modal isOpen={isOpen} onClose={onClose} title="Configure API Key">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-muted mb-2">AI Provider</label>
          <Select
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
          <label className="block text-sm font-medium text-muted mb-2">Base URL</label>
          <Input
            placeholder="e.g. https://api.openai.com/v1"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted mb-2">API Key</label>
          <Input
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
            <label className="block text-sm font-medium text-muted mb-2">Model</label>
            <Select
              value={selectedModelId || ''}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-full"
            >
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name || m.id}
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

          {hasKey && (
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
