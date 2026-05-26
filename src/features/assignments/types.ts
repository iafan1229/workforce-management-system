export type AssignmentRecord = {
  id: string;
  taskTypeId: string;
};

export type ManualAssignmentRepository = {
  findAttendance: (input: {
    workerId: string;
    workDate: string;
  }) => Promise<{ workerId: string; workDate: string } | null>;
  findAssignment: (input: {
    workerId: string;
    workDate: string;
  }) => Promise<AssignmentRecord | null>;
  createAssignment: (input: {
    workerId: string;
    taskTypeId: string;
    workDate: string;
    source: "manual_assignment";
  }) => Promise<void>;
  updateAssignment: (input: {
    assignmentId: string;
    taskTypeId: string;
    source: "manual_assignment";
  }) => Promise<void>;
  deleteAssignment: (input: { assignmentId: string }) => Promise<void>;
  incrementSkill: (input: {
    workerId: string;
    taskTypeId: string;
  }) => Promise<void>;
  decrementSkill: (input: {
    workerId: string;
    taskTypeId: string;
  }) => Promise<void>;
};
