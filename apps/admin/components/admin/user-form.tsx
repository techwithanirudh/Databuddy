'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, UserPlus } from 'lucide-react'
import { UserImageUpload } from './user-image-upload'

interface UserFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function UserForm({ onSuccess, onCancel }: UserFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'AUTHOR',
    imageUrl: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, imageUrl }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.name) {
        toast.error('Name is required')
        setLoading(false)
        return
      }

      if (!formData.email) {
        toast.error('Email is required')
        setLoading(false)
        return
      }

      if (!formData.password) {
        toast.error('Password is required')
        setLoading(false)
        return
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create user')
      }

      toast.success('User created successfully')
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'AUTHOR',
        imageUrl: ''
      })
      
      if (onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user')
      console.error('Error creating user:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
          <CardDescription>
            Add a new user to the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center mb-4">
            <UserImageUpload 
              imageUrl={formData.imageUrl}
              onChange={handleImageChange}
              disabled={loading}
              name={formData.name}
            />
          </div>
          
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              disabled={loading}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              disabled={loading}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="role">Role</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => handleSelectChange("role", value)}
              disabled={loading}
            >
              <SelectTrigger id="role" className="mt-1">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="AUTHOR">Author</SelectItem>
                <SelectItem value="EDITOR">Editor</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <UserPlus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 