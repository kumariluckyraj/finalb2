"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "customer",
  });

  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to send OTP");
        return;
      }
      setStep(2);
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");

      // Verify OTP first
      const verifyRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone, otp }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        setError(verifyData.error || "Invalid OTP");
        return;
      }

      // Then register
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to register");
        return;
      }

      router.push("/login");
    } catch (err) {
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
          top: -12px;
          font-size: 11.5px;
          font-weight: 500;
        }

        .b2w-field input:focus + label {
          color: #1a211e;
        }

        .b2w-btn-primary {
          width: 100%;
          background: #1a211e;
          color: #fff;
          border: none;
          padding: 14px;
          border-radius: 4px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(20,184,166,0.35);
          transition: transform 0.2s, box-shadow 0.2s;
          margin-top: 12px;
        }
        .b2w-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(20,184,166,0.4);
        }
        .b2w-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .b2w-error {
          color: #ef4444;
          font-size: 12.5px;
          margin-top: -16px;
          margin-bottom: 16px;
          font-weight: 500;
        }

        .b2w-link {
          text-align: center;
          margin-top: 32px;
        }
        .b2w-link button {
          background: none;
          border: none;
          color: #1a211e;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .b2w-link button:hover {
          opacity: 0.8;
        }

        @media (max-width: 768px) {
          .b2w-card {
            flex-direction: column;
            width: 100%;
            height: 100vh;
            border-radius: 4px;
          }
          .b2w-left {
            width: 100%;
            padding: 30px 24px;
            flex-direction: row;
            align-items: center;
          }
          .b2w-illustration {
            display: none;
          }
          .b2w-right {
            padding: 32px 24px;
          }
        }
      `}</style>

      <div className="b2w-root">
        <div className="b2w-card">
          <div className="b2w-left">
            <div className="b2w-brand">
              <h2>Looks like you're new here!</h2>
              <p>Sign up with your details to get started</p>
            </div>
            <div className="b2w-illustration">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="48" fill="#1b5fc0"/>
                <path d="M50 20 L80 80 L20 80 Z" fill="#fff" opacity="0.8"/>
              </svg>
            </div>
          </div>

          <div className="b2w-right">
            <div className="b2w-form-section">
              {step === 1 ? (
                <form onSubmit={handleSendOTP}>
                  <div className="b2w-field">
                    <input
                      type="text"
                      id="name"
                      placeholder="name"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                    <label htmlFor="name">Full Name</label>
                  </div>
                  
                  <div className="b2w-field">
                    <input
                      type="email"
                      id="email"
                      placeholder="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    <label htmlFor="email">Email Address</label>
                  </div>

                  <div className="b2w-field">
                    <input
                      type="tel"
                      id="phone"
                      placeholder="phone"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                    <label htmlFor="phone">Phone Number (+91...)</label>
                  </div>

                  <div className="b2w-field">
                    <input
                      type="password"
                      id="password"
                      placeholder="password"
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <label htmlFor="password">Enter Password</label>
                  </div>

                  {error && <div className="b2w-error" role="alert">{error}</div>}

                  <button type="submit" disabled={loading} className="b2w-btn-primary">
                    {loading ? "Sending OTP..." : "Continue"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister}>
                  <p style={{ fontSize: 13, color: "#4b5563", marginBottom: 20 }}>
                    Please enter the OTP sent to <b>{form.phone}</b>.
                  </p>
                  <div className="b2w-field">
                    <input
                      type="text"
                      id="otp"
                      placeholder="otp"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                    <label htmlFor="otp">Enter OTP</label>
                  </div>

                  {error && <div className="b2w-error" role="alert">{error}</div>}

                  <button type="submit" disabled={loading} className="b2w-btn-primary">
                    {loading ? "Verifying..." : "Register"}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setStep(1); setError(""); }}
                    style={{ background: "none", border: "none", color: "#1a211e", width: "100%", marginTop: 16, cursor: "pointer", fontWeight: 600, fontSize: 13 }}
                  >
                    Change Number
                  </button>
                </form>
              )}
            </div>

            <div className="b2w-link">
              <button onClick={() => router.push("/login")}>
                Existing User? Log in
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}