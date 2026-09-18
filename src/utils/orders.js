// src/utils/orders.js
export function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

export function mapOrder(o) {
  return {
    orderId: o.order_no,
    patient: [o.patient?.first_name, o.patient?.last_name].filter(Boolean).join(" "),
    regNo: o.patient?.patient_number || "",
    tests: o.items_count ?? o.items?.length ?? 0,
    status: capitalize(o.status),
    date: o.ordered_at
      ? new Date(o.ordered_at).toLocaleString("en-GB", {
          day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
        })
      : "",
    bill: Number(o.bill_total || 0).toFixed(2),
  };
}

export function todayLocalDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function toLocalDateString(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}