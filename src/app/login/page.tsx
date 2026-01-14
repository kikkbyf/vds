'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { registerUser } from '@/actions/register';
import { User, Lock, Mail, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            if (isLogin) {
                const res = await signIn('credentials', {
                    email,
                    password,
                    redirect: false,
                });

                if (res?.error) {
                    setError('Invalid email or password');
                } else {
                    router.push('/');
                    router.refresh();
                }
            } else {
                // Register
                const res = await registerUser(formData);
                if (res.error) {
                    setError(res.error);
                } else {
                    setSuccessMsg('true');
                    setError('');
                }
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="retro-window">
                <div className="window-header">
                    <div className="window-title">VDS System Access</div>
                    <div className="window-controls">
                        <button disabled>×</button>
                    </div>
                </div>

                <div className="window-content">
                    <div className="brand-section">
                        <div className="logo-text">VDS<span className="version">v1.14</span></div>
                        <p className="system-msg">
                            {successMsg ? 'Request Submitted.' : (isLogin ? 'Enter authorized credentials.' : 'New user registration sequence.')}
                        </p>
                    </div>

                    {successMsg ? (
                        <div className="success-view">
                            <div className="status-icon">✓</div>
                            <h3 className="status-title">Registration Pending</h3>
                            <p className="status-desc">
                                Your account request has been sent to the administrator.
                                <br /><br />
                                Status: <b>WAITING_FOR_APPROVAL</b>
                                <br /><br />
                                Please contact the admin to expedite access.
                            </p>
                            <div className="action-row">
                                <button
                                    onClick={() => { setSuccessMsg(''); setIsLogin(true); }}
                                    className="retro-btn primary"
                                >
                                    Return to Login
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="retro-form">
                            <div className="input-group">
                                <label>Username:</label>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="Enter email..."
                                    className="retro-input"
                                />
                            </div>

                            <div className="input-group">
                                <label>Password:</label>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    minLength={6}
                                    placeholder="********"
                                    className="retro-input"
                                />
                            </div>

                            {error && (
                                <div className="error-box">
                                    <span className="error-icon">⚠</span>
                                    {error}
                                </div>
                            )}

                            <div className="action-row">
                                <button
                                    type="button"
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="retro-btn secondary"
                                >
                                    {isLogin ? 'Register...' : 'Cancel'}
                                </button>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="retro-btn primary"
                                >
                                    {loading ? 'Processing...' : (isLogin ? 'Connect' : 'Initialize')}
                                </button>
                            </div>
                        </form>
                </div>
            </div>

            <style jsx>{`
                .login-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #555;
                    font-family: 'Tahoma', 'Segoe UI', sans-serif;
                }

                .retro-window {
                    width: 400px;
                    background: #c0c0c0;
                    border: 2px solid;
                    border-color: #dfdfdf #404040 #404040 #dfdfdf;
                    box-shadow: 4px 4px 10px rgba(0,0,0,0.5);
                    padding: 2px;
                }

                .window-header {
                    background: #000080;
                    padding: 4px 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 4px;
                }

                .window-title {
                    color: white;
                    font-weight: bold;
                    font-size: 14px;
                    letter-spacing: 0.5px;
                }

                .window-controls button {
                    width: 16px;
                    height: 14px;
                    background: #c0c0c0;
                    border: 1px solid;
                    border-color: #dfdfdf #404040 #404040 #dfdfdf;
                    font-size: 10px;
                    line-height: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: default;
                }

                .window-content {
                    padding: 24px;
                }

                .brand-section {
                    margin-bottom: 24px;
                }

                .logo-text {
                    font-size: 24px;
                    font-weight: 900;
                    color: #404040;
                    text-shadow: 1px 1px 0px white;
                    margin-bottom: 4px;
                }

                .version {
                    font-size: 12px;
                    margin-left: 8px;
                    color: #808080;
                    font-weight: normal;
                }

                .system-msg {
                    font-size: 14px;
                    color: #404040;
                }

                .retro-form {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                label {
                    font-size: 14px;
                    font-weight: bold;
                    color: #000;
                }

                .retro-input {
                    background: white;
                    border: 2px solid;
                    border-color: #404040 #dfdfdf #dfdfdf #404040;
                    padding: 6px 8px;
                    font-family: 'Courier New', monospace;
                    font-size: 14px;
                    color: #000;
                    outline: none;
                }

                .retro-input:focus {
                    background: #fff;
                }

                .error-box {
                    border: 1px dashed #ff0000;
                    background: #fff0f0;
                    color: #d00000;
                    font-size: 12px;
                    padding: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .action-row {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    margin-top: 8px;
                }

                .retro-btn {
                    background: #c0c0c0;
                    border: 2px solid;
                    border-color: #dfdfdf #404040 #404040 #dfdfdf;
                    padding: 6px 20px;
                    font-size: 13px;
                    color: #000;
                    cursor: pointer;
                    font-family: 'Tahoma', sans-serif;
                }

                .retro-btn:active {
                    border-color: #404040 #dfdfdf #dfdfdf #404040;
                    transform: translate(1px, 1px);
                }

                .retro-btn.primary {
                    font-weight: bold;
                    border: 2px solid #000; /* Extra bold border for emphasis */
                }

                .retro-btn:disabled {
                    color: #808080;
                    cursor: not-allowed;
                }

                .success-view {
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 16px;
                }
                .status-icon {
                    font-size: 48px;
                    color: #008000;
                    text-shadow: 1px 1px 0 rgba(255,255,255,0.5);
                }
                .status-title {
                    font-size: 16px;
                    font-weight: bold;
                    color: #000;
                }
                .status-desc {
                    font-size: 14px;
                    color: #404040;
                    line-height: 1.4;
                }
            `}</style>
        </div>
    );
}
