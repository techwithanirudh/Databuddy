"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Target, Trash } from "@phosphor-icons/react";

interface DeleteGoalDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function DeleteGoalDialog({ isOpen, onClose, onConfirm }: DeleteGoalDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="rounded-xl">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center justify-center w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg">
                            <Trash size={20} weight="duotone" className="text-red-600 dark:text-red-400" />
                        </div>
                        <AlertDialogTitle className="text-lg">Delete Goal</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-left">
                        Are you sure you want to delete this goal? This action cannot be undone and will permanently remove all associated analytics data.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                        Delete Goal
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
} 