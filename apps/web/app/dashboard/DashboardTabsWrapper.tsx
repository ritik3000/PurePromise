"use client";

import { createContext, useContext, useState } from "react";
import { Tabs } from "@/components/ui/tabs";

type DashboardTabContextValue = {
  switchToMyImages: () => void;
};

const DashboardTabContext = createContext<DashboardTabContextValue | null>(null);

export function useDashboardTab() {
  const ctx = useContext(DashboardTabContext);
  return ctx;
}

const MY_IMAGES_TAB = "camera";

export function DashboardTabsWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeTab, setActiveTab] = useState("packs");

  const switchToMyImages = () => setActiveTab(MY_IMAGES_TAB);

  return (
    <DashboardTabContext.Provider value={{ switchToMyImages }}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {children}
      </Tabs>
    </DashboardTabContext.Provider>
  );
}
