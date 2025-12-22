import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const generatePDF = (transactions, periodLabel, summary, t) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(t.appTitle, 14, 22);
  
  // Period
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`${t.noRecords.replace('No records for', '')} ${periodLabel}`, 14, 30);
  
  // Summary Box
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(14, 36, 182, 28, 3, 3, 'FD');
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(t.totalIn, 24, 46);
  doc.text(t.totalOut, 84, 46);
  doc.text(t.netBalance, 144, 46);
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text(`+ ${summary.totalIn.toLocaleString('en-IN')}`, 24, 56);
  
  doc.setTextColor(244, 63, 94); // rose-500
  doc.text(`- ${summary.totalOut.toLocaleString('en-IN')}`, 84, 56);
  
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(`= ${summary.netBalance.toLocaleString('en-IN')}`, 144, 56);
  
  // Table
  const tableColumn = ["Date", "Type", "Category/Note", "Amount"];
  const tableRows = [];

  transactions.forEach(txn => {
    const txnData = [
      format(txn.date, 'dd/MM/yyyy'),
      txn.type === 'IN' ? t.cashIn : t.cashOut,
      txn.category ? (t[txn.category.toLowerCase()] || txn.category) : (txn.note || '-'),
      txn.amount.toLocaleString('en-IN')
    ];
    tableRows.push(txnData);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 70,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 25 },
      2: { cellWidth: 'auto' }, // Category/Note takes remaining space
      3: { cellWidth: 35, halign: 'right' }
    }
  });

  doc.save(`cashbook_${periodLabel.replace(/[\s\/]/g, '_')}.pdf`);
};
