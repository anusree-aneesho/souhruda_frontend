// src/Routes/AppRoutes.jsx
import { Routes, Route } from "react-router-dom";
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
import Settings from "../components/SettingPage/Settings";
import OrderDetail from "../components/LabOrders/OrderDetail/OrderDetail";
import Report from "../components/LabOrders/Report/Report";

// import LabOrders from "../components/LabOrders/LabOrders";
// ...add as each page is built

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/lab-orders" element={<LabOrders/>} />
          <Route path="/home-collection" element={<HomeCollection />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/technicians" element={<Technicians />} />
          <Route path="/lab-assistants" element={<LabAssistants />} />
          <Route path="/test-master" element={<TestMaster />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/follow-ups" element={<FollowUps />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/lab-orders/:orderId" element={<OrderDetail />} />
          <Route path="/lab-orders/:orderId/report" element={<Report />} />
        </Route>
      </Route>
    </Routes>
  );
}
