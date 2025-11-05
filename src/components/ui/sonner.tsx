import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-right"
      gap={8}
      toastOptions={{
        duration: 3000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg group-[.toaster]:py-2.5 group-[.toaster]:px-3.5 group-[.toaster]:min-h-0 group-[.toaster]:gap-2",
          title: "group-[.toast]:text-sm group-[.toast]:font-semibold group-[.toast]:leading-none",
          description: "group-[.toast]:text-xs group-[.toast]:text-muted-foreground group-[.toast]:mt-1 group-[.toast]:leading-tight",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-md group-[.toast]:px-2.5 group-[.toast]:py-1.5 group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:h-auto group-[.toast]:ml-auto",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md group-[.toast]:px-2.5 group-[.toast]:py-1.5 group-[.toast]:text-xs group-[.toast]:h-auto",
          closeButton:
            "group-[.toast]:bg-transparent group-[.toast]:border-0 group-[.toast]:text-muted-foreground hover:group-[.toast]:text-foreground group-[.toast]:left-auto group-[.toast]:right-2 group-[.toast]:top-2 group-[.toast]:h-4 group-[.toast]:w-4",
          success:
            "group-[.toast]:bg-emerald-50 dark:group-[.toast]:bg-emerald-950/40 group-[.toast]:border-emerald-200/60 dark:group-[.toast]:border-emerald-800/50 group-[.toast]:text-emerald-900 dark:group-[.toast]:text-emerald-100",
          error:
            "group-[.toast]:bg-red-50 dark:group-[.toast]:bg-red-950/40 group-[.toast]:border-red-200/60 dark:group-[.toast]:border-red-800/50 group-[.toast]:text-red-900 dark:group-[.toast]:text-red-100",
          warning:
            "group-[.toast]:bg-amber-50 dark:group-[.toast]:bg-amber-950/40 group-[.toast]:border-amber-200/60 dark:group-[.toast]:border-amber-800/50 group-[.toast]:text-amber-900 dark:group-[.toast]:text-amber-100",
          info:
            "group-[.toast]:bg-blue-50 dark:group-[.toast]:bg-blue-950/40 group-[.toast]:border-blue-200/60 dark:group-[.toast]:border-blue-800/50 group-[.toast]:text-blue-900 dark:group-[.toast]:text-blue-100",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
