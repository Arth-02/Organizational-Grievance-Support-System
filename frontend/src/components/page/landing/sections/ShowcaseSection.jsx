import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Layout, 
  MessageSquare,
  CheckCircle2,
  Search,
  Filter,
  MoreHorizontal,
  Plus,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const tabs = [
  {
    id: 'grievance',
    label: 'Grievance Management',
    icon: MessageSquare,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    description: "Streamline issue reporting and resolution with automated workflows.",
    features: ["Anonymous Reporting", "SLA Tracking", "Automated Routing"]
  },
  {
    id: 'projects',
    label: 'Project Boards',
    icon: Layout,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    description: "Visualize work with flexible Kanban boards and timeline views.",
    features: ["Drag & Drop", "Custom Workflows", "Team Assignment"]
  },
  {
    id: 'analytics',
    label: 'Analytics & Insights',
    icon: BarChart3,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    description: "Make data-driven decisions with real-time dashboards.",
    features: ["Performance Metrics", "Trend Analysis", "Exportable Reports"]
  }
];

// --- Real UI Mockup Components ---

const GrievanceMockup = () => (
  <div className="flex flex-col h-full bg-background rounded-b-lg overflow-hidden">
    {/* Toolbar */}
    <div className="flex items-center justify-between p-4 border-b border-border/40 shrink-0">
      <div className="flex items-center gap-2 w-full max-w-sm">
        <div className="relative w-full">
           <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
           <input 
             type="text" 
             placeholder="Search grievances..." 
             className="w-full pl-9 pr-4 py-2 text-sm bg-muted/40 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
           />
        </div>
        <Button variant="outline" size="icon" className="shrink-0 h-9 w-9">
          <Filter className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
      <div className="flex items-center gap-2">
         <Button size="sm" variant="outline" className="hidden sm:flex h-9 text-xs">Export</Button>
      </div>
    </div>

    {/* Table Header */}
    <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/20 border-b border-border/40 text-xs font-medium text-muted-foreground shrink-0">
      <div className="col-span-6 sm:col-span-5">Issue</div>
      <div className="col-span-3 sm:col-span-2">Department</div>
      <div className="col-span-3 sm:col-span-2">Status</div>
      <div className="hidden sm:block col-span-2">Priority</div>
      <div className="hidden sm:block col-span-1 text-right">Action</div>
    </div>

    {/* Table Body */}
    <div className="flex-1 overflow-y-auto min-h-0">
      {[
        { title: "Wi-Fi Connectivity Issue", id: "GR-2024-001", dept: "IT Support", status: "In Progress", priority: "High", time: "2m ago", reporter: "JD" },
        { title: "AC Maintenance Required", id: "GR-2024-002", dept: "Facilities", status: "Open", priority: "Medium", time: "15m ago", reporter: "AM" },
        { title: "Software License Renewal", id: "GR-2024-003", dept: "Procurement", status: "Resolved", priority: "Low", time: "1h ago", reporter: "TS" },
        { title: "Payroll Discrepancy", id: "GR-2024-004", dept: "HR", status: "Open", priority: "Critical", time: "3h ago", reporter: "RK" },
        { title: "Elevator Malfunction", id: "GR-2024-005", dept: "Facilities", status: "Open", priority: "High", time: "4h ago", reporter: "PL" },
        { title: "New Employee Onboarding", id: "GR-2024-006", dept: "HR", status: "In Progress", priority: "Medium", time: "5h ago", reporter: "SJ" },
      ].map((item, i) => (
        <motion.div
           key={i}
           initial={{ opacity: 0, x: -10 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: i * 0.05 }}
           className="grid grid-cols-12 gap-4 px-4 py-3 items-center border-b border-border/30 hover:bg-muted/30 transition-colors group cursor-pointer"
        >
           {/* ... row content ... */}
           {/* Saving tokens by not repeating unchanged inner row content if possible, but replace_file_content needs dropping in full block or perfectly matching start/end. 
               Given the instruction is "Update GrievanceMockup container...", and avoiding matching errors, I will include the inner row content.
           */}
          <div className="col-span-6 sm:col-span-5">
            <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{item.title}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
              <span>{item.id}</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
              <span>{item.time}</span>
            </div>
          </div>
          <div className="col-span-3 sm:col-span-2 text-xs text-muted-foreground">
             <Badge variant="outline" className="font-normal bg-background">{item.dept}</Badge>
          </div>
          <div className="col-span-3 sm:col-span-2">
            <Badge 
              variant="secondary" 
              className={cn(
                "text-[10px] font-medium border-0",
                item.status === "Open" ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" : 
                item.status === "In Progress" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : 
                item.status === "Resolved" ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                "bg-red-500/10 text-red-600 dark:text-red-400"
              )}
            >
              {item.status}
            </Badge>
          </div>
          <div className="hidden sm:flex col-span-2 items-center gap-1.5">
            <div className={cn("w-1.5 h-1.5 rounded-full", 
               item.priority === "Critical" || item.priority === "High" ? "bg-red-500" : 
               item.priority === "Medium" ? "bg-orange-400" : "bg-blue-400"
            )} />
            <span className="text-xs text-muted-foreground">{item.priority}</span>
          </div>
          <div className="hidden sm:block col-span-1 text-right">
             <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
               <MoreHorizontal className="h-3.5 w-3.5" />
             </Button>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

// ... (skipping others) ...

// Later in the file:
// Tabs rendering
// {tabs.map((tab) => (
//   <motion.button ... >

  /* Replacement for tabs loop logic */
/*
             {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full text-left p-4 rounded-xl transition-colors duration-200 border-2 border-transparent relative overflow-hidden group outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  activeTab !== tab.id && "hover:bg-muted/50"
                )}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/5 border-2 border-primary/50 rounded-xl shadow-sm"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
*/


const ProjectMockup = () => (
  <div className="flex h-full gap-4 p-4 overflow-x-auto bg-background rounded-b-lg">
    {/* Column 1 */}
    <div className="w-1/2 min-w-[200px] flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-400" /> 
          To Do <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded-full">3</span>
        </h4>
        <Button variant="ghost" size="icon" className="h-6 w-6"><Plus className="h-3.5 w-3.5" /></Button>
      </div>
      
      <div className="space-y-3">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="p-3 bg-card border border-border/60 rounded-lg shadow-sm group hover:border-primary/30 transition-colors cursor-pointer">
          <div className="flex items-start justify-between mb-2">
             <Badge variant="outline" className="text-[10px] bg-blue-500/5 text-blue-600 border-blue-200 dark:border-blue-900">Design</Badge>
             <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
          </div>
          <p className="text-sm font-medium mb-3">Create high-fidelity mockups for dashboard</p>
          <div className="flex items-center justify-between">
             <div className="flex -space-x-2">
                <Avatar className="w-5 h-5 border-2 border-background"><AvatarFallback className="text-[8px] bg-pink-100 text-pink-700">JD</AvatarFallback></Avatar>
                <Avatar className="w-5 h-5 border-2 border-background"><AvatarFallback className="text-[8px] bg-purple-100 text-purple-700">AS</AvatarFallback></Avatar>
             </div>
             <div className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> 2d</div>
          </div>
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="p-3 bg-card border border-border/60 rounded-lg shadow-sm group hover:border-primary/30 transition-colors cursor-pointer">
           <div className="flex items-start justify-between mb-2">
             <Badge variant="outline" className="text-[10px] bg-orange-500/5 text-orange-600 border-orange-200 dark:border-orange-900">Research</Badge>
          </div>
          <p className="text-sm font-medium mb-3">Conduct user interviews for new feature</p>
           <div className="flex items-center justify-between">
             <Avatar className="w-5 h-5 border-2 border-background"><AvatarFallback className="text-[8px] bg-green-100 text-green-700">RK</AvatarFallback></Avatar>
             <div className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> 5d</div>
          </div>
        </motion.div>
      </div>
    </div>

    {/* Column 2 */}
    <div className="w-1/2 min-w-[200px] flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400" /> 
          In Progress <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded-full">1</span>
        </h4>
        <Button variant="ghost" size="icon" className="h-6 w-6"><Plus className="h-3.5 w-3.5" /></Button>
      </div>

       <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="p-3 bg-card border border-border/60 rounded-lg shadow-sm group hover:border-primary/30 transition-colors cursor-pointer">
          <div className="flex items-start justify-between mb-2">
             <Badge variant="outline" className="text-[10px] bg-purple-500/5 text-purple-600 border-purple-200 dark:border-purple-900">Backend</Badge>
             <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
          </div>
          <p className="text-sm font-medium mb-3">Integrate payment gateway API</p>
          <div className="h-1.5 w-full bg-muted rounded-full mb-3 overflow-hidden">
             <div className="h-full bg-blue-500 w-3/4 rounded-full" />
          </div>
          <div className="flex items-center justify-between">
             <Avatar className="w-5 h-5 border-2 border-background"><AvatarFallback className="text-[8px] bg-blue-100 text-blue-700">TS</AvatarFallback></Avatar>
             <div className="text-[10px] text-muted-foreground flex items-center gap-1 text-orange-500"><AlertCircle className="w-3 h-3" /> Due Tmrw</div>
          </div>
        </motion.div>
    </div>
  </div>
);

const AnalyticsMockup = () => (
  <div className="p-4 sm:p-6 bg-background rounded-b-lg flex flex-col h-full">
    {/* Summary Cards */}
    <div className="grid grid-cols-3 gap-4 mb-6">
      {[ 
        { label: "Total Resolution", value: "94%", change: "+5.2%", positive: true },
        { label: "Avg Response", value: "24m", change: "-12%", positive: true },
        { label: "Active Tickets", value: "14", change: "+2", positive: false }
      ].map((stat, i) => (
        <motion.div 
          key={i} 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="p-3 bg-muted/20 border border-border/50 rounded-xl"
        >
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">{stat.label}</p>
          <div className="flex items-end gap-2">
            <span className="text-lg sm:text-xl font-bold leading-none">{stat.value}</span>
            <span className={cn("text-[10px] font-medium mb-0.5", stat.positive ? "text-green-500" : "text-red-500")}>
              {stat.change}
            </span>
          </div>
        </motion.div>
      ))}
    </div>

    {/* Chart Area */}
    <div className="space-y-3 flex-1 flex flex-col justify-end">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Weekly Activity</h4>
        <div className="flex gap-2">
           <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary" /> Reports
           </div>
           <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary/20" /> Resolved
           </div>
        </div>
      </div>
      
      <div className="h-40 w-full flex items-end justify-between gap-2 sm:gap-4 pt-4 border-b border-border/50 relative">
         {/* Grid lines */}
         <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
            <div className="w-full h-px dashed border-t border-dashed border-foreground/30" />
            <div className="w-full h-px dashed border-t border-dashed border-foreground/30" />
            <div className="w-full h-px dashed border-t border-dashed border-foreground/30" />
            <div />
         </div>

         {[65, 40, 75, 55, 80, 45, 90].map((h, i) => (
            <motion.div 
               key={i} 
               className="relative flex-1 flex flex-col justify-end group h-full"
               initial={{ height: "0%" }}
               animate={{ height: "100%" }}
               transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
            >
               <div className="absolute bottom-0 w-full h-full flex items-end gap-[1px] sm:gap-1 px-1">
                  {/* Background Bar (Total) */}
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.6, delay: 0.2 + i * 0.05 }}
                    className="w-full bg-primary/20 rounded-t-sm group-hover:bg-primary/30 transition-colors relative"
                  >
                     {/* Foreground Bar (Resolved part) */}
                     <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${h * 0.7}%` }} // Simulate ~70% resolution
                        transition={{ duration: 0.6, delay: 0.4 + i * 0.05 }}
                        className="absolute bottom-0 w-full bg-primary rounded-t-sm"
                     />
                  </motion.div>
               </div>
               <span className="absolute -bottom-6 w-full text-center text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                 {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}
               </span>
            </motion.div>
         ))}
      </div>
    </div>
  </div>
);

// --- Main Component ---

const ShowcaseSection = () => {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <section className="py-20 md:py-32 bg-background relative overflow-hidden">
       {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-6"
          >
            Built for <span className="text-primary">Modern Teams</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            Experience a platform that adapts to your needs. Switch between views to see how OrgX handles different workflows.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Side: Tabs */}
          <div className="lg:col-span-5 space-y-4">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full text-left p-4 rounded-xl transition-colors duration-200 border-2 border-transparent relative group outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  activeTab !== tab.id && "hover:bg-muted/50"
                )}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary/5 border-2 border-primary/50 rounded-xl shadow-sm"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <div className="flex items-start gap-4 relative z-10">
                  <div className={cn("p-2 rounded-lg", tab.bgColor, tab.color)}>
                    <tab.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={cn("font-semibold text-lg mb-1", activeTab === tab.id ? "text-primary" : "text-foreground")}>
                      {tab.label}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {tab.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Right Side: Mockup Preview */}
          <div className="lg:col-span-7">
            <div className="relative">
              {/* Decorative Elements */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-purple-600/30 rounded-2xl blur opacity-30 transform -rotate-1" />
              
              <div className="relative bg-background border border-border/50 rounded-2xl shadow-2xl overflow-hidden h-[550px] flex flex-col">
                {/* Mockup Header - Browser Style */}
                <div className="flex items-center gap-4 px-4 py-3 border-b border-border/50 bg-muted/30">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                    <div className="w-3 h-3 rounded-full bg-green-400/80" />
                  </div>
                  
                  {/* Fake URL Bar */}
                  <div className="flex-1 max-w-sm mx-auto bg-background border border-border/40 h-7 rounded-md flex items-center px-3 text-[10px] text-muted-foreground font-mono shadow-sm">
                    <span className="text-green-500 mr-2">🔒</span> https://app.orgx.com/{activeTab}
                  </div>

                  <div className="w-16" /> {/* Spacer */}
                </div>

                {/* Mockup Content Area */}
                <div className="flex-1 bg-background/50 h-full overflow-hidden flex flex-col">
                   {/* Contextual Header inside the App */}
                  <div className="px-6 py-4 flex justify-between items-center border-b border-border/30 bg-background/50 backdrop-blur-sm z-10">
                    <div>
                      <h4 className="text-lg font-bold text-foreground">{tabs.find(t => t.id === activeTab).label}</h4>
                      <p className="text-xs text-muted-foreground">Workspace / {tabs.find(t => t.id === activeTab).id}</p>
                    </div>
                    <Button size="sm" className="h-8 text-xs gap-1.5 shadow-sm">
                       <Plus className="w-3.5 h-3.5" /> New Item
                    </Button>
                  </div>

                  {/* Main Content Animation Wrapper */}
                  <div className="flex-1 relative overflow-hidden bg-muted/5">
                    <AnimatePresence>
                      <motion.div
                        key={activeTab}
                        className="absolute inset-0 w-full h-full"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                         {/* Dynamic Component Render */}
                        {activeTab === 'grievance' && <GrievanceMockup />}
                        {activeTab === 'projects' && <ProjectMockup />}
                        {activeTab === 'analytics' && <AnalyticsMockup />}

                      </motion.div>
                    </AnimatePresence>
                  </div>
                  
                   {/* Bottom Feature Bar */}
                  <div className="px-6 py-3 bg-muted/20 border-t border-border/30 flex items-center justify-between gap-4">
                     <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Key Capabilities</span>
                     <div className="flex gap-2">
                        {tabs.find(t => t.id === activeTab).features.map((feat, i) => (
                          <motion.div
                            key={feat}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                          >
                             <Badge variant="secondary" className="text-[10px] h-5 bg-background border border-border/50 px-2 font-normal text-muted-foreground">
                                <CheckCircle2 className="w-2.5 h-2.5 text-primary mr-1" /> {feat}
                             </Badge>
                          </motion.div>
                        ))}
                     </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShowcaseSection;
