import { normalizePhone } from "@/lib/phone";
import type {
  AssignmentUploadRow,
  ValidatedAssignmentUploadRow,
} from "./types";

export function validateAssignmentRows(rows: AssignmentUploadRow[]) {
  const seenPhones = new Set<string>();

  return rows.map((row, index): ValidatedAssignmentUploadRow => {
    const rowNumber = row.rowNumber ?? index + 2;
    const name = toCellString(row.name).trim();
    const phone = toCellString(row.phone).trim();
    const task = toCellString(row.task).trim();

    if (!name) {
      throw new Error(`${rowNumber}행: 이름을 입력해 주세요.`);
    }

    if (!phone) {
      throw new Error(`${rowNumber}행: 전화번호를 입력해 주세요.`);
    }

    if (!task) {
      throw new Error(`${rowNumber}행: 업무를 입력해 주세요.`);
    }

    const normalizedPhone = normalizePhoneWithRow(phone, rowNumber);

    if (seenPhones.has(normalizedPhone)) {
      throw new Error(
        `${rowNumber}행: 업로드 파일 안에 동일 인력 중복 행이 있습니다.`,
      );
    }

    seenPhones.add(normalizedPhone);

    return {
      rowNumber,
      name,
      phone: normalizedPhone,
      task,
    };
  });
}

function normalizePhoneWithRow(phone: string, rowNumber: number) {
  try {
    return normalizePhone(phone);
  } catch (error) {
    throw new Error(`${rowNumber}행: ${getErrorMessage(error)}`);
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "유효하지 않은 전화번호 형식입니다.";
}

function toCellString(value: AssignmentUploadRow["name"]) {
  return typeof value === "string" ? value : String(value ?? "");
}
