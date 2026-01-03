import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="h-screen bg-muted/30">
      <Header setIsSidebarOpen={setIsSidebarOpen} />
      <div className="flex overflow-hidden h-[calc(100vh-56px)]">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-10 lg:hidden"
          />
        )}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="bg-card border border-border/50 shadow-sm dark:shadow-none rounded-xl min-h-full p-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;