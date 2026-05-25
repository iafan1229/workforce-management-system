import * as XLSX from "xlsx";
import { describe, expect, it, vi } from "vitest";
import { importAssignmentUpload } from "./import-assignment-upload";
import { parseAssignmentWorkbook } from "./parse-assignment-workbook";
import { validateAssignmentRows } from "./validate-assignment-upload";

describe("parseAssignmentWorkbook", () => {
  it("첫 번째 시트만 읽고 실제 엑셀 행 번호를 보존한다", () => {
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([
        { name: "홍길동", phone: "010-1234-5678", task: "피딩" },
        { name: "", phone: "", task: "" },
        { name: "김영희", phone: "01099998888", task: "선별" },
      ]),
      "assignments",
    );
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([{ name: "무시", phone: "01000000000", task: "무시" }]),
      "ignored",
    );

    const fileBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    expect(parseAssignmentWorkbook(fileBuffer)).toEqual([
      { rowNumber: 2, name: "홍길동", phone: "010-1234-5678", task: "피딩" },
      { rowNumber: 4, name: "김영희", phone: "01099998888", task: "선별" },
    ]);
  });

  it("필수 헤더가 없으면 친화적인 에러로 거절한다", () => {
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet([
        { worker_name: "홍길동", phone_number: "010-1234-5678", duty: "피딩" },
      ]),
      "assignments",
    );

    const fileBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    expect(() => parseAssignmentWorkbook(fileBuffer)).toThrowError(
      "필수 컬럼(name, phone, task)을 업로드 시트에서 찾을 수 없습니다.",
    );
  });
});

describe("validateAssignmentRows", () => {
  it("전화번호를 정규화하고 필수값을 trim 한다", () => {
    expect(
      validateAssignmentRows([
        { name: "  홍길동  ", phone: "010-1234-5678", task: "  피딩 " },
      ]),
    ).toEqual([
      { rowNumber: 2, name: "홍길동", phone: "01012345678", task: "피딩" },
    ]);
  });

  it("필수값이 비어 있으면 행 번호와 함께 거절한다", () => {
    expect(() =>
      validateAssignmentRows([
        { name: "   ", phone: "010-1234-5678", task: "피딩" },
      ]),
    ).toThrowError("2행: 이름을 입력해 주세요.");

    expect(() =>
      validateAssignmentRows([{ name: "홍길동", phone: "   ", task: "피딩" }]),
    ).toThrowError("2행: 전화번호를 입력해 주세요.");

    expect(() =>
      validateAssignmentRows([
        { name: "홍길동", phone: "010-1234-5678", task: "   " },
      ]),
    ).toThrowError("2행: 업무를 입력해 주세요.");
  });

  it("전화번호 형식이 올바르지 않으면 행 번호와 함께 거절한다", () => {
    expect(() =>
      validateAssignmentRows([{ name: "홍길동", phone: "1234", task: "피딩" }]),
    ).toThrowError("2행: 유효하지 않은 전화번호 형식입니다.");
  });

  it("숫자 셀 전화번호도 TypeError 없이 검증 에러로 처리한다", () => {
    expect(() =>
      validateAssignmentRows([{ rowNumber: 7, name: "홍길동", phone: 1012345678, task: "피딩" }]),
    ).toThrowError("7행: 유효하지 않은 전화번호 형식입니다.");
  });

  it("업로드 파일 안에 동일 인력 중복 행이 있으면 거절한다", () => {
    expect(() =>
      validateAssignmentRows([
        { name: "홍길동", phone: "010-1234-5678", task: "피딩" },
        { name: "홍길동", phone: "01012345678", task: "선별" },
      ]),
    ).toThrowError("3행: 업로드 파일 안에 동일 인력 중복 행이 있습니다.");
  });
});

describe("importAssignmentUpload", () => {
  it("업로드할 데이터 행이 없으면 전체를 거절한다", async () => {
    const repo = {
      findWorkersByPhones: vi.fn(),
      findAttendancesByDate: vi.fn(),
      findTaskTypesByLabels: vi.fn(),
      applyAssignmentBatch: vi.fn(),
    };

    await expect(
      importAssignmentUpload(
        {
          workDate: "2026-05-21",
          rows: [],
        },
        repo,
      ),
    ).rejects.toThrowError("업로드할 데이터 행이 없습니다.");

    expect(repo.findWorkersByPhones).not.toHaveBeenCalled();
    expect(repo.findAttendancesByDate).not.toHaveBeenCalled();
    expect(repo.findTaskTypesByLabels).not.toHaveBeenCalled();
    expect(repo.applyAssignmentBatch).not.toHaveBeenCalled();
  });

  it("업로드 중복 행이 있으면 전체를 거절한다", async () => {
    const repo = {
      findWorkersByPhones: vi.fn().mockResolvedValue([
        { id: "worker-1", name: "홍길동", phone: "01012345678" },
      ]),
      findAttendancesByDate: vi.fn().mockResolvedValue([
        { workerId: "worker-1", workDate: "2026-05-21" },
      ]),
      findTaskTypesByLabels: vi.fn().mockResolvedValue([
        { id: "task-1", label: "피딩" },
      ]),
      applyAssignmentBatch: vi.fn(),
    };

    await expect(
      importAssignmentUpload(
        {
          workDate: "2026-05-21",
          rows: [
            { name: "홍길동", phone: "01012345678", task: "피딩" },
            { name: "홍길동", phone: "01012345678", task: "피딩" },
          ],
        },
        repo,
      ),
    ).rejects.toThrowError("3행: 업로드 파일 안에 동일 인력 중복 행이 있습니다.");

    expect(repo.findWorkersByPhones).not.toHaveBeenCalled();
    expect(repo.findAttendancesByDate).not.toHaveBeenCalled();
    expect(repo.findTaskTypesByLabels).not.toHaveBeenCalled();
    expect(repo.applyAssignmentBatch).not.toHaveBeenCalled();
  });

  it("출근하지 않은 인력이 있으면 전체를 거절한다", async () => {
    const repo = {
      findWorkersByPhones: vi.fn().mockResolvedValue([
        { id: "worker-1", name: "홍길동", phone: "01012345678" },
      ]),
      findAttendancesByDate: vi.fn().mockResolvedValue([]),
      findTaskTypesByLabels: vi.fn().mockResolvedValue([
        { id: "task-1", label: "피딩" },
      ]),
      applyAssignmentBatch: vi.fn(),
    };

    await expect(
      importAssignmentUpload(
        {
          workDate: "2026-05-21",
          rows: [{ name: "홍길동", phone: "010-1234-5678", task: "피딩" }],
        },
        repo,
      ),
    ).rejects.toThrowError(
      "2행: 홍길동은(는) 2026-05-21 출근 등록이 되어 있지 않습니다.",
    );

    expect(repo.applyAssignmentBatch).not.toHaveBeenCalled();
  });

  it("등록되지 않은 인력이 있으면 전체를 거절한다", async () => {
    const repo = {
      findWorkersByPhones: vi.fn().mockResolvedValue([]),
      findAttendancesByDate: vi.fn().mockResolvedValue([]),
      findTaskTypesByLabels: vi.fn().mockResolvedValue([
        { id: "task-1", label: "피딩" },
      ]),
      applyAssignmentBatch: vi.fn(),
    };

    await expect(
      importAssignmentUpload(
        {
          workDate: "2026-05-21",
          rows: [{ name: "홍길동", phone: "010-1234-5678", task: "피딩" }],
        },
        repo,
      ),
    ).rejects.toThrowError(
      "2행: 01012345678 전화번호의 인력을 찾을 수 없습니다.",
    );

    expect(repo.applyAssignmentBatch).not.toHaveBeenCalled();
  });

  it("이름이 등록 정보와 다르면 전체를 거절한다", async () => {
    const repo = {
      findWorkersByPhones: vi.fn().mockResolvedValue([
        { id: "worker-1", name: "홍길동", phone: "01012345678" },
      ]),
      findAttendancesByDate: vi.fn().mockResolvedValue([
        { workerId: "worker-1", workDate: "2026-05-21" },
      ]),
      findTaskTypesByLabels: vi.fn().mockResolvedValue([
        { id: "task-1", label: "피딩" },
      ]),
      applyAssignmentBatch: vi.fn(),
    };

    await expect(
      importAssignmentUpload(
        {
          workDate: "2026-05-21",
          rows: [{ name: "김영희", phone: "010-1234-5678", task: "피딩" }],
        },
        repo,
      ),
    ).rejects.toThrowError(
      "2행: 01012345678 전화번호의 인력 이름이 등록 정보와 일치하지 않습니다.",
    );

    expect(repo.applyAssignmentBatch).not.toHaveBeenCalled();
  });

  it("업무 카테고리를 찾을 수 없으면 전체를 거절한다", async () => {
    const repo = {
      findWorkersByPhones: vi.fn().mockResolvedValue([
        { id: "worker-1", name: "홍길동", phone: "01012345678" },
      ]),
      findAttendancesByDate: vi.fn().mockResolvedValue([
        { workerId: "worker-1", workDate: "2026-05-21" },
      ]),
      findTaskTypesByLabels: vi.fn().mockResolvedValue([]),
      applyAssignmentBatch: vi.fn(),
    };

    await expect(
      importAssignmentUpload(
        {
          workDate: "2026-05-21",
          rows: [{ name: "홍길동", phone: "010-1234-5678", task: "피딩" }],
        },
        repo,
      ),
    ).rejects.toThrowError("2행: 피딩 업무 카테고리를 찾을 수 없습니다.");

    expect(repo.applyAssignmentBatch).not.toHaveBeenCalled();
  });

  it("모든 검증이 통과하면 배정을 한 번에 반영하고 건수를 반환한다", async () => {
    const repo = {
      findWorkersByPhones: vi.fn().mockResolvedValue([
        { id: "worker-1", name: "홍길동", phone: "01012345678" },
        { id: "worker-2", name: "김영희", phone: "01099998888" },
      ]),
      findAttendancesByDate: vi.fn().mockResolvedValue([
        { workerId: "worker-1", workDate: "2026-05-21" },
        { workerId: "worker-2", workDate: "2026-05-21" },
      ]),
      findTaskTypesByLabels: vi.fn().mockResolvedValue([
        { id: "task-1", label: "피딩" },
        { id: "task-2", label: "선별" },
      ]),
      applyAssignmentBatch: vi.fn().mockResolvedValue(undefined),
    };

    await expect(
      importAssignmentUpload(
        {
          workDate: "2026-05-21",
          rows: [
            { name: " 홍길동 ", phone: "010-1234-5678", task: " 피딩 " },
            { name: "김영희", phone: "010-9999-8888", task: "선별" },
          ],
        },
        repo,
      ),
    ).resolves.toEqual({ importedCount: 2 });

    expect(repo.findWorkersByPhones).toHaveBeenCalledWith([
      "01012345678",
      "01099998888",
    ]);
    expect(repo.findAttendancesByDate).toHaveBeenCalledWith("2026-05-21");
    expect(repo.findTaskTypesByLabels).toHaveBeenCalledWith(["피딩", "선별"]);
    expect(repo.applyAssignmentBatch).toHaveBeenCalledTimes(1);
    expect(repo.applyAssignmentBatch).toHaveBeenCalledWith({
      workDate: "2026-05-21",
      rows: [
        { workerId: "worker-1", taskTypeId: "task-1" },
        { workerId: "worker-2", taskTypeId: "task-2" },
      ],
    });
  });

  it("같은 날짜에 기존 수동 배정이 있어도 업로드 배치를 호출한다", async () => {
    const repo = {
      findWorkersByPhones: vi.fn().mockResolvedValue([
        { id: "worker-1", name: "홍길동", phone: "01012345678" },
      ]),
      findAttendancesByDate: vi.fn().mockResolvedValue([
        { workerId: "worker-1", workDate: "2026-05-21" },
      ]),
      findTaskTypesByLabels: vi.fn().mockResolvedValue([
        { id: "task-1", label: "피딩" },
      ]),
      applyAssignmentBatch: vi.fn().mockResolvedValue(undefined),
    };

    await expect(
      importAssignmentUpload(
        {
          workDate: "2026-05-21",
          rows: [{ name: "홍길동", phone: "010-1234-5678", task: "피딩" }],
        },
        repo,
      ),
    ).resolves.toEqual({ importedCount: 1 });

    expect(repo.applyAssignmentBatch).toHaveBeenCalledWith({
      workDate: "2026-05-21",
      rows: [{ workerId: "worker-1", taskTypeId: "task-1" }],
    });
  });
});
