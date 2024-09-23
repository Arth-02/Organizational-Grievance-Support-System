import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
    return (
      <div className="h-screen">
        <Header setIsSidebarOpen={setIsSidebarOpen} />
        <div className="flex overflow-hidden h-[calc(100vh-64px)]">
            <Sidebar isOpen={isSidebarOpen} />
            {isSidebarOpen && (
                <div 
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black bg-opacity-50 z-10"
                />
            )}
            <main className="flex-1 min-w-full overflow-y-auto p-4 bg-secondary/20">
                <Outlet />
            </main>
        </div>
      </div>
    );
  };
  
  export default Layout;