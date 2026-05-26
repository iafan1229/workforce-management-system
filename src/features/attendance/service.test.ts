import { describe, expect, it, vi } from "vitest";
import { registerAttendance } from "./service";

describe("registerAttendance", () => {
  it("없는 전화번호면 신규 인력을 만들고 출근을 기록한다", async () => {
    const repo = {
      findWorkerByPhone: vi.fn().mockResolvedValue(null),
      createWorker: vi.fn().mockResolvedValue({
        id: "worker-1",
        name: "홍길동",
        phone: "01012345678",
      }),
      findAttendance: vi.fn().mockResolvedValue(null),
      createAttendance: vi.fn().mockResolvedValue({ id: "attendance-1" }),
      updateAttendanceStatus: vi.fn(),
    };

    await registerAttendance(
      {
        name: "  홍길동  ",
        phone: "010-1234-5678",
        workDate: "2026-05-21",
        status: "checked_in",
      },
      repo,
    );

    expect(repo.findWorkerByPhone).toHaveBeenCalledWith("01012345678");
    expect(repo.createWorker).toHaveBeenCalledWith({
      name: "홍길동",
      phone: "01012345678",
    });
    expect(repo.createAttendance).toHaveBeenCalledWith({
      workerId: "worker-1",
      workDate: "2026-05-21",
      status: "checked_in",
    });
  });

  it("기존 인력이 있으면 신규 생성 없이 출근만 기록한다", async () => {
    const repo = {
      findWorkerByPhone: vi.fn().mockResolvedValue({
        id: "worker-9",
        name: "기존 인력",
        phone: "01099998888",
      }),
      createWorker: vi.fn(),
      findAttendance: vi.fn().mockResolvedValue(null),
      createAttendance: vi.fn().mockResolvedValue({ id: "attendance-9" }),
      updateAttendanceStatus: vi.fn(),
    };

    await registerAttendance(
      {
        name: "다른 이름",
        phone: "010 9999 8888",
        workDate: "2026-05-21",
        status: "checked_in",
      },
      repo,
    );

    expect(repo.findWorkerByPhone).toHaveBeenCalledWith("01099998888");
    expect(repo.createWorker).not.toHaveBeenCalled();
    expect(repo.createAttendance).toHaveBeenCalledWith({
      workerId: "worker-9",
      workDate: "2026-05-21",
      status: "checked_in",
    });
  });

  it("trim 후 이름이 비어 있으면 거절한다", async () => {
    const repo = {
      findWorkerByPhone: vi.fn(),
      createWorker: vi.fn(),
      findAttendance: vi.fn(),
      createAttendance: vi.fn(),
      updateAttendanceStatus: vi.fn(),
    };

    await expect(
      registerAttendance(
        {
          name: "   ",
          phone: "010-1234-5678",
          workDate: "2026-05-21",
          status: "checked_in",
        },
        repo,
      ),
    ).rejects.toThrowError("이름을 입력해 주세요.");

    expect(repo.findWorkerByPhone).not.toHaveBeenCalled();
    expect(repo.createWorker).not.toHaveBeenCalled();
    expect(repo.createAttendance).not.toHaveBeenCalled();
  });

  it("유효하지 않은 근무일이면 거절한다", async () => {
    const repo = {
      findWorkerByPhone: vi.fn(),
      createWorker: vi.fn(),
      findAttendance: vi.fn(),
      createAttendance: vi.fn(),
      updateAttendanceStatus: vi.fn(),
    };

    await expect(
      registerAttendance(
        {
          name: "홍길동",
          phone: "010-1234-5678",
          workDate: "2026-02-30",
          status: "checked_in",
        },
        repo,
      ),
    ).rejects.toThrowError("근무일 형식이 올바르지 않습니다.");

    expect(repo.findWorkerByPhone).not.toHaveBeenCalled();
    expect(repo.createWorker).not.toHaveBeenCalled();
    expect(repo.createAttendance).not.toHaveBeenCalled();
  });

  it("신규 인력 생성 중 unique 충돌이 나면 다시 조회해서 계속 진행한다", async () => {
    const repo = {
      findWorkerByPhone: vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: "worker-2",
          name: "홍길동",
          phone: "01012345678",
        }),
      createWorker: vi.fn().mockRejectedValue({
        code: "23505",
        message: 'duplicate key value violates unique constraint "workers_phone_key"',
        details: "Key (phone)=(01012345678) already exists.",
      }),
      findAttendance: vi.fn().mockResolvedValue(null),
      createAttendance: vi.fn().mockResolvedValue({ id: "attendance-2" }),
      updateAttendanceStatus: vi.fn(),
    };

    await registerAttendance(
      {
        name: " 홍길동 ",
        phone: "010-1234-5678",
        workDate: "2026-05-21",
        status: "checked_in",
      },
      repo,
    );

    expect(repo.findWorkerByPhone).toHaveBeenNthCalledWith(1, "01012345678");
    expect(repo.findWorkerByPhone).toHaveBeenNthCalledWith(2, "01012345678");
    expect(repo.createAttendance).toHaveBeenCalledWith({
      workerId: "worker-2",
      workDate: "2026-05-21",
      status: "checked_in",
    });
  });

  it("출근예정이 있으면 출근완료 등록 시 상태를 승격한다", async () => {
    const repo = {
      findWorkerByPhone: vi.fn().mockResolvedValue({
        id: "worker-9",
        name: "기존 인력",
        phone: "01099998888",
      }),
      createWorker: vi.fn(),
      findAttendance: vi.fn().mockResolvedValue({
        id: "attendance-9",
        workerId: "worker-9",
        workDate: "2026-05-21",
        status: "scheduled",
      }),
      createAttendance: vi.fn(),
      updateAttendanceStatus: vi.fn().mockResolvedValue(undefined),
    };

    await registerAttendance(
      {
        name: "기존 인력",
        phone: "010-9999-8888",
        workDate: "2026-05-21",
        status: "checked_in",
      },
      repo,
    );

    expect(repo.createAttendance).not.toHaveBeenCalled();
    expect(repo.updateAttendanceStatus).toHaveBeenCalledWith({
      attendanceId: "attendance-9",
      status: "checked_in",
    });
    expect(repo.createWorker).not.toHaveBeenCalled();
  });

  it("같은 날짜에 이미 출근예정이면 다시 예정 등록하지 않는다", async () => {
    const repo = {
      findWorkerByPhone: vi.fn().mockResolvedValue({
        id: "worker-9",
        name: "기존 인력",
        phone: "01099998888",
      }),
      createWorker: vi.fn(),
      findAttendance: vi.fn().mockResolvedValue({
        id: "attendance-9",
        workerId: "worker-9",
        workDate: "2026-05-21",
        status: "scheduled",
      }),
      createAttendance: vi.fn(),
      updateAttendanceStatus: vi.fn(),
    };

    await expect(
      registerAttendance(
        {
          name: "기존 인력",
          phone: "010-9999-8888",
          workDate: "2026-05-21",
          status: "scheduled",
        },
        repo,
      ),
    ).rejects.toThrowError("이미 해당 날짜에 출근예정 등록된 인력입니다.");
  });

  it("같은 날짜에 이미 출근완료면 예정 등록으로 되돌리지 않는다", async () => {
    const repo = {
      findWorkerByPhone: vi.fn().mockResolvedValue({
        id: "worker-9",
        name: "기존 인력",
        phone: "01099998888",
      }),
      createWorker: vi.fn(),
      findAttendance: vi.fn().mockResolvedValue({
        id: "attendance-9",
        workerId: "worker-9",
        workDate: "2026-05-21",
        status: "checked_in",
      }),
      createAttendance: vi.fn(),
      updateAttendanceStatus: vi.fn(),
    };

    await expect(
      registerAttendance(
        {
          name: "기존 인력",
          phone: "010-9999-8888",
          workDate: "2026-05-21",
          status: "scheduled",
        },
        repo,
      ),
    ).rejects.toThrowError("이미 해당 날짜에 출근 완료 등록된 인력입니다.");
  });
});
