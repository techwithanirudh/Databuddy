"use client"

import { useState, useEffect } from 'react'
import { getTags, createTag, deleteTag } from '../../../actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Pencil, Save, Trash2, Plus, Tag } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

export default function TagsPage() {
  const [tags, setTags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newTag, setNewTag] = useState({ name: '', slug: '' })
  const [editingTag, setEditingTag] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  useEffect(() => {
    loadTags()
  }, [])
  
  const loadTags = async () => {
    try {
      setLoading(true)
      const data = await getTags()
      setTags(data)
      setLoading(false)
    } catch (error) {
      console.error('Error loading tags:', error)
      toast.error('Failed to load tags')
      setLoading(false)
    }
  }
  
  const handleNameChange = (value: string, isNew = true) => {
    if (isNew) {
      setNewTag(prev => {
        const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        return { ...prev, name: value, slug }
      })
    } else {
      setEditingTag((prev: any) => {
        const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        return { ...prev, name: value, slug }
      })
    }
  }
  
  const handleSlugChange = (value: string, isNew = true) => {
    const slug = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (isNew) {
      setNewTag(prev => ({ ...prev, slug }))
    } else {
      setEditingTag((prev: any) => ({ ...prev, slug }))
    }
  }
  
  const handleCreateTag = async () => {
    if (!newTag.name || !newTag.slug) {
      toast.error('Name and slug are required')
      return
    }
    
    try {
      setSaving(true)
      await createTag(newTag)
      toast.success('Tag created successfully')
      setNewTag({ name: '', slug: '' })
      loadTags()
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error creating tag:', error)
      toast.error('Failed to create tag')
    } finally {
      setSaving(false)
    }
  }
  
  const handleEditTag = (tag: any) => {
    setEditingTag(tag)
    setIsEditing(true)
    setIsDialogOpen(true)
  }
  
  const handleUpdateTag = async () => {
    if (!editingTag.name || !editingTag.slug) {
      toast.error('Name and slug are required')
      return
    }
    
    try {
      setSaving(true)
      await createTag(editingTag) // Using the same action for update
      toast.success('Tag updated successfully')
      loadTags()
      setIsDialogOpen(false)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating tag:', error)
      toast.error('Failed to update tag')
    } finally {
      setSaving(false)
    }
  }
  
  const handleDeleteTag = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tag? This action cannot be undone.')) {
      return
    }
    
    try {
      await deleteTag(id)
      toast.success('Tag deleted successfully')
      loadTags()
    } catch (error) {
      console.error('Error deleting tag:', error)
      toast.error('Failed to delete tag')
    }
  }
  
  const openNewTagDialog = () => {
    setNewTag({ name: '', slug: '' })
    setIsEditing(false)
    setIsDialogOpen(true)
  }
  
  if (loading) {
    return (
      <div className="py-6 space-y-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-40 mt-2" />
            </div>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }
  
  return (
    <div className="py-6 space-y-6 px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-sky-500/10 rounded-lg">
            <Tag className="h-8 w-8 text-sky-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
            <p className="text-muted-foreground">
              Manage blog tags
            </p>
          </div>
        </div>
        
        <Button onClick={openNewTagDialog}>
          <Plus className="h-4 w-4 mr-2" />
          New Tag
        </Button>
      </div>
      
      <Separator className="bg-sky-500/10" />
      
      <Card className="border border-sky-500/10 bg-slate-900/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Blog Tags</CardTitle>
          <CardDescription>
            Create and manage tags for your blog posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">No tags found</p>
              <Button variant="outline" onClick={openNewTagDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first tag
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap gap-2 mb-6">
                {tags.map(tag => (
                  <Badge 
                    key={tag.id} 
                    variant="secondary" 
                    className="bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 cursor-pointer"
                    onClick={() => handleEditTag(tag)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell className="font-medium">{tag.name}</TableCell>
                      <TableCell>{tag.slug}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditTag(tag)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteTag(tag.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Tag' : 'New Tag'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update tag details' : 'Create a new tag for your blog posts'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={isEditing ? editingTag?.name : newTag.name} 
                onChange={(e) => handleNameChange(e.target.value, !isEditing)} 
                placeholder="Tag name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">/blog/tag/</span>
                <Input 
                  id="slug" 
                  value={isEditing ? editingTag?.slug : newTag.slug} 
                  onChange={(e) => handleSlugChange(e.target.value, !isEditing)} 
                  placeholder="tag-slug"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={isEditing ? handleUpdateTag : handleCreateTag} 
              disabled={saving}
            >
              {saving ? 'Saving...' : (isEditing ? 'Update Tag' : 'Create Tag')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 