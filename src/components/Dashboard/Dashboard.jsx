// src/components/Dashboard/Dashboard.jsx
import WelcomeHeader from "./WelcomeHeader";
import DashboardStats from "./DashboardStats";
import AICard from "../common/AIcard";
import DailyBrief from "./DailyBrief";
import OutbreakWatch from "./OutBreakWatch";
import TestWatch from "./TestWatch";
import FollowUpRadar from "./FollowUpRadar";
import TodaysOrders from "./TodaysOrders/TodaysOrders";
import LatestActivities from "./LatestActivities";
import HomeCollectionSchedule from "./HomeCollectionSchedule";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <WelcomeHeader />
      <DashboardStats />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AICard title="Daily Brief">
          <DailyBrief />
        </AICard>
        <AICard title="Outbreak Watch">
          <OutbreakWatch />
        </AICard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TestWatch />
        <FollowUpRadar />
      </div>

      <TodaysOrders />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LatestActivities />
        <HomeCollectionSchedule />
      </div>
    </div>
  );
}