export type AttendanceFilterState = {
  name: string;
  phone: string;
  taskTypeId: string;
};

export function readAttendanceFilterState(input: {
  name?: string | string[] | undefined;
  phone?: string | string[] | undefined;
  taskTypeId?: string | string[] | undefined;
}) {
  return {
    name: readSingleSearchValue(input.name),
    phone: readSingleSearchValue(input.phone),
    taskTypeId: readSingleSearchValue(input.taskTypeId),
  };
}

export function matchesNameFilter(name: string, nameFilter: string) {
  const normalizedFilter = normalizeTextFilter(nameFilter);

  if (!normalizedFilter) {
    return true;
  }

  return normalizeTextFilter(name).includes(normalizedFilter);
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
  return Boolean(filters.name || filters.phone || filters.taskTypeId);
}

export function sortRowsByTaskTypeAndName<
  T extends {
    name: string;
    phone: string;
    taskTypeLabel: string;
  },
>(rows: T[]) {
  return [...rows].sort((left, right) => {
    const taskTypeCompare = compareTaskTypeLabel(
      left.taskTypeLabel,
      right.taskTypeLabel,
    );

    if (taskTypeCompare !== 0) {
      return taskTypeCompare;
    }

    const nameCompare = left.name.localeCompare(right.name, "ko");

    if (nameCompare !== 0) {
      return nameCompare;
    }

    return left.phone.localeCompare(right.phone, "ko");
  });
}

function normalizePhoneFilter(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeTextFilter(value: string) {
  return value.trim().toLocaleLowerCase("ko-KR");
}

function compareTaskTypeLabel(left: string, right: string) {
  const leftIsUnassigned = left === "미배정";
  const rightIsUnassigned = right === "미배정";

  if (leftIsUnassigned && rightIsUnassigned) {
    return 0;
  }

  if (leftIsUnassigned) {
    return 1;
  }

  if (rightIsUnassigned) {
    return -1;
  }

  return left.localeCompare(right, "ko");
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
