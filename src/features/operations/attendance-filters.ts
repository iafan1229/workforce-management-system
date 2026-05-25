export type AttendanceFilterState = {
  phone: string;
  taskTypeId: string;
};

export function readAttendanceFilterState(input: {
  phone?: string | string[] | undefined;
  taskTypeId?: string | string[] | undefined;
}) {
  return {
    phone: readSingleSearchValue(input.phone),
    taskTypeId: readSingleSearchValue(input.taskTypeId),
  };
}

export function matchesPhoneFilter(phone: string, phoneFilter: string) {
  const normalizedFilter = normalizePhoneFilter(phoneFilter);

  if (!normalizedFilter) {
    return true;
  }

  return phone.replace(/\D/g, "").includes(normalizedFilter);
}

export function matchesTaskTypeFilter(
  taskTypeId: string | null | undefined,
  selectedTaskTypeId: string,
) {
  if (!selectedTaskTypeId) {
    return true;
  }

  return taskTypeId === selectedTaskTypeId;
}

export function hasActiveAttendanceFilters(filters: AttendanceFilterState) {
  return Boolean(filters.phone || filters.taskTypeId);
}

function normalizePhoneFilter(value: string) {
  return value.replace(/\D/g, "");
}

function readSingleSearchValue(value: string | string[] | undefined) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return "";
}
