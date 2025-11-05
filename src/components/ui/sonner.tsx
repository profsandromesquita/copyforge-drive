import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur-md group-[.toaster]:rounded-xl group-[.toaster]:p-4",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm",
          success:
            "group-[.toast]:bg-emerald-50 dark:group-[.toast]:bg-emerald-950/20 group-[.toast]:border-emerald-200 dark:group-[.toast]:border-emerald-800/30 group-[.toast]:text-emerald-900 dark:group-[.toast]:text-emerald-100",
          error:
            "group-[.toast]:bg-red-50 dark:group-[.toast]:bg-red-950/20 group-[.toast]:border-red-200 dark:group-[.toast]:border-red-800/30 group-[.toast]:text-red-900 dark:group-[.toast]:text-red-100",
          warning:
            "group-[.toast]:bg-amber-50 dark:group-[.toast]:bg-amber-950/20 group-[.toast]:border-amber-200 dark:group-[.toast]:border-amber-800/30 group-[.toast]:text-amber-900 dark:group-[.toast]:text-amber-100",
          info:
            "group-[.toast]:bg-blue-50 dark:group-[.toast]:bg-blue-950/20 group-[.toast]:border-blue-200 dark:group-[.toast]:border-blue-800/30 group-[.toast]:text-blue-900 dark:group-[.toast]:text-blue-100",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
