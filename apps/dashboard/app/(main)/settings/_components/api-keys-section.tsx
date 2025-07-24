import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import { PencilSimpleIcon, TrashIcon, CopyIcon, CheckCircleIcon, KeyIcon } from "@phosphor-icons/react";

const SCOPE_OPTIONS = [
    { value: "read:data", label: "Read Data" },
    { value: "read:experiments", label: "Read Experiments" },
];

const apiKeyFormSchema = z.object({
    name: z.string().min(2, "Name required"),
    scopes: z.array(z.enum(["read:data", "read:experiments"])),
});

type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>;

const DEFAULT_TYPE = "user" as const;
const DEFAULT_METADATA = {};
const DEFAULT_RATE_LIMIT_ENABLED = true;

export function ApiKeysSection() {
    const apiKeysQuery = trpc.apiKeys.list.useQuery({});
    const createApiKey = trpc.apiKeys.create.useMutation();
    const updateApiKey = trpc.apiKeys.update.useMutation();
    const deleteApiKey = trpc.apiKeys.delete.useMutation();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editKey, setEditKey] = useState<any | null>(null);
    const [showKey, setShowKey] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [copyKeyId, setCopyKeyId] = useState<string | null>(null);

    const form = useForm<ApiKeyFormValues>({
        resolver: zodResolver(apiKeyFormSchema),
        defaultValues: { name: "", scopes: ["read:data"] },
    });

    const handleSubmit = async (values: ApiKeyFormValues) => {
        const payload = {
            ...values,
            type: DEFAULT_TYPE,
            metadata: DEFAULT_METADATA,
            rateLimitEnabled: DEFAULT_RATE_LIMIT_ENABLED,
        };
        if (editKey) {
            await updateApiKey.mutateAsync({ id: editKey.id, ...payload });
            setDialogOpen(false);
            setEditKey(null);
            form.reset();
            apiKeysQuery.refetch();
        } else {
            const res = await createApiKey.mutateAsync(payload as any);
            setShowKey(res?.key || null);
            setEditKey(null);
            form.reset();
            apiKeysQuery.refetch();
        }
    };

    const handleEdit = (key: any) => {
        setEditKey(key);
        form.reset({
            name: key.name,
            scopes: key.scopes.filter((s: string) => s === "read:data" || s === "read:experiments"),
        });
        setDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        await deleteApiKey.mutateAsync({ id });
        setDeleteId(null);
        apiKeysQuery.refetch();
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setCopyKeyId(id);
        setTimeout(() => {
            setCopied(false);
            setCopyKeyId(null);
        }, 1500);
    };

    return (
        <Card className="w-full border border-muted-foreground/10 bg-background shadow-sm p-0">
            <div className="pt-6 pb-4 px-2 sm:px-6">
                <div className="flex flex-col gap-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <KeyIcon size={22} weight="duotone" className="text-primary" />
                            <h2 className="font-bold text-xl tracking-tight">API Keys</h2>
                        </div>
                        <Button variant="default" onClick={() => { setEditKey(null); setDialogOpen(true); }}>
                            <KeyIcon size={16} weight="duotone" className="mr-2" /> New API Key
                        </Button>
                    </div>
                    <p className="text-muted-foreground text-xs mb-1 max-w-2xl">
                        Manage your API keys for SDKs, integrations, and automation. You can create, edit, enable/disable, and delete keys. <span className="font-medium">Note:</span> Keys are only shown once when created.
                    </p>
                </div>
                {apiKeysQuery.isLoading ? (
                    <Skeleton className="h-32 w-full rounded" />
                ) : apiKeysQuery.data && apiKeysQuery.data.length > 0 ? (
                    <div className="overflow-x-auto rounded border border-muted-foreground/10 bg-background mt-2">
                        <Table className="min-w-full text-xs sm:text-sm">
                            <TableHeader>
                                <TableRow className="bg-muted/50 sticky top-0 z-10">
                                    <TableHead className="font-semibold py-2 px-2">Name</TableHead>
                                    <TableHead className="font-semibold py-2 px-2">Scopes</TableHead>
                                    <TableHead className="font-semibold py-2 px-2">Status</TableHead>
                                    <TableHead className="font-semibold py-2 px-2">Created</TableHead>
                                    <TableHead className="font-semibold py-2 px-2 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {apiKeysQuery.data.map((key, idx) => (
                                    <TableRow key={key.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/30 hover:bg-muted/40 transition-colors"}>
                                        <TableCell className="font-medium max-w-[140px] truncate py-2 px-2">{key.name}</TableCell>
                                        <TableCell className="py-2 px-2">
                                            <div className="flex flex-wrap gap-1">
                                                {(key.scopes.filter((scope: string): scope is "read:data" | "read:experiments" => scope === "read:data" || scope === "read:experiments") as ("read:data" | "read:experiments")[])
                                                    .map((scope) => (
                                                        <Badge key={scope} variant="secondary">{SCOPE_OPTIONS.find(opt => opt.value === scope)?.label}</Badge>
                                                    ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2 px-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-block w-2 h-2 rounded-full ${key.enabled ? "bg-green-500" : "bg-gray-400"}`}></span>
                                                <span className="sr-only">{key.enabled ? "Enabled" : "Disabled"}</span>
                                                <span className={key.enabled ? "text-green-700 font-medium" : "text-gray-500"}>{key.enabled ? "Enabled" : "Disabled"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-2 px-2 whitespace-nowrap">{dayjs(key.createdAt).format("YYYY-MM-DD")}</TableCell>
                                        <TableCell className="flex gap-1 justify-end items-center py-2 px-2">
                                            <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => handleEdit(key)}>
                                                <PencilSimpleIcon size={16} weight="duotone" />
                                            </Button>
                                            <Button size="icon" variant="ghost" aria-label="Copy" onClick={() => handleCopy(key.prefix, key.id)}>
                                                {copied && copyKeyId === key.id ? (
                                                    <CheckCircleIcon size={16} weight="duotone" className="text-green-600 transition-all" />
                                                ) : (
                                                    <CopyIcon size={16} weight="duotone" />
                                                )}
                                            </Button>
                                            <AlertDialog open={deleteId === key.id} onOpenChange={(open) => setDeleteId(open ? key.id : null)}>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" aria-label="Delete">
                                                        <TrashIcon size={16} weight="duotone" className="text-red-600" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete this API key? This cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(key.id)} disabled={deleteApiKey.isPending} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <Alert className="mt-2">
                        <AlertTitle>No API Keys</AlertTitle>
                        <AlertDescription>You have not created any API keys yet.</AlertDescription>
                    </Alert>
                )}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="max-w-md w-full animate-fade-in p-4">
                        <DialogHeader>
                            <DialogTitle>{editKey ? "Edit API Key" : "Create API Key"}</DialogTitle>
                        </DialogHeader>
                        {showKey && !editKey ? (
                            <div className="space-y-6 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <CheckCircleIcon size={40} weight="duotone" className="text-green-600 mb-1" />
                                    <h3 className="font-bold text-lg">API Key Created</h3>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex flex-col sm:flex-row items-center gap-1 justify-center w-full max-w-full">
                                        <span className="font-mono text-xs sm:text-sm bg-muted px-2 py-1 rounded select-all border border-muted-foreground/20 break-all max-w-full overflow-x-auto">
                                            {showKey}
                                        </span>
                                        <Button size="icon" variant="outline" onClick={() => handleCopy(showKey, "show")}
                                            aria-label="Copy API Key" className="shrink-0 h-7 w-7">
                                            {copied && copyKeyId === "show" ? (
                                                <CheckCircleIcon size={14} weight="duotone" className="text-green-600" />
                                            ) : (
                                                <CopyIcon size={14} weight="duotone" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                                <div className="bg-yellow-100 text-yellow-900 text-xs rounded px-3 py-2 border border-yellow-300 font-semibold">
                                    This key is only shown once. Copy and store it securely. You will not be able to see it again!
                                </div>
                                <DialogFooter>
                                    <Button onClick={() => { setShowKey(null); setDialogOpen(false); }} className="w-full mt-2">Done</Button>
                                </DialogFooter>
                            </div>
                        ) : (
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel htmlFor="api-key-name">Name</FormLabel>
                                                <FormControl>
                                                    <Input id="api-key-name" placeholder="Key name" {...field} autoFocus className="rounded border px-2 py-2 text-base" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="scopes"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Scopes</FormLabel>
                                                <div className="flex flex-wrap gap-3">
                                                    {SCOPE_OPTIONS.map((opt) => {
                                                        const checkboxId = `scope-checkbox-${opt.value}`;
                                                        return (
                                                            <label key={opt.value} htmlFor={checkboxId} className="flex items-center gap-2 cursor-pointer select-none">
                                                                <Checkbox
                                                                    id={checkboxId}
                                                                    checked={field.value.includes(opt.value as "read:data" | "read:experiments")}
                                                                    onCheckedChange={(checked) => {
                                                                        if (checked) field.onChange([...field.value, opt.value as "read:data" | "read:experiments"]);
                                                                        else field.onChange(field.value.filter((v) => v !== opt.value));
                                                                    }}
                                                                />
                                                                <span className="text-base">{opt.label}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <DialogFooter className="flex flex-col gap-2 pt-2">
                                        <Button type="submit" disabled={createApiKey.isPending || updateApiKey.isPending} className="w-full">
                                            {editKey ? "Save Changes" : "Create Key"}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </Card>
    );
} 