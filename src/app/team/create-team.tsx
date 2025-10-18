"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createFantasyTeam } from "@/lib/actions/fantasy-teams";
import { toast } from "sonner";

const createTeamSchema = z.object({
    name: z.string().min(1, "Team name is required").max(100, "Team name must be 100 characters or less"),
});

type CreateTeamFormData = z.infer<typeof createTeamSchema>;

interface CreateTeamProps {
    userId: string;
}

export default function CreateTeam({ userId }: CreateTeamProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const form = useForm<CreateTeamFormData>({
        resolver: zodResolver(createTeamSchema),
        defaultValues: {
            name: "",
        },
    });

    async function onSubmit(data: CreateTeamFormData) {
        setIsSubmitting(true);
        try {
            const team = await createFantasyTeam({
                name: data.name,
                owner: userId,
                season: 2025,
            });

            toast.success("Fantasy team created successfully!");
            form.reset();
            router.refresh();
        } catch (error) {
            console.error("Error creating team:", error);
            toast.error(error instanceof Error ? error.message : "Failed to create team");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="w-full max-w-md space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Create Your Fantasy Team</h2>
                <p className="text-muted-foreground mt-2">
                    Season 2025
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Team Name</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Enter your team name"
                                        {...field}
                                        disabled={isSubmitting}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? "Creating..." : "Create Team"}
                    </Button>
                </form>
            </Form>
        </div>
    );
}