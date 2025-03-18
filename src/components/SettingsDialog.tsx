import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

const formSchema = z.object({
  apiKey: z.string().min(1, {
    message: "API key is required",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export interface SettingsDialogProps {
  onSettingsChange: () => void;
}

const SettingsDialog = ({ onSettingsChange }: SettingsDialogProps) => {
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: localStorage.getItem("chatopia-groq-api-key") || "",
    },
  });

  const onSubmit = (values: FormValues) => {
    localStorage.setItem("chatopia-groq-api-key", values.apiKey);
    setOpen(false);
    toast.success("Settings saved");
    onSettingsChange();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Groq API Settings</DialogTitle>
          <DialogDescription>
            Configure your Groq API key to access the models.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="gsk_..." 
                      {...field} 
                      type="password"
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter your Groq API key. You can find it in your Groq dashboard.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog; 