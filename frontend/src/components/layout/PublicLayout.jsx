import { Outlet } from 'react-router-dom';
import Navbar from '../page/landing/sections/Navbar';
import Footer from '../page/landing/sections/Footer';

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
