import { CATEGORIES } from "@/lib/types";

export type TransactionFieldErrors = {
  title?: string;
  amount?: string;
  type?: string;
  category?: string;
  date?: string;
};

export type TransactionFormValues = {
  title: string;
  amount: string;
  type: string;
  category: string;
  date: string;
  notes: string;
};

export function validateTransactionInput(values: TransactionFormValues) {
  const errors: TransactionFieldErrors = {};

  if (!values.title.trim()) {
    errors.title = "Title is required.";
  }

  const amount = Number(values.amount);
  if (!values.amount || Number.isNaN(amount) || amount <= 0) {
    errors.amount = "Enter an amount greater than 0.";
  }

  if (values.type !== "income" && values.type !== "expense") {
    errors.type = "Select income or expense.";
  }

  if (!(CATEGORIES as readonly string[]).includes(values.category)) {
    errors.category = "Select a category.";
  }

  if (!values.date || Number.isNaN(new Date(values.date).getTime())) {
    errors.date = "Select a valid date.";
  }

  return { valid: Object.keys(errors).length === 0, errors, amount };
}
