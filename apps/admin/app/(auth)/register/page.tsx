"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { registerWithEmail } from "@databuddy/auth"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import { AlertCircle, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await registerWithEmail(
        data.email,
        data.password,
        data.name,
        {
          redirectUrl: "/login",
          router,
          onError: (err) => {
            console.error("Registration error:", err)
            const errorMessage = typeof err === 'object' && err.message 
              ? err.message 
              : "Something went wrong. Please try again."
            setError(errorMessage)
            toast.error(errorMessage)
          }
        }
      )
      
      if (!result.success) {
        // If registration was not successful but didn't trigger the onError handler
        let errorMessage = "Registration failed. Please try again."
        setError(errorMessage)
        toast.error(errorMessage)
        return
      }
      
      toast.success("Registration successful! Please log in.")
      // Helper handles redirection
    } catch (error: any) {
      // This catches any unexpected errors not caught by the helper
      console.error("Registration error:", error)
      const errorMessage = error.message || "Something went wrong. Please try again."
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[rgb(0,5,15)] to-[rgb(1,8,20)] p-4">
      <Card className="w-full max-w-md border-sky-500/20 bg-black/50 backdrop-blur-sm shadow-xl shadow-sky-950/30">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold text-white">Create an Account</CardTitle>
          <CardDescription className="text-gray-200">
            Enter your details to create an admin account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {error && (
            <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-100 font-medium">Name</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="Enter your full name"
                          {...field}
                          className="border-gray-700 bg-gray-900/70 text-white pl-10 h-11 ring-offset-sky-800 focus-visible:ring-sky-600 placeholder:text-gray-500"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    </div>
                    <FormMessage className="text-red-300" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-100 font-medium">Email</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="Enter your email address"
                          {...field}
                          className="border-gray-700 bg-gray-900/70 text-white pl-10 h-11 ring-offset-sky-800 focus-visible:ring-sky-600 placeholder:text-gray-500"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                    </div>
                    <FormMessage className="text-red-300" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-100 font-medium">Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          {...field}
                          className="border-gray-700 bg-gray-900/70 text-white pl-10 pr-10 h-11 ring-offset-sky-800 focus-visible:ring-sky-600 placeholder:text-gray-500"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <FormMessage className="text-red-300" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-100 font-medium">Confirm Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          {...field}
                          className="border-gray-700 bg-gray-900/70 text-white pl-10 pr-10 h-11 ring-offset-sky-800 focus-visible:ring-sky-600 placeholder:text-gray-500"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <FormMessage className="text-red-300" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-sky-600 text-white hover:bg-sky-700 h-11 font-medium mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center pt-0">
          <p className="text-sm text-gray-300">
            Already have an account?{" "}
            <Link href="/login" className="text-sky-400 font-medium hover:text-sky-300 underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
} 