"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Upload, X } from 'lucide-react'

export interface UserImageUploadProps {
  imageUrl?: string
  onChange: (imageUrl: string) => void
  disabled?: boolean
  name?: string
}

export function UserImageUpload({ 
  imageUrl = '', 
  onChange, 
  disabled = false,
  name = ''
}: UserImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getInitials = (name: string) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'users')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload image')
      }

      const data = await response.json()
      onChange(data.url)
      toast.success('Image uploaded successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image')
      console.error('Error uploading image:', error)
    } finally {
      setIsUploading(false)
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = () => {
    onChange('')
    toast.success('Image removed')
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          {imageUrl ? (
            <AvatarImage src={imageUrl} alt={name || 'User'} />
          ) : null}
          <AvatarFallback className="text-lg">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        
        {imageUrl && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={handleRemoveImage}
            disabled={disabled || isUploading}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      <div className="flex flex-col items-center">
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={disabled || isUploading}
          className="hidden"
          id="user-image-upload"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="text-xs"
        >
          <Upload className="h-3 w-3 mr-1" />
          {imageUrl ? 'Change Photo' : 'Upload Photo'}
        </Button>
        <p className="text-xs text-muted-foreground mt-1">
          {isUploading ? 'Uploading...' : 'JPG, PNG or GIF. Max 5MB.'}
        </p>
      </div>
    </div>
  )
} 