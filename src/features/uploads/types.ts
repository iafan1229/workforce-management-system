import type { AttendanceStatus } from "@/features/attendance/types";

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

export type AssignmentUploadTaskType = {
  id: string;
  label: string;
};

export type CreateAssignmentUploadWorkerInput = Pick<
  AssignmentUploadWorker,
  "name" | "phone"
>;

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
  createWorkers: (
    workers: CreateAssignmentUploadWorkerInput[],
  ) => Promise<void>;
  createAttendances: (input: {
    workDate: string;
    workerIds: string[];
    status: AttendanceStatus;
  }) => Promise<void>;
  findTaskTypesByLabels: (
    labels: string[],
  ) => Promise<AssignmentUploadTaskType[]>;
  applyAssignmentBatch: (input: {
    workDate: string;
    rows: ApplyAssignmentBatchRow[];
  }) => Promise<void>;
};
