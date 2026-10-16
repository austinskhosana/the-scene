"use client";

import {useEffect, useState, type FormEvent} from "react";
import Link from "next/link";
import {useClerk, useUser} from "@clerk/react";
import {Avatar} from "@/components/lime/ui/avatar";
import {Button, buttonVariants} from "@/components/lime/ui/button";
import {Card, CardDescription, CardHeader, CardTitle} from "@/components/lime/ui/card";
import {Field, FieldError, FieldLabel} from "@/components/lime/ui/field";
import {Input} from "@/components/lime/ui/input";
import {List, ListItem} from "@/components/lime/ui/list";
import {ArrowLeft, Delete, Email, Icon, Locked, LogoX, Logout, UserFilled} from "@/components/lime/icon";
import {cn} from "@/lib/lime/utils";

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "We couldn’t save those changes. Try again.";
}

export default function AccountPage() {
  const {isLoaded, user} = useUser();
  const {signOut} = useClerk();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
  }, [user]);

  if (!isLoaded) {
    return (
      <main className="mx-auto! min-h-dvh w-full max-w-xl bg-page px-4 py-8 text-fg sm:px-6">
        <p className="text-sm text-fg-2">Loading your account…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto! min-h-dvh w-full max-w-xl bg-page px-4 py-8 text-fg sm:px-6">
        <h1 className="font-pixel-square text-xl font-semibold tracking-tight sm:text-2xl">Account</h1>
        <p className="mt-2 text-sm text-fg-2">Sign in to manage your Scene account.</p>
        <Link href="/sign-in" className={cn(buttonVariants({size: "lg"}), "mt-6")}>Sign in</Link>
      </main>
    );
  }

  const name = user.fullName ?? user.username ?? user.primaryEmailAddress?.emailAddress ?? "Scene account";
  const handle = user.username ? `@${user.username}` : null;
  const connectedAccounts = user.externalAccounts.filter((account) => account.verification?.status === "verified");

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError("");
    setSaved(false);

    try {
      await user.update({
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
      });
      await user.reload();
      setSaved(true);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-dvh bg-page text-fg">
      <main className="mx-auto! w-full max-w-xl px-4! pb-12! pt-4! sm:px-6! sm:pb-16! sm:pt-8!">
        <header className="flex h-14 items-center gap-2">
          <Link href="/dashboard" aria-label="Back to dashboard" className={buttonVariants({variant: "ghost", size: "icon"})}>
            <Icon icon={ArrowLeft} size={20}/>
          </Link>
          <h1 className="font-pixel-square text-xl font-semibold leading-tight tracking-tight sm:text-2xl">Account</h1>
        </header>

        <div className="flex flex-col gap-8">
          <section aria-labelledby="profile-heading" className="mt-8! flex flex-col gap-3 sm:mt-10!">
            <div>
              <h2 id="profile-heading" className="font-pixel-square text-lg font-semibold">Profile</h2>
              <p className="mt-1 text-sm text-fg-2">The name shown across The Scene.</p>
            </div>
            <Card variant="surface" className="gap-6">
              <div className="flex min-w-0 items-center gap-4">
                <Avatar size="lg" src={user.hasImage ? user.imageUrl : undefined} name={name}/>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold">{name}</p>
                  <p className="truncate text-sm text-fg-2">{handle ?? user.primaryEmailAddress?.emailAddress}</p>
                </div>
              </div>

              <form onSubmit={saveProfile} className="flex w-full flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field name="firstName">
                    <FieldLabel>First name</FieldLabel>
                    <Input focusStyle="neutral" value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name"/>
                  </Field>
                  <Field name="lastName">
                    <FieldLabel>Last name</FieldLabel>
                    <Input focusStyle="neutral" value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name"/>
                  </Field>
                </div>
                {error && <FieldError role="alert">{error}</FieldError>}
                <div className="flex flex-col gap-2">
                  <Button type="submit" size="lg" pending={pending} className="w-full sm:w-auto sm:self-start">
                    Save profile
                  </Button>
                  {saved && <p aria-live="polite" className="text-sm text-fg-2">Profile saved.</p>}
                </div>
              </form>
            </Card>
          </section>

          <section aria-labelledby="email-heading" className="flex flex-col gap-3">
            <div>
              <h2 id="email-heading" className="font-pixel-square text-lg font-semibold">Email addresses</h2>
              <p className="mt-1 text-sm text-fg-2">Addresses connected to your account.</p>
            </div>
            <List variant="grouped">
              {user.emailAddresses.map((email) => (
                <ListItem
                  key={email.id}
                  leading={<Icon icon={Email} size={20}/>}
                  title={email.emailAddress}
                  description={email.verification.status === "verified" ? "Verified" : "Verification needed"}
                  trailing={email.id === user.primaryEmailAddressId ? <span className="text-sm text-fg-2">Primary</span> : undefined}
                />
              ))}
            </List>
          </section>

          <section aria-labelledby="connections-heading" className="flex flex-col gap-3">
            <div>
              <h2 id="connections-heading" className="font-pixel-square text-lg font-semibold">Connected accounts</h2>
              <p className="mt-1 text-sm text-fg-2">Accounts used to sign in to The Scene.</p>
            </div>
            <List variant="grouped">
              {connectedAccounts.length > 0 ? connectedAccounts.map((account) => {
                const isX = account.provider === "twitter" || account.provider === "x";
                const identifier = account.username ? `@${account.username}` : account.emailAddress;
                return (
                  <ListItem
                    key={account.id}
                    leading={<Icon icon={isX ? LogoX : UserFilled} size={20}/>}
                    title={account.providerTitle()}
                    description={identifier}
                    trailing={<span className="text-sm text-fg-2">Connected</span>}
                  />
                );
              }) : (
                <ListItem
                  leading={<Icon icon={LogoX} size={20}/>}
                  title="X account"
                  description="No connected X account found"
                />
              )}
            </List>
          </section>

          <section aria-labelledby="security-heading" className="flex flex-col gap-3 pb-8! sm:pb-12!">
            <div>
              <h2 id="security-heading" className="font-pixel-square text-lg font-semibold">Security</h2>
              <p className="mt-1 text-sm text-fg-2">Your current sign-in setup.</p>
            </div>
            <Card variant="surface" className="text-left">
              <CardHeader>
                <div className="min-w-0">
                  <div className="flex items-start gap-2">
                    <Icon icon={Locked} size={20} className="mt-0.5 shrink-0"/>
                    <div className="min-w-0">
                      <CardTitle>Sign-in methods</CardTitle>
                      <CardDescription className="mt-1">
                        {user.passwordEnabled ? "Password and connected accounts are enabled." : "Your connected account is used to sign in."}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <div className="flex flex-col items-start gap-3 border-t border-line pt-4 text-left">
                <div className="min-w-0">
                  <p className="text-sm font-medium">End your session</p>
                  <p className="text-sm text-fg-2">Sign out on this device.</p>
                </div>
                <Button type="button" size="sm" variant="outline" className="w-full" icon={<Icon icon={Logout} size={16}/>} onClick={() => void signOut({redirectUrl: "/sign-in"})}>
                  Sign out
                </Button>
              </div>
              <div className="flex flex-col items-start gap-3 border-t border-line pt-4 text-left">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Delete account</p>
                  <p className="text-sm text-fg-2">Permanently remove your Scene account.</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="w-full"
                  pending={deleting}
                  icon={<Icon icon={Delete} size={16}/>}
                  onClick={() => {
                    if (!window.confirm("Delete your Scene account permanently? This cannot be undone.")) return;
                    setDeleting(true);
                    setDeleteError("");
                    void user.delete().then(() => signOut({redirectUrl: "/sign-in"})).catch((caught) => {
                      setDeleting(false);
                      setDeleteError(errorMessage(caught));
                    });
                  }}
                >
                  Delete account
                </Button>
              </div>
              {deleteError && <div className="border-t border-line pt-4 text-left"><FieldError role="alert">{deleteError}</FieldError></div>}
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
