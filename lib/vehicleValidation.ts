import { MAINTENANCE_TYPES, COVERAGE_TYPES } from "@/lib/types";

function isValidDate(value: string) {
  return !!value && !Number.isNaN(new Date(value).getTime());
}

function isPositiveNumber(value: string) {
  const n = Number(value);
  return value !== "" && !Number.isNaN(n) && n > 0;
}

// ---- Fuel log ----

export type FuelLogFormValues = {
  date: string;
  station: string;
  gallons: string;
  pricePerGallon: string;
  totalCost: string;
  odometer: string;
  notes: string;
};

export type FuelLogFieldErrors = Partial<Record<keyof FuelLogFormValues, string>>;

export function validateFuelLog(values: FuelLogFormValues) {
  const errors: FuelLogFieldErrors = {};

  if (!isValidDate(values.date)) errors.date = "Select a valid date.";
  if (!isPositiveNumber(values.gallons)) errors.gallons = "Enter gallons greater than 0.";
  if (!isPositiveNumber(values.pricePerGallon)) errors.pricePerGallon = "Enter a price greater than 0.";
  if (!isPositiveNumber(values.totalCost)) errors.totalCost = "Enter a total greater than 0.";
  if (values.odometer === "" || Number.isNaN(Number(values.odometer)) || Number(values.odometer) < 0) {
    errors.odometer = "Enter the odometer reading.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ---- Weekly fuel summary ----

export type WeeklyFuelFormValues = {
  weekStart: string;
  weekEnd: string;
  totalCost: string;
  startOdometer: string;
  endOdometer: string;
  milesDriven: string;
  fillUpCount: string;
  notes: string;
};

export type WeeklyFuelFieldErrors = Partial<Record<keyof WeeklyFuelFormValues, string>>;

export function validateWeeklyFuelLog(values: WeeklyFuelFormValues) {
  const errors: WeeklyFuelFieldErrors = {};

  if (!isValidDate(values.weekStart) || !isValidDate(values.weekEnd)) errors.weekEnd = "Invalid week.";
  if (!isPositiveNumber(values.totalCost)) errors.totalCost = "Enter a total greater than 0.";
  if (values.endOdometer === "" || Number.isNaN(Number(values.endOdometer)) || Number(values.endOdometer) < 0) {
    errors.endOdometer = "Enter the ending odometer reading.";
  }
  if (values.milesDriven === "" || Number.isNaN(Number(values.milesDriven)) || Number(values.milesDriven) < 0) {
    errors.milesDriven = "Enter miles driven this week.";
  }
  if (values.fillUpCount && (Number.isNaN(Number(values.fillUpCount)) || Number(values.fillUpCount) < 0)) {
    errors.fillUpCount = "Enter a valid number.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ---- Maintenance log ----

export type MaintenanceFormValues = {
  date: string;
  type: string;
  cost: string;
  odometer: string;
  shop: string;
  nextDueDate: string;
  nextDueMiles: string;
  notes: string;
};

export type MaintenanceFieldErrors = Partial<Record<keyof MaintenanceFormValues, string>>;

export function validateMaintenanceLog(values: MaintenanceFormValues) {
  const errors: MaintenanceFieldErrors = {};

  if (!isValidDate(values.date)) errors.date = "Select a valid date.";
  if (!(MAINTENANCE_TYPES as readonly string[]).includes(values.type)) {
    errors.type = "Select a maintenance type.";
  }
  if (!isPositiveNumber(values.cost)) errors.cost = "Enter a cost greater than 0.";
  if (values.odometer === "" || Number.isNaN(Number(values.odometer)) || Number(values.odometer) < 0) {
    errors.odometer = "Enter the odometer reading.";
  }
  if (values.nextDueDate && !isValidDate(values.nextDueDate)) {
    errors.nextDueDate = "Enter a valid date.";
  }
  if (values.nextDueMiles && (Number.isNaN(Number(values.nextDueMiles)) || Number(values.nextDueMiles) < 0)) {
    errors.nextDueMiles = "Enter a valid mileage.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ---- Repair log ----

export type RepairFormValues = {
  date: string;
  description: string;
  shop: string;
  partsCost: string;
  laborCost: string;
  cost: string;
  odometer: string;
  notes: string;
};

export type RepairFieldErrors = Partial<Record<keyof RepairFormValues, string>>;

export function validateRepairLog(values: RepairFormValues) {
  const errors: RepairFieldErrors = {};

  if (!isValidDate(values.date)) errors.date = "Select a valid date.";
  if (!values.description.trim()) errors.description = "Description is required.";
  if (!isPositiveNumber(values.cost)) errors.cost = "Enter a total cost greater than 0.";
  if (values.odometer === "" || Number.isNaN(Number(values.odometer)) || Number(values.odometer) < 0) {
    errors.odometer = "Enter the odometer reading.";
  }
  if (values.partsCost && (Number.isNaN(Number(values.partsCost)) || Number(values.partsCost) < 0)) {
    errors.partsCost = "Enter a valid amount.";
  }
  if (values.laborCost && (Number.isNaN(Number(values.laborCost)) || Number(values.laborCost) < 0)) {
    errors.laborCost = "Enter a valid amount.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ---- Odometer log ----

export type OdometerFormValues = {
  date: string;
  miles: string;
  notes: string;
};

export type OdometerFieldErrors = Partial<Record<keyof OdometerFormValues, string>>;

export function validateOdometerLog(values: OdometerFormValues) {
  const errors: OdometerFieldErrors = {};

  if (!isValidDate(values.date)) errors.date = "Select a valid date.";
  if (values.miles === "" || Number.isNaN(Number(values.miles)) || Number(values.miles) < 0) {
    errors.miles = "Enter a valid mileage.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ---- New vehicle ----

export type NewVehicleFormValues = {
  nickname: string;
  year: string;
  make: string;
  model: string;
  color: string;
  licensePlate: string;
  purchasePrice: string;
  purchaseDate: string;
  startOdometer: string;
  insuranceProvider: string;
  insuranceMonthlyCost: string;
  insuranceStartDate: string;
  insuranceRenewalDate: string;
  insuranceCoverageType: string;
};

export type NewVehicleFieldErrors = Partial<Record<keyof NewVehicleFormValues, string>>;

export function validateNewVehicle(values: NewVehicleFormValues) {
  const errors: NewVehicleFieldErrors = {};

  if (!values.nickname.trim()) errors.nickname = "Give your vehicle a nickname.";
  if (!values.make.trim()) errors.make = "Make is required.";
  if (!values.model.trim()) errors.model = "Model is required.";
  if (!values.color.trim()) errors.color = "Color is required.";
  if (
    !isPositiveNumber(values.year) ||
    Number(values.year) < 1900 ||
    Number(values.year) > new Date().getFullYear() + 1
  ) {
    errors.year = "Enter a valid year.";
  }
  if (values.startOdometer === "" || Number.isNaN(Number(values.startOdometer)) || Number(values.startOdometer) < 0) {
    errors.startOdometer = "Enter the starting odometer reading.";
  }

  if (values.insuranceProvider.trim()) {
    if (!values.insuranceProvider.trim()) errors.insuranceProvider = "Provider is required.";
    if (!isPositiveNumber(values.insuranceMonthlyCost)) errors.insuranceMonthlyCost = "Enter a cost greater than 0.";
    if (!isValidDate(values.insuranceStartDate)) errors.insuranceStartDate = "Select a valid start date.";
    if (!isValidDate(values.insuranceRenewalDate)) errors.insuranceRenewalDate = "Select a valid renewal date.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

// ---- Insurance ----

export type InsuranceFormValues = {
  provider: string;
  policyNumber: string;
  monthlyCost: string;
  startDate: string;
  renewalDate: string;
  coverageType: string;
  notes: string;
};

export type InsuranceFieldErrors = Partial<Record<keyof InsuranceFormValues, string>>;

export function validateInsurance(values: InsuranceFormValues) {
  const errors: InsuranceFieldErrors = {};

  if (!values.provider.trim()) errors.provider = "Provider is required.";
  if (!isPositiveNumber(values.monthlyCost)) errors.monthlyCost = "Enter a cost greater than 0.";
  if (!isValidDate(values.startDate)) errors.startDate = "Select a valid start date.";
  if (!isValidDate(values.renewalDate)) errors.renewalDate = "Select a valid renewal date.";
  if (
    isValidDate(values.startDate) &&
    isValidDate(values.renewalDate) &&
    new Date(values.renewalDate) <= new Date(values.startDate)
  ) {
    errors.renewalDate = "Renewal date must be after the start date.";
  }
  if (!(COVERAGE_TYPES as readonly string[]).includes(values.coverageType)) {
    errors.coverageType = "Select a coverage type.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
