"use client";

import { LandingPage } from "@/components/landing/landing-page";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { ForgotPasswordForm } from "./forgot-password-form";
import { ResetPasswordForm } from "./reset-password-form";
import { VerifyEmailNotice } from "./verify-email-notice";
import type { PageKey } from "@/lib/router";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { ConfigureSupabaseInline } from "./configure-inline";

interface AuthRouterProps {
  page: PageKey;
}

export function AuthRouter({ page }: AuthRouterProps) {
  if (!isSupabaseConfigured) {
    return <ConfigureSupabaseInline />;
  }

  switch (page) {
    case "login":
      return <LoginForm />;
    case "register":
      return <RegisterForm />;
    case "forgot-password":
      return <ForgotPasswordForm />;
    case "reset-password":
      return <ResetPasswordForm />;
    case "verify-email":
      return <VerifyEmailNotice />;
    default:
      return <LandingPage />;
  }
}
