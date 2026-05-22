import * as XLSX from "xlsx";
import type { AssignmentUploadRow } from "./types";

export function parseAssignmentWorkbook(fileBuffer: ArrayBuffer) {
  const workbook = XLSX.read(fileBuffer, { type: "array" });
  const [firstSheetName] = workbook.SheetNames;

  if (!firstSheetName) {
    throw new Error("업로드할 시트를 찾을 수 없습니다.");
  }

  const sheet = workbook.Sheets[firstSheetName];

  if (!sheet) {
    throw new Error("업로드할 시트를 찾을 수 없습니다.");
  }

  const [headerRow = [], ...dataRows] = XLSX.utils.sheet_to_json<
    Array<string | number | boolean | null | undefined>
  >(sheet, {
    header: 1,
    defval: "",
    blankrows: true,
  });
  const headerIndexes = getHeaderIndexes(headerRow);

  if (
    headerIndexes.name < 0 ||
    headerIndexes.phone < 0 ||
    headerIndexes.task < 0
  ) {
    throw new Error(
      "필수 컬럼(name, phone, task)을 업로드 시트에서 찾을 수 없습니다.",
    );
  }

  return dataRows
    .map(
      (row, index): AssignmentUploadRow => ({
        rowNumber: index + 2,
        name: getCellValue(row, headerIndexes.name),
        phone: getCellValue(row, headerIndexes.phone),
        task: getCellValue(row, headerIndexes.task),
      }),
    )
    .filter((row) => hasAnyValue(row));
}

function getHeaderIndexes(headerRow: Array<string | number | boolean | null | undefined>) {
  const normalizedHeaders = headerRow.map((cell) =>
    String(cell ?? "")
      .trim()
      .toLowerCase(),
  );

  return {
    name: normalizedHeaders.indexOf("name"),
    phone: normalizedHeaders.indexOf("phone"),
    task: normalizedHeaders.indexOf("task"),
  };
}

function getCellValue(
  row: Array<string | number | boolean | null | undefined>,
  index: number,
) {
  return row[index] ?? "";
}

function hasAnyValue(row: AssignmentUploadRow) {
  return [row.name, row.phone, row.task].some((value) =>
    String(value ?? "").trim(),
  );
}
