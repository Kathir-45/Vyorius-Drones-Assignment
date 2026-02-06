import React, { useState } from "react";
import { signUp, signIn } from "../lib/supabaseClient";
import "../styles/Auth.css";

function Auth({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [showDemoModal, setShowDemoModal] = useState(false);

  const demoEmail = "jacebo8297@hopesx.com";
  const demoPassword = "123456";

  const handleFillDemoCredentials = () => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setShowDemoModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { data, error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          setMessage("Sign up successful! Please check your email to confirm.");
          setEmail("");
          setPassword("");
        }
      } else {
        const { data, error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          onAuthSuccess(data.user);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>🚀 Kanban Board</h1>
        <p className="auth-subtitle">
          {isSignUp
            ? "Create an account to get started"
            : "Sign in to your account"}
        </p>

        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-message">{message}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-button"
          >
            {loading
              ? "Loading..."
              : isSignUp
                ? "Sign Up"
                : "Sign In"}
          </button>
        </form>

        <div className="auth-toggle">
          <p>
            {isSignUp
              ? "Already have an account? "
              : "Don't have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
              }}
              className="toggle-button"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>

        <div className="auth-demo">
          <button 
            type="button"
            onClick={() => setShowDemoModal(true)}
            className="demo-button"
          >
            📝 Demo Credentials
          </button>
        </div>

        {/* Demo Credentials Modal */}
        {showDemoModal && (
          <div className="demo-modal-overlay" onClick={() => setShowDemoModal(false)}>
            <div className="demo-modal" onClick={(e) => e.stopPropagation()}>
              <div className="demo-modal-header">
                <h3>🔐 Demo Credentials</h3>
                <button 
                  className="demo-modal-close"
                  onClick={() => setShowDemoModal(false)}
                >
                  ✕
                </button>
              </div>
              <p className="demo-modal-text">Click on a credential to auto-fill the login form:</p>
              
              <div className="demo-credentials">
                <div 
                  className="credential-item"
                  onClick={handleFillDemoCredentials}
                >
                  <div className="credential-label">Email:</div>
                  <div className="credential-value">{demoEmail}</div>
                  <div className="credential-hint">Click to fill</div>
                </div>
                
                <div 
                  className="credential-item"
                  onClick={handleFillDemoCredentials}
                >
                  <div className="credential-label">Password:</div>
                  <div className="credential-value">{demoPassword}</div>
                  <div className="credential-hint">Click to fill</div>
                </div>
              </div>

              <button 
                className="demo-modal-button"
                onClick={handleFillDemoCredentials}
              >
                ✓ Fill All Credentials
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Auth;
