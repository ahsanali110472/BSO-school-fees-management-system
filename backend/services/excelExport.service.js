import ExcelJS from 'exceljs';

/**
 * Service to generate real formatted .xlsx files using ExcelJS
 * Strictly adheres to Section 30: Genuine XLSX format with styled headers, columns & totals.
 */
class ExcelExportService {
  /**
   * Build a styled Excel workbook and return buffer
   * @param {Object} options
   * @param {string} options.sheetName
   * @param {string} options.reportTitle
   * @param {string} options.subtitle
   * @param {Array<string>} options.filterSummary
   * @param {Array<{header: string, key: string, width?: number, isCurrency?: boolean, align?: string}>} options.columns
   * @param {Array<Object>} options.data
   * @param {Object} [options.totals] key-value pairs for total row
   * @returns {Promise<Buffer>}
   */
  static async createReportWorkbook({
    sheetName = 'Report',
    reportTitle = 'Report',
    subtitle = 'BSO Model High School Management System',
    filterSummary = [],
    columns = [],
    data = [],
    totals = null,
  }) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BSO School Management System';
    workbook.lastModifiedBy = 'BSO School Management System';
    workbook.created = new Date();
    workbook.modified = new Date();

    const worksheet = workbook.addWorksheet(sheetName, {
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
      views: [{ showGridLines: true }],
    });

    const colCount = Math.max(columns.length, 6);

    // 1. Title Row
    worksheet.mergeCells(1, 1, 1, colCount);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = 'BSO MODEL HIGH SCHOOL & COLLEGE';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1E293B' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 28;

    // 2. Report Subtitle & Name
    worksheet.mergeCells(2, 1, 2, colCount);
    const subCell = worksheet.getCell(2, 1);
    subCell.value = `${reportTitle.toUpperCase()} • Generated on: ${new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    subCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF475569' } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 20;

    // 3. Filter Summary Row (if any)
    if (filterSummary.length > 0) {
      worksheet.mergeCells(3, 1, 3, colCount);
      const filterCell = worksheet.getCell(3, 1);
      filterCell.value = `Applied Filters: ${filterSummary.join(' | ')}`;
      filterCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF64748B' } };
      filterCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(3).height = 18;
    } else {
      worksheet.mergeCells(3, 1, 3, colCount);
      const filterCell = worksheet.getCell(3, 1);
      filterCell.value = subtitle;
      filterCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF64748B' } };
      filterCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(3).height = 18;
    }

    // Row 4: Empty separator
    worksheet.getRow(4).height = 10;

    // Row 5: Table Headers
    const headerRowIndex = 5;
    const headerRow = worksheet.getRow(headerRowIndex);
    headerRow.height = 24;

    columns.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = col.header;
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' }, // Slate 800
      };
      cell.alignment = {
        horizontal: col.align || (col.isCurrency ? 'right' : 'left'),
        vertical: 'middle',
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FF94A3B8' } },
        right: { style: 'thin', color: { argb: 'FF94A3B8' } },
      };
    });

    // Data Rows
    let currentRowIndex = 6;
    data.forEach((item, rIdx) => {
      const row = worksheet.getRow(currentRowIndex);
      row.height = 20;
      const isEven = rIdx % 2 === 0;

      columns.forEach((col, cIdx) => {
        const cell = row.getCell(cIdx + 1);
        let val = item[col.key];

        if (val === undefined || val === null) {
          val = '-';
        }

        cell.value = val;
        cell.font = { name: 'Arial', size: 9, color: { argb: 'FF1E293B' } };
        cell.alignment = {
          horizontal: col.align || (col.isCurrency ? 'right' : 'left'),
          vertical: 'middle',
        };

        if (col.isCurrency && typeof val === 'number') {
          cell.numFmt = '#,##0';
        }

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' }, // subtle zebra
        };

        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });

      currentRowIndex++;
    });

    // Grand Totals Row (if provided)
    if (totals) {
      const totalRow = worksheet.getRow(currentRowIndex);
      totalRow.height = 22;

      columns.forEach((col, cIdx) => {
        const cell = totalRow.getCell(cIdx + 1);
        const val = totals[col.key];

        if (cIdx === 0 && (!val || val === '')) {
          cell.value = 'GRAND TOTAL';
        } else {
          cell.value = val !== undefined ? val : '';
        }

        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
        cell.alignment = {
          horizontal: col.align || (col.isCurrency ? 'right' : 'left'),
          vertical: 'middle',
        };

        if (col.isCurrency && typeof cell.value === 'number') {
          cell.numFmt = '#,##0';
        }

        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2E8F0' }, // Slate 200
        };

        cell.border = {
          top: { style: 'medium', color: { argb: 'FF0F172A' } },
          bottom: { style: 'double', color: { argb: 'FF0F172A' } },
          left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
          right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        };
      });
    }

    // Set Column Widths with padding
    columns.forEach((col, idx) => {
      const worksheetCol = worksheet.getColumn(idx + 1);
      if (col.width) {
        worksheetCol.width = col.width;
      } else {
        // Compute reasonable width based on header length
        const baseLen = col.header.length;
        worksheetCol.width = Math.max(baseLen + 5, 14);
      }
    });

    return await workbook.xlsx.writeBuffer();
  }
}

export default ExcelExportService;
