import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";

export function LoadingState() {
  // Create a fixed array of unique IDs for the loading rows
  const loadingRowIds = ['loading-row-1', 'loading-row-2', 'loading-row-3'];
  
  return (
    <div className="rounded-md border overflow-hidden bg-card shadow-sm">
      <Table className="table-modern">
        <TableHeader>
          <TableRow className="bg-secondary/80 hover:bg-secondary/80">
            <TableHead className="w-[40%] text-secondary-foreground text-xs font-medium">WEBSITE</TableHead>
            <TableHead className="w-[40%] text-secondary-foreground text-xs font-medium">TRAFFIC</TableHead>
            <TableHead className="text-right text-secondary-foreground text-xs font-medium">ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loadingRowIds.map((id, index) => (
            <TableRow key={id} 
              className="border-b last:border-0"
              style={{ 
                animationDelay: `${index * 100}ms`,
                opacity: 0,
                animation: 'fadeIn 0.5s ease forwards'
              }}
            >
              <TableCell className="py-3.5">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-48" />
                </div>
              </TableCell>
              <TableCell className="py-3.5">
                <Skeleton className="h-12 w-full rounded-md" />
              </TableCell>
              <TableCell className="py-3.5" align="right">
                <div className="flex items-center justify-end gap-1.5">
                  <Skeleton className="h-8 w-24 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 