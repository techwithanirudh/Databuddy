"use client"

import { UserTabs } from '@/components/admin/user-tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Users } from 'lucide-react'

export default function UsersPage() {
  return (
    <div className="py-6 space-y-6 px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-sky-500/10 rounded-lg">
            <Users className="h-8 w-8 text-sky-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">
              Create and manage users in the system
            </p>
          </div>
        </div>
      </div>
      
      <Separator className="bg-sky-500/10" />
      
      <Card className="border border-sky-500/10 bg-slate-900/30 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle>Users</CardTitle>
          <CardDescription>
            View and manage all users in the system. Edit profiles, update roles, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserTabs />
        </CardContent>
      </Card>
    </div>
  )
} 