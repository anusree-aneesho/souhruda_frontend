// src/context/OrderModalContext.jsx
import { createContext, useContext, useState, useCallback } from "react";

const OrderModalContext = createContext(null);

export function OrderModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [flowType, setFlowType] = useState("order"); // "order" | "homeCollection"
  const [presetPatientRegNo, setPresetPatientRegNo] = useState(null);

  const open = useCallback((type = "order", patientRegNo = null) => {
    setFlowType(type);
    setPresetPatientRegNo(patientRegNo);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setPresetPatientRegNo(null);
  }, []);

  return (
    <OrderModalContext.Provider
      value={{ isOpen, open, close, flowType, setFlowType, presetPatientRegNo }}
    >
      {children}
    </OrderModalContext.Provider>
  );
}

export function useOrderModal() {
  const ctx = useContext(OrderModalContext);
  if (!ctx) throw new Error("useOrderModal must be used within OrderModalProvider");
  return ctx;
}