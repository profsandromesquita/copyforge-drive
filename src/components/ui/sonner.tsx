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
            "group toast group-[.toaster]:bg-white dark:group-[.toaster]:bg-zinc-900 group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border/50 group-[.toaster]:shadow-xl group-[.toaster]:shadow-black/10 group-[.toaster]:rounded-xl group-[.toaster]:py-3 group-[.toaster]:px-4 group-[.toaster]:min-h-0 group-[.toaster]:gap-3 group-[.toaster]:min-w-[320px]",
          title: "group-[.toast]:text-sm group-[.toast]:font-semibold group-[.toast]:leading-tight group-[.toast]:text-zinc-900 dark:group-[.toast]:text-zinc-100",
          description: "group-[.toast]:text-xs group-[.toast]:text-zinc-500 dark:group-[.toast]:text-zinc-400 group-[.toast]:mt-0.5 group-[.toast]:leading-tight",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-md group-[.toast]:px-2.5 group-[.toast]:py-1.5 group-[.toast]:text-xs group-[.toast]:font-medium group-[.toast]:h-auto group-[.toast]:ml-auto",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md group-[.toast]:px-2.5 group-[.toast]:py-1.5 group-[.toast]:text-xs group-[.toast]:h-auto",
          closeButton:
            "group-[.toast]:bg-transparent group-[.toast]:border-0 group-[.toast]:text-muted-foreground hover:group-[.toast]:text-foreground group-[.toast]:left-auto group-[.toast]:right-2 group-[.toast]:top-2 group-[.toast]:h-4 group-[.toast]:w-4",
          success:
            "group-[.toast]:!border-l-4 group-[.toast]:!border-l-emerald-500 group-[.toast]:bg-gradient-to-r group-[.toast]:from-emerald-50 group-[.toast]:to-white dark:group-[.toast]:from-emerald-950/30 dark:group-[.toast]:to-zinc-900 [&>[data-icon]]:text-emerald-600 dark:[&>[data-icon]]:text-emerald-400 [&>[data-icon]]:bg-emerald-100 dark:[&>[data-icon]]:bg-emerald-900/50 [&>[data-icon]]:rounded-full [&>[data-icon]]:p-1",
          error:
            "group-[.toast]:!border-l-4 group-[.toast]:!border-l-red-500 group-[.toast]:bg-gradient-to-r group-[.toast]:from-red-50 group-[.toast]:to-white dark:group-[.toast]:from-red-950/30 dark:group-[.toast]:to-zinc-900 [&>[data-icon]]:text-red-600 dark:[&>[data-icon]]:text-red-400 [&>[data-icon]]:bg-red-100 dark:[&>[data-icon]]:bg-red-900/50 [&>[data-icon]]:rounded-full [&>[data-icon]]:p-1",
          warning:
            "group-[.toast]:!border-l-4 group-[.toast]:!border-l-amber-500 group-[.toast]:bg-gradient-to-r group-[.toast]:from-amber-50 group-[.toast]:to-white dark:group-[.toast]:from-amber-950/30 dark:group-[.toast]:to-zinc-900 [&>[data-icon]]:text-amber-600 dark:[&>[data-icon]]:text-amber-400 [&>[data-icon]]:bg-amber-100 dark:[&>[data-icon]]:bg-amber-900/50 [&>[data-icon]]:rounded-full [&>[data-icon]]:p-1",
          info:
            "group-[.toast]:!border-l-4 group-[.toast]:!border-l-blue-500 group-[.toast]:bg-gradient-to-r group-[.toast]:from-blue-50 group-[.toast]:to-white dark:group-[.toast]:from-blue-950/30 dark:group-[.toast]:to-zinc-900 [&>[data-icon]]:text-blue-600 dark:[&>[data-icon]]:text-blue-400 [&>[data-icon]]:bg-blue-100 dark:[&>[data-icon]]:bg-blue-900/50 [&>[data-icon]]:rounded-full [&>[data-icon]]:p-1",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
