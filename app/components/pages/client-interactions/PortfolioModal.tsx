'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Briefcase, Plus, Trash2, ClipboardPaste } from 'lucide-react';
import { AssetClass, PortfolioHolding } from '@/app/lib/types/engagements';

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPortfolio: PortfolioHolding[] | undefined;
  onSave: (portfolio: PortfolioHolding[] | undefined) => void;
}

interface EditableHolding {
  id: string;
  identifier: string;
  assetClass: AssetClass | '';
  weight: string;
}

const ASSET_CLASSES: AssetClass[] = ['Equity', 'Fixed Income', 'Alternatives'];

const createEmptyRow = (): EditableHolding => ({
  id: crypto.randomUUID(),
  identifier: '',
  assetClass: '',
  weight: '',
});

const PortfolioModal: React.FC<PortfolioModalProps> = ({
  isOpen,
  onClose,
  currentPortfolio,
  onSave,
}) => {
  const [holdings, setHoldings] = useState<EditableHolding[]>([createEmptyRow()]);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Handle animation states
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 220);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Reset holdings when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setPasteError(null);
      if (currentPortfolio && currentPortfolio.length > 0) {
        setHoldings(
          currentPortfolio.map((h) => ({
            id: crypto.randomUUID(),
            identifier: h.identifier,
            assetClass: h.assetClass,
            weight: (h.weight * 100).toFixed(2), // Convert to percentage for display
          }))
        );
      } else {
        setHoldings([createEmptyRow()]);
      }
    }
  }, [isOpen, currentPortfolio]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const updateHolding = (id: string, field: keyof EditableHolding, value: string) => {
    setHoldings((prev) => {
      const updated = prev.map((h) => (h.id === id ? { ...h, [field]: value } : h));

      // Check if we should auto-add a new row
      const lastRow = updated[updated.length - 1];
      const isLastRowComplete = lastRow.identifier.trim() && lastRow.assetClass && lastRow.weight.trim();

      if (isLastRowComplete) {
        return [...updated, createEmptyRow()];
      }

      return updated;
    });
  };

  const addRow = () => {
    setHoldings((prev) => [...prev, createEmptyRow()]);
  };

  const removeRow = (id: string) => {
    setHoldings((prev) => {
      const filtered = prev.filter((h) => h.id !== id);
      return filtered.length === 0 ? [createEmptyRow()] : filtered;
    });
  };

  // Parse asset class from string (handles variations)
  const parseAssetClass = (value: string): AssetClass | '' => {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'equity' || normalized === 'eq' || normalized === 'stock' || normalized === 'stocks') {
      return 'Equity';
    }
    if (normalized === 'fixed income' || normalized === 'fi' || normalized === 'bond' || normalized === 'bonds' || normalized === 'fixedincome') {
      return 'Fixed Income';
    }
    if (normalized === 'alternatives' || normalized === 'alt' || normalized === 'alts' || normalized === 'alternative') {
      return 'Alternatives';
    }
    return '';
  };

  // Handle paste from Excel (tab-separated or comma-separated)
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText.trim()) return;

    // Determine delimiter (tab for Excel, comma for CSV)
    const hasTab = pastedText.includes('\t');
    const delimiter = hasTab ? '\t' : ',';

    const lines = pastedText.trim().split('\n').filter((line) => line.trim());
    if (lines.length === 0) return;

    e.preventDefault();
    setPasteError(null);

    const newHoldings: EditableHolding[] = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
      const parts = line.split(delimiter).map((p) => p.trim());

      if (parts.length >= 1) {
        const identifier = parts[0] || '';
        const assetClassStr = parts[1] || '';
        const weightStr = parts[2] || '';

        const assetClass = parseAssetClass(assetClassStr);

        if (assetClassStr && !assetClass) {
          errors.push(`Row ${index + 1}: Unknown asset class "${assetClassStr}"`);
        }

        newHoldings.push({
          id: crypto.randomUUID(),
          identifier,
          assetClass,
          weight: weightStr.replace('%', '').trim(),
        });
      }
    });

    if (newHoldings.length > 0) {
      // If current holdings only has one empty row, replace it
      if (holdings.length === 1 && !holdings[0].identifier && !holdings[0].weight) {
        setHoldings(newHoldings);
      } else {
        setHoldings((prev) => [...prev, ...newHoldings]);
      }
    }

    if (errors.length > 0) {
      setPasteError(errors.join('; '));
    }
  }, [holdings]);

  // Normalize weights to sum to 1
  const normalizeWeights = (rawHoldings: EditableHolding[]): PortfolioHolding[] => {
    const validHoldings = rawHoldings.filter(
      (h) => h.identifier.trim() && h.assetClass && h.weight
    );

    if (validHoldings.length === 0) return [];

    const weights = validHoldings.map((h) => parseFloat(h.weight) || 0);
    const sum = weights.reduce((a, b) => a + b, 0);

    if (sum === 0) return [];

    return validHoldings.map((h, i) => ({
      identifier: h.identifier.trim().toUpperCase(),
      assetClass: h.assetClass as AssetClass,
      weight: weights[i] / sum, // Normalize to sum to 1
    }));
  };

  const handleSave = () => {
    const normalized = normalizeWeights(holdings);
    onSave(normalized.length > 0 ? normalized : undefined);
    onClose();
  };

  const handleClear = () => {
    onSave(undefined);
    onClose();
  };

  // Calculate preview of normalized weights
  const previewNormalized = normalizeWeights(holdings);
  const hasValidHoldings = previewNormalized.length > 0;
  const hasChanges =
    JSON.stringify(previewNormalized) !== JSON.stringify(currentPortfolio || []);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/70 transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/50 shadow-2xl transition-all duration-200 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Gradient border effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        {/* Header */}
        <div className="relative z-10 px-5 py-4 border-b border-zinc-800/50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-medium text-white">Client Portfolio</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Add holdings with identifier, asset class, and weight
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div
          ref={tableRef}
          className="relative z-10 p-5 max-h-[60vh] overflow-y-auto"
          onPaste={handlePaste}
        >
          {/* Paste hint */}
          <div className="mb-4 p-3 bg-zinc-800/30 border border-zinc-700/30 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <ClipboardPaste className="w-4 h-4" />
              <span>
                Paste from Excel: columns should be Identifier, Asset Class, Weight (tab or comma separated)
              </span>
            </div>
          </div>

          {pasteError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-xs text-red-400">{pasteError}</p>
            </div>
          )}

          {/* Table */}
          <div className="border border-zinc-700/50 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_1fr_100px_40px] gap-2 px-3 py-2 bg-zinc-800/50 border-b border-zinc-700/50">
              <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Identifier
              </div>
              <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Asset Class
              </div>
              <div className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Weight
              </div>
              <div></div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-zinc-800/50">
              {holdings.map((holding) => (
                <div
                  key={holding.id}
                  className="grid grid-cols-[1fr_1fr_100px_40px] gap-2 px-3 py-2 items-center"
                >
                  <input
                    type="text"
                    value={holding.identifier}
                    onChange={(e) =>
                      updateHolding(holding.id, 'identifier', e.target.value.toUpperCase())
                    }
                    placeholder="AAPL, US0378331005..."
                    className="w-full px-2 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-colors font-mono"
                  />
                  <select
                    value={holding.assetClass}
                    onChange={(e) =>
                      updateHolding(holding.id, 'assetClass', e.target.value)
                    }
                    className="w-full px-2 py-1.5 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-zinc-800">
                      Select...
                    </option>
                    {ASSET_CLASSES.map((ac) => (
                      <option key={ac} value={ac} className="bg-zinc-800">
                        {ac}
                      </option>
                    ))}
                  </select>
                  <div className="relative">
                    <input
                      type="text"
                      value={holding.weight}
                      onChange={(e) => {
                        // Allow numbers and decimals only
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        updateHolding(holding.id, 'weight', val);
                      }}
                      placeholder="10"
                      className="w-full px-2 py-1.5 pr-6 bg-zinc-800/50 border border-zinc-700/50 rounded text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-colors text-right font-mono"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                      %
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(holding.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Row Button */}
            <div className="px-3 py-2 border-t border-zinc-700/50">
              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Row
              </button>
            </div>
          </div>

          {/* Preview */}
          {hasValidHoldings && (
            <div className="mt-4 p-3 bg-zinc-800/30 border border-zinc-700/30 rounded-lg">
              <p className="text-xs text-zinc-400 mb-2">
                Normalized Preview (weights sum to 100%):
              </p>
              <div className="space-y-1">
                {previewNormalized.map((h, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_1fr_80px] gap-2 text-sm"
                  >
                    <span className="font-mono text-white">{h.identifier}</span>
                    <span className="text-zinc-400">{h.assetClass}</span>
                    <span className="font-mono text-cyan-400 text-right">
                      {(h.weight * 100).toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-10 px-5 py-4 border-t border-zinc-800/50 flex items-center justify-between">
          <div>
            {currentPortfolio && currentPortfolio.length > 0 && (
              <button
                onClick={handleClear}
                className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                Clear Portfolio
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${
                hasChanges
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-500 hover:to-cyan-400'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Save Portfolio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioModal;
