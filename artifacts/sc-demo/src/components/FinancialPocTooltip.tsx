import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { FinancialPocContact } from "@/lib/mockData";

export default function FinancialPocTooltip({
  name,
  contact,
  children,
}: {
  name: string;
  contact?: FinancialPocContact;
  children: ReactNode;
}) {
  const details = [
    ["Laboratory", contact?.laboratory],
    ["Office location", contact?.officeLocation],
    ["Job title", contact?.jobTitle],
    ["Job description", contact?.jobDescription],
    ["Email", contact?.email],
    ["Phone", contact?.phone],
  ].filter(([, value]) => value);
  const tooltipText = [
    "POC — Financial Point of Contact",
    "Definition: This is the financial point of contact for the request.",
    "",
    "Demo capability only — not finalized. Contact details shown are fictional examples.",
    "",
    `Name: ${name || "No POC provided"}`,
    ...(details.length > 0
      ? details.map(([label, value]) => `${label}: ${value}`)
      : ["No additional contact details available in this demo."]),
  ].join("\n");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          tabIndex={0}
          aria-label={`Financial point of contact: ${name || "not provided"}. View demo contact information.`}
          className="relative rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          {children}
          <Info size={12} aria-hidden="true" className="absolute top-0.5 left-8 text-slate-400" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[min(360px,calc(100vw-32px))] border border-slate-200 bg-white text-slate-700 shadow-lg p-3 whitespace-pre-line break-words font-normal leading-relaxed">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
}