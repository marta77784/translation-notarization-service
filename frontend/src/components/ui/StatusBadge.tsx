type DisplayStatus = "pending" | "paid" | "translated" | "notarized" | "failed";

const NORMALIZE: Record<string, DisplayStatus> = {
  pending: "pending",
  paid: "paid",
  translating: "paid",
  translated: "translated",
  notarizing: "translated",
  notarized: "notarized",
  failed: "failed",
};

const LABEL: Record<DisplayStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  translated: "Translated",
  notarized: "Notarized",
  failed: "Failed",
};

const STYLE: Record<DisplayStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-sky-50 text-sky-700 border-sky-200",
  translated: "bg-indigo-50 text-indigo-700 border-indigo-200",
  notarized: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-red-50 text-red-700 border-red-200",
};

export default function StatusBadge({ status }: { status: string }) {
  const s = NORMALIZE[status] ?? "pending";
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${STYLE[s]}`}
    >
      {LABEL[s]}
    </span>
  );
}
