import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import App from './App.jsx';
import Login from './Login.jsx';
import Landing from './Landing.jsx';
import './index.css';

function Root() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        localStorage.setItem('chainhandler_last_user', JSON.stringify({
          displayName: currentUser.displayName,
          email: currentUser.email,
          photoURL: currentUser.photoURL
        }));
      }
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-semibold">Loading ChainHandler...</p>
        </div>
      </div>
    );
  }

  if (showLanding) {
    return <Landing onStart={() => setShowLanding(false)} />;
  }

  return user ? <App user={user} /> : <Login />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
