"use client"

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Pencil } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UserEditForm } from './user-edit-form'

interface User {
  id: string
  name: string
  email: string
  image: string | null
  role: string
  createdAt: string
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users')
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      
      const data = await response.json()
      setUsers(data)
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch users')
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const getInitials = (name: string) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
      case 'EDITOR':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
      case 'AUTHOR':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
  }

  const handleEditSuccess = () => {
    setEditingUser(null)
    fetchUsers()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Users Found</CardTitle>
          <CardDescription>
            There are no users in the system yet. Create your first user to get started.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-12 w-12">
                {user.image ? (
                  <AvatarImage src={user.image} alt={user.name} />
                ) : null}
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="grid gap-1">
                <CardTitle className="text-lg">{user.name}</CardTitle>
                <CardDescription className="text-sm">{user.email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge className={getRoleBadgeColor(user.role)}>
                  {user.role}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 p-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-auto"
                onClick={() => handleEditUser(user)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Make changes to the user profile
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <UserEditForm 
              user={editingUser} 
              onSuccess={handleEditSuccess} 
              onCancel={() => setEditingUser(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
} 