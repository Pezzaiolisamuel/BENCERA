import type { FormEvent } from "react";
import AdminField from "./AdminField";
import { adminStyles } from "./admin-styles";

type LoginModalProps = {
  isCheckingAuth: boolean;
  loginError: string | null;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onUsernameChange: (value: string) => void;
  password: string;
  username: string;
};

export default function LoginModal({
  isCheckingAuth,
  loginError,
  onPasswordChange,
  onSubmit,
  onUsernameChange,
  password,
  username,
}: LoginModalProps) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, display: "grid", placeItems: "center" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          background: "rgba(0,0,0,0.35)",
        }}
      />

      <form
        onSubmit={onSubmit}
        style={{
          position: "relative",
          width: 320,
          minHeight: 320,
          borderRadius: 18,
          background: "rgba(255,255,255,0.92)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          padding: 18,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          justifyContent: "center",
          alignItems: "stretch",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>Admin Access</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Please sign in to continue</div>
        </div>

        <AdminField label="Username">
          <input
            id="admin-username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            placeholder="Enter username"
            disabled={isCheckingAuth}
            style={adminStyles.input}
          />
        </AdminField>

        <AdminField label="Password">
          <input
            id="admin-password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="Enter password"
            type="password"
            disabled={isCheckingAuth}
            style={adminStyles.input}
          />
        </AdminField>

        <button type="submit" disabled={isCheckingAuth} style={adminStyles.button}>
          {isCheckingAuth ? "Checking..." : "Sign in"}
        </button>

        {loginError ? (
          <div style={{ marginTop: 4, fontSize: 12, color: "#b00020", textAlign: "center" }}>
            {loginError}
          </div>
        ) : null}
      </form>
    </div>
  );
}
