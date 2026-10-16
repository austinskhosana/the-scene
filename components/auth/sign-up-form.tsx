"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useSignUp } from "@clerk/react";
import { Button } from "@/components/lime/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/lime/ui/field";
import { Input } from "@/components/lime/ui/input";

const onboardingPath = "/onboarding";

function userMessage(error: { longMessage?: string; message?: string } | null | undefined) {
  return error?.longMessage ?? error?.message ?? null;
}

export function SignUpForm() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"details" | "verification">("details");
  const [localError, setLocalError] = useState<string | null>(null);
  const [localErrorField, setLocalErrorField] = useState<"password" | "confirmPassword" | "form" | null>(null);

  const pending = fetchStatus === "fetching";
  const navigateToOnboarding = ({ decorateUrl }: { decorateUrl: (url: string) => string }) => {
    window.location.assign(decorateUrl(onboardingPath));
  };

  async function handleDetailsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    setLocalErrorField(null);

    if (password.length < 15) {
      setLocalError("Use 15 or more characters for your password.");
      setLocalErrorField("password");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("The passwords do not match. Enter the same password twice.");
      setLocalErrorField("confirmPassword");
      return;
    }

    const { error } = await signUp.password({ emailAddress, password });
    if (error) {
      setLocalError(userMessage(error));
      setLocalErrorField("form");
      return;
    }

    if (signUp.status === "complete") {
      const { error: finalizeError } = await signUp.finalize({ navigate: navigateToOnboarding });
      setLocalError(userMessage(finalizeError));
      setLocalErrorField(finalizeError ? "form" : null);
      return;
    }

    const { error: verificationError } = await signUp.verifications.sendEmailCode();
    if (verificationError) {
      setLocalError(userMessage(verificationError));
      setLocalErrorField("form");
      return;
    }

    setStep("verification");
  }

  async function handleVerificationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    setLocalErrorField(null);

    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) {
      setLocalError(userMessage(error));
      setLocalErrorField("form");
      return;
    }

    const { error: finalizeError } = await signUp.finalize({ navigate: navigateToOnboarding });
    setLocalError(userMessage(finalizeError));
    setLocalErrorField(finalizeError ? "form" : null);
  }

  async function handleXSignUp() {
    setLocalError(null);
    setLocalErrorField(null);
    const { error } = await signUp.sso({
      strategy: "oauth_twitter",
      redirectUrl: onboardingPath,
      redirectCallbackUrl: "/sso-callback",
    });
    setLocalError(userMessage(error));
    setLocalErrorField(error ? "form" : null);
  }

  if (step === "verification") {
    return (
      <form className="flex flex-col gap-4!" onSubmit={handleVerificationSubmit} noValidate>
        <div className="flex flex-col gap-1! text-center">
          <h2 className="text-lg font-semibold">Check your email</h2>
          <p className="text-sm text-fg-2">Enter the verification code sent to {emailAddress}.</p>
        </div>
        <Field name="code" invalid={Boolean(errors.fields.code || localError)}>
          <FieldLabel>Verification code</FieldLabel>
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoComplete="one-time-code"
            inputMode="numeric"
            placeholder="Enter your code"
            size="lg"
            required
          />
          {(errors.fields.code || localError) && <FieldError match role="alert">{userMessage(errors.fields.code) ?? localError}</FieldError>}
        </Field>
        <Button type="submit" size="lg" pending={pending}>Verify email</Button>
        <Button type="button" variant="link" onClick={() => setStep("details")}>Use a different email address</Button>
      </form>
    );
  }

  const emailError = userMessage(errors.fields.emailAddress);
  const passwordError = userMessage(errors.fields.password) ?? (localErrorField === "password" ? localError : null);
  const confirmPasswordError = localErrorField === "confirmPassword" ? localError : null;
  const formError = localErrorField === "form" ? localError : null;

  return (
    <div className="flex flex-col gap-4!">
      <form className="flex flex-col gap-4!" onSubmit={handleDetailsSubmit} noValidate>
        <Field name="emailAddress" invalid={Boolean(emailError)}>
          <FieldLabel>Email address</FieldLabel>
          <Input
            type="email"
            value={emailAddress}
            onChange={(event) => setEmailAddress(event.target.value)}
            autoComplete="email"
            placeholder="Enter your email address"
            size="lg"
            required
          />
          {emailError && <FieldError match role="alert">{emailError}</FieldError>}
        </Field>

        <Field name="password" invalid={Boolean(passwordError)}>
          <FieldLabel>Password</FieldLabel>
          <Input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setLocalError(null);
              setLocalErrorField(null);
            }}
            autoComplete="new-password"
            placeholder="Create a password"
            size="lg"
            minLength={15}
            required
          />
          <FieldDescription className="mt-1!">Your password must contain 15 or more characters.</FieldDescription>
          {passwordError && <FieldError match role="alert">{passwordError}</FieldError>}
        </Field>

        <Field name="confirmPassword" invalid={Boolean(confirmPasswordError)}>
          <FieldLabel>Confirm password</FieldLabel>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setLocalError(null);
              setLocalErrorField(null);
            }}
            autoComplete="new-password"
            placeholder="Enter your password again"
            size="lg"
            minLength={15}
            required
          />
          {confirmPasswordError && <FieldError match role="alert">{confirmPasswordError}</FieldError>}
        </Field>

        {formError && <FieldError match role="alert">{formError}</FieldError>}
        <div id="clerk-captcha" />
        <Button type="submit" size="lg" pending={pending}>Continue</Button>
      </form>

      <div className="flex items-center gap-3!" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span className="text-sm text-fg-2">or</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <Button type="button" variant="secondary" size="lg" onClick={handleXSignUp} disabled={pending}>
        Continue with X
      </Button>

      <p className="text-center text-sm text-fg-2">
        Already have an account?{" "}
        <Link className="font-medium text-fg underline! underline-offset-4! hover:underline!" href="/sign-in">Sign in</Link>
      </p>
    </div>
  );
}
