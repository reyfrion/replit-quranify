import { useState } from "react";
import { 
  useListHafalan, 
  useCreateHafalan, 
  useUpdateHafalan, 
  useDeleteHafalan,
  getListHafalanQueryKey,
  HafalanStatus,
  Hafalan,
  CreateHafalanBodyStatus
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Edit2, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getGetDashboardSummaryQueryKey, getGetMeQueryKey, getGetAnalyticsQueryKey } from "@workspace/api-client-react";

const hafalanSchema = z.object({
  surah: z.string().min(1, "Surah is required"),
  surahNumber: z.coerce.number().min(1).max(114),
  ayahStart: z.coerce.number().min(1),
  ayahEnd: z.coerce.number().min(1),
  status: z.enum([CreateHafalanBodyStatus.New, CreateHafalanBodyStatus.Review, CreateHafalanBodyStatus.Strong]),
  date: z.string(),
}).refine(data => data.ayahEnd >= data.ayahStart, {
  message: "End ayah must be greater than or equal to start ayah",
  path: ["ayahEnd"]
});

type HafalanFormValues = z.infer<typeof hafalanSchema>;

export default function Tracker() {
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: hafalanList, isLoading } = useListHafalan({
    surah: search || undefined
  }, {
    query: {
      queryKey: getListHafalanQueryKey({ surah: search || undefined })
    }
  });

  const createMutation = useCreateHafalan();
  const updateMutation = useUpdateHafalan();
  const deleteMutation = useDeleteHafalan();

  const form = useForm<HafalanFormValues>({
    resolver: zodResolver(hafalanSchema),
    defaultValues: {
      surah: "",
      surahNumber: 1,
      ayahStart: 1,
      ayahEnd: 1,
      status: CreateHafalanBodyStatus.New,
      date: new Date().toISOString().split('T')[0]
    }
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: getListHafalanQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAnalyticsQueryKey() });
  };

  function onSubmit(data: HafalanFormValues) {
    if (editingId) {
      updateMutation.mutate(
        { id: editingId, data },
        {
          onSuccess: () => {
            invalidateQueries();
            setIsDialogOpen(false);
            setEditingId(null);
            toast({ title: "Updated successfully" });
          }
        }
      );
    } else {
      createMutation.mutate(
        { data },
        {
          onSuccess: () => {
            invalidateQueries();
            setIsDialogOpen(false);
            toast({ title: "MasyaAllah, hafalan hari ini tercatat 🤍" });
          }
        }
      );
    }
  }

  function handleEdit(item: Hafalan) {
    setEditingId(item.id);
    form.reset({
      surah: item.surah,
      surahNumber: item.surahNumber,
      ayahStart: item.ayahStart,
      ayahEnd: item.ayahEnd,
      status: item.status as CreateHafalanBodyStatus,
      date: new Date(item.date).toISOString().split('T')[0]
    });
    setIsDialogOpen(true);
  }

  function handleDelete(id: number) {
    if (confirm("Are you sure you want to delete this entry?")) {
      deleteMutation.mutate(
        { id }, // custom fetch params: customFetch signature is id then options. The generated hook uses `{id}`
        {
          onSuccess: () => {
            invalidateQueries();
            toast({ title: "Deleted successfully" });
          }
        }
      );
    }
  }

  function openNewDialog() {
    setEditingId(null);
    form.reset({
      surah: "",
      surahNumber: 1,
      ayahStart: 1,
      ayahEnd: 1,
      status: CreateHafalanBodyStatus.New,
      date: new Date().toISOString().split('T')[0]
    });
    setIsDialogOpen(true);
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Strong': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400';
      case 'Review': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'New': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <h1 className="text-3xl font-serif font-bold text-foreground">Hafalan Tracker</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Log Memorization
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Entry' : 'Log New Memorization'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="surah"
                    render={({ field }) => (
                      <FormItem className="col-span-2 sm:col-span-1">
                        <FormLabel>Surah Name</FormLabel>
                        <FormControl><Input placeholder="Al-Baqarah" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="surahNumber"
                    render={({ field }) => (
                      <FormItem className="col-span-2 sm:col-span-1">
                        <FormLabel>Surah Number</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ayahStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Ayah</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ayahEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Ayah</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={CreateHafalanBodyStatus.New}>New</SelectItem>
                            <SelectItem value={CreateHafalanBodyStatus.Review}>Review</SelectItem>
                            <SelectItem value={CreateHafalanBodyStatus.Strong}>Strong</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Simpan Hafalan"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Surah..."
              className="pl-9 max-w-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !hafalanList || hafalanList.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p>No memorization records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Surah</TableHead>
                    <TableHead>Ayah Range</TableHead>
                    <TableHead>Total Ayat</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hafalanList.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap">{new Date(item.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">
                        {item.surah} <span className="text-muted-foreground text-xs">({item.surahNumber})</span>
                      </TableCell>
                      <TableCell>{item.ayahStart} - {item.ayahEnd}</TableCell>
                      <TableCell>{item.ayahCount}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="w-4 h-4 text-destructive/70 hover:text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Just importing this for the empty state above
import { BookOpen } from "lucide-react";
