"use client"

import { useState } from 'react'
import { UserForm } from './user-form'
import { UserList } from './user-list'
import { Plus, Users } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function UserTabs() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const handleCreateSuccess = () => {
    setShowCreateDialog(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">User Management</h2>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      <UserList />

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system
            </DialogDescription>
          </DialogHeader>
          <UserForm onSuccess={handleCreateSuccess} onCancel={() => setShowCreateDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
} 