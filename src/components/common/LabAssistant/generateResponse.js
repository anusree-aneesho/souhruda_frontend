// src/components/common/LabAssistant/generateResponse.js
import { labOrders } from "../../../data/labOrders";
import { technicians } from "../../../data/technicians";
import { calculateFlag } from "../../../utils/calculateFlag";

function getPendingOrdersAnswer() {
  const pending = labOrders.filter((o) =>
    o.tests.some((t) => !t.result || t.result.trim() === "")
  );
  if (pending.length === 0) return "No pending orders right now — everything's resulted.";
  const names = pending.map((o) => `#${o.orderId} (${o.patient.name})`).join(", ");
  return `${pending.length} order(s) pending results: ${names}.`;
}

function getRevenueAnswer() {
  const total = labOrders.reduce(
    (sum, o) => sum + o.tests.reduce((s, t) => s + t.price, 0),
    0
  );
  return `Today's revenue across all lab orders is ₹${total.toFixed(2)}.`;
}

function getAbnormalAnswer(keyword) {
  const matches = [];
  labOrders.forEach((order) => {
    order.tests.forEach((test) => {
      if (!test.result) return;
      const flag = calculateFlag(test.range, test.result);
      const nameMatches = keyword ? test.name.toLowerCase().includes(keyword) : true;
      if (nameMatches && ["Low", "High", "Abnormal"].includes(flag)) {
        matches.push(`${order.patient.name} (${test.name}: ${test.result} ${test.unit}, ${flag})`);
      }
    });
  });
  if (matches.length === 0) {
    return keyword
      ? `No patients currently have an abnormal ${keyword} result.`
      : "No abnormal results found across current orders.";
  }
  return `Found ${matches.length}: ${matches.join(", ")}.`;
}

function getBusiestTechnicianAnswer() {
  const busiest = [...technicians].sort((a, b) => b.activeJobs - a.activeJobs)[0];
  if (!busiest || busiest.activeJobs === 0) return "No technicians have active jobs right now.";
  return `${busiest.name} is currently the busiest, with ${busiest.activeJobs} active job(s) in ${busiest.location}.`;
}

export function generateResponse(question) {
  const q = question.toLowerCase();

  if (q.includes("pending")) return getPendingOrdersAnswer();
  if (q.includes("revenue")) return getRevenueAnswer();
  if (q.includes("cholesterol")) return getAbnormalAnswer("cholesterol");
  if (q.includes("hemoglobin")) return getAbnormalAnswer("hemoglobin");
  if (q.includes("high") || q.includes("abnormal")) return getAbnormalAnswer();
  if (q.includes("busiest") || q.includes("technician")) return getBusiestTechnicianAnswer();

  return "I can help with pending orders, today's revenue, abnormal results, or technician workload — try one of the suggestions below.";
}