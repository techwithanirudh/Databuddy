"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    PencilIcon,
    Target,
    Eye,
    MouseMiddleClick
} from "@phosphor-icons/react";
import type { Funnel, FunnelStep, AutocompleteData, CreateFunnelData } from "@/hooks/use-funnels";
import { AutocompleteInput } from "../../funnels/_components/funnel-components";

interface EditGoalDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (goal: Funnel) => Promise<void>;
    onCreate?: (data: CreateFunnelData) => Promise<void>;
    goal: Funnel | null;
    isUpdating: boolean;
    isCreating?: boolean;
    autocompleteData?: AutocompleteData;
}

export function EditGoalDialog({
    isOpen,
    onClose,
    onSubmit,
    onCreate,
    goal,
    isUpdating,
    isCreating = false,
    autocompleteData
}: EditGoalDialogProps) {
    const [formData, setFormData] = useState<Funnel | null>(null);
    const isCreateMode = !goal;

    useEffect(() => {
        if (goal) {
            setFormData({
                ...goal,
                filters: goal.filters || []
            });
        } else {
            // Initialize for create mode with a single step
            setFormData({
                id: '',
                name: '',
                description: '',
                steps: [
                    { type: 'PAGE_VIEW' as const, target: '', name: '' }
                ],
                filters: [],
                isActive: true,
                createdAt: '',
                updatedAt: ''
            });
        }
    }, [goal]);

    const handleSubmit = async () => {
        if (!formData) return;

        if (isCreateMode && onCreate) {
            const createData: CreateFunnelData = {
                name: formData.name,
                description: formData.description,
                steps: formData.steps,
                filters: formData.filters || []
            };
            await onCreate(createData);
            resetForm();
        } else {
            await onSubmit(formData);
        }
    };

    const resetForm = useCallback(() => {
        if (isCreateMode) {
            setFormData({
                id: '',
                name: '',
                description: '',
                steps: [
                    { type: 'PAGE_VIEW' as const, target: '', name: '' }
                ],
                filters: [],
                isActive: true,
                createdAt: '',
                updatedAt: ''
            });
        }
    }, [isCreateMode]);

    const updateStep = useCallback((field: keyof FunnelStep, value: string) => {
        if (!formData) return;
        setFormData(prev => prev ? ({
            ...prev,
            steps: [{
                ...prev.steps[0],
                [field]: value
            }]
        }) : prev);
    }, [formData]);

    const getStepSuggestions = useCallback((stepType: string): string[] => {
        if (!autocompleteData) return [];

        if (stepType === 'PAGE_VIEW') {
            return autocompleteData.pagePaths || [];
        } else if (stepType === 'EVENT') {
            return autocompleteData.customEvents || [];
        }

        return [];
    }, [autocompleteData]);

    const handleClose = useCallback(() => {
        onClose();
        if (isCreateMode) {
            resetForm();
        }
    }, [onClose, isCreateMode, resetForm]);

    // Memoize form validation
    const isFormValid = useMemo(() => {
        if (!formData) return false;
        return formData.name && formData.steps[0]?.target;
    }, [formData]);

    const getStepIcon = (type: string) => {
        switch (type) {
            case 'PAGE_VIEW':
                return <Eye size={16} weight="duotone" className="text-blue-600" />;
            case 'EVENT':
                return <MouseMiddleClick size={16} weight="duotone" className="text-green-600" />;
            default:
                return <Target size={16} weight="duotone" className="text-muted-foreground" />;
        }
    };

    const step = formData?.steps[0];

    if (!formData) return null;

    return (
        <Sheet open={isOpen} onOpenChange={handleClose}>
            <SheetContent side="right" className="w-[60vw] overflow-y-auto"
                style={{ width: '40vw', padding: '1rem', maxWidth: '1200px' }}
            >
                <SheetHeader className="space-y-3 pb-6 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                            {isCreateMode ? (
                                <Target size={16} weight="duotone" className="h-6 w-6 text-primary" />
                            ) : (
                                <PencilIcon size={16} weight="duotone" className="h-6 w-6 text-primary" />
                            )}
                        </div>
                        <div>
                            <SheetTitle className="text-xl font-semibold text-foreground">
                                {isCreateMode ? 'Create New Goal' : 'Edit Goal'}
                            </SheetTitle>
                            <SheetDescription className="text-muted-foreground mt-1">
                                {isCreateMode
                                    ? 'Set up a new goal to track single-step conversions'
                                    : 'Update goal configuration and tracking settings'
                                }
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <div className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name" className="text-sm font-medium text-foreground">Goal Name</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => prev ? ({ ...prev, name: e.target.value }) : prev)}
                                placeholder="e.g., Newsletter Signup"
                                className="rounded-lg border-border/50 focus:border-primary/50 focus:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description" className="text-sm font-medium text-foreground">Description</Label>
                            <Input
                                id="edit-description"
                                value={formData.description || ''}
                                onChange={(e) => setFormData(prev => prev ? ({ ...prev, description: e.target.value }) : prev)}
                                placeholder="Optional description"
                                className="rounded-lg border-border/50 focus:border-primary/50 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Target size={16} weight="duotone" className="h-5 w-5 text-primary" />
                            <Label className="text-base font-semibold text-foreground">Goal Target</Label>
                        </div>

                        <div className="flex items-center gap-4 p-4 border rounded-xl hover:shadow-sm hover:border-border transition-all duration-150">
                            {/* Goal Number */}
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-2 border-primary/20 flex items-center justify-center text-sm font-semibold shadow-sm flex-shrink-0">
                                1
                            </div>

                            {/* Goal Fields */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                                <Select
                                    value={step?.type}
                                    onValueChange={(value) => updateStep('type', value)}
                                >
                                    <SelectTrigger className="rounded-lg border-border/50 focus:border-primary/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg">
                                        <SelectItem value="PAGE_VIEW">Page View</SelectItem>
                                        <SelectItem value="EVENT">Event</SelectItem>
                                    </SelectContent>
                                </Select>
                                <AutocompleteInput
                                    value={step?.target || ''}
                                    onValueChange={(value) => updateStep('target', value)}
                                    suggestions={getStepSuggestions(step?.type || 'PAGE_VIEW')}
                                    placeholder={step?.type === 'PAGE_VIEW' ? '/path' : 'event_name'}
                                    className="rounded-lg border-border/50 focus:border-primary/50 focus:ring-primary/20"
                                />
                                <Input
                                    value={step?.name || ''}
                                    onChange={(e) => updateStep('name', e.target.value)}
                                    placeholder="Goal name"
                                    className="rounded-lg border-border/50 focus:border-primary/50 focus:ring-primary/20"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="rounded-lg"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={
                                !isFormValid ||
                                (isCreateMode ? isCreating : isUpdating)
                            }
                            className="rounded-lg relative"
                        >
                            {(isCreateMode ? isCreating : isUpdating) && (
                                <div className="absolute left-3">
                                    <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin"></div>
                                </div>
                            )}
                            <span className={(isCreateMode ? isCreating : isUpdating) ? 'ml-6' : ''}>
                                {isCreateMode
                                    ? (isCreating ? 'Creating...' : 'Create Goal')
                                    : (isUpdating ? 'Updating...' : 'Update Goal')
                                }
                            </span>
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
