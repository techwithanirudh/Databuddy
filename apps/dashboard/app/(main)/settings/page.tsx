"use client";

import { useQueryState } from "nuqs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldIcon,
  UserIcon,
  BellIcon,
  GearSixIcon,
  InfoIcon
} from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EmailForm = dynamic(() => import("./_components/email-form").then(mod => ({ default: mod.EmailForm })), {
  loading: () => <Skeleton className="h-32 w-full rounded" />,
  ssr: false
});

const PasswordForm = dynamic(() => import("./_components/password-form").then(mod => ({ default: mod.PasswordForm })), {
  loading: () => <Skeleton className="h-40 w-full rounded" />,
  ssr: false
});

const TwoFactorForm = dynamic(() => import("./_components/two-factor-form").then(mod => ({ default: mod.TwoFactorForm })), {
  loading: () => <Skeleton className="h-48 w-full rounded" />,
  ssr: false
});

const SessionsForm = dynamic(() => import("./_components/sessions-form").then(mod => ({ default: mod.SessionsForm })), {
  loading: () => <Skeleton className="h-64 w-full rounded" />,
  ssr: false
});

const AccountDeletion = dynamic(() => import("./_components/account-deletion").then(mod => ({ default: mod.AccountDeletion })), {
  loading: () => <Skeleton className="h-24 w-full rounded" />,
  ssr: false
});

const ProfileForm = dynamic(() => import("./_components/profile-form").then(mod => ({ default: mod.ProfileForm })), {
  loading: () => <Skeleton className="h-56 w-full rounded" />,
  ssr: false
});

const TimezonePreferences = dynamic(() => import("./_components/timezone-preferences").then(mod => ({ default: mod.TimezonePreferences })), {
  loading: () => <Skeleton className="h-20 w-full rounded" />,
  ssr: false
});

type SettingsTab = "profile" | "account" | "security" | "notifications";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useQueryState("tab", {
    defaultValue: "profile" as SettingsTab
  });

  const tabs = [
    {
      id: "profile" as SettingsTab,
      label: "Profile",
      icon: UserIcon
    },
    {
      id: "account" as SettingsTab,
      label: "Account",
      icon: GearSixIcon
    },
    {
      id: "security" as SettingsTab,
      label: "Security",
      icon: ShieldIcon
    },
    {
      id: "notifications" as SettingsTab,
      label: "Notifications",
      icon: BellIcon,
      disabled: true
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-gradient-to-r from-background via-background to-muted/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 sm:py-6 gap-3 sm:gap-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <GearSixIcon
                  size={24}
                  weight="duotone"
                  className="h-6 w-6 text-primary"
                />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate">
                  Settings
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base mt-1">
                  Manage your account and preferences
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="w-full p-4 sm:px-6 sm:pt-6 sm:pb-8">
          <Tabs
            value={activeTab}
            onValueChange={value => setActiveTab(value as SettingsTab)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4 max-w-lg h-10 bg-transparent p-0">
              {tabs.map(tab => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  disabled={tab.disabled}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="profile">
              <div className="space-y-8 mt-6">
                <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
                  <InfoIcon
                    size={16}
                    weight="duotone"
                    className="h-4 w-4 text-blue-600"
                  />
                  <AlertTitle>Profile Information</AlertTitle>
                  <AlertDescription>
                    Your profile information is used to personalize your
                    experience and how others see you on the platform. This
                    information is visible to other users.
                  </AlertDescription>
                </Alert>

                <Card className="shadow-sm">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-xl font-semibold tracking-tight">
                      Personal Information
                    </CardTitle>
                    <CardDescription className="text-base">
                      Update your personal information and profile picture
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ProfileForm />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="account">
              <div className="space-y-8 mt-6">
                <div className="flex flex-col gap-4">
                  <Card className="shadow-sm">
                    <CardHeader className="pb-6">
                      <CardTitle className="text-xl font-semibold tracking-tight">
                        Email Address
                      </CardTitle>
                      <CardDescription className="text-base">
                        Update your email address and manage email preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <EmailForm />
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-6">
                      <CardTitle className="text-xl font-semibold tracking-tight">
                        Password
                      </CardTitle>
                      <CardDescription className="text-base">
                        Change your password and manage password security
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <PasswordForm />
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-6">
                      <CardTitle className="text-xl font-semibold tracking-tight">
                        Timezone
                      </CardTitle>
                      <CardDescription className="text-base">
                        Set your timezone for accurate date and time display
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <TimezonePreferences />
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-destructive">
                    <CardHeader className="pb-6">
                      <CardTitle className="text-xl font-semibold tracking-tight text-destructive">
                        Delete Account
                      </CardTitle>
                      <CardDescription className="text-base">
                        Permanently delete your account and all associated data
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <AccountDeletion />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="security">
              <div className="space-y-8 mt-6">
                <Card className="shadow-sm">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-xl font-semibold tracking-tight">
                      Two-Factor Authentication
                    </CardTitle>
                    <CardDescription className="text-base">
                      Add an additional layer of security to your account by
                      enabling 2FA
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <TwoFactorForm />
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-xl font-semibold tracking-tight">
                      Active Sessions
                    </CardTitle>
                    <CardDescription className="text-base">
                      Manage your active sessions and log out from other devices
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <SessionsForm />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="notifications">
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">
                  Notification settings will be available soon.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}