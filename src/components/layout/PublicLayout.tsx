import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { ToastProvider } from '@/components/ui/Toast';

export default function PublicLayout() {
  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </ToastProvider>
  );
}
