import { useState } from 'react';
import { supabase } from './supabase.js';
import { ShoppingBag, Mail, Lock, LogIn, UserPlus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const isSignup = mode === 'signup';

  const switchMode = () => {
    setMode(isSignup ? 'signin' : 'signup');
    setError('');
    setInfo('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // Email confirmation off: a session exists and AuthContext takes over.
        if (data.session) return;
        // Email confirmation on (or the address is already registered - Supabase
        // does not reveal which): ask the user to confirm via email, then sign in.
        setInfo('אם הכתובת חדשה, נשלח אליך מייל לאימות החשבון. אחרי האישור אפשר להיכנס.');
        setMode('signin');
        setPassword('');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // AuthContext will detect the session change and App will unmount AuthPage
      }
    } catch (err) {
      const messages = {
        'Invalid login credentials': 'אימייל או סיסמה שגויים. אנא נסה שוב.',
        'Email not confirmed': 'יש לאמת את האימייל לפני הכניסה.',
      };
      setError(messages[err.message] || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 mb-4">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Agalist</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">רשימת הקניות שלך, מסונכרנת תמיד</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-6">

          <p className="text-sm font-semibold text-slate-700 mb-5">{isSignup ? 'יצירת חשבון חדש' : 'כניסה לחשבון'}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="auth-email" className="block text-xs font-semibold text-slate-600 mb-1.5">
                כתובת אימייל
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:bg-white transition-all"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="auth-password" className="block text-xs font-semibold text-slate-600 mb-1.5">
                סיסמה
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 focus:bg-white transition-all"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-medium px-3 py-2.5 rounded-xl">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Info (e.g. after signup when email confirmation is on) */}
            {info && (
              <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium px-3 py-2.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{info}</span>
              </div>
            )}

            {/* Submit */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-300 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-200 mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSignup ? (
                <><UserPlus className="w-4 h-4" /> הרשמה</>
              ) : (
                <><LogIn className="w-4 h-4" /> כניסה</>
              )}
            </button>
          </form>

          {/* Mode toggle */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={switchMode}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
            >
              {isSignup ? 'כבר יש לך חשבון? כניסה' : 'אין לך חשבון? הרשמה'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          Agalist • רשימת קניות משותפת 🛒
        </p>
      </div>
    </div>
  );
}
