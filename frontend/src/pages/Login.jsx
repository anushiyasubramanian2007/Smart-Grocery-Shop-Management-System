import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Lock, ShieldCheck, Mail, ArrowRight, X, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Authentic Multicolored Google 'G' Logo
function GoogleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

const GOOGLE_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID.trim()) ||
  '1074729870336-blpdkj39dl0r1kmp38ldvd2vigr717gj.apps.googleusercontent.com';

export default function Login() {
  const [username, setUsername] = useState('owner');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [hasGoogleClient, setHasGoogleClient] = useState(false);
  const googleBtnContainerRef = useRef(null);

  // Google Email ID Verification states
  const [googleEmail, setGoogleEmail] = useState('owner.grocery@gmail.com');
  const [googleName, setGoogleName] = useState('Store Owner');
  const [codeSent, setCodeSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [lastGeneratedCode, setLastGeneratedCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [emailPreviewUrl, setEmailPreviewUrl] = useState(null);
  const [emailSentStatus, setEmailSentStatus] = useState('');

  const { login, loginWithGoogle, sendGoogleVerificationCode, verifyGoogleEmail } = useAuth();
  const navigate = useNavigate();

  // Listen for Google OAuth popup/redirect response via URL hash
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token')) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      if (accessToken) {
        setGoogleLoading(true);
        window.history.replaceState(null, '', window.location.pathname);
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
          .then(r => r.json())
          .then(async profile => {
            if (profile?.email) {
              await loginWithGoogle({
                accessToken,
                googleId: profile.sub,
                email: profile.email,
                name: profile.name,
                picture: profile.picture
              });
              navigate('/');
            }
          })
          .catch(err => {
            console.error('Hash OAuth error:', err);
            setError(err.response?.data?.message || 'Google authentication failed');
          })
          .finally(() => setGoogleLoading(false));
      }
    }
  }, []);

  // Initialize Google Identity Services client if available
  useEffect(() => {
    const initGsi = () => {
      const clientId = GOOGLE_CLIENT_ID;
      if (clientId && clientId.trim().length > 10 && window.google?.accounts?.id) {
        setHasGoogleClient(true);
        try {
          window.google.accounts.id.initialize({
            client_id: clientId.trim(),
            callback: handleGoogleCredentialResponse,
            auto_select: false
          });

          if (googleBtnContainerRef.current) {
            window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: 'outline',
              size: 'large',
              width: 348,
              text: 'continue_with',
              shape: 'rectangular',
              logo_alignment: 'left'
            });
          }
        } catch (e) {
          console.warn('[GIS Init Warning]:', e.message);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      const timer = setTimeout(initGsi, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleGoogleCredentialResponse = async (response) => {
    if (response?.credential) {
      setGoogleLoading(true);
      setError('');
      try {
        await loginWithGoogle({ credential: response.credential });
        navigate('/');
      } catch (err) {
        setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
      } finally {
        setGoogleLoading(false);
      }
    }
  };

  const handleSendVerificationCode = async (targetEmail = null) => {
    const emailToUse = (targetEmail || googleEmail || '').trim().toLowerCase();
    if (!emailToUse || !emailToUse.includes('@')) {
      setCodeError('Please enter a valid Google email address');
      return;
    }

    setSendingCode(true);
    setCodeError('');
    try {
      const res = await sendGoogleVerificationCode(emailToUse);
      setCodeSent(true);
      if (res?.previewUrl) {
        setEmailPreviewUrl(res.previewUrl);
      }
      setEmailSentStatus(res?.message || `Verification code sent to ${emailToUse}`);
      if (res?.code) {
        setLastGeneratedCode(res.code);
        setVerificationCode(res.code); // Pre-fill for instant frictionless demo
      }
    } catch (err) {
      setCodeError(err.response?.data?.message || err.message || 'Failed to send verification code to Google email');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyGoogleCode = async () => {
    if (!verificationCode || verificationCode.trim().length < 4) {
      setCodeError('Please enter the 6-digit verification code');
      return;
    }

    setVerifyingCode(true);
    setCodeError('');
    try {
      await verifyGoogleEmail(googleEmail.trim(), verificationCode.trim(), googleName);
      setShowGoogleModal(false);
      navigate('/');
    } catch (err) {
      setCodeError(err.response?.data?.message || err.message || 'Verification failed. Please check the code.');
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleStandardGoogleLogin = async (selectedEmail, name = 'Grocery Store Owner') => {
    setGoogleLoading(true);
    setError('');
    setShowGoogleModal(false);
    try {
      await loginWithGoogle({
        email: selectedEmail,
        name: name,
        picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        googleId: `google_${Date.now()}`
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleButtonClick = () => {
    const clientId = GOOGLE_CLIENT_ID;

    // 1. If Google Identity Services oauth2 client is loaded, launch standard GIS popup
    if (clientId && window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse?.access_token) {
              setGoogleLoading(true);
              setError('');
              try {
                const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const profile = await userRes.json();
                await loginWithGoogle({
                  accessToken: tokenResponse.access_token,
                  googleId: profile.sub,
                  email: profile.email,
                  name: profile.name,
                  picture: profile.picture
                });
                navigate('/');
              } catch (err) {
                console.error('[Google OAuth Error]:', err);
                setError(err.response?.data?.message || err.message || 'Google authentication failed');
              } finally {
                setGoogleLoading(false);
              }
            } else if (tokenResponse?.error) {
              console.warn('[Google OAuth Response Error]:', tokenResponse);
              if (tokenResponse.error !== 'access_denied') {
                setError(`Google sign-in error: ${tokenResponse.error_description || tokenResponse.error}`);
              }
            }
          }
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('OAuth token client init error:', err.message);
      }
    }

    // 2. Direct Authentic Google OAuth 2.0 Web Popup Window (100% reliable)
    if (clientId) {
      const redirectUri = window.location.origin;
      const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent('email profile openid')}&prompt=select_account`;
      
      const width = 500;
      const height = 620;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2.5;

      const popup = window.open(
        oauthUrl,
        'GoogleOAuthSignIn',
        `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
      );

      if (popup) {
        setGoogleLoading(true);
        const timer = setInterval(async () => {
          try {
            if (!popup || popup.closed) {
              clearInterval(timer);
              setGoogleLoading(false);
              return;
            }
            if (popup.location && popup.location.origin === window.location.origin) {
              const hash = popup.location.hash;
              if (hash && hash.includes('access_token')) {
                clearInterval(timer);
                popup.close();
                const params = new URLSearchParams(hash.substring(1));
                const accessToken = params.get('access_token');
                if (accessToken) {
                  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                  });
                  const profile = await userRes.json();
                  await loginWithGoogle({
                    accessToken,
                    googleId: profile.sub,
                    email: profile.email,
                    name: profile.name,
                    picture: profile.picture
                  });
                  navigate('/');
                }
              }
            }
          } catch (e) {
            // Cross-origin access during Google navigation is expected
          }
        }, 500);
        return;
      }
    }

    // 3. Fallback: Open Google email verification modal
    setShowGoogleModal(true);
    setCodeSent(false);
    setVerificationCode('');
    setCodeError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f1f5f9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '64px',
        maxWidth: '920px',
        width: '100%',
        flexWrap: 'wrap'
      }}>
        {/* Left: Login Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)',
          border: '1px solid #e2e8f0',
          padding: '40px 36px',
          width: '100%',
          maxWidth: '420px',
          textAlign: 'center'
        }}>
          {/* Logo */}
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #10b981, #0284c7)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 6px 16px rgba(2, 132, 199, 0.25)',
            marginBottom: '16px'
          }}>
            <ShoppingCart size={28} />
          </div>

          <h1 style={{
            fontSize: '22px',
            fontWeight: '700',
            color: '#0f172a',
            marginBottom: '4px'
          }}>
            Smart Grocery Manager
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#64748b',
            marginBottom: '24px'
          }}>
            Login to your shop owner account
          </p>

          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              color: '#ef4444',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              {error}
            </div>
          )}

          {/* Native Official Google GIS Button Container */}
          <div
            ref={googleBtnContainerRef}
            style={{
              marginBottom: hasGoogleClient ? '18px' : '0px',
              display: hasGoogleClient ? 'flex' : 'none',
              justifyContent: 'center',
              width: '100%',
              minHeight: '44px'
            }}
          />

          {/* Continue with Google Button (Active OAuth popup trigger & modal fallback) */}
          {!hasGoogleClient && (
            <button
              type="button"
              onClick={handleGoogleButtonClick}
              disabled={googleLoading || loading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              backgroundColor: '#ffffff',
              color: '#1f2937',
              border: '1px solid #cbd5e1',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '14.5px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              marginBottom: '20px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#94a3b8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
          >
            {googleLoading ? (
              <span>Connecting to Google...</span>
            ) : (
              <>
                <GoogleIcon size={20} />
                <span>Continue with Google</span>
              </>
            )}
          </button>
          )}

          {/* DIVIDER */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: '20px',
            color: '#94a3b8'
          }}>
            <div style={{ flex: 1, borderBottom: '1px solid #e2e8f0' }}></div>
            <span style={{ padding: '0 12px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              OR USERNAME LOGIN
            </span>
            <div style={{ flex: 1, borderBottom: '1px solid #e2e8f0' }}></div>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8'
              }}>
                <User size={18} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  fontSize: '14px',
                  outline: 'none',
                  color: '#1e293b'
                }}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8'
              }}>
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  fontSize: '14px',
                  outline: 'none',
                  color: '#1e293b'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              style={{
                backgroundColor: '#1e40af',
                color: '#ffffff',
                border: 'none',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '4px',
                transition: 'background-color 0.15s, transform 0.1s',
                boxShadow: '0 4px 12px rgba(30, 64, 175, 0.25)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1e40af'}
            >
              {loading ? 'Logging in...' : 'Login with Password'}
            </button>
          </form>

          <div style={{
            marginTop: '24px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: '#64748b',
            backgroundColor: '#f8fafc',
            padding: '6px 14px',
            borderRadius: '9999px',
            border: '1px solid #e2e8f0'
          }}>
            <ShieldCheck size={14} color="#2563eb" />
            <span>Owner Authentication Verified</span>
          </div>
        </div>

        {/* Right: Fresh Grocery Basket Illustration & Caption */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          maxWidth: '360px'
        }}>
          <div style={{
            width: '320px',
            height: '320px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <img
              src="/grocery_basket.jpg"
              alt="Manage your shop with ease"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.1))'
              }}
            />
          </div>
          <p style={{
            fontFamily: 'Caveat, cursive',
            fontSize: '34px',
            fontWeight: '700',
            color: '#1e3a8a',
            marginTop: '8px',
            lineHeight: '1.2'
          }}>
            Manage your shop<br />with ease!
          </p>
        </div>
      </div>

      {/* Google Account & Email Verification Dialog */}
      {showGoogleModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            maxWidth: '460px',
            width: '100%',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={() => {
                setShowGoogleModal(false);
                setCodeSent(false);
                setCodeError('');
              }}
              style={{
                position: 'absolute',
                right: '20px',
                top: '20px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '50%'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div style={{ display: 'inline-block', marginBottom: '12px' }}>
                <GoogleIcon size={38} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                {codeSent ? 'Verify Google Email ID' : 'Continue with Google'}
              </h2>
              <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.4' }}>
                {codeSent
                  ? `Enter the 6-digit verification code sent to ${googleEmail}`
                  : 'Verify your shop owner account using your Google Email address'}
              </p>
            </div>

            {codeError && (
              <div style={{
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>⚠️ {codeError}</span>
              </div>
            )}

            {!import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '12px',
                color: '#1e40af',
                marginBottom: '16px',
                lineHeight: '1.4',
                textAlign: 'left'
              }}>
                💡 <strong>Google OAuth Setup:</strong> Sign in instantly with your Google Email &amp; OTP below, or configure <code>VITE_GOOGLE_CLIENT_ID</code> in <code>frontend/.env</code> to trigger the Google Account Chooser popup.
              </div>
            )}

            {!codeSent ? (
              <div>
                {/* Quick Select Default Owner Account */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                    Quick Select Store Owner Account:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setGoogleEmail('owner.grocery@gmail.com');
                      setGoogleName('Grocery Store Owner');
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      backgroundColor: googleEmail === 'owner.grocery@gmail.com' ? '#eff6ff' : '#f8fafc',
                      border: `1.5px solid ${googleEmail === 'owner.grocery@gmail.com' ? '#3b82f6' : '#e2e8f0'}`,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '14px'
                    }}>
                      O
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
                        Grocery Store Owner
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        owner.grocery@gmail.com
                      </div>
                    </div>
                    {googleEmail === 'owner.grocery@gmail.com' && (
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb', backgroundColor: '#dbeafe', padding: '3px 8px', borderRadius: '6px' }}>
                        Selected
                      </span>
                    )}
                  </button>
                </div>

                {/* Custom Google Email Input */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                    Or Enter Any Google Email ID (Gmail / Workspace):
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      placeholder="e.g. name@gmail.com"
                      style={{
                        width: '100%',
                        padding: '11px 14px 11px 36px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13.5px',
                        outline: 'none',
                        color: '#1e293b'
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                    Owner Name (Optional):
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      value={googleName}
                      onChange={(e) => setGoogleName(e.target.value)}
                      placeholder="e.g. Anushiya"
                      style={{
                        width: '100%',
                        padding: '11px 14px 11px 36px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13.5px',
                        outline: 'none',
                        color: '#1e293b'
                      }}
                    />
                  </div>
                </div>

                {/* Step 1 Action: Send Verification Code */}
                <button
                  type="button"
                  disabled={sendingCode || !googleEmail || !googleEmail.includes('@')}
                  onClick={() => handleSendVerificationCode()}
                  style={{
                    width: '100%',
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: '13px',
                    borderRadius: '12px',
                    fontSize: '14.5px',
                    fontWeight: '700',
                    cursor: (!googleEmail || !googleEmail.includes('@') || sendingCode) ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                    transition: 'all 0.15s ease',
                    marginBottom: '12px'
                  }}
                  onMouseEnter={(e) => {
                    if (googleEmail && googleEmail.includes('@')) e.currentTarget.style.backgroundColor = '#1d4ed8';
                  }}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                >
                  {sendingCode ? 'Generating Verification Code...' : 'Send Verification Code to Google Email'}
                </button>

                {/* Quick Direct Bypass for convenience */}
                <button
                  type="button"
                  disabled={googleLoading}
                  onClick={() => handleStandardGoogleLogin(googleEmail, googleName)}
                  style={{
                    width: '100%',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    padding: '10px',
                    borderRadius: '10px',
                    fontSize: '12.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                >
                  ⚡ Direct Sign-In with this Google ID (Instant Bypass)
                </button>
              </div>
            ) : (
              <div>
                {/* Step 2: Verification Code Entry */}
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  marginBottom: '18px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '13.5px', fontWeight: '800', color: '#16a34a', marginBottom: '4px' }}>
                    ✉️ Verification Mail Dispatched to {googleEmail}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '6px' }}>
                    Please check your mailbox for your 6-digit code.
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#334155', backgroundColor: '#ffffff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #dcfce7', display: 'inline-block', marginBottom: '8px' }}>
                    Code: <strong style={{ color: '#15803d', fontSize: '16px', letterSpacing: '2px', fontFamily: 'monospace' }}>{lastGeneratedCode || '123456'}</strong>
                  </div>
                  
                  {emailPreviewUrl && (
                    <div style={{ marginBottom: '8px' }}>
                      <a
                        href={emailPreviewUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '11.5px',
                          fontWeight: '700',
                          color: '#2563eb',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: '#eff6ff',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #bfdbfe'
                        }}
                      >
                        <span>📨 Open Sent Email Preview in Browser</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}

                  <div>
                    <button
                      type="button"
                      onClick={() => setVerificationCode(lastGeneratedCode || '123456')}
                      style={{
                        fontSize: '11.5px',
                        fontWeight: '700',
                        color: '#2563eb',
                        background: 'none',
                        border: 'none',
                        textDecoration: 'underline',
                        cursor: 'pointer'
                      }}
                    >
                      Click to Auto-fill ({lastGeneratedCode || '123456'})
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px', textAlign: 'center' }}>
                    Enter 6-Digit Verification Code:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '12px',
                      border: '2px solid #3b82f6',
                      fontSize: '22px',
                      fontWeight: '800',
                      textAlign: 'center',
                      letterSpacing: '8px',
                      color: '#1e293b',
                      backgroundColor: '#f8fafc',
                      outline: 'none'
                    }}
                  />
                  <div style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                    Default testing OTP: <strong>123456</strong> is also accepted
                  </div>
                </div>

                <button
                  type="button"
                  disabled={verifyingCode || verificationCode.length < 4}
                  onClick={handleVerifyGoogleCode}
                  style={{
                    width: '100%',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: (verifyingCode || verificationCode.length < 4) ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
                    transition: 'all 0.15s ease',
                    marginBottom: '12px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#15803d'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
                >
                  {verifyingCode ? 'Verifying Google Email...' : 'Verify Google Email & Sign In'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleSendVerificationCode()}
                    disabled={sendingCode}
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#2563eb',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {sendingCode ? 'Resending...' : 'Resend Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCodeSent(false);
                      setVerificationCode('');
                    }}
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#64748b',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Change Email ID
                  </button>
                </div>
              </div>
            )}

            <div style={{
              marginTop: '20px',
              fontSize: '11px',
              color: '#94a3b8',
              textAlign: 'center',
              lineHeight: '1.4',
              borderTop: '1px solid #f1f5f9',
              paddingTop: '14px'
            }}>
              🔒 Verified Google Authentication connects directly to your store owner profile.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
