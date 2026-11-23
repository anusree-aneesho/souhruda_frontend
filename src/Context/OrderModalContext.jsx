// src/context/OrderModalContext.jsx
import { createContext, useContext, useState, useCallback } from "react";
import AlertModal from "../components/common/Modal/AlertModal";
import { needsBranchSelection } from "../utils/selectedBranch";

const OrderModalContext = createContext(null);

const BRANCH_ACTION_LABELS = {
  order: "create a lab order",
  homeCollection: "book a home collection",
  patient: "add a patient",
};

export function OrderModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [flowType, setFlowType] = useState("order"); // "order" | "homeCollection"
  const [presetPatientRegNo, setPresetPatientRegNo] = useState(null);
  const [branchAlertAction, setBranchAlertAction] = useState(null);

  // A super admin / admin on "All branches" must pick a branch before creating
  // a patient, order or home collection. Returns true when it's OK to go ahead,
  // otherwise shows the "Select a Branch" alert and returns false.
  // action: "order" | "homeCollection" | "patient"
  const requireBranch = useCallback((action = "order") => {
    if (!needsBranchSelection()) return true;
    setBranchAlertAction(action);
    return false;
  }, []);

  const open = useCallback((type = "order", patientRegNo = null) => {
    // `<button onClick={open}>` passes the click event as the first argument
    const flow = type === "homeCollection" ? "homeCollection" : "order";
    if (!requireBranch(flow)) return;
    setFlowType(flow);
    setPresetPatientRegNo(patientRegNo);
    setIsOpen(true);
  }, [requireBranch]);

  const close = useCallback(() => {
    setIsOpen(false);
    setPresetPatientRegNo(null);
  }, []);

  return (
    <OrderModalContext.Provider
      value={{ isOpen, open, close, flowType, setFlowType, presetPatientRegNo, requireBranch }}
    >
      {children}
      {branchAlertAction && (
        <AlertModal
          title="Select a Branch"
          message={`You are viewing all branches. Please select a branch from the branch selector in the top bar before you ${BRANCH_ACTION_LABELS[branchAlertAction]}.`}
          onClose={() => setBranchAlertAction(null)}
        />
      )}
    </OrderModalContext.Provider>
  );
}

export function useOrderModal() {
  const ctx = useContext(OrderModalContext);
  if (!ctx) throw new Error("useOrderModal must be used within OrderModalProvider");
  return ctx;
}