import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/#about' },
  { label: 'Participants', href: '/participants' },
  { label: 'Contact', href: '/#contact' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-jubilee-700 flex items-center justify-center text-white font-serif text-sm lg:text-base font-bold border-2 border-gold-500">
              50
            </div>
            <div className="hidden sm:block">
              <p className="font-serif text-jubilee-800 font-semibold text-sm lg:text-base leading-tight">
                Golden Jubilee Celebration 2026
              </p>
              <p className="text-[11px] lg:text-xs text-gray-500">
                Dept. of Government & Politics, JU
              </p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.href
                    ? 'text-jubilee-700'
                    : 'text-gray-600 hover:text-jubilee-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/register"
              className="hidden sm:inline-flex btn-primary text-sm !py-2.5 !px-5"
            >
              Register Now
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden p-2 text-gray-600 hover:text-jubilee-700"
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="lg:hidden animate-slide-down border-t border-gray-100 bg-white">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-gray-700 hover:text-jubilee-700 hover:bg-jubilee-50 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/register"
              onClick={() => setOpen(false)}
              className="btn-primary w-full text-sm !py-2.5"
            >
              Register Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
