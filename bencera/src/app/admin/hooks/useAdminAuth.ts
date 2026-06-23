import type { FormEvent } from "react";
import { useEffect, useState } from "react";

type UseAdminAuthOptions = {
  onAuthenticated: () => Promise<void>;
  onLoginAttempt: () => void;
};

export function useAdminAuth({ onAuthenticated, onLoginAttempt }: UseAdminAuthOptions) {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoginVisible, setIsLoginVisible] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      setLoginError(null);

      try {
        const response = await fetch("/api/admin/me", { cache: "no-store" });
        const data = await response.json();
        const isAuthenticated = !!data?.authenticated;

        setIsLoginVisible(!isAuthenticated);

        if (isAuthenticated) {
          await onAuthenticated();
        }
      } catch {
        setIsLoginVisible(true);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [onAuthenticated]);

  useEffect(() => {
    if (!isLoginVisible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () =>
      window.removeEventListener("keydown", handleKeyDown, {
        capture: true,
      } as EventListenerOptions);
  }, [isLoginVisible]);

  const handleLoginSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoginError(null);
    onLoginAttempt();

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data?.error || "Login failed");
        return;
      }

      setIsLoginVisible(false);
      setPassword("");
      await onAuthenticated();
    } catch {
      setLoginError("Login failed");
    }
  };

  return {
    handleLoginSubmit,
    isCheckingAuth,
    isLoginVisible,
    loginError,
    password,
    setPassword,
    setUsername,
    username,
  };
}
