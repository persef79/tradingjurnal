import React, { useState, useEffect } from 'react';
import { TrendingUp, Sun, Moon, Download, Upload, LogIn, LogOut, User } from 'lucide-react';
import AuthModal from './AuthModal';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

interface HeaderProps {
  onOpenImport: () => void;
  onExport: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onOpenImport, 
  onExport, 
  isDarkMode, 
  toggleDarkMode 
}) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
      setUserEmail(user?.email);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h1 className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
              MT5 Trading Journal
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={onOpenImport}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md 
                       text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 
                       focus:ring-offset-2 focus:ring-blue-500 transition-colors
                       dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Upload size={16} className="mr-2" />
              Import
            </button>
            
            <button
              onClick={onExport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md 
                       text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 
                       focus:ring-offset-2 focus:ring-blue-500 transition-colors
                       dark:border-gray-600 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              <Download size={16} className="mr-2" />
              Export
            </button>

            {isLoggedIn ? (
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {userEmail}
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md 
                           text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 
                           focus:ring-offset-2 focus:ring-blue-500 transition-colors
                           dark:border-gray-600 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <LogOut size={16} className="mr-2" />
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md 
                         text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 
                         focus:ring-offset-2 focus:ring-blue-500 transition-colors
                         dark:border-gray-600 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                <LogIn size={16} className="mr-2" />
                Login
              </button>
            )}
            
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-gray-500 hover:text-gray-900 focus:outline-none 
                       focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors
                       dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun size={20} />
              ) : (
                <Moon size={20} />
              )}
            </button>
          </div>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </header>
  );
};

export default Header;