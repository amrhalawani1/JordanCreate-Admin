"use client";

import { createContext, useContext, type ReactNode } from "react";
import { isViewOnlyLevel } from "@/lib/auth/levels";
import type { AdminLevel } from "@/types/entities";

type AdminAccess = {
  viewLevel: AdminLevel;
  canEdit: boolean;
  isViewOnly: boolean;
};

const AdminAccessContext = createContext<AdminAccess>({
  viewLevel: "admin",
  canEdit: true,
  isViewOnly: false,
});

export function AdminAccessProvider({
  viewLevel,
  children,
}: {
  viewLevel: AdminLevel;
  children: ReactNode;
}) {
  const isViewOnly = isViewOnlyLevel(viewLevel);
  return (
    <AdminAccessContext.Provider value={{ viewLevel, canEdit: !isViewOnly, isViewOnly }}>
      {children}
    </AdminAccessContext.Provider>
  );
}

export function useAdminAccess(): AdminAccess {
  return useContext(AdminAccessContext);
}
