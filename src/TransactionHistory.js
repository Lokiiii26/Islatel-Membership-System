import React, { useState, useMemo } from "react";
import { jsPDF } from "jspdf";

const BRAND = {
  gold: [212, 175, 55],
  darkGold: [184, 134, 11],
  charcoal: [44, 44, 44],
  gray: [120, 120, 120],
  lightGray: [248, 248, 248]
};

const TransactionHistory = ({ transactions, members = [], onClose, isOpen }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [actionFilter, setActionFilter] = useState("All");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  // Calculate totals from members (same as dashboard)
  const membersTotalBookValue = members.reduce((sum, m) => sum + (parseFloat(m.bookValue) || 0), 0);

  // Get unique actions from transactions
  const uniqueActions = useMemo(() => {
    const actions = [...new Set(transactions.map(t => t.action || "Updated"))];
    return ["All", ...actions];
  }, [transactions]);

  // Filter transactions based on all criteria
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Search by name
      if (searchTerm && !t.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      // Filter by status
      if (statusFilter !== "All" && t.status !== statusFilter) {
        return false;
      }
      // Filter by action
      if (actionFilter !== "All" && (t.action || "Updated") !== actionFilter) {
        return false;
      }
      // Filter by date range
      if (startDateFilter && t.startDate && t.startDate < startDateFilter) {
        return false;
      }
      if (endDateFilter && t.endDate && t.endDate > endDateFilter) {
        return false;
      }
      return true;
    });
  }, [transactions, searchTerm, statusFilter, actionFilter, startDateFilter, endDateFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setActionFilter("All");
    setStartDateFilter("");
    setEndDateFilter("");
  };

  const hasActiveFilters = searchTerm || statusFilter !== "All" || actionFilter !== "All" || startDateFilter || endDateFilter;

  const generatePDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Helper function to add a new page with header
    const addNewPage = () => {
      addFooter(doc, pageWidth, pageHeight, margin);
      doc.addPage();
      y = margin + 10;
      // Mini header on continuation pages
      doc.setFillColor(...BRAND.gold);
      doc.rect(0, 0, pageWidth, 8, "F");
      doc.setFontSize(8);
      doc.setFont(undefined, "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("Hello Club Membership - Transaction History (Continued)", pageWidth / 2, 5.5, { align: "center" });
      doc.setTextColor(...BRAND.charcoal);
      y += 5;
    };

    /* ================= DECORATIVE TOP BAR ================= */
    doc.setFillColor(...BRAND.gold);
    doc.rect(0, 0, pageWidth, 12, "F");
    
    /* ================= COMPANY HEADER ================= */
    y = 22;
    doc.setFontSize(22);
    doc.setFont(undefined, "bold");
    doc.setTextColor(...BRAND.charcoal);
    doc.text("THE FIRST ISLATEL", pageWidth / 2, y, { align: "center" });

    y += 7;
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.setTextColor(...BRAND.gray);
    doc.text("Islatel Realty and Development Corporation", pageWidth / 2, y, { align: "center" });
    
    y += 5;
    doc.setFontSize(9);
    doc.text("Lucap, Alaminos City, Pangasinan", pageWidth / 2, y, { align: "center" });
    
    y += 4;
    doc.text("www.islatelph.com  |  (+63) 968 851 5485", pageWidth / 2, y, { align: "center" });

    /* ================= DOCUMENT TITLE ================= */
    y += 12;
    doc.setFillColor(250, 248, 244);
    doc.roundedRect(margin, y - 6, contentWidth, 18, 3, 3, "F");
    doc.setDrawColor(...BRAND.gold);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y - 6, contentWidth, 18, 3, 3, "S");
    
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.setTextColor(...BRAND.darkGold);
    doc.text("HELLO CLUB MEMBERSHIP", pageWidth / 2, y + 2, { align: "center" });
    
    doc.setFontSize(11);
    doc.setFont(undefined, "normal");
    doc.setTextColor(...BRAND.charcoal);
    doc.text("Transaction History Report", pageWidth / 2, y + 9, { align: "center" });

    /* ================= DOCUMENT INFO BAR ================= */
    y += 20;
    doc.setFillColor(...BRAND.charcoal);
    doc.roundedRect(margin, y, contentWidth, 10, 2, 2, "F");
    
    doc.setFontSize(8);
    doc.setFont(undefined, "bold");
    doc.setTextColor(255, 255, 255);
    
    const reportDate = new Date().toLocaleDateString("en-US", { 
      year: "numeric", month: "long", day: "numeric" 
    });
    const reportTime = new Date().toLocaleTimeString("en-US", { 
      hour: "2-digit", minute: "2-digit" 
    });
    const reportNo = `TH-${Date.now().toString().slice(-8)}`;
    
    doc.text(`Report No: ${reportNo}`, margin + 4, y + 6.5);
    doc.text(`Generated: ${reportDate} at ${reportTime}`, pageWidth - margin - 4, y + 6.5, { align: "right" });

    /* ================= SUMMARY BOX ================= */
    y += 18;
    // Use members data for accurate totals (matches dashboard)
    const totalValue = membersTotalBookValue;
    const activeCount = members.filter(m => {
      if (!m.endDate) return false;
      return new Date(m.endDate) >= new Date();
    }).length;
    const expiredCount = members.length - activeCount;
    const avgValue = members.length > 0 ? totalValue / members.length : 0;
    
    // Summary container
    doc.setFillColor(...BRAND.lightGray);
    doc.roundedRect(margin, y, contentWidth, 42, 3, 3, "F");
    doc.setDrawColor(...BRAND.gold);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, contentWidth, 42, 3, 3, "S");
    
    // Summary title
    doc.setFont(undefined, "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.darkGold);
    doc.text("SUMMARY", margin + 6, y + 7);
    
    // Summary items - Row 1
    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.setTextColor(...BRAND.charcoal);
    
    const summaryRow1 = [
      { label: "Total Members:", value: String(members.length) },
      { label: "Total Lifetime Book Value:", value: "P" + (totalValue || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") },
      { label: "Active:", value: String(activeCount) },
      { label: "Expired:", value: String(expiredCount) }
    ];
    
    let summaryX = margin + 6;
    const itemSpacing = (contentWidth - 12) / 4;
    
    summaryRow1.forEach((item, i) => {
      doc.setFont(undefined, "normal");
      doc.setTextColor(...BRAND.gray);
      doc.text(item.label, summaryX + (i * itemSpacing), y + 17);
      doc.setFont(undefined, "bold");
      doc.setTextColor(...BRAND.charcoal);
      doc.text(item.value, summaryX + (i * itemSpacing), y + 23);
    });

    // Summary items - Row 2
    const summaryRow2 = [
      { label: "Avg. Lifetime Book Value:", value: "P" + (avgValue || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") },
      { label: "Active Rate:", value: `${members.length > 0 ? ((activeCount / members.length) * 100).toFixed(1) : 0}%` }
    ];

    const row2Spacing = (contentWidth - 12) / 2;
    summaryRow2.forEach((item, i) => {
      doc.setFont(undefined, "normal");
      doc.setTextColor(...BRAND.gray);
      doc.text(item.label, summaryX + (i * row2Spacing), y + 32);
      doc.setFont(undefined, "bold");
      doc.setTextColor(...BRAND.charcoal);
      doc.text(item.value, summaryX + (i * row2Spacing), y + 38);
    });

    /* ================= TOP 3 HIGHEST BOOK VALUE ================= */
    y += 50;
    const top3 = [...members]
      .sort((a, b) => (parseFloat(b.bookValue) || 0) - (parseFloat(a.bookValue) || 0))
      .slice(0, 3);

    if (top3.length > 0) {
      const top3Height = 8 + top3.length * 8 + 4;
      doc.setFillColor(255, 251, 235);
      doc.roundedRect(margin, y, contentWidth, top3Height, 3, 3, "F");
      doc.setDrawColor(...BRAND.gold);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, y, contentWidth, top3Height, 3, 3, "S");

      doc.setFont(undefined, "bold");
      doc.setFontSize(10);
      doc.setTextColor(...BRAND.darkGold);
      doc.text("TOP 3 HIGHEST LIFETIME BOOK VALUE", margin + 6, y + 7);

      const medals = ["1st", "2nd", "3rd"];
      top3.forEach((m, i) => {
        const rowY = y + 14 + i * 8;
        doc.setFontSize(8);
        doc.setFont(undefined, "bold");
        doc.setTextColor(...BRAND.darkGold);
        doc.text(medals[i], margin + 6, rowY);
        doc.setFont(undefined, "normal");
        doc.setTextColor(...BRAND.charcoal);
        doc.text(m.name || "—", margin + 20, rowY);
        doc.setFont(undefined, "bold");
        doc.setTextColor(...BRAND.darkGold);
        const val = "P" + parseFloat(m.bookValue || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        doc.text(val, margin + contentWidth - 6, rowY, { align: "right" });
      });

      y += top3Height + 6;
    }

    /* ================= FILTER INFO ================= */
    if (hasActiveFilters) {
      doc.setFillColor(255, 249, 196);
      doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "F");
      doc.setDrawColor(255, 193, 7);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "S");
      
      doc.setFontSize(8);
      doc.setFont(undefined, "normal");
      doc.setTextColor(156, 121, 0);
      
      let filterText = "Filters Applied: ";
      const filters = [];
      if (searchTerm) filters.push(`Name: "${searchTerm}"`);
      if (statusFilter !== "All") filters.push(`Status: ${statusFilter}`);
      if (actionFilter !== "All") filters.push(`Action: ${actionFilter}`);
      if (startDateFilter) filters.push(`From: ${startDateFilter}`);
      if (endDateFilter) filters.push(`To: ${endDateFilter}`);
      filterText += filters.join(" | ");
      
      doc.text(filterText, margin + 4, y + 7.5);
      y += 16;
    }

    /* ================= TRANSACTION TABLE ================= */
    doc.setFont(undefined, "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.charcoal);
    doc.text("TRANSACTION DETAILS", margin, y);
    
    y += 5;
    
    // Table headers with auto-adjust for Member Name column
    const headers = ["#", "Member Name", "Start Date", "End Date", "Lifetime Book Value", "Status", "Action"];
    // Calculate optimal name column width based on longest name
    doc.setFontSize(8);
    doc.setFont(undefined, "bold");
    const longestName = filteredTransactions.reduce((max, t) => {
      const name = t.name || "—";
      return doc.getTextWidth(name) > doc.getTextWidth(max) ? name : max;
    }, "Member Name");
    const nameTextWidth = doc.getTextWidth(longestName) + 6; // add padding
    // Other columns: #, StartDate, EndDate, BookValue, Status, Action
    const otherColWidths = [8, 22, 22, 26, 20, 22]; // compact sizing
    const otherTotal = otherColWidths.reduce((s, w) => s + w, 0); // = 120
    const maxNameWidth = contentWidth - otherTotal; // all remaining space
    const minNameWidth = 42;
    const finalNameWidth = Math.max(Math.min(nameTextWidth, maxNameWidth), minNameWidth);
    // If name col doesn't use all available space, distribute extra to other cols
    const extraSpace = maxNameWidth - finalNameWidth;
    const widths = [
      otherColWidths[0],                                          // #
      finalNameWidth,                                             // Member Name
      otherColWidths[1] + extraSpace * (otherColWidths[1] / otherTotal), // Start Date
      otherColWidths[2] + extraSpace * (otherColWidths[2] / otherTotal), // End Date
      otherColWidths[3] + extraSpace * (otherColWidths[3] / otherTotal), // Book Value
      otherColWidths[4] + extraSpace * (otherColWidths[4] / otherTotal), // Status
      otherColWidths[5] + extraSpace * (otherColWidths[5] / otherTotal), // Action
    ];
    let x = margin;

    // Header row
    const headerHeight = 15;
    doc.setFillColor(...BRAND.gold);
    doc.rect(margin, y, contentWidth, headerHeight, "F");
    
    doc.setFontSize(8);
    doc.setFont(undefined, "bold");
    doc.setTextColor(255, 255, 255);
    
    headers.forEach((h, i) => {
      doc.text(h, x + widths[i] / 2, y + headerHeight / 2 + 2, { align: "center" });
      x += widths[i];
    });
    
    y += headerHeight + 2;
    doc.setFont(undefined, "normal");
    doc.setTextColor(...BRAND.charcoal);
    
    // Table rows with dynamic height based on changes
    const baseRowHeight = 9;
    filteredTransactions.forEach((t, i) => {
      const action = t.action || "Updated";
      const hasChanges = (action === "Updated" || action === "Reactivated") && t.changes && t.changes !== "No changes";
      // Split long changes string into lines of ~3 items each
      const changeLines = hasChanges
        ? t.changes.split(", ").reduce((lines, item, idx) => {
            if (idx % 2 === 0) lines.push([]);
            lines[lines.length - 1].push(item);
            return lines;
          }, []).map(g => g.join(", "))
        : [];
      const extraHeight = changeLines.length > 0 ? changeLines.length * 4.5 : 0;
      const rowHeight = baseRowHeight + extraHeight;

      if (y > pageHeight - 45) {
        addNewPage();
      }
      
      // Alternating row colors
      if (i % 2 === 0) {
        doc.setFillColor(250, 248, 244);
        doc.rect(margin, y - 6, contentWidth, rowHeight, "F");
      }
      
      // Row border
      doc.setDrawColor(240, 230, 210);
      doc.setLineWidth(0.1);
      doc.line(margin, y + rowHeight - 6, pageWidth - margin, y + rowHeight - 6);
      
      x = margin;
      doc.setFontSize(8);

      const midY = y + extraHeight / 2;
      
      // Row number
      doc.setTextColor(...BRAND.gray);
      doc.text(String(i + 1), x + widths[0] / 2, midY, { align: "center" });
      x += widths[0];
      
      // Member name - auto-fitted column
      doc.setFont(undefined, "bold");
      doc.setTextColor(...BRAND.charcoal);
      const name = t.name || "—";
      // Truncate only if text still exceeds the column width
      const nameMaxW = widths[1] - 4;
      let displayName = name;
      if (doc.getTextWidth(name) > nameMaxW) {
        while (doc.getTextWidth(displayName + "...") > nameMaxW && displayName.length > 0) {
          displayName = displayName.slice(0, -1);
        }
        displayName += "...";
      }
      doc.text(displayName, x + 2, midY);
      x += widths[1];
      
      // Start Date
      doc.setFont(undefined, "normal");
      doc.text(t.startDate || "—", x + widths[2] / 2, midY, { align: "center" });
      x += widths[2];
      
      // End Date
      doc.text(t.endDate || "—", x + widths[3] / 2, midY, { align: "center" });
      x += widths[3];
      
      // Lifetime Book Value with better formatting
      doc.setFont(undefined, "bold");
      doc.setTextColor(46, 125, 50);
      const bookValueText = "P" + parseFloat(t.bookValue || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      doc.text(bookValueText, x + widths[4] - 2, midY, { align: "right" });
      x += widths[4];
      
      // Status badge with improved styling
      const isActive = t.status === "Active";
      const isDeleted = t.status === "Deleted";
      
      if (isActive) {
        doc.setFillColor(232, 245, 233);
        doc.setTextColor(46, 125, 50);
      } else if (isDeleted) {
        doc.setFillColor(250, 235, 235);
        doc.setTextColor(180, 40, 40);
      } else {
        doc.setFillColor(255, 235, 238);
        doc.setTextColor(198, 40, 40);
      }
      
      doc.roundedRect(x + 2, midY - 3.5, widths[5] - 4, 5.5, 1, 1, "F");
      doc.setFontSize(7);
      doc.setFont(undefined, "bold");
      doc.text(t.status || "—", x + widths[5] / 2, midY - 0.3, { align: "center" });
      x += widths[5];
      
      // Action + changes detail
      doc.setFontSize(8);
      doc.setFont(undefined, "bold");
      doc.setTextColor(...BRAND.charcoal);
      const actionLabelY = hasChanges ? y : midY;
      doc.text(action, x + widths[6] / 2, actionLabelY, { align: "center" });
      if (hasChanges && changeLines.length > 0) {
        doc.setFont(undefined, "normal");
        doc.setFontSize(6);
        doc.setTextColor(...BRAND.darkGold);
        changeLines.forEach((line, li) => {
          doc.text(line, x + widths[6] / 2, actionLabelY + 4 + li * 4.5, { align: "center" });
        });
      }
      
      y += rowHeight;
    });
    
    // Table bottom border
    doc.setDrawColor(...BRAND.gold);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);

    // Table totals row
    y += 2;
    if (y > pageHeight - 50) {
      addNewPage();
    }
    doc.setFillColor(250, 248, 244);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "F");
    doc.setDrawColor(...BRAND.gold);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "S");

    doc.setFontSize(8);
    doc.setFont(undefined, "bold");
    doc.setTextColor(...BRAND.charcoal);

    const filteredMemberNames = [...new Set(filteredTransactions.map(t => t.name))];
    const filteredBookTotal = filteredMemberNames.reduce((sum, name) => {
      const member = members.find(m => m.name === name);
      return sum + (member ? (parseFloat(member.bookValue) || 0) : 0);
    }, 0);
    const filteredBookFormatted = filteredBookTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    doc.text(`Total Transactions: ${filteredTransactions.length}`, margin + 6, y + 9);
    doc.text(`Total Members: ${hasActiveFilters ? filteredMemberNames.length : members.length}`, margin + 60, y + 9);
    doc.setTextColor(...BRAND.darkGold);
    doc.text("Total Lifetime Book Value: P" + filteredBookFormatted, margin + contentWidth - 6, y + 9, { align: "right" });

    addFooter(doc, pageWidth, pageHeight, margin);
    doc.save("hello_club_transaction_history.pdf");
  };

  const addFooter = (doc, w, h, m) => {
    const footerY = h - 35;
    
    // Footer separator
    doc.setDrawColor(...BRAND.gold);
    doc.setLineWidth(0.5);
    doc.line(m, footerY, w - m, footerY);
    
    // Bottom bar
    doc.setFillColor(...BRAND.charcoal);
    doc.rect(0, h - 8, w, 8, "F");
    
    doc.setFontSize(7);
    doc.setFont(undefined, "normal");
    doc.setTextColor(255, 255, 255);
    doc.text(
      `Hello Club Membership System  |  Page ${doc.internal.getNumberOfPages()}  |  Generated: ${new Date().toLocaleString()}`,
      w / 2,
      h - 3,
      { align: "center" }
    );
  };

  if (!isOpen) return null;

  return (
    <>
    <style>{`
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUpFadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes rowFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes rowSlideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes countPulse { 0% { opacity: 0.5; transform: scale(0.97); } 100% { opacity: 1; transform: scale(1); } }
      .tx-row { animation: rowFadeIn 0.3s ease-out both; }
      .tx-row:hover { background-color: #f5f0e4 !important; transition: background-color 0.2s ease; }
      .tx-empty { animation: rowSlideIn 0.4s ease-out both; }
      .tx-count { animation: countPulse 0.3s ease-out both; }
      .tx-tfoot { animation: rowFadeIn 0.35s ease-out 0.1s both; }
    `}</style>
    <div className="transaction-modal-overlay" style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999,
      animation: "fadeIn 0.3s ease-out"
    }} onClick={onClose}>
      <div className="transaction-modal-content" style={{
        background: "#fff",
        borderRadius: 12,
        padding: "clamp(16px, 4vw, 40px)",
        maxWidth: 1000,
        width: "95%",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,.3)",
        animation: "slideUpFadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30, flexWrap: "wrap", gap: 12 }}>
          <h2 style={{ color: "#2C2C2C", margin: 0, fontSize: "clamp(18px, 4vw, 24px)" }}>Transaction History</h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={onClose}
              style={{
                background: "#fff",
                color: "#2c2c2c",
                padding: "12px 24px",
                border: "2px solid #e8dcc8",
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.3s ease",
                fontSize: 14
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = "#d4af37";
                e.target.style.color = "#d4af37";
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = "#e8dcc8";
                e.target.style.color = "#2c2c2c";
              }}
            >
              ✕ Close
            </button>
            <button
              onClick={generatePDF}
            style={{
              background: "#D4AF37",
              color: "#fff",
              padding: "12px 24px",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)"
            }}
            onMouseEnter={(e) => { 
              e.target.style.background = "#B8860B"; 
              e.target.style.transform = "translateY(-2px)"; 
              e.target.style.boxShadow = "0 6px 16px rgba(212, 175, 55, 0.4)";
            }}
            onMouseLeave={(e) => { 
              e.target.style.background = "#D4AF37"; 
              e.target.style.transform = "translateY(0)"; 
              e.target.style.boxShadow = "0 4px 12px rgba(212, 175, 55, 0.3)";
            }}
            onMouseDown={(e) => { 
              e.target.style.transform = "translateY(0) scale(0.98)"; 
            }}
            onMouseUp={(e) => { 
              e.target.style.transform = "translateY(-2px) scale(1)"; 
            }}
          >
            📄 Export to PDF
          </button>
          </div>
        </div>

        {/* Filter Section */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 24,
          padding: 20,
          backgroundColor: "#faf8f4",
          borderRadius: 10,
          border: "1px solid #f0e6d2"
        }}>
          {/* Search by Name */}
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#666", textTransform: "uppercase" }}>Search Name</label>
            <input
              type="text"
              placeholder="Search member..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 6,
                fontSize: 14,
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box"
              }}
              onFocus={(e) => e.target.style.borderColor = "#D4AF37"}
              onBlur={(e) => e.target.style.borderColor = "#ddd"}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#666", textTransform: "uppercase" }}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 6,
                fontSize: 14,
                outline: "none",
                backgroundColor: "#fff",
                cursor: "pointer",
                boxSizing: "border-box"
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          {/* Action Filter */}
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#666", textTransform: "uppercase" }}>Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 6,
                fontSize: 14,
                outline: "none",
                backgroundColor: "#fff",
                cursor: "pointer",
                boxSizing: "border-box"
              }}
            >
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action === "All" ? "All Actions" : action}</option>
              ))}
            </select>
          </div>

          {/* Start Date Filter */}
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#666", textTransform: "uppercase" }}>From Date</label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 6,
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* End Date Filter */}
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 12, fontWeight: 600, color: "#666", textTransform: "uppercase" }}>To Date</label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 6,
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>

          {/* Clear Filters Button */}
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #D4AF37",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                backgroundColor: hasActiveFilters ? "#fff" : "#f5f5f5",
                color: hasActiveFilters ? "#D4AF37" : "#999",
                cursor: hasActiveFilters ? "pointer" : "not-allowed",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => hasActiveFilters && (e.target.style.backgroundColor = "#D4AF37", e.target.style.color = "#fff")}
              onMouseLeave={(e) => hasActiveFilters && (e.target.style.backgroundColor = "#fff", e.target.style.color = "#D4AF37")}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results count */}
        {hasActiveFilters && (
          <div className="tx-count" key={`count-${filteredTransactions.length}`} style={{ marginBottom: 16, fontSize: 14, color: "#666" }}>
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
        )}

        {transactions.length === 0 ? (
          <div className="tx-empty" style={{ textAlign: "center", padding: "40px", color: "#999" }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>📭</div>
            <p>No transactions yet.</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="tx-empty" style={{ textAlign: "center", padding: "40px", color: "#999" }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🔍</div>
            <p>No transactions match your filters.</p>
            <button
              onClick={clearFilters}
              style={{
                marginTop: 16,
                padding: "10px 20px",
                border: "none",
                borderRadius: 6,
                backgroundColor: "#D4AF37",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto", borderRadius: 10, boxShadow: "0 4px 12px rgba(184,134,11,0.06)" }}>
            <table style={{
              width: "100%",
              minWidth: 850,
              borderCollapse: "collapse",
              backgroundColor: "#fff",
              tableLayout: "fixed"
            }}>
              <thead style={{ backgroundColor: "#D4AF37", color: "#fff" }}>
                <tr>
                  <th style={{ padding: "16px 8px", textAlign: "center", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", width: "6%" }}>#</th>
                  <th style={{ padding: "16px 12px", textAlign: "center", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", width: "24%" }}>Member Name</th>
                  <th style={{ padding: "16px 12px", textAlign: "center", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", width: "15%" }}>Start Date</th>
                  <th style={{ padding: "16px 12px", textAlign: "center", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", width: "15%" }}>End Date</th>
                  <th style={{ padding: "16px 12px", textAlign: "center", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", width: "16%" }}>Lifetime Book Value</th>
                  <th style={{ padding: "16px 12px", textAlign: "center", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", width: "12%" }}>Status</th>
                  <th style={{ padding: "16px 12px", textAlign: "center", fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", width: "12%" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t, idx) => (
                  <tr key={`${t.name}-${idx}`} className="tx-row" style={{ 
                    borderBottom: "1px solid #f0e6d2",
                    backgroundColor: idx % 2 === 0 ? "#fff" : "#faf8f4",
                    animationDelay: `${idx * 0.03}s`
                  }}>
                    <td style={{ padding: "12px 8px", borderBottom: "1px solid #f0e6d2", color: "#888", fontSize: 14, textAlign: "center", fontWeight: 500 }}>{idx + 1}</td>
                    <td style={{ padding: "12px 10px", borderBottom: "1px solid #f0e6d2", color: "#2c2c2c", fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name || "—"}</td>
                    <td style={{ padding: "12px 10px", borderBottom: "1px solid #f0e6d2", color: "#2c2c2c", fontSize: 14, textAlign: "center", whiteSpace: "nowrap" }}>{t.startDate || "—"}</td>
                    <td style={{ padding: "12px 10px", borderBottom: "1px solid #f0e6d2", color: "#2c2c2c", fontSize: 14, textAlign: "center", whiteSpace: "nowrap" }}>{t.endDate || "—"}</td>
                    <td style={{ padding: "12px 10px", borderBottom: "1px solid #f0e6d2", color: "#2e7d32", fontSize: 14, fontWeight: 600, textAlign: "right", whiteSpace: "nowrap" }}>₱{parseFloat(t.bookValue || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</td>
                    <td style={{ padding: "12px 10px", borderBottom: "1px solid #f0e6d2", color: "#2c2c2c", fontSize: 14, textAlign: "center" }}>
                      <span style={{
                        padding: "5px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                        backgroundColor: t.status === "Expired" ? "#ffebee" : t.status === "Deleted" ? "#fce4ec" : "#e8f5e9",
                        color: t.status === "Expired" ? "#c62828" : t.status === "Deleted" ? "#880e4f" : "#2e7d32",
                        display: "inline-block",
                        whiteSpace: "nowrap"
                      }}>
                        {t.status || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 10px", borderBottom: "1px solid #f0e6d2", color: "#2c2c2c", fontSize: 14, textAlign: "center" }}>
                      <div style={{ fontWeight: 600 }}>{t.action || "Updated"}</div>
                      {(t.action === "Updated" || t.action === "Reactivated") && t.changes && t.changes !== "No changes" && (
                        <div style={{ fontSize: 11, color: "#B8860B", marginTop: 3, whiteSpace: "normal", lineHeight: 1.4 }}>{t.changes}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="tx-tfoot">
                <tr style={{ backgroundColor: "#faf8f4", borderTop: "2px solid #D4AF37" }}>
                  <td colSpan={2} style={{ padding: "14px 12px", fontSize: 13, fontWeight: 700, color: "#2c2c2c" }}>
                    Total Transactions: {filteredTransactions.length}
                  </td>
                  <td colSpan={2} style={{ padding: "14px 12px", fontSize: 13, fontWeight: 700, color: "#2c2c2c", textAlign: "center" }}>
                    Total Members: {hasActiveFilters ? [...new Set(filteredTransactions.map(t => t.name))].length : members.length}
                  </td>
                  <td style={{ padding: "14px 12px", fontSize: 13, fontWeight: 700, color: "#B8860B", textAlign: "right", whiteSpace: "nowrap" }}>
                    ₱{(() => {
                      const names = [...new Set(filteredTransactions.map(t => t.name))];
                      return names.reduce((sum, name) => {
                        const member = members.find(m => m.name === name);
                        return sum + (member ? (parseFloat(member.bookValue) || 0) : 0);
                      }, 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    })()}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default TransactionHistory;
