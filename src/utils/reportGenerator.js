import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate a PDF report for a code analysis result
 * @param {Object} data - { code, language, analysisResult, user }
 */
export function generatePDFReport(data) {
    const { code, language, analysisResult = {}, user } = data;
    const { issues = [], score = { overall: 0, correctness: 0, performance: 0, readability: 0, bestPractices: 0 }, codeStatus = 'unknown' } = analysisResult;

    // Fallback for issues if it's not an array
    const safeIssues = Array.isArray(issues) ? issues : [];

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // ─── Header ───
    doc.setFontSize(22);
    doc.setTextColor(108, 92, 231); // Accent color
    doc.text('Codewhiz - Analysis Report', 15, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 28);
    doc.text(`User: ${user?.fullName || 'Guest User'} (${user?.email || 'N/A'})`, 15, 33);
    doc.text(`Language: ${language}`, 15, 38);

    // ─── Score Overview ───
    doc.setDrawColor(200);
    doc.line(15, 45, pageWidth - 15, 45);

    doc.setFontSize(16);
    doc.setTextColor(45, 52, 54);
    doc.text('Overall Quality Score', 15, 55);

    doc.setFontSize(30);
    const scoreColor = score.overall >= 80 ? [0, 184, 148] : score.overall >= 50 ? [253, 203, 110] : [255, 107, 107];
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(`${score.overall}/100`, 15, 70);

    doc.setFontSize(12);
    doc.setTextColor(80);
    doc.text(`Status: ${codeStatus.toUpperCase().replace('_', ' ')}`, 15, 78);

    // ─── Breakdown ───
    const breakdownData = [
        ['Metric', 'Score', 'Impact'],
        ['Correctness', `${score.correctness}/100`, '40%'],
        ['Performance', `${score.performance}/100`, '20%'],
        ['Readability', `${score.readability}/100`, '20%'],
        ['Best Practices', `${score.bestPractices}/100`, '20%']
    ];

    autoTable(doc, {
        startY: 85,
        head: [breakdownData[0]],
        body: breakdownData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [108, 92, 231] }
    });

    // ─── Issues Summary ───
    const currentY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.setTextColor(45, 52, 54);
    doc.text('Issues Detected', 15, currentY);

    if (safeIssues.length === 0) {
        doc.setFontSize(11);
        doc.setTextColor(0, 184, 148);
        doc.text('✨ No issues found! Your code is perfect.', 15, currentY + 10);
    } else {
        const issuesRows = safeIssues.map((issue, idx) => [
            idx + 1,
            (issue.severity || 'INFO').toUpperCase(),
            issue.category || 'General',
            `Line ${issue.line || '?'}: ${issue.title || 'Code Issue'}`,
            issue.suggestion || 'See editor for details'
        ]);

        autoTable(doc, {
            startY: currentY + 5,
            head: [['#', 'Severity', 'Category', 'Description', 'Suggestion']],
            body: issuesRows,
            styles: { fontSize: 9 },
            columnStyles: {
                1: { fontStyle: 'bold' },
                3: { cellWidth: 50 },
                4: { cellWidth: 60 }
            },
            didDrawCell: (data) => {
                if (data.section === 'body' && data.column.index === 1) {
                    const sev = String(data.cell.raw || '').toUpperCase();
                    if (sev === 'ERROR') doc.setTextColor(255, 107, 107);
                    else if (sev === 'WARNING') doc.setTextColor(253, 203, 110);
                    else if (sev === 'INFO') doc.setTextColor(116, 185, 255);
                    else doc.setTextColor(0, 184, 148);
                }
            }
        });
    }

    // ─── Source Code ───
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(45, 52, 54);
    doc.text('Source Code', 15, 20);

    doc.setFont('courier');
    doc.setFontSize(8);
    doc.setTextColor(60);

    const splitCode = doc.splitTextToSize(code, pageWidth - 30);
    let y = 30;
    splitCode.forEach(line => {
        if (y > 280) {
            doc.addPage();
            y = 20;
        }
        doc.text(line, 15, y);
        y += 4;
    });

    // ─── Footer ───
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 25, 290);
        doc.text('Powered by Codewhiz ', 15, 290);
    }

    // Save the PDF
    const filename = `CodeMentor_Report_${new Date().getTime()}.pdf`;
    doc.save(filename);
}
