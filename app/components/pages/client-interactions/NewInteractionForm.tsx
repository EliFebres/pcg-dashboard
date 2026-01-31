'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, ChevronDown, Check, DollarSign, Briefcase } from 'lucide-react';
import NNAModal from './NNAModal';

export interface InteractionFormData {
  externalClient: string | null;
  internalClient: string;
  intakeType: 'IRQ' | 'GRRF' | 'GCG Ad-Hoc' | '';
  adHocChannel?: 'In-Person' | 'Email' | 'Teams';
  projectType: string;
  teamMembers: string[];
  dateStarted: string;
  dateFinished?: string;
  status?: string;
  notes: string;
  portfolioLogged: boolean;
  nna: number | null;
}

export interface EditingEngagement {
  id: number;
  data: InteractionFormData;
}

interface NewInteractionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InteractionFormData) => void;
  onUpdate?: (id: number, data: InteractionFormData) => void;
  editingEngagement?: EditingEngagement | null;
}

// Internal clients grouped by department
const internalClientsByDept = {
  'IAG': ['Jennifer Martinez', 'Robert Chen', 'Amanda Foster'],
  'Broker-Dealer': ['Michael Thompson', 'Jessica Williams', 'Daniel Park'],
  'Institution': ['Christopher Lee', 'Rachel Goldman', 'Andrew Mitchell'],
};

const allInternalClients = Object.values(internalClientsByDept).flat();

// Team members
const teamMembers = [
  'Eli F.', 'Sarah K.', 'Mike R.', 'Lisa M.', 'James T.',
  'David L.', 'Rachel W.', 'Chris B.', 'Amanda P.', 'Kevin H.', 'Nicole S.', 'Brandon T.'
];

// Project types by intake
const projectTypesByIntake = {
  'IRQ': ['Meeting', 'Follow-Up', 'Data Request', 'PCR'],
  'GRRF': ['Meeting', 'Follow-Up', 'Data Request', 'PCR'],
  'GCG Ad-Hoc': ['Data Request', 'PCR', 'Other'],
};

// Parse NNA input string to number (handles commas, M, B, K suffixes)
const parseNNAInput = (input: string): number | undefined => {
  if (!input.trim()) return undefined;

  // Remove commas and spaces
  let cleaned = input.replace(/,/g, '').replace(/\s/g, '').toUpperCase();

  // Remove leading $ if present
  if (cleaned.startsWith('$')) {
    cleaned = cleaned.substring(1);
  }

  // Handle M (millions), B (billions), and K (thousands) suffixes
  let multiplier = 1;
  if (cleaned.endsWith('M')) {
    multiplier = 1_000_000;
    cleaned = cleaned.slice(0, -1);
  } else if (cleaned.endsWith('B')) {
    multiplier = 1_000_000_000;
    cleaned = cleaned.slice(0, -1);
  } else if (cleaned.endsWith('K')) {
    multiplier = 1_000;
    cleaned = cleaned.slice(0, -1);
  }

  const num = parseFloat(cleaned);
  if (isNaN(num)) return undefined;

  return Math.round(num * multiplier);
};

// Format NNA for display
const formatNNADisplay = (value: number | null): string => {
  if (!value || value === 0) return '—';
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
};

export default function NewInteractionForm({ isOpen, onClose, onSubmit, onUpdate, editingEngagement }: NewInteractionFormProps) {
  const isEditMode = !!editingEngagement;

  const getDefaultFormData = (): InteractionFormData => ({
    externalClient: '',
    internalClient: '',
    intakeType: '',
    projectType: '',
    teamMembers: [],
    dateStarted: new Date().toISOString().split('T')[0],
    notes: '',
    portfolioLogged: false,
    nna: null,
  });

  const [formData, setFormData] = useState<InteractionFormData>(getDefaultFormData());

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [internalClientSearch, setInternalClientSearch] = useState('');
  const [showInternalClientDropdown, setShowInternalClientDropdown] = useState(false);
  const [isNNAModalOpen, setIsNNAModalOpen] = useState(false);
  const internalClientRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (internalClientRef.current && !internalClientRef.current.contains(event.target as Node)) {
        setShowInternalClientDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset form when opened (or populate with editing data)
  useEffect(() => {
    if (isOpen) {
      if (editingEngagement) {
        // Pre-fill with existing data for editing
        setFormData(editingEngagement.data);
      } else {
        // Reset to defaults for new interaction
        setFormData(getDefaultFormData());
      }
      setErrors({});
      setInternalClientSearch('');
      setShowInternalClientDropdown(false);
    }
  }, [isOpen, editingEngagement]);

  // Filter internal clients based on search
  const filteredInternalClients = useMemo(() => {
    const search = internalClientSearch.toLowerCase();
    if (!search) {
      // Return all clients grouped by department
      return Object.entries(internalClientsByDept).map(([dept, clients]) => ({
        dept,
        clients,
      }));
    }
    // Filter clients that match the search
    return Object.entries(internalClientsByDept)
      .map(([dept, clients]) => ({
        dept,
        clients: clients.filter(client => client.toLowerCase().includes(search)),
      }))
      .filter(group => group.clients.length > 0);
  }, [internalClientSearch]);

  // Get available project types based on intake type
  const availableProjectTypes = formData.intakeType
    ? (projectTypesByIntake[formData.intakeType as keyof typeof projectTypesByIntake] || [])
    : [];

  // Reset project type when intake type changes (only if current project type is invalid)
  useEffect(() => {
    if (formData.intakeType && formData.projectType && !availableProjectTypes.includes(formData.projectType)) {
      setFormData(prev => ({ ...prev, projectType: '' }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.intakeType]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.intakeType) {
      newErrors.intakeType = 'Intake type is required';
    }

    if (!formData.internalClient) {
      newErrors.internalClient = 'Internal client is required';
    }

    if (!formData.projectType) {
      newErrors.projectType = 'Project type is required';
    }

    if (formData.teamMembers.length === 0) {
      newErrors.teamMembers = 'At least one team member is required';
    }

    if (!formData.dateStarted) {
      newErrors.dateStarted = 'Start date is required';
    }

    if (formData.intakeType === 'GCG Ad-Hoc' && !formData.adHocChannel) {
      newErrors.adHocChannel = 'Channel is required for GCG Ad-Hoc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const submissionData = {
        ...formData,
        externalClient: formData.externalClient?.trim() || null,
      };

      if (isEditMode && editingEngagement && onUpdate) {
        // Update existing interaction
        onUpdate(editingEngagement.id, submissionData);
      } else {
        // Create new interaction
        onSubmit({
          ...submissionData,
          nna: null, // NNA is added later, not at interaction creation
        });
      }
      onClose();
    }
  };

  const toggleTeamMember = (member: string) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.includes(member)
        ? prev.teamMembers.filter(m => m !== member)
        : [...prev.teamMembers, member]
    }));
  };

  // Animation state for smooth exit
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to ensure DOM is ready before animating in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      // Wait for exit animation to complete before unmounting
      const timer = setTimeout(() => setShouldRender(false), 330);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[100] transition-all duration-[330ms] ${
          isVisible ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none'
        }`}
        onClick={onClose}
      />

      {/* Form Panel - Centered */}
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-8 pointer-events-none"
      >
        <div
          className={`w-full max-w-2xl max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl pointer-events-auto transform transition-all duration-[330ms] overflow-hidden ${
            isVisible
              ? 'scale-100 opacity-100 translate-y-0'
              : 'scale-95 opacity-0 translate-y-4'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
        <div className="flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {isEditMode ? 'Edit Interaction' : 'New Interaction'}
              </h2>
              <p className="text-sm text-zinc-500">
                {isEditMode ? 'Update the client interaction record' : 'Create a new client interaction record'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1">
            <div className="p-6 space-y-4">
              {/* Row 1: Intake Type + Project Type + Interaction Type for Ad-Hoc */}
              <div className={`grid gap-4 ${formData.intakeType === 'GCG Ad-Hoc' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Intake Type <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.intakeType}
                      onChange={(e) => setFormData(prev => ({ ...prev, intakeType: e.target.value as 'IRQ' | 'GRRF' | 'GCG Ad-Hoc' | '', adHocChannel: undefined }))}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-zinc-800">Select...</option>
                      <option value="IRQ" className="bg-zinc-800">IRQ</option>
                      <option value="GRRF" className="bg-zinc-800">GRRF</option>
                      <option value="GCG Ad-Hoc" className="bg-zinc-800">GCG Ad-Hoc</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>
                  {errors.intakeType && <p className="mt-1 text-xs text-red-400">{errors.intakeType}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Project Type <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.projectType}
                      onChange={(e) => setFormData(prev => ({ ...prev, projectType: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-zinc-800">Select...</option>
                      {availableProjectTypes.map(type => (
                        <option key={type} value={type} className="bg-zinc-800">{type}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>
                  {errors.projectType && <p className="mt-1 text-xs text-red-400">{errors.projectType}</p>}
                </div>
                {formData.intakeType === 'GCG Ad-Hoc' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                      Interaction Type <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.adHocChannel || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, adHocChannel: e.target.value as 'In-Person' | 'Email' | 'Teams' }))}
                        className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-zinc-800">Select...</option>
                        <option value="In-Person" className="bg-zinc-800">In-Person</option>
                        <option value="Email" className="bg-zinc-800">Email</option>
                        <option value="Teams" className="bg-zinc-800">Teams</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    </div>
                    {errors.adHocChannel && <p className="mt-1 text-xs text-red-400">{errors.adHocChannel}</p>}
                  </div>
                )}
              </div>

              {/* Row 2: External Client + Internal Client */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    External Client <span className="text-zinc-500 font-normal text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.externalClient || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, externalClient: e.target.value }))}
                    placeholder="e.g., Vanguard Advisors"
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
                <div className="relative" ref={internalClientRef}>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Internal Client (GCG) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.internalClient || internalClientSearch}
                      onChange={(e) => {
                        setInternalClientSearch(e.target.value);
                        setFormData(prev => ({ ...prev, internalClient: '' }));
                        setShowInternalClientDropdown(true);
                      }}
                      onFocus={() => setShowInternalClientDropdown(true)}
                      placeholder="Search clients..."
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  </div>
                  {/* Dropdown */}
                  {showInternalClientDropdown && (
                    <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl">
                      {filteredInternalClients.length > 0 ? (
                        filteredInternalClients.map(({ dept, clients }) => (
                          <div key={dept}>
                            <div className="px-3 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-800/80">
                              {dept}
                            </div>
                            {clients.map(client => (
                              <button
                                key={client}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, internalClient: client }));
                                  setInternalClientSearch('');
                                  setShowInternalClientDropdown(false);
                                }}
                                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                                  formData.internalClient === client
                                    ? 'bg-cyan-500/20 text-cyan-400'
                                    : 'text-zinc-300 hover:bg-zinc-700/50'
                                }`}
                              >
                                {client}
                              </button>
                            ))}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-zinc-500">No matches found</div>
                      )}
                    </div>
                  )}
                  {errors.internalClient && <p className="mt-1 text-xs text-red-400">{errors.internalClient}</p>}
                </div>
              </div>

              {/* Row 3: Team Members (4 columns) */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Team Members <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {teamMembers.map((member) => (
                    <button
                      key={member}
                      type="button"
                      onClick={() => toggleTeamMember(member)}
                      className={`px-2 py-1.5 text-xs font-medium rounded-md border transition-all flex items-center justify-between ${
                        formData.teamMembers.includes(member)
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                          : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                      }`}
                    >
                      <span className="truncate">{member}</span>
                      {formData.teamMembers.includes(member) && <Check className="w-3 h-3 ml-1 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
                {errors.teamMembers && <p className="mt-1 text-xs text-red-400">{errors.teamMembers}</p>}
              </div>

              {/* Row 4: Date Started + Date Finished */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Date Started <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dateStarted}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateStarted: e.target.value }))}
                    className="w-full h-[38px] px-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                  {errors.dateStarted && <p className="mt-1 text-xs text-red-400">{errors.dateStarted}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Date Finished <span className="text-zinc-500 font-normal text-xs">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dateFinished || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateFinished: e.target.value || undefined }))}
                    className="w-full h-[38px] px-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Row 5: NNA + Client Portfolio */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Net New Assets <span className="text-zinc-500 font-normal text-xs">(Optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsNNAModalOpen(true)}
                    className={`w-full h-[38px] px-3 bg-zinc-800/50 border rounded-lg text-sm text-left transition-colors flex items-center gap-2 ${
                      formData.nna
                        ? 'border-emerald-500/50 text-emerald-400 hover:border-emerald-500/70'
                        : 'border-zinc-700 text-zinc-400 hover:border-cyan-500/50'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    {formData.nna ? formatNNADisplay(formData.nna) : '+ Add NNA'}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Client Portfolio <span className="text-zinc-500 font-normal text-xs">(Optional)</span>
                  </label>
                  <button
                    type="button"
                    className="w-full h-[38px] px-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-sm text-zinc-400 text-left hover:border-cyan-500/50 focus:outline-none focus:border-cyan-500/50 transition-colors flex items-center gap-2"
                  >
                    <Briefcase className="w-4 h-4" />
                    + Add Portfolio
                  </button>
                </div>
              </div>

              {/* Row 6: Notes */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Notes <span className="text-zinc-500 font-normal text-xs">(Optional)</span>
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any relevant notes..."
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                />
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/80">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-medium rounded-lg hover:from-blue-500 hover:to-cyan-400 transition-all"
              >
                {isEditMode ? 'Save Changes' : 'Create Interaction'}
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* NNA Modal */}
      <NNAModal
        isOpen={isNNAModalOpen}
        onClose={() => setIsNNAModalOpen(false)}
        engagementId={editingEngagement?.id || 0}
        externalClient={formData.externalClient}
        internalClient={formData.internalClient}
        currentNNA={formData.nna ?? undefined}
        onSave={(_, nna) => {
          setFormData(prev => ({ ...prev, nna: nna ?? null }));
        }}
      />
    </>
  );
}
