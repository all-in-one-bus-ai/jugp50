import { Link } from 'react-router-dom';
import { Facebook, Youtube, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-jubilee-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-serif text-gold-400 font-bold text-lg border-2 border-gold-500/40">
                  50
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-white">
                    Golden Jubilee Celebration 2026
                  </h3>
                  <p className="text-sm text-jubilee-200">
                    Department of Government & Politics
                  </p>
                </div>
              </div>
              <p className="text-jubilee-300 text-sm leading-relaxed max-w-md mb-6">
                Jahangirnagar University, Savar, Dhaka, Bangladesh. Reuniting Generations,
                Strengthening Our Bonds.
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="#"
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-jubilee-200 hover:bg-white/20 hover:text-white transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-jubilee-200 hover:bg-white/20 hover:text-white transition-colors"
                >
                  <Youtube className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-jubilee-200 hover:bg-white/20 hover:text-white transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-gold-400 mb-4">
                Navigation
              </h4>
              <ul className="space-y-2">
                {['Home', 'About', 'Participants', 'Contact'].map((item) => (
                  <li key={item}>
                    <Link
                      to={item === 'Home' ? '/' : item === 'Participants' ? '/participants' : `/#${item.toLowerCase()}`}
                      className="text-sm text-jubilee-300 hover:text-white transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-gold-400 mb-4">
                People &middot; Politics &middot; Possibilities
              </h4>
              <p className="text-sm text-jubilee-300 leading-relaxed italic font-serif">
                "সময়ের সেতুবন্ধন
                <br />
                আমাদের এক আড্ডায়"
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-jubilee-700 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-jubilee-400">
            &copy; 2026 Department of Government & Politics, Jahangirnagar University. All rights
            reserved.
          </p>
          <p className="text-xs text-jubilee-400">
            Design & Developed by{' '}
            <a
              href="https://www.karigor.com.bd"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-400 hover:text-gold-300 transition-colors"
            >
              Karigor
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
