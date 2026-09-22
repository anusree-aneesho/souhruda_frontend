// src/Routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../layouts/Mainlayout";
import ProtectedRoute from "./ProtectedRoute";
import Login from "../components/Auth/Login";
import Dashboard from "../components/Dashboard/Dashboard";
import LabOrders from "../components/LabOrders/LabOrders";
import HomeCollection from "../components/HomeCollection/HomeCollection";
import TestMaster from "../components/TestMaster/TestMaster";
import Patients from "../components/Patients/Patients";
import Staff from "../components/Staff/Staff";
import Technicians from "../components/Technicians/Technicians";
import LabAssistants from "../components/LabAssistants/LabAssistants";
import FollowUps from "../components/Follow-ups/FollowUps";
import Statistics from "../components/Statistics/Statistics";
import Settings from "../components/SettingPage/Settings";
import OrderDetail from "../components/LabOrders/OrderDetail/OrderDetail";
import Report from "../components/LabOrders/Report/Report";
import ActivityLogPage from "../components/Dashboard/ActivityLogPage";
import ResetPassword from "../components/Auth/ResetPassword";
import GstSettings from "../components/SettingPage/GstSettings";
import StaffManagement from "../components/SettingPage/StaffManagement";
import TestConfiguration from "../components/SettingPage/TestConfiguration/TestConfiguration";
import Stock from "../components/SettingPage/Stock";
import RequireRole from "../components/common/RequireRole";
import Reports from "../components/Reports/Reports";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/lab-orders" element={<LabOrders />} />
          <Route path="/home-collection" element={<HomeCollection />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/technicians" element={<Technicians />} />
          <Route path="/lab-assistants" element={<LabAssistants />} />
          <Route path="/test-master" element={<TestMaster />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/follow-ups" element={<FollowUps />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/lab-orders/:orderId" element={<OrderDetail />} />
          <Route path="/lab-orders/:orderId/report" element={<Report />} />
          <Route path="/activity-logs" element={<ActivityLogPage />} />

          <Route
            path="/settings"
            element={<Navigate to="/settings/lab-settings" replace />}
          />

          <Route path="/settings/lab-settings" element={<Settings />} />
          <Route path="/settings/gst" element={<GstSettings />} />

          <Route
            path="/settings/staff-management"
            element={
              <RequireRole roles={["admin", "super_admin", "superadmin"]}>
                <StaffManagement />
              </RequireRole>
            }
          />

          <Route
            path="/settings/test-configuration"
            element={<TestConfiguration />}
          />

          <Route path="/settings/stock" element={<Stock />} />
        </Route>
      </Route>
    </Routes>
  );
}