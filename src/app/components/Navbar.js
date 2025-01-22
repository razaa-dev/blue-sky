// src/app/components/Navbar.js
export default function Navbar() {
    return (
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <a href="/" className="flex items-center px-4 text-gray-700 hover:text-gray-900">
                Home
              </a>
              <a href="/custom-posts" className="flex items-center px-4 text-gray-700 hover:text-gray-900">
                Example Posts
              </a>
            </div>
          </div>
        </div>
      </nav>
    );
  }