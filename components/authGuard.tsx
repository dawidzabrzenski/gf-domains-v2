"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/services/auth-service";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (pathname === "/login") {
      setIsChecking(false);
      return;
    }

    const isAuthenticated = authService.isAuthenticated();

    if (!isAuthenticated) {
      router.push("/login");
    } else {
      setIsChecking(false);
    }
  }, [pathname, router]);

  if (isChecking && pathname !== "/login") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
