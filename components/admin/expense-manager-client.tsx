"use client";

import { useSearchParams } from "next/navigation";
import { ExpenseManager } from "@/components/admin/expense-manager";
import type { CrewOption } from "@/lib/admin/types";

type Expense = {
  id: string;
  expense_date: string;
  category: string;
  vendor: string;
  description: string;
  amount: number;
  payment_method: string;
  receipt_url: string | null;
  reimbursable: boolean;
};

export function ExpenseManagerClient({
  initial,
  crew,
}: {
  initial: Expense[];
  crew: CrewOption[];
}) {
  const searchParams = useSearchParams();
  const focus = searchParams.get("focus");
  const initialFocus = focus === "receipt" || focus === "form" ? focus : null;
  return <ExpenseManager initial={initial} crew={crew} initialFocus={initialFocus} />;
}
