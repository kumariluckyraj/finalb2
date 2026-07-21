"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPassword() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setSuccess("If that email exists, we have sent a password reset link.");

    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
        return;
      }

      setSuccess("Password successfully updated. Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);

    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .b2w-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
        }

        .b2w-card {
          width: 440px;
          background: #fff;
          border-radius: 8px;
          box-shadow: none;
          padding: 44px 36px 32px;
        }

        .b2w-title {
          font-size: 20px;
          font-weight: 600;
          color: #1a211e;
          margin-bottom: 10px;
          text-align: center;
        }

        .b2w-subtitle {
          font-size: 13.5px;
          color: #4b5563;
          text-align: center;
          margin-bottom: 28px;
          line-height: 1.5;
        }

        .b2w-field {
          position: relative;
          margin-bottom: 28px;
        }

        .b2w-field input {
          width: 100%;
          border: none;
          border-bottom: 1px solid #e2e8f0;
          outline: none;
          font-size: 14px;
          padding: 10px 0 8px;
          color: #1a211e;
          background: transparent;
          transition: border-color 0.2s;
        }

        .b2w-field input:focus {
          border-bottom-color: #1a211e;
        }

        .b2w-field input::placeholder { color: transparent; }

        .b2w-field label {
          position: absolute;
          left: 0;
          top: 10px;
          font-size: 14px;
          color: #4b5563;
          pointer-events: none;
          transition: all 0.2s ease;
        }

        .b2w-field input:focus + label,
        .b2w-field input:not(:placeholder-shown) + label {
          top: -10px;
          font-size: 11px;
          color: #1a211e;
        }

        .b2w-error {
          background: #fef2f2;
          border-left: 3px solid #ef4444;
          color: #c0392b;
          font-size: 12.5px;
          padding: 10px 12px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .b2w-success {
          background: #f0fdf4;
          border-left: 3px solid #22c55e;
          color: #166534;
          font-size: 12.5px;
          padding: 10px 12px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .b2w-btn-primary {
          width: 100%;
          background: #1a211e;
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 14px;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.6px;
          cursor: pointer;
          text-transform: uppercase;
          box-shadow: 0 4px 14px rgba(20,184,166,0.35);
          transition: transform 0.15s, box-shadow 0.15s;
          margin-bottom: 14px;
        }

        .b2w-btn-primary:hover:not(:disabled) {
          background: #C62828;
          box-shadow: 0 6px 20px rgba(20,184,166,0.45);
          transform: translateY(-1px);
        }

        .b2w-btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }

        .b2w-link {
          display: block;
          text-align: center;
          font-size: 13px;
          color: #1a211e;
          text-decoration: none;
          font-weight: 500;
          margin-top: 20px;
        }

        .b2w-link:hover { color: #C62828; }

        /* Spinner */
        @keyframes spin { to { transform: rotate(360deg); } }
        .b2w-spinner {
          display: inline-block;
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 6px;
        }
      `}</style>

      <div className="b2w-root">
        <div className="b2w-card">
          {step === "email" ? (
            <>
              <h1 className="b2w-title">Forgot Password?</h1>
              <p className="b2w-subtitle">Enter the email address associated with your account, and we will send you a link to reset your password.</p>

              {error && <div className="b2w-error">{error}</div>}
              {success && <div className="b2w-success">{success}</div>}

              <form onSubmit={handleEmailSubmit}>
                <div className="b2w-field">
                  <input
                    id="b2w-email"
                    type="email"
                    placeholder=" "
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <label htmlFor="b2w-email">Email Address</label>
                </div>
                
                <button type="submit" className="b2w-btn-primary" disabled={loading}>
                  {loading && <span className="b2w-spinner" />}
                  {loading ? "Sending Link..." : "Continue"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="b2w-title">Set New Password</h1>
              <p className="b2w-subtitle">Please enter your new password below for <b>{email}</b>.</p>

              {error && <div className="b2w-error">{error}</div>}
              {success && <div className="b2w-success">{success}</div>}

              <form onSubmit={handleResetSubmit}>
                <div className="b2w-field">
                  <input
                    id="b2w-new-password"
                    type="password"
                    placeholder=" "
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <label htmlFor="b2w-new-password">New Password</label>
                </div>
                
                <button type="submit" className="b2w-btn-primary" disabled={loading || !!success}>
                  {loading && <span className="b2w-spinner" />}
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </>
          )}

          <Link href="/login" className="b2w-link">
            Return to Login
          </Link>
        </div>
      </div>
    </>
  );
}
