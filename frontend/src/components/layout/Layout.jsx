import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
  
    return (
      <div className="h-screen">
        <Header setIsSidebarOpen={setIsSidebarOpen} />
        <div className="flex overflow-hidden h-[calc(100vh-50px)] ">
            <Sidebar isSidebarOpen={isSidebarOpen} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            {isSidebarOpen && (
                <div 
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black bg-opacity-50 z-10"
                />
            )}
            <main className="flex-1 overflow-y-auto py-4 px-6 h-full bg-secondary/30">
                <div className="p-4 bg-white dark:bg-black shadow-lg dark:shadow-white/10 rounded-md min-h-full relative">
                  <Outlet />
                </div>
            </main>
        </div>
      </div>
    );
  };
  
  export default Layout;