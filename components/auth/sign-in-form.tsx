"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useSignIn } from "@clerk/react/legacy";
import { Button } from "@/components/lime/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/lime/ui/field";
import { Input } from "@/components/lime/ui/input";

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "errors" in error) {
    const firstError = (error as {errors?: Array<{longMessage?: string; message?: string}>}).errors?.[0];
    if (firstError) return firstError.longMessage ?? firstError.message ?? null;
  }

  return error instanceof Error ? error.message : "We couldn’t sign you in. Check your details and try again.";
}

export function SignInForm() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetPasswordConfirmation, setResetPasswordConfirmation] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [step, setStep] = useState<"sign-in" | "forgot-email" | "forgot-code">("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLoaded) return;

    setError(null);
    setPending(true);

    try {
      const result = await signIn.create({
        strategy: "password",
        identifier: emailAddress,
        password,
      });

      if (result.status !== "complete" || !result.createdSessionId) {
        setError("Additional verification is required to finish signing in.");
        return;
      }

      await setActive({ session: result.createdSessionId, redirectUrl: "/dashboard" });
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setPending(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!isLoaded) return;

    setError(null);
    setPending(true);

    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback?destination=dashboard",
        redirectUrlComplete: "/dashboard",
      });
    } catch (signInError) {
      setError(errorMessage(signInError));
      setPending(false);
    }
  }

  async function handleSendResetCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLoaded) return;

    setError(null);
    setPending(true);

    try {
      const result = await signIn.create({identifier: emailAddress});
      const resetFactor = result.supportedFirstFactors?.find((factor) => factor.strategy === "reset_password_email_code");

      if (!resetFactor || !("emailAddressId" in resetFactor)) {
        setError("Password reset by email is not available for this account.");
        return;
      }

      await signIn.prepareFirstFactor({
        strategy: "reset_password_email_code",
        emailAddressId: resetFactor.emailAddressId,
      });
      setStep("forgot-code");
    } catch (resetError) {
      setError(errorMessage(resetError));
    } finally {
      setPending(false);
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLoaded) return;

    setError(null);
    if (resetPassword.length < 15) {
      setError("Use 15 or more characters for your new password.");
      return;
    }
    if (resetPassword !== resetPasswordConfirmation) {
      setError("The passwords do not match. Enter the same password twice.");
      return;
    }

    setPending(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: resetCode,
        password: resetPassword,
      });

      if (result.status !== "complete" || !result.createdSessionId) {
        setError("Additional verification is required to finish resetting your password.");
        return;
      }

      await setActive({session: result.createdSessionId, redirectUrl: "/dashboard"});
    } catch (resetError) {
      setError(errorMessage(resetError));
    } finally {
      setPending(false);
    }
  }

  function returnToSignIn() {
    setError(null);
    setStep("sign-in");
  }

  if (step === "forgot-email") {
    return (
      <div className="flex flex-col gap-4!">
        <div className="flex flex-col gap-1!">
          <h2 className="text-lg font-semibold">Reset your password</h2>
          <p className="text-sm text-fg-2">Enter your email and we’ll send you a reset code.</p>
        </div>
        <form className="flex flex-col gap-4!" onSubmit={handleSendResetCode} noValidate>
          <Field name="emailAddress" invalid={Boolean(error)}>
            <FieldLabel>Email address</FieldLabel>
            <Input
              type="email"
              value={emailAddress}
              onChange={(event) => {
                setEmailAddress(event.target.value);
                setError(null);
              }}
              autoComplete="email"
              placeholder="Enter your email address"
              size="lg"
              required
            />
            {error && <FieldError match role="alert">{error}</FieldError>}
          </Field>
          <Button type="submit" size="lg" pending={pending}>Send reset code</Button>
        </form>
        <Button type="button" variant="link" onClick={returnToSignIn}>Back to sign in</Button>
      </div>
    );
  }

  if (step === "forgot-code") {
    return (
      <div className="flex flex-col gap-4!">
        <div className="flex flex-col gap-1!">
          <h2 className="text-lg font-semibold">Create a new password</h2>
          <p className="text-sm text-fg-2">Enter the code sent to {emailAddress}, then choose a new password.</p>
        </div>
        <form className="flex flex-col gap-4!" onSubmit={handleResetPassword} noValidate>
          <Field name="resetCode" invalid={Boolean(error)}>
            <FieldLabel>Reset code</FieldLabel>
            <Input
              value={resetCode}
              onChange={(event) => {
                setResetCode(event.target.value);
                setError(null);
              }}
              autoComplete="one-time-code"
              inputMode="numeric"
              placeholder="Enter your reset code"
              size="lg"
              required
            />
          </Field>
          <Field name="resetPassword" invalid={Boolean(error)}>
            <FieldLabel>New password</FieldLabel>
            <Input
              type="password"
              value={resetPassword}
              onChange={(event) => {
                setResetPassword(event.target.value);
                setError(null);
              }}
              autoComplete="new-password"
              placeholder="Create a new password"
              size="lg"
              minLength={15}
              required
            />
            <FieldDescription>Your password must contain 15 or more characters.</FieldDescription>
          </Field>
          <Field name="resetPasswordConfirmation" invalid={Boolean(error)}>
            <FieldLabel>Confirm new password</FieldLabel>
            <Input
              type="password"
              value={resetPasswordConfirmation}
              onChange={(event) => {
                setResetPasswordConfirmation(event.target.value);
                setError(null);
              }}
              autoComplete="new-password"
              placeholder="Enter your new password again"
              size="lg"
              minLength={15}
              required
            />
            {error && <FieldError match role="alert">{error}</FieldError>}
          </Field>
          <Button type="submit" size="lg" pending={pending}>Reset password</Button>
        </form>
        <Button type="button" variant="link" onClick={returnToSignIn}>Back to sign in</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4!">
      <form className="flex flex-col gap-4!" onSubmit={handleSubmit} noValidate>
        <Field name="emailAddress" invalid={Boolean(error)}>
          <FieldLabel>Email address</FieldLabel>
          <Input
            type="email"
            value={emailAddress}
            onChange={(event) => {
              setEmailAddress(event.target.value);
              setError(null);
            }}
            autoComplete="email"
            placeholder="Enter your email address"
            size="lg"
            required
          />
        </Field>

        <Field name="password" invalid={Boolean(error)}>
          <FieldLabel>Password</FieldLabel>
          <Input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError(null);
            }}
            autoComplete="current-password"
            placeholder="Enter your password"
            size="lg"
            required
          />
          {error && <FieldError match role="alert">{error}</FieldError>}
        </Field>

        <Button type="button" variant="link" size="sm" className="self-start! underline! underline-offset-4! hover:underline!" onClick={() => {
          setError(null);
          setStep("forgot-email");
        }}>Forgot password?</Button>

        <div id="clerk-captcha" />
        <Button type="submit" size="lg" pending={pending}>Continue</Button>
      </form>

      <div className="flex items-center gap-3!" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span className="text-sm text-fg-2">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <Button type="button" variant="secondary" size="lg" onClick={handleGoogleSignIn} disabled={pending}>
        Continue with Google
      </Button>

      <p className="text-center text-sm text-fg-2">
        Don’t have an account?{" "}
        <Link className="font-medium text-fg underline! underline-offset-4! hover:underline!" href="/sign-up">Sign up</Link>
      </p>
    </div>
  );
}
