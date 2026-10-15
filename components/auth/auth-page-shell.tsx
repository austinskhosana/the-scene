import Link from "next/link";
import { CircleDash, Icon } from "@/components/lime/icon";
import { buttonVariants } from "@/components/lime/ui/button";
import { Card, CardContent } from "@/components/lime/ui/card";
import { cn } from "@/lib/lime/utils";

type AuthPageShellProps = Readonly<{
  title: string;
  description: string;
  children: React.ReactNode;
}>;

export function AuthPageShell({ title, description, children }: AuthPageShellProps) {
  return (
    <div className="lime min-h-dvh bg-page text-fg">
      <main className="mx-auto! flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-4 py-8 sm:px-6">
        <Link
          href="/"
          aria-label="The Scene home"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "auth-logo size-(--control-lg) rounded-panel")}
        >
          <Icon icon={CircleDash} size={24} />
        </Link>
        <div className="auth-intro flex flex-col gap-2 text-center">
          <h1 className="auth-page-title font-pixel-square leading-tight tracking-tight">{title}</h1>
          <p className="auth-intro-description w-full max-w-xs self-center text-center text-sm leading-normal text-fg-2">{description}</p>
        </div>
        <Card variant="surface" className="w-full">
          <CardContent>{children}</CardContent>
        </Card>
      </main>
    </div>
  );
}
