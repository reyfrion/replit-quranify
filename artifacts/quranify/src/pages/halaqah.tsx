import { useState } from "react";
import { Link } from "wouter";
import { 
  useListHalaqah, 
  useCreateHalaqah,
  useAssignHalaqah,
  getListHalaqahQueryKey,
  UserRole
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Users, UsersRound, BookOpen, Plus, LogIn } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getGetMeQueryKey } from "@workspace/api-client-react";

const createHalaqahSchema = z.object({
  name: z.string().min(3, "Halaqah name must be at least 3 characters"),
});

type CreateHalaqahFormValues = z.infer<typeof createHalaqahSchema>;

export default function HalaqahList() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: halaqahs, isLoading } = useListHalaqah({
    query: {
      queryKey: getListHalaqahQueryKey()
    }
  });

  const createMutation = useCreateHalaqah();
  const assignMutation = useAssignHalaqah();

  const form = useForm<CreateHalaqahFormValues>({
    resolver: zodResolver(createHalaqahSchema),
    defaultValues: { name: "" }
  });

  const isMentorOrAdmin = user?.role === UserRole.mentor || user?.role === UserRole.admin;

  function onSubmit(data: CreateHalaqahFormValues) {
    if (!user) return;
    createMutation.mutate(
      { data: { name: data.name, mentorId: user.id } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListHalaqahQueryKey() });
          setIsDialogOpen(false);
          form.reset();
          toast({ title: "Halaqah created successfully" });
        }
      }
    );
  }

  function handleJoinHalaqah(halaqahId: number) {
    assignMutation.mutate(
      { data: { halaqahId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListHalaqahQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({ title: "Joined Halaqah successfully!" });
        }
      }
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <UsersRound className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Halaqah Groups</h1>
            <p className="text-muted-foreground">Journey together, support one another</p>
          </div>
        </div>

        {isMentorOrAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Create Halaqah
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Halaqah Group</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Group Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Al-Fajr Memorizers" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Group"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : !halaqahs || halaqahs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg">No halaqah groups found.</p>
            {isMentorOrAdmin && (
              <p className="text-sm mt-2">Create the first one to start mentoring!</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {halaqahs.map((halaqah) => (
            <Card key={halaqah.id} className="flex flex-col hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span className="font-serif text-xl line-clamp-1" title={halaqah.name}>{halaqah.name}</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Mentor: <span className="font-medium text-foreground">{halaqah.mentorName}</span>
                </p>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-3 rounded-lg flex flex-col items-center justify-center">
                    <Users className="w-5 h-5 text-primary mb-1" />
                    <span className="font-bold text-lg">{halaqah.memberCount}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Members</span>
                  </div>
                  <div className="bg-muted p-3 rounded-lg flex flex-col items-center justify-center">
                    <BookOpen className="w-5 h-5 text-primary mb-1" />
                    <span className="font-bold text-lg">{halaqah.totalAyat.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Ayat</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 border-t p-4 flex gap-2">
                <Link href={`/halaqah/${halaqah.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">View Details</Button>
                </Link>
                {user?.halaqahGroup !== halaqah.id && (
                  <Button 
                    variant="default" 
                    className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => handleJoinHalaqah(halaqah.id)}
                    disabled={assignMutation.isPending}
                  >
                    <LogIn className="w-4 h-4" /> Join
                  </Button>
                )}
                {user?.halaqahGroup === halaqah.id && (
                  <Button variant="secondary" className="flex-1" disabled>Joined</Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
