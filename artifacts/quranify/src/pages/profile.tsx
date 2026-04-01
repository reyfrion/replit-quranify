import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useUpdateProfile } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";

const profileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const updateProfileMutation = useUpdateProfile();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  if (!user) return null;

  function onSubmit(data: ProfileFormValues) {
    updateProfileMutation.mutate(
      { data },
      {
        onSuccess: (updatedUser) => {
          queryClient.setQueryData(getGetMeQueryKey(), updatedUser);
          setIsEditing(false);
          toast({
            title: "Profile updated",
            description: "Your profile has been updated successfully.",
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to update profile.",
          });
        }
      }
    );
  }

  const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  return (
    <div className="space-y-8 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-serif font-bold text-foreground mb-6">Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-primary/10 bg-primary/5">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
            <Avatar className="w-32 h-32 border-4 border-background shadow-md">
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-serif">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground">{user.role}</p>
            </div>
            {user.halaqahName && (
              <div className="bg-background px-3 py-1 rounded-full text-sm font-medium border text-primary">
                {user.halaqahName}
              </div>
            )}
            
            <div className="w-full pt-4 grid grid-cols-2 gap-4 border-t border-border mt-4">
              <div>
                <p className="text-2xl font-bold text-foreground">{user.totalAyat}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Ayat</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-500">{user.streak}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Personal Information</CardTitle>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="ghost" onClick={() => setIsEditing(false)} type="button">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Full Name</h3>
                  <p className="mt-1 text-lg">{user.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                  <p className="mt-1 text-lg">{user.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Member Since</h3>
                  <p className="mt-1 text-lg">{new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Badges & Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          {user.badges && user.badges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.badges.map((badge, idx) => (
                <Badge key={idx} variant="secondary" className="px-3 py-1 bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20 text-sm">
                  {badge}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground italic text-center py-8">
              Keep memorizing to earn badges!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
