'use client'
import EmbeddedPost from './EmbeddedPost';
import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';

export default function PostsComparison({ postsData }) {
  const [isDark, setIsDark] = useState(false);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-white'} transition-colors duration-200`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Posts Feed
            </h1>
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${isDark
                  ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } transition-colors duration-200`}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Embedded Posts Column */}
            <div className="space-y-8">
              <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Embedded Posts
              </h2>
              {postsData.map((currencyData) => (
                <div key={`embedded-${currencyData.currency}`} className="space-y-6">
                  <h3 className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {currencyData.currency}
                  </h3>
                  <div className="space-y-6">
                    {currencyData.posts.map((post) => (
                      <EmbeddedPost
                        key={post.uri}
                        post={post}
                        isDark={isDark}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Posts Column */}
            {/* <div className="space-y-8">
              <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Custom Posts
              </h2>
              {postsData.map((currencyData) => (
                <div key={`custom-${currencyData.currency}`} className="space-y-6">
                  <h3 className={`text-lg font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {currencyData.currency}
                  </h3>
                  <div className="space-y-6">
                    {currencyData.posts.map((post) => (
                      <CustomPost
                        key={post.uri}
                        post={post}
                        isDark={isDark}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}