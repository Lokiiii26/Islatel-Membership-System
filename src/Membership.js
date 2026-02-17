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

function Membership() {
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
    totalBookValue: members.reduce((sum, m) => sum + (parseFloat(m.bookValue) || 0), 0).toFixed(2)
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

        // Add transaction record to Firebase
        const newTransaction = {
          name: memberData.name,
          startDate: memberData.startDate,
          endDate: memberData.endDate,
          bookValue: memberData.bookValue,
          status: getMemberStatus(memberData),
          timestamp: new Date().toLocaleString(),
          action: reactivateMode ? "Reactivated" : "Updated"
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
              <span className="nav-item-icon">📊</span>
              <span>Dashboard</span>
            </div>
            <div className="nav-item" onClick={() => { handleOpenAddModal(); setSidebarCollapsed(false); }}>
              <span className="nav-item-icon">➕</span>
              <span>Add Member</span>
            </div>
            <div className="nav-item" onClick={() => { setTransactionHistoryOpen(true); setSidebarCollapsed(false); }}>
              <span className="nav-item-icon">📋</span>
              <span>Transactions</span>
              {transactions.length > 0 && (
                <span className="nav-item-badge">{transactions.length}</span>
              )}
            </div>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Quick Stats</div>
            <div className="nav-item">
              <span className="nav-item-icon">✅</span>
              <span>Active</span>
              <span className="nav-item-badge">{metrics.active}</span>
            </div>
            <div className="nav-item">
              <span className="nav-item-icon">⏰</span>
              <span>Expired</span>
              <span className="nav-item-badge" style={{ backgroundColor: metrics.expired > 0 ? '#ff6b6b' : '#d4af37', color: metrics.expired > 0 ? '#fff' : '#1a1a1a' }}>{metrics.expired}</span>
            </div>
          </div>
        </nav>
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
            <button className="btn-secondary" onClick={() => setTransactionHistoryOpen(true)}>
              📄 Export Report
            </button>
            <button className="btn-primary" onClick={handleOpenAddModal}>
              + Add Member
            </button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="analytics-grid">
          <div className="analytics-card">
            <div className="analytics-card-header">
              <div className="analytics-card-icon blue">👥</div>
            </div>
            <div className="analytics-card-value">{metrics.total}</div>
            <div className="analytics-card-label">Total Members</div>
          </div>

          <div className="analytics-card">
            <div className="analytics-card-header">
              <div className="analytics-card-icon green">✅</div>
              {metrics.active > 0 && <span className="analytics-card-trend up">Active</span>}
            </div>
            <div className="analytics-card-value">{metrics.active}</div>
            <div className="analytics-card-label">Active Members</div>
          </div>

          <div className="analytics-card">
            <div className="analytics-card-header">
              <div className="analytics-card-icon orange">⏰</div>
              {metrics.expired > 0 && <span className="analytics-card-trend down">Needs Attention</span>}
            </div>
            <div className="analytics-card-value">{metrics.expired}</div>
            <div className="analytics-card-label">Expired Members</div>
          </div>

          <div className="analytics-card">
            <div className="analytics-card-header">
              <div className="analytics-card-icon gold">💰</div>
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

        {/* Members Table */}
        <div className="table-card">
          <div className="table-header">
            <div className="table-title">All Members ({filteredMembers.length})</div>
            <div className="search-box">
              <span>🔍</span>
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
              <div className="empty-state-icon">📭</div>
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
                      <td data-label="Book Value">₱{parseFloat(m.bookValue || 0).toFixed(2)}</td>
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
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        input:focus {
          border-color: #d4af37;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
          outline: none;
        }
      `}</style>
    </div>
  );
}

export default Membership;
