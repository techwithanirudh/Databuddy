"use client"

import { useState, useEffect } from 'react'
import { getCategories, createCategory, deleteCategory } from '../../../actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Pencil, Save, Trash2, Plus, Folder } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

interface CategoryFormData {
  name: string
  slug: string
  description: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newCategory, setNewCategory] = useState<CategoryFormData>({ name: '', slug: '', description: '' })
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  useEffect(() => {
    loadCategories()
  }, [])
  
  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await getCategories()
      setCategories(data as Category[])
      setLoading(false)
    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Failed to load categories')
      setLoading(false)
    }
  }
  
  const handleNameChange = (value: string, isNew = true) => {
    if (isNew) {
      setNewCategory(prev => {
        const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        return { ...prev, name: value, slug }
      })
    } else {
      setEditingCategory(prev => {
        if (!prev) return prev
        const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        return { ...prev, name: value, slug }
      })
    }
  }
  
  const handleSlugChange = (value: string, isNew = true) => {
    const slug = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    if (isNew) {
      setNewCategory(prev => ({ ...prev, slug }))
    } else {
      setEditingCategory(prev => {
        if (!prev) return prev
        return { ...prev, slug }
      })
    }
  }
  
  const handleDescriptionChange = (value: string, isNew = true) => {
    if (isNew) {
      setNewCategory(prev => ({ ...prev, description: value }))
    } else {
      setEditingCategory(prev => {
        if (!prev) return prev
        return { ...prev, description: value }
      })
    }
  }
  
  const handleCreateCategory = async () => {
    if (!newCategory.name || !newCategory.slug) {
      toast.error('Name and slug are required')
      return
    }
    
    try {
      setSaving(true)
      await createCategory(newCategory)
      toast.success('Category created successfully')
      setNewCategory({ name: '', slug: '', description: '' })
      loadCategories()
      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error creating category:', error)
      toast.error('Failed to create category')
    } finally {
      setSaving(false)
    }
  }
  
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setIsEditing(true)
    setIsDialogOpen(true)
  }
  
  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name || !editingCategory.slug) {
      toast.error('Name and slug are required')
      return
    }
    
    try {
      setSaving(true)
      await createCategory({
        name: editingCategory.name,
        slug: editingCategory.slug,
        description: editingCategory.description || ''
      })
      toast.success('Category updated successfully')
      loadCategories()
      setIsDialogOpen(false)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Failed to update category')
    } finally {
      setSaving(false)
    }
  }
  
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return
    }
    
    try {
      await deleteCategory(id)
      toast.success('Category deleted successfully')
      loadCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    }
  }
  
  const openNewCategoryDialog = () => {
    setNewCategory({ name: '', slug: '', description: '' })
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
            <Folder className="h-8 w-8 text-sky-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
            <p className="text-muted-foreground">
              Manage blog categories
            </p>
          </div>
        </div>
        
        <Button onClick={openNewCategoryDialog}>
          <Plus className="h-4 w-4 mr-2" />
          New Category
        </Button>
      </div>
      
      <Separator className="bg-sky-500/10" />
      
      <Card className="border border-sky-500/10 bg-slate-900/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Blog Categories</CardTitle>
          <CardDescription>
            Create and manage categories for your blog posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">No categories found</p>
              <Button variant="outline" onClick={openNewCategoryDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first category
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.slug}</TableCell>
                    <TableCell className="max-w-xs truncate">{category.description || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCategory(category.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Category' : 'New Category'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update category details' : 'Create a new category for your blog posts'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={isEditing ? editingCategory?.name || '' : newCategory.name} 
                onChange={(e) => handleNameChange(e.target.value, !isEditing)} 
                placeholder="Category name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">/blog/category/</span>
                <Input 
                  id="slug" 
                  value={isEditing ? editingCategory?.slug || '' : newCategory.slug} 
                  onChange={(e) => handleSlugChange(e.target.value, !isEditing)} 
                  placeholder="category-slug"
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea 
                id="description" 
                value={isEditing ? editingCategory?.description || '' : newCategory.description} 
                onChange={(e) => handleDescriptionChange(e.target.value, !isEditing)} 
                placeholder="Brief description of this category"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={isEditing ? handleUpdateCategory : handleCreateCategory} 
              disabled={saving}
            >
              {saving ? 'Saving...' : (isEditing ? 'Update Category' : 'Create Category')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 