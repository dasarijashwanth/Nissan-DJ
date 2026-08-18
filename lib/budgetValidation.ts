import { CATEGORIES } from "@/lib/types";

export type BudgetFormValues = {
  category: string;
  amount: string;
  month: string;
  year: string;
};

export type BudgetFieldErrors = Partial<Record<keyof BudgetFormValues, string>>;

export function validateBudget(values: BudgetFormValues) {
  const errors: BudgetFieldErrors = {};

  if (!(CATEGORIES as readonly string[]).includes(values.category)) {
    errors.category = "Select a category.";
  }

  const amount = Number(values.amount);
  if (!values.amount || Number.isNaN(amount) || amount <= 0) {
    errors.amount = "Enter an amount greater than 0.";
  }

  const month = Number(values.month);
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    errors.month = "Select a valid month.";
  }

  const year = Number(values.year);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    errors.year = "Select a valid year.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
