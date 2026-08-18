export type TransactionType = "income" | "expense";

export const CATEGORIES = [
  "Salary",
  "Freelance",
  "Rides",
  "Food",
  "Fuel",
  "Rent",
  "Insurance",
  "Utilities",
  "Entertainment",
  "Medical",
  "Maintenance",
  "Repair",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Transaction = {
  id: string;
  userId: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  notes: string | null;
  createdAt: string;
};

export type TransactionInput = {
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  notes?: string | null;
};

export const MAINTENANCE_TYPES = [
  "Oil Change",
  "Tire Rotation",
  "Air Filter",
  "Brake Pad",
  "Battery",
  "Wiper Blades",
  "Other",
] as const;

export type MaintenanceType = (typeof MAINTENANCE_TYPES)[number];

export const COVERAGE_TYPES = ["Liability", "Comprehensive", "Full Coverage"] as const;

export type CoverageType = (typeof COVERAGE_TYPES)[number];

export type Vehicle = {
  id: string;
  userId: string;
  nickname: string;
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string | null;
  photoUrl: string | null;
  purchasePrice: number | null;
  purchaseDate: string | null;
  startOdometer: number | null;
  isActive: boolean;
  isPrimary: boolean;
  createdAt: string;
};

export type FuelLog = {
  id: string;
  vehicleId: string;
  date: string;
  gallons: number;
  pricePerGallon: number;
  totalCost: number;
  odometer: number;
  station: string | null;
  notes: string | null;
  type: string; // "per_fill" | "weekly_summary"
  createdAt: string;
};

export type MaintenanceLog = {
  id: string;
  vehicleId: string;
  date: string;
  type: string;
  cost: number;
  odometer: number;
  shop: string | null;
  notes: string | null;
  nextDueDate: string | null;
  nextDueMiles: number | null;
  createdAt: string;
};

export type RepairLog = {
  id: string;
  vehicleId: string;
  date: string;
  description: string;
  cost: number;
  odometer: number;
  shop: string | null;
  partsCost: number | null;
  laborCost: number | null;
  notes: string | null;
  createdAt: string;
};

export type OdometerLog = {
  id: string;
  vehicleId: string;
  date: string;
  miles: number;
  notes: string | null;
  createdAt: string;
};

export type DailyOdometer = {
  id: string;
  vehicleId: string;
  date: string;
  miles: number;
  driven: number;
  notes: string | null;
  createdAt: string;
};

export type Insurance = {
  id: string;
  vehicleId: string;
  provider: string;
  policyNumber: string | null;
  monthlyCost: number;
  startDate: string;
  renewalDate: string;
  coverageType: string;
  notes: string | null;
  createdAt: string;
};

export type Budget = {
  id: string;
  userId: string;
  category: string;
  amount: number;
  month: number;
  year: number;
  createdAt: string;
};

export type BudgetStatus = "on_track" | "warning" | "exceeded";

export type RecurringFrequency = "weekly" | "biweekly" | "monthly" | "yearly";

export type RecurringTransaction = {
  id: string;
  userId: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  frequency: RecurringFrequency;
  startDate: string;
  nextDueDate: string;
  lastCreated: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
};

export type AlertType =
  | "budget_exceeded"
  | "budget_warning"
  | "maintenance_due"
  | "insurance_due"
  | "oil_change_due"
  | "recurring_due";

export type Alert = {
  id: string;
  userId: string;
  type: AlertType;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

export type UserPreferences = {
  displayName: string;
  currencySymbol: string;
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  weekStartsOn: "sunday" | "monday";
  defaultTransactionType: TransactionType;
  defaultBudgets: Record<string, number>;
  notifications: {
    budgetWarnings: boolean;
    carMaintenanceAlerts: boolean;
    recurringReminders: boolean;
  };
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  displayName: "",
  currencySymbol: "$",
  dateFormat: "MM/DD/YYYY",
  weekStartsOn: "sunday",
  defaultTransactionType: "expense",
  defaultBudgets: {},
  notifications: {
    budgetWarnings: true,
    carMaintenanceAlerts: true,
    recurringReminders: true,
  },
};

export type MonthlyReport = {
  month: string;
  income: {
    total: number;
    byCategory: Record<string, number>;
    transactions: Transaction[];
  };
  expenses: {
    total: number;
    byCategory: Record<string, number>;
    transactions: Transaction[];
  };
  netSavings: number;
  savingsRate: number;
  carCosts: {
    fuel: number;
    maintenance: number;
    repairs: number;
    insurance: number;
    total: number;
    costPerMile: number;
  };
  budgets: {
    category: string;
    budgeted: number;
    spent: number;
    remaining: number;
    status: BudgetStatus;
  }[];
  topExpenseCategories: { category: string; amount: number }[];
  carLogEntries: {
    fuel: FuelLog[];
    maintenance: MaintenanceLog[];
    repair: RepairLog[];
  };
};
