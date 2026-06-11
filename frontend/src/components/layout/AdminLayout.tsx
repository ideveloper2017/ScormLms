import {Sidebar} from "@/components/layout/sidebar";
import {Header} from "@/components/layout/header";
import {useState} from "react";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({children}: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    return (
        <div className="flex h-screen bg-background">
            <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}/>
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
                    {children}
                </main>
            </div>
        </div>
    )
}