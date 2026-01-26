/**
 * Endpoint Form Modal
 * Create/Edit endpoint configuration
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { endpointsApi, Endpoint, CreateEndpointData, ScrapingStep } from '../api/endpoints';
import { getErrorMessage } from '../utils/error.utils';
import { showError, showSuccess } from '../utils/toast.utils';
import { Button, Modal, ModalFooter, Input, Select, FormField } from './ui';

interface EndpointFormModalProps {
  endpoint?: Endpoint | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EndpointFormModal({ endpoint, onClose, onSuccess }: EndpointFormModalProps) {
  const isEditing = !!endpoint;

  const [formData, setFormData] = useState<CreateEndpointData>({
    name: endpoint?.name || '',
    ipAddress: endpoint?.ipAddress || '',
    type: endpoint?.type || 'power-meter',
    vendor: endpoint?.vendor || '',
    location: endpoint?.location || '',
    clientName: endpoint?.clientName || '',
    authType: endpoint?.authType || 'none',
    authConfig: endpoint?.authConfig || undefined,
    scrapingConfig: endpoint?.scrapingConfig || {
      steps: [{ action: 'navigate', url: '' }],
      valueSelector: '',
      valuePattern: '',
      timeout: 30000,
    },
    enabled: endpoint?.enabled ?? true,
    pollInterval: endpoint?.pollInterval || 15,
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: CreateEndpointData) => {
      if (isEditing && endpoint) {
        return endpointsApi.update(endpoint.id, data);
      } else {
        return endpointsApi.create(data);
      }
    },
    onSuccess: () => {
      showSuccess(isEditing ? 'Endpoint updated successfully' : 'Endpoint created successfully');
      onSuccess();
    },
    onError: (error: any) => {
      showError(`Failed to save endpoint: ${getErrorMessage(error)}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveMutation.mutateAsync(formData);
  };

  const addScrapingStep = () => {
    setFormData({
      ...formData,
      scrapingConfig: {
        ...formData.scrapingConfig,
        steps: [...formData.scrapingConfig.steps, { action: 'navigate', url: '' }],
      },
    });
  };

  const removeScrapingStep = (index: number) => {
    setFormData({
      ...formData,
      scrapingConfig: {
        ...formData.scrapingConfig,
        steps: formData.scrapingConfig.steps.filter((_, i) => i !== index),
      },
    });
  };

  const updateScrapingStep = (index: number, step: Partial<ScrapingStep>) => {
    const newSteps = [...formData.scrapingConfig.steps];
    newSteps[index] = { ...newSteps[index], ...step };
    setFormData({
      ...formData,
      scrapingConfig: {
        ...formData.scrapingConfig,
        steps: newSteps,
      },
    });
  };

  return (

    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEditing ? 'Edit Endpoint' : 'Add New Endpoint'}
      size="full"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Name" required>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Rack 1 Power Meter"
              />
            </FormField>

            <FormField label="IP Address" required>
              <Input
                value={formData.ipAddress}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                placeholder="192.168.1.100"
              />
            </FormField>

            <FormField label="Type">
              <Input
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="power-meter"
              />
            </FormField>

            <FormField label="Vendor">
              <Input
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="APC, Schneider, etc."
              />
            </FormField>

            <FormField label="Location">
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Room A, Rack 1"
              />
            </FormField>

            <FormField label="Client Name">
              <Input
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Client XYZ"
              />
            </FormField>

            <FormField label="Poll Interval (minutes)">
              <Input
                type="number"
                min={1}
                value={formData.pollInterval}
                onChange={(e) => setFormData({ ...formData, pollInterval: parseInt(e.target.value) })}
              />
            </FormField>

            <div className="flex items-center pt-8">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enabled
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Authentication */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Authentication
          </h3>
          <div className="space-y-4">
            <FormField label="Auth Type">
              <Select
                value={formData.authType}
                onChange={(e) => setFormData({ ...formData, authType: e.target.value as any })}
              >
                <option value="none">None</option>
                <option value="basic">Basic Auth</option>
                <option value="form">Form Login</option>
              </Select>
            </FormField>

            {formData.authType === 'basic' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Username">
                  <Input
                    value={formData.authConfig?.username || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      authConfig: { ...formData.authConfig, username: e.target.value },
                    })}
                  />
                </FormField>
                <FormField label="Password">
                  <Input
                    type="password"
                    value={formData.authConfig?.password || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      authConfig: { ...formData.authConfig, password: e.target.value },
                    })}
                  />
                </FormField>
              </div>
            )}

            {formData.authType === 'form' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Username">
                    <Input
                      value={formData.authConfig?.username || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        authConfig: { ...formData.authConfig, username: e.target.value },
                      })}
                      placeholder="admin"
                    />
                  </FormField>
                  <FormField label="Password">
                    <Input
                      type="password"
                      value={formData.authConfig?.password || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        authConfig: { ...formData.authConfig, password: e.target.value },
                      })}
                    />
                  </FormField>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="Username Selector (CSS)">
                    <Input
                      value={formData.authConfig?.usernameSelector || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        authConfig: { ...formData.authConfig, usernameSelector: e.target.value },
                      })}
                      placeholder="input[name='username']"
                    />
                  </FormField>
                  <FormField label="Password Selector (CSS)">
                    <Input
                      value={formData.authConfig?.passwordSelector || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        authConfig: { ...formData.authConfig, passwordSelector: e.target.value },
                      })}
                      placeholder="input[name='password']"
                    />
                  </FormField>
                  <FormField label="Submit Button Selector (CSS)">
                    <Input
                      value={formData.authConfig?.submitSelector || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        authConfig: { ...formData.authConfig, submitSelector: e.target.value },
                      })}
                      placeholder="button[type='submit']"
                    />
                  </FormField>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  If selectors are left empty, default selectors will be used (input[name='username'], input[name='password'], button[type='submit'])
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Scraping Configuration */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Scraping Configuration
          </h3>

          {/* Steps */}
          <div className="space-y-3 mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Scraping Steps
            </label>
            {formData.scrapingConfig.steps.map((step, index) => (
              <div key={index} className="flex gap-2 items-start p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <Select
                    value={step.action}
                    onChange={(e) => updateScrapingStep(index, { action: e.target.value as any })}
                  >
                    <option value="navigate">Navigate</option>
                    <option value="click">Click</option>
                    <option value="type">Type</option>
                    <option value="wait">Wait</option>
                    <option value="select">Select</option>
                  </Select>

                  {step.action === 'navigate' && (
                    <div className="col-span-2">
                      <Input
                        placeholder="URL"
                        value={step.url || ''}
                        onChange={(e) => updateScrapingStep(index, { url: e.target.value })}
                      />
                    </div>
                  )}

                  {(step.action === 'click' || step.action === 'type' || step.action === 'select') && (
                    <>
                      <Input
                        placeholder="CSS Selector"
                        value={step.selector || ''}
                        onChange={(e) => updateScrapingStep(index, { selector: e.target.value })}
                      />
                      {step.action === 'type' && (
                        <Input
                          placeholder="Value"
                          value={step.value || ''}
                          onChange={(e) => updateScrapingStep(index, { value: e.target.value })}
                        />
                      )}
                    </>
                  )}

                  {step.action === 'wait' && (
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Timeout (ms)"
                        value={step.timeout || 1000}
                        onChange={(e) => updateScrapingStep(index, { timeout: parseInt(e.target.value) })}
                      />
                    </div>
                  )}
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => removeScrapingStep(index)}
                  className="mt-0.5"
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={addScrapingStep}
              leftIcon={<Plus size={16} />}
              className="text-blue-600 dark:text-blue-400"
            >
              Add Step
            </Button>
          </div>

          {/* Value Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Value Selector (CSS)" required>
              <Input
                value={formData.scrapingConfig.valueSelector}
                onChange={(e) => setFormData({
                  ...formData,
                  scrapingConfig: { ...formData.scrapingConfig, valueSelector: e.target.value },
                })}
                placeholder=".kwh-value"
              />
            </FormField>

            <FormField label="Value Pattern (Regex)">
              <Input
                value={formData.scrapingConfig.valuePattern || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  scrapingConfig: { ...formData.scrapingConfig, valuePattern: e.target.value },
                })}
                placeholder="(\d+\.?\d*)"
              />
            </FormField>
          </div>
        </div>
      </form>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit as any}
          disabled={saveMutation.isPending}
          isLoading={saveMutation.isPending}
        >
          {isEditing ? 'Update Endpoint' : 'Create Endpoint'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
