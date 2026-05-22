export type AssignmentUploadCellValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type AssignmentUploadRow = {
  rowNumber?: number;
  name: AssignmentUploadCellValue;
  phone: AssignmentUploadCellValue;
  task: AssignmentUploadCellValue;
};

export type ValidatedAssignmentUploadRow = {
  rowNumber: number;
  name: string;
  phone: string;
  task: string;
};

export type AssignmentUploadWorker = {
  id: string;
  name: string;
  phone: string;
};

export type AssignmentUploadAttendance = {
  workerId: string;
  workDate: string;
};

export type AssignmentUploadTaskType = {
  id: string;
  label: string;
};

export type ApplyAssignmentBatchRow = {
  workerId: string;
  taskTypeId: string;
};

export type ImportAssignmentUploadInput = {
  workDate: string;
  rows: AssignmentUploadRow[];
};

export type ImportAssignmentUploadResult = {
  importedCount: number;
};

export type AssignmentUploadRepository = {
  findWorkersByPhones: (
    phones: string[],
  ) => Promise<AssignmentUploadWorker[]>;
  findAttendancesByDate: (
    workDate: string,
  ) => Promise<AssignmentUploadAttendance[]>;
  findTaskTypesByLabels: (
    labels: string[],
  ) => Promise<AssignmentUploadTaskType[]>;
  applyAssignmentBatch: (input: {
    workDate: string;
    rows: ApplyAssignmentBatchRow[];
  }) => Promise<void>;
};
