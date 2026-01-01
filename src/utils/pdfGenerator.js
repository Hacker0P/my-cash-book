import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const generatePDF = async (transactions, periodLabel, summary, t, userName) => {
  const doc = new jsPDF();
  const themeColor = [16, 185, 129]; // Emerald-500

  // --- Header Section ---
  
  // 1. Logo (App Asset)
  try {
    const response = await fetch('/pwa-192x192.png');
    const blob = await response.blob();
    const reader = new FileReader();
    
    await new Promise((resolve) => {
      reader.onloadend = () => {
         doc.addImage(reader.result, 'PNG', 14, 12, 12, 12);
         resolve();
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    // Fallback if image fails
    doc.setFillColor(...themeColor);
    doc.roundedRect(14, 12, 12, 12, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text("CB", 16.5, 20.5);
  }

  // 2. App Title
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(t.appTitle, 32, 22);

  // 3. Document Label & Date
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('STATEMENT OF ACCOUNTS', 196, 18, { align: 'right' });
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, 196, 24, { align: 'right' });

  // 4. Account Details Rectangle
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, 32, 182, 16, 2, 2, 'FD');

  // Account Holder
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-400
  doc.text("ACCOUNT HOLDER", 20, 39); // Label
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont(undefined, 'bold');
  doc.text(userName || "Guest User", 20, 44); // Value

  // Period Label
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-400
  doc.setFont(undefined, 'normal');
  doc.text("PERIOD", 100, 39); // Label
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont(undefined, 'bold');
  doc.text(periodLabel, 100, 44); // Value

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 54, 196, 54);

  // --- Summary Section ---
  
  const startY = 62;
  
  // Income Box
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.roundedRect(14, startY, 58, 24, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text("TOTAL INCOME", 20, startY + 8);
  doc.setFontSize(14);
  doc.setTextColor(6, 95, 70); // emerald-800
  doc.text(`+ ${summary.totalIn.toLocaleString('en-IN')}`, 20, startY + 18);

  // Expense Box
  doc.setFillColor(255, 241, 242); // rose-50
  doc.roundedRect(76, startY, 58, 24, 3, 3, 'F');
  doc.setFontSize(9);
  doc.setTextColor(244, 63, 94); // rose-500
  doc.text("TOTAL EXPENSE", 82, startY + 8);
  doc.setFontSize(14);
  doc.setTextColor(159, 18, 57); // rose-800
  doc.text(`- ${summary.totalOut.toLocaleString('en-IN')}`, 82, startY + 18);

  // Net Balance Box
  const netColor = summary.netBalance >= 0 ? [248, 250, 252] : [254, 242, 242]; // slate-50 or rose-50
  doc.setFillColor(...netColor);
  doc.setDrawColor(203, 213, 225); // slate-300 border
  doc.roundedRect(138, startY, 58, 24, 3, 3, 'FD');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("NET BALANCE", 144, startY + 8);
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`= ${summary.netBalance.toLocaleString('en-IN')}`, 144, startY + 18);

  // --- Transactions Table ---
  
  const tableColumn = ["Date & Time", "Type", "Category / Note", "Amount"];
  const tableRows = [];

  transactions.forEach(txn => {
    const txnData = [
      format(txn.date, 'dd/MM/yyyy HH:mm'),
      txn.type === 'IN' ? t.cashIn : t.cashOut,
      txn.category ? (t[String(txn.category).toLowerCase()] || txn.category) : (txn.note || '-'),
      { 
        content: txn.amount.toLocaleString('en-IN'), 
        styles: { 
          textColor: txn.type === 'IN' ? [16, 185, 129] : [244, 63, 94],
          fontStyle: 'bold'
        } 
      }
    ];
    tableRows.push(txnData);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 90,
    theme: 'grid',
    styles: { 
      fontSize: 9, 
      cellPadding: 4,
      font: "helvetica",
      textColor: [51, 65, 85] // slate-700
    },
    headStyles: { 
      fillColor: [241, 245, 249], // slate-100
      textColor: [71, 85, 105], // slate-600
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'left'
    },
    alternateRowStyles: { 
      fillColor: [255, 255, 255] 
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 25 },
      2: { cellWidth: 'auto' }, // Category/Note takes remaining space
      3: { cellWidth: 35, halign: 'right' }
    }
  });

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
     doc.setPage(i);
     doc.setFontSize(8);
     doc.setTextColor(150);
     doc.text(`Page ${i} of ${pageCount}`, 196, 290, { align: 'right' });
     doc.text("Generated by My Cash Book App", 14, 290);
  }

  doc.save(`cashbook_${periodLabel.replace(/[\s\/]/g, '_')}.pdf`);
};
