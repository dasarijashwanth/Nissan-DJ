import { CATEGORIES } from "@/lib/types";

const FREQUENCIES = ["weekly", "biweekly", "monthly", "yearly"];

export type RecurringFormValues = {
  title: string;
  amount: string;
  type: string;
  category: string;
  frequency: string;
  startDate: string;
  notes: string;
};

export type RecurringFieldErrors = Partial<Record<keyof RecurringFormValues, string>>;

export function validateRecurring(values: RecurringFormValues) {
  const errors: RecurringFieldErrors = {};

  if (!values.title.trim()) errors.title = "Title is required.";

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

  if (!FREQUENCIES.includes(values.frequency)) {
    errors.frequency = "Select a frequency.";
  }

  if (!values.startDate || Number.isNaN(new Date(values.startDate).getTime())) {
    errors.startDate = "Select a valid start date.";
  }

  return { valid: Object.keys(errors).length === 0, errors, amount };
}
