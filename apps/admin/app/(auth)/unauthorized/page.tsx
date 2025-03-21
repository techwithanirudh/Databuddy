import Link from "next/link"
import { Button } from "@/components/ui/button" 
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function UnauthorizedPage() {

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[rgb(0,5,15)] to-[rgb(1,8,20)] p-4">
      <Card className="w-full max-w-md border-red-500/20 bg-black/50 backdrop-blur-sm shadow-xl shadow-red-950/20">
        <CardHeader className="space-y-1 pb-4">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-red-500/10 p-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl font-bold text-white">Unauthorized Access</CardTitle>
          <CardDescription className="text-center text-gray-200">
            You don&apos;t have permission to access this area
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-gray-300">
          <p>
            Your account doesn&apos;t have the required permissions to view this page. 
            If you believe this is a mistake, please contact an administrator.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 pt-2">
          <Button
            asChild
            className="w-full bg-sky-600 hover:bg-sky-700"
          >
            <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Login
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 