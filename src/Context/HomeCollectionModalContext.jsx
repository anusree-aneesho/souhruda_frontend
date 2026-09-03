// src/Context/HomeCollectionModalContext.jsx
import { createContext, useContext, useState, useCallback } from "react";

const HomeCollectionModalContext = createContext(null);

export function HomeCollectionModalProvider({ children }) {
  const [activeId, setActiveId] = useState(null);

  const open = useCallback((id) => setActiveId(id), []);
  const close = useCallback(() => setActiveId(null), []);

  return (
    <HomeCollectionModalContext.Provider value={{ activeId, open, close }}>
      {children}
    </HomeCollectionModalContext.Provider>
  );
}

export function useHomeCollectionModal() {
  const ctx = useContext(HomeCollectionModalContext);
  if (!ctx) throw new Error("useHomeCollectionModal must be used within HomeCollectionModalProvider");
  return ctx;
}