import { CATEGORIES, type ChitFundEntryType } from "@/lib/types";

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

// ---- Chit fund / Cheeti (purely informational, never counted in income/expense totals) ----

export type ChitFundFieldErrors = {
  amount?: string;
  groupName?: string;
  date?: string;
};

export type ChitFundFormValues = {
  amount: string;
  groupName: string;
  type: ChitFundEntryType;
  date: string;
  notes: string;
};

export function validateChitFundInput(values: ChitFundFormValues) {
  const errors: ChitFundFieldErrors = {};

  const amount = Number(values.amount);
  if (!values.amount || Number.isNaN(amount) || amount <= 0) {
    errors.amount = "Enter an amount greater than 0.";
  }

  if (!values.groupName.trim()) {
    errors.groupName = "Group name is required.";
  }

  if (!values.date || Number.isNaN(new Date(values.date).getTime())) {
    errors.date = "Select a valid date.";
  }

  return { valid: Object.keys(errors).length === 0, errors, amount };
}

// ---- Chit fund recurring plan (auto-posts a ChitFund row each month it's due) ----

export type ChitFundPlanFieldErrors = {
  amount?: string;
  groupName?: string;
  startDate?: string;
  periodMonths?: string;
};

export type ChitFundPlanFormValues = {
  amount: string;
  groupName: string;
  type: ChitFundEntryType;
  startDate: string;
  periodMonths: string;
  notes: string;
};

export function validateChitFundPlan(values: ChitFundPlanFormValues) {
  const errors: ChitFundPlanFieldErrors = {};

  const amount = Number(values.amount);
  if (!values.amount || Number.isNaN(amount) || amount <= 0) {
    errors.amount = "Enter an amount greater than 0.";
  }

  if (!values.groupName.trim()) {
    errors.groupName = "Group name is required.";
  }

  if (!values.startDate || Number.isNaN(new Date(values.startDate).getTime())) {
    errors.startDate = "Select a valid start date.";
  }

  const periodMonths = Number(values.periodMonths);
  if (!values.periodMonths || !Number.isInteger(periodMonths) || periodMonths <= 0) {
    errors.periodMonths = "Enter the number of months as a whole number greater than 0.";
  }

  return { valid: Object.keys(errors).length === 0, errors, amount, periodMonths };
}

// ---- India transfer (purely informational, never counted in income/expense totals) ----

export type IndiaTransferFieldErrors = {
  amount?: string;
  recipient?: string;
  date?: string;
};

export type IndiaTransferFormValues = {
  amount: string;
  recipient: string;
  date: string;
  notes: string;
};

export function validateIndiaTransferInput(values: IndiaTransferFormValues) {
  const errors: IndiaTransferFieldErrors = {};

  const amount = Number(values.amount);
  if (!values.amount || Number.isNaN(amount) || amount <= 0) {
    errors.amount = "Enter an amount greater than 0.";
  }

  if (!values.recipient.trim()) {
    errors.recipient = "Recipient is required.";
  }

  if (!values.date || Number.isNaN(new Date(values.date).getTime())) {
    errors.date = "Select a valid date.";
  }

  return { valid: Object.keys(errors).length === 0, errors, amount };
}
