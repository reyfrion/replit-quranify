import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin, LoginBody } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  if (isAuthenticated && !isLoading) {
    setLocation("/");
    return null;
  }

  function onSubmit(data: LoginFormValues) {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (response) => {
          queryClient.setQueryData(getGetMeQueryKey(), response.user);
          setLocation("/");
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: "Login failed",
            description: error.error || "An error occurred during login.",
          });
        },
      }
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-xl shadow-lg border border-border relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="text-center relative z-10">
          <div className="w-12 h-12 rounded-full bg-primary mx-auto flex items-center justify-center text-primary-foreground font-serif font-bold text-2xl mb-4">
            Q
          </div>
          <h2 className="text-3xl font-serif font-bold text-foreground">Welcome Back</h2>
          <p className="text-muted-foreground mt-2">Continue your hifzh journey</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative z-10">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="••••••••" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </form>
        </Form>

        <div className="text-center text-sm text-muted-foreground relative z-10">
          Don't have an account?{" "}
          <Link href="/register">
            <Button variant="link" className="p-0 h-auto text-primary hover:text-primary/80">
              Register here
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
