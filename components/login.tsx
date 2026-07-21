"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      const redirectMap: Record<string, string> = {
        admin: "/admin/vendors",
        vendor: "/vendor/dashboard",
        customer: "/",
      };
      window.location.href = redirectMap[data.role] || "/";
    } catch (err) {
      console.error("Catch error:", err);
      setError("Something went wrong");
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
          background: #f8f9f8;
        }

        .b2w-card {
          display: flex;
          width: 800px;
          min-height: 500px;
          background: #fff;
          border-radius: 8px;
          box-shadow: none;
          overflow: hidden;
        }

        .b2w-left {
          width: 40%;
          background: #1a211e;
          padding: 44px 32px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }

        .b2w-left::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(20,184,166,0.08) 0%, transparent 70%);
        }

        .b2w-brand h2 {
          color: #fff;
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 10px;
          line-height: 1.3;
          position: relative;
        }

        .b2w-brand p {
          color: rgba(255,255,255,0.7);
          font-size: 13.5px;
          line-height: 1.6;
          position: relative;
        }

        .b2w-illustration {
          display: flex;
          justify-content: flex-end;
          align-items: flex-end;
          padding-top: 24px;
          position: relative;
        }

        .b2w-illustration svg {
          width: 120px;
          opacity: 0.9;
        }

        .b2w-right {
          flex: 1;
          padding: 44px 40px 32px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .b2w-form-section {
          flex: 1;
        }

        .b2w-field {
          position: relative;
          margin-bottom: 28px;
        }

        .b2w-field input {
          width: 100%;
          border: none;
          border-bottom: 1.5px solid #e2e8f0;
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

        .b2w-field input:focus-visible {
          outline: 2px solid #1a211e;
          outline-offset: 2px;
          border-radius: 4px;
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

        .b2w-hint {
          font-size: 11.5px;
          color: #4b5563;
          margin-top: 4px;
          line-height: 1.5;
        }

        .b2w-error {
          background: #fef2f2;
          border-left: 3px solid #ef4444;
          color: #b91c1c;
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
          letter-spacing: 0.4px;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(20,184,166,0.35);
          transition: transform 0.2s, box-shadow 0.2s;
          margin-bottom: 14px;
        }

        .b2w-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(20,184,166,0.4);
        }

        .b2w-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        .b2w-divider {
          text-align: center;
          font-size: 12px;
          color: #4b5563;
          margin-bottom: 14px;
          position: relative;
        }

        .b2w-divider::before, .b2w-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 40%;
          height: 1px;
          background: #e2e8f0;
        }
        .b2w-divider::before { left: 0; }
        .b2w-divider::after { right: 0; }

        .b2w-btn-secondary {
          width: 100%;
          background: #fff;
          color: #1a211e;
          border: 1.5px solid #1a211e;
          border-radius: 8px;
          padding: 13px;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.3px;
          cursor: pointer;
          transition: background 0.18s, transform 0.2s;
        }

        .b2w-btn-secondary:hover { background: #f0f5ff; transform: translateY(-1px); }

        .b2w-footer {
          text-align: center;
          font-size: 12px;
          color: #4b5563;
          padding-top: 20px;
          border-top: 1px solid #f1f5f9;
          margin-top: 20px;
        }

        .b2w-footer span {
          color: #1a211e;
          font-weight: 600;
          cursor: pointer;
        }

        .b2w-footer span:hover { text-decoration: underline; }

        .b2w-tos {
          font-size: 11px;
          color: #4b5563;
          text-align: center;
          margin-top: 16px;
          line-height: 1.6;
        }

        .b2w-tos a { color: #1a211e; text-decoration: none; }
        .b2w-tos a:hover { text-decoration: underline; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .b2w-spinner {
          display: inline-block;
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 6px;
        }

        @media (max-width: 640px) {
          .b2w-card { flex-direction: column; width: 100%; min-height: auto; border-radius: 0; }
          .b2w-left { width: 100%; padding: 32px 24px 20px; }
          .b2w-right { padding: 28px 24px 24px; }
          .b2w-illustration { display: none; }
          .b2w-brand h2 { font-size: 18px; }
        }
      `}</style>

      <div className="b2w-root">
        <div className="b2w-card">

          {/* ── LEFT ── */}
          <div className="b2w-left">
            <div className="b2w-brand">
              <h2>Login &amp; get access to your Orders, Wishlist &amp; Recommendations</h2>
              <p style={{ marginTop: 16 }}>New to our platform?<br />Create an account and enjoy a new experience.</p>
            </div>
            <div className="b2w-illustration">
              {/* Shopping bag SVG illustration */}
              <svg viewBox="0 0 160 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="20" y="60" width="120" height="100" rx="8" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
                <path d="M55 60 C55 38 105 38 105 60" stroke="rgba(255,255,255,0.7)" strokeWidth="3" fill="none" strokeLinecap="round"/>
                <rect x="48" y="98" width="64" height="6" rx="3" fill="rgba(255,255,255,0.5)"/>
                <rect x="48" y="114" width="46" height="6" rx="3" fill="rgba(255,255,255,0.35)"/>
                <circle cx="63" cy="78" r="5" fill="rgba(255,255,255,0.6)"/>
                <circle cx="97" cy="78" r="5" fill="rgba(255,255,255,0.6)"/>
                <rect x="62" y="130" width="36" height="14" rx="7" fill="rgba(255,255,255,0.25)"/>
                <text x="80" y="141" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="9" fontFamily="Geist,ui-sans-serif,sans-serif" fontWeight="600">SECURE</text>
              </svg>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="b2w-right">
            <div className="b2w-form-section">
              {error && <div className="b2w-error" role="alert">{error}</div>}

              <form onSubmit={handleSubmit}>
                {/* Email */}
                <div className="b2w-field">
                  <input
                    id="b2w-email"
                    type="email"
                    placeholder=" "
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <label htmlFor="b2w-email">Email Address</label>
                </div>

                {/* Password */}
                <div className="b2w-field">
                  <input
                    id="b2w-password"
                    type="password"
                    placeholder=" "
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <label htmlFor="b2w-password">Password</label>
                  <p className="b2w-hint" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Use 6 or more characters.</span>
                    <span
                      onClick={() => router.push("/forgot-password")}
                      style={{ color: "#1a211e", cursor: "pointer", fontWeight: 500 }}
                    >
                      Forgot?
                    </span>
                  </p>
                </div>

                <div className="b2w-tos" style={{ marginBottom: 20 }}>
                  By continuing, you agree to our{" "}
                  <a href="#">Terms of Use</a> &amp; <a href="#">Privacy Policy</a>.
                </div>

                <button type="submit" className="b2w-btn-primary" disabled={loading}>
                  {loading && <span className="b2w-spinner" />}
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>

              <div className="b2w-divider">or</div>

              <button
                type="button"
                className="b2w-btn-secondary"
                onClick={() => router.push("/register")}
              >
                Create Account
              </button>
            </div>

            <div className="b2w-footer">
              Don&apos;t have an account?{" "}
              <span onClick={() => router.push("/register")}>Register now</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}