import { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";
import MemberModal from "./MemberModal";
import TransactionHistory from "./TransactionHistory";
import "./Membership.css";

function Membership({ onLogout }) {
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [transactionHistoryOpen, setTransactionHistoryOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [reactivateMode, setReactivateMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const memberCollection = collection(db, "members");
  const transactionCollection = collection(db, "transactions");

  // Check if member is expired
  const isExpired = (dateString) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  // Get member status
  const getMemberStatus = (member) => {
    if (!member.endDate) return "Active";
    return isExpired(member.endDate) ? "Expired" : "Active";
  };

  // Calculate metrics
  const metrics = {
    total: members.length,
    active: members.filter((m) => getMemberStatus(m) === "Active").length,
    expired: members.filter((m) => getMemberStatus(m) === "Expired").length,
    totalBookValue: members.reduce((sum, m) => sum + (parseFloat(m.bookValue) || 0), 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  };

  // Filter members based on search
  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  

  // Fetch Members
  const getMembers = async () => {
    const data = await getDocs(memberCollection);
    setMembers(data.docs.map(doc => ({ ...doc.data(), id: doc.id })));
  };

  // Fetch Transactions
  const getTransactions = async () => {
    const data = await getDocs(transactionCollection);
    const transactionsList = data.docs.map(doc => doc.data()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setTransactions(transactionsList);
  };

  useEffect(() => {
    getMembers();
    getTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add or Update Member
  const handleSaveMember = async (formData) => {
    const memberData = {
      name: formData.name,
      bookValue: formData.bookValue,
      startDate: formData.startDate,
      endDate: formData.endDate,
      birthDate: formData.birthDate,
      email: formData.email,
      mobile: formData.mobile,
      address: formData.address,
      gender: formData.gender,
      isSenior: formData.isSenior,
      isPWD: formData.isPWD,
      idType: formData.idType,
      idNumber: formData.idNumber
    };

    try {
      if (editingMember) {
        // Update existing member (edit or reactivate)
        await updateDoc(doc(db, "members", editingMember.id), memberData);

        // Detect what changed between old and new values
        const changeLabels = {
          name: "Name",
          startDate: "Start Date",
          endDate: "End Date",
          bookValue: "Book Value",
          email: "Email",
          mobile: "Mobile",
          address: "Address",
          gender: "Gender",
          birthDate: "Birth Date",
          isSenior: "Senior",
          isPWD: "PWD",
          idType: "ID Type",
          idNumber: "ID Number"
        };
        const changedFields = Object.keys(changeLabels).filter(key => {
          const oldVal = String(editingMember[key] ?? "");
          const newVal = String(memberData[key] ?? "");
          return oldVal !== newVal;
        }).map(key => changeLabels[key]);
        const changesText = changedFields.length > 0 ? changedFields.join(", ") : "No changes";

        // Add transaction record to Firebase
        const newTransaction = {
          name: memberData.name,
          startDate: memberData.startDate,
          endDate: memberData.endDate,
          bookValue: memberData.bookValue,
          status: getMemberStatus(memberData),
          timestamp: new Date().toLocaleString(),
          action: reactivateMode ? "Reactivated" : "Updated",
          changes: changesText
        };
        await addDoc(transactionCollection, newTransaction);
        await getTransactions();

        setEditingMember(null);
        setReactivateMode(false);
      } else {
        // Add new member
        await addDoc(memberCollection, memberData);

        // Add transaction record to Firebase
        const newTransaction = {
          name: memberData.name,
          startDate: memberData.startDate,
          endDate: memberData.endDate,
          bookValue: memberData.bookValue,
          status: getMemberStatus(memberData),
          timestamp: new Date().toLocaleString(),
          action: "Added"
        };
        await addDoc(transactionCollection, newTransaction);
        await getTransactions();
      }

      setModalOpen(false);
      getMembers();
    } catch (error) {
      console.error("Error saving member:", error);
    }
  };

  // Delete Member
  const handleDeleteMember = async (memberId, memberName) => {
    if (window.confirm(`Are you sure you want to delete ${memberName}?`)) {
      try {
        await deleteDoc(doc(db, "members", memberId));

        // Add transaction record to Firebase
        const newTransaction = {
          name: memberName,
          startDate: "—",
          endDate: "—",
          bookValue: "—",
          status: "Deleted",
          timestamp: new Date().toLocaleString(),
          action: "Deleted"
        };
        await addDoc(transactionCollection, newTransaction);
        await getTransactions();

        getMembers();
      } catch (error) {
        console.error("Error deleting member:", error);
      }
    }
  };

  // View member details
  const handleViewMember = (member) => {
    setSelectedMember(member);
    setViewModalOpen(true);
  };

  // Edit member
  const handleEditMember = (member) => {
    setEditingMember(member);
    setModalOpen(true);
  };

  // Reactivate member (open modal pre-filled and set reactivateMode)
  const handleReactivate = (member) => {
    setEditingMember(member);
    setReactivateMode(true);
    setModalOpen(true);
  };

  // Download CSV
  const handleDownloadCSV = () => {
    const headers = ["Name", "Contact Number", "Email"];
    const rows = members.map((m) => [
      `"${(m.name || "").replace(/"/g, '""')}"`,
      `"${(m.mobile || "").replace(/"/g, '""')}"`,
      `"${(m.email || "").replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `members_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Open add member modal
  const handleOpenAddModal = () => {
    setEditingMember(null);
    setModalOpen(true);
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile Sidebar Overlay */}
      {sidebarCollapsed && (
        <div className="sidebar-overlay" onClick={() => setSidebarCollapsed(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <img src="/logo.png" alt="Logo" className="sidebar-logo" />
          <div className="sidebar-brand">
            <h2>Hello Club</h2>
            <span>Management</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Main Menu</div>
            <div className="nav-item active">
              <span className="nav-item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              </span>
              <span>Dashboard</span>
            </div>
            <div className="nav-item" onClick={() => { handleOpenAddModal(); setSidebarCollapsed(false); }}>
              <span className="nav-item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
              </span>
              <span>Add Member</span>
            </div>
            <div className="nav-item" onClick={() => { setTransactionHistoryOpen(true); setSidebarCollapsed(false); }}>
              <span className="nav-item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </span>
              <span>Transactions</span>
              {transactions.length > 0 && (
                <span className="nav-item-badge">{transactions.length}</span>
              )}
            </div>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Quick Stats</div>
            <div className="nav-item">
              <span className="nav-item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </span>
              <span>Active</span>
              <span className="nav-item-badge">{metrics.active}</span>
            </div>
            <div className="nav-item">
              <span className="nav-item-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </span>
              <span>Expired</span>
              <span className="nav-item-badge" style={{ backgroundColor: metrics.expired > 0 ? 'var(--danger)' : 'var(--gold-500)', color: '#fff' }}>{metrics.expired}</span>
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-footer-btn" onClick={() => { sessionStorage.removeItem('hcm_authenticated'); onLogout(); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 6, verticalAlign: 'middle'}}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        {/* Header */}
        <div className="main-header">
          <div className="main-header-left">
            <button 
              className="sidebar-toggle-btn" 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <span className="hamburger-icon">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
            <div>
              <h1>Membership Dashboard</h1>
              <p>Welcome back! Here's your membership overview.</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={handleDownloadCSV}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              CSV
            </button>
            <button className="btn-secondary" onClick={() => setTransactionHistoryOpen(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Report
            </button>
            <button className="btn-primary" onClick={handleOpenAddModal}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Member
            </button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="analytics-card-header">
              <div className="analytics-card-icon blue">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
              </div>
            </div>
            <div className="analytics-card-value">{metrics.total}</div>
            <div className="analytics-card-label">Total Members</div>
          </div>

          <div className="analytics-card">
            <div className="analytics-card-header">
              <div className="analytics-card-icon green">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              {metrics.active > 0 && <span className="analytics-card-trend up">Active</span>}
            </div>
            <div className="analytics-card-value">{metrics.active}</div>
            <div className="analytics-card-label">Active Members</div>
          </div>

          <div className="analytics-card">
            <div className="analytics-card-header">
              <div className="analytics-card-icon orange">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              {metrics.expired > 0 && <span className="analytics-card-trend down">Needs Attention</span>}
            </div>
            <div className="analytics-card-value">{metrics.expired}</div>
            <div className="analytics-card-label">Expired Members</div>
          </div>

          <div className="analytics-card">
            <div className="analytics-card-header">
              <div className="analytics-card-icon gold">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              </div>
            </div>
            <div className="analytics-card-value">₱{metrics.totalBookValue}</div>
            <div className="analytics-card-label">Total Lifetime Book Value</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-row">
          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-card-title">Membership Status Overview</div>
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-dot active"></span>
                  <span>Active</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot expired"></span>
                  <span>Expired</span>
                </div>
              </div>
            </div>
            <div className="bar-chart">
              <div className="bar-item">
                <div className="bar-value">{metrics.active}</div>
                <div className="bar active" style={{ height: `${Math.max((metrics.active / Math.max(metrics.total, 1)) * 150, 10)}px` }}></div>
                <div className="bar-label">Active</div>
              </div>
              <div className="bar-item">
                <div className="bar-value">{metrics.expired}</div>
                <div className="bar expired" style={{ height: `${Math.max((metrics.expired / Math.max(metrics.total, 1)) * 150, 10)}px` }}></div>
                <div className="bar-label">Expired</div>
              </div>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-card-header">
              <div className="chart-card-title">Distribution</div>
            </div>
            <div className="donut-chart-container">
              <div 
                className="donut-chart" 
                style={{
                  background: metrics.total > 0 
                    ? `conic-gradient(#4caf50 0deg ${(metrics.active / metrics.total) * 360}deg, #f44336 ${(metrics.active / metrics.total) * 360}deg 360deg)`
                    : '#e0e0e0'
                }}
              >
                <div className="donut-center">
                  <div className="donut-center-value">{metrics.total}</div>
                  <div className="donut-center-label">Total</div>
                </div>
              </div>
              <div className="donut-stats">
                <div className="donut-stat">
                  <div className="donut-stat-value green">{metrics.total > 0 ? ((metrics.active / metrics.total) * 100).toFixed(0) : 0}%</div>
                  <div className="donut-stat-label">Active Rate</div>
                </div>
                <div className="donut-stat">
                  <div className="donut-stat-value red">{metrics.total > 0 ? ((metrics.expired / metrics.total) * 100).toFixed(0) : 0}%</div>
                  <div className="donut-stat-label">Expired Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top 3 Highest Book Value */}
        <div className="top-members-card">
          <div className="top-members-header">
            <div className="top-members-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{verticalAlign:'middle', marginRight:8}}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
              Top 3 Highest Lifetime Book Value
            </div>
          </div>
          <div className="top-members-list">
            {[...members]
              .sort((a, b) => (parseFloat(b.bookValue) || 0) - (parseFloat(a.bookValue) || 0))
              .slice(0, 3)
              .map((m, index) => (
                <div className={`top-member-item rank-${index + 1}`} key={m.id}>
                  <div className="top-member-rank">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                  </div>
                  <div className="top-member-info">
                    <div className="top-member-name">{m.name}</div>
                    <div className="top-member-status">
                      <span className={`status-badge ${getMemberStatus(m).toLowerCase()}`}>{getMemberStatus(m)}</span>
                    </div>
                  </div>
                  <div className="top-member-value">₱{parseFloat(m.bookValue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              ))}
            {members.length === 0 && (
              <div className="top-members-empty">No members yet</div>
            )}
          </div>
        </div>

        {/* Members Table */}
        <div className="table-card">
          <div className="table-header">
            <div className="table-title">All Members ({filteredMembers.length})</div>
            <div className="search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--gray-400)', flexShrink:0}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {filteredMembers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color:'var(--gray-300)'}}><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>
              </div>
              <p>{searchQuery ? "No members match your search." : "No members yet. Add one to get started!"}</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Lifetime Book Value</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m) => {
                  const status = getMemberStatus(m);
                  return (
                    <tr key={m.id}>
                      <td className="member-name">
                        {m.name}
                        <button
                          className="mobile-card-close"
                          onClick={() => handleDeleteMember(m.id, m.name)}
                          title="Delete member"
                        >
                          ×
                        </button>
                      </td>
                      <td data-label="Start">{m.startDate || "—"}</td>
                      <td data-label="End">{m.endDate || "—"}</td>
                      <td data-label="Book Value">₱{parseFloat(m.bookValue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td data-label="Status">
                        <span className={`status-badge ${status === "Expired" ? "expired" : "active"}`}>
                          {status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="action-btn view" onClick={() => handleViewMember(m)}>View</button>
                          <button className="action-btn edit" onClick={() => handleEditMember(m)}>Edit</button>
                          <button className="action-btn delete" onClick={() => handleDeleteMember(m.id, m.name)}>Delete</button>
                          {status === "Expired" && (
                            <button className="action-btn reactivate" onClick={() => handleReactivate(m)}>Reactivate</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Member Modal */}
      <MemberModal
        isOpen={modalOpen}
        member={editingMember}
        onClose={() => {
          setModalOpen(false);
          setEditingMember(null);
          setReactivateMode(false);
        }}
        onSave={handleSaveMember}
        reactivateMode={reactivateMode}
        existingMembers={members}
      />

      {/* View Member Modal */}
      <MemberModal
        isOpen={viewModalOpen}
        member={selectedMember}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedMember(null);
        }}
        onSave={() => {}}
        isViewOnly={true}
      />

      {/* Transaction History Modal */}
      <TransactionHistory
        isOpen={transactionHistoryOpen}
        transactions={transactions}
        members={members}
        onClose={() => setTransactionHistoryOpen(false)}
      />

      {/* CSS Animations */}
      <style>{`
        input:focus {
          border-color: var(--gold-500);
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
          outline: none;
        }
      `}</style>
    </div>
  );
}

export default Membership;
