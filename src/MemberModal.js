import React from "react";

const MemberModal = ({ isOpen, member, onClose, onSave, isViewOnly = false, reactivateMode = false }) => {
  const [formData, setFormData] = React.useState({
    name: "",
    bookValue: "",
    startDate: "",
    endDate: "",
    birthDate: "",
    email: "",
    mobile: "",
    address: "",
    gender: "",
    isSenior: false,
    isPWD: false,
    idType: "",
    idNumber: "",
    ...member
  });

  const [errors, setErrors] = React.useState({});
  const [addAmount, setAddAmount] = React.useState("");

  const requiredFields = ["name", "startDate", "endDate", "email", "mobile"];

  const validateForm = () => {
    const newErrors = {};
    
    requiredFields.forEach((field) => {
      if (!formData[field] || formData[field].toString().trim() === "") {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Mobile validation
    if (formData.mobile && !/^\d{10,11}$/.test(formData.mobile.replace(/\D/g, ""))) {
      newErrors.mobile = "Please enter a valid mobile number (10-11 digits)";
    }

    // Date validation
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) <= new Date(formData.startDate)) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  React.useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || "",
        bookValue: member.bookValue || "",
        startDate: member.startDate || "",
        endDate: member.endDate || "",
        birthDate: member.birthDate || "",
        email: member.email || "",
        mobile: member.mobile || "",
        address: member.address || "",
        gender: member.gender || "",
        isSenior: member.isSenior || false,
        isPWD: member.isPWD || false,
        idType: member.idType || "",
        idNumber: member.idNumber || ""
      });
    } else {
      setFormData({
        name: "",
        bookValue: "0",
        startDate: "",
        endDate: "",
        birthDate: "",
        email: "",
        mobile: "",
        address: "",
        gender: "",
        isSenior: false,
        isPWD: false,
        idType: "",
        idNumber: ""
      });
    }
    setAddAmount("");
  }, [member, isOpen]);

  const handleAddBookValue = () => {
    const amount = parseFloat(addAmount);
    if (!amount || amount <= 0) return;
    const current = parseFloat(formData.bookValue) || 0;
    setFormData((prev) => ({
      ...prev,
      bookValue: (current + amount).toString()
    }));
    setAddAmount("");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSave(formData);
    setFormData({
      name: "",
      bookValue: "",
      startDate: "",
      endDate: "",
      birthDate: "",
      email: "",
      mobile: "",
      address: "",
      gender: "",
      isSenior: false,
      isPWD: false,
      idType: "",
      idNumber: ""
    });
    setErrors({});
  };

  if (!isOpen) return null;

  const modalStyles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      animation: "fadeIn 0.3s ease-in-out"
    },
    modal: {
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "clamp(20px, 4vw, 40px)",
      maxWidth: "600px",
      width: "95%",
      maxHeight: "90vh",
      overflowY: "auto",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
      animation: "slideUp 0.3s ease-in-out"
    },
    header: {
      marginBottom: "30px",
      borderBottom: "3px solid #d4af37",
      paddingBottom: "15px"
    },
    title: {
      fontSize: "clamp(20px, 4vw, 28px)",
      fontWeight: "700",
      color: "#2c2c2c",
      margin: 0
    },
    formGroup: {
      marginBottom: "20px"
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: "600",
      color: "#2c2c2c",
      marginBottom: "8px",
      textTransform: "uppercase",
      letterSpacing: "0.3px"
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      fontSize: "14px",
      border: "2px solid #e8dcc8",
      borderRadius: "8px",
      transition: "all 0.3s ease",
      fontFamily: "inherit",
      backgroundColor: "white",
      color: "#2c2c2c",
      boxSizing: "border-box"
    },
    inputError: {
      borderColor: "#c62828",
      boxShadow: "0 0 0 3px rgba(198, 40, 40, 0.1)"
    },
    errorText: {
      color: "#c62828",
      fontSize: "12px",
      marginTop: "4px",
      fontWeight: "500"
    },
    inputDisabled: {
      backgroundColor: "#f5f5f5",
      cursor: "not-allowed",
      color: "#999"
    },
    buttonContainer: {
      display: "flex",
      gap: "12px",
      marginTop: "30px",
      justifyContent: "flex-end"
    },
    button: {
      padding: "12px 24px",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.3s ease",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    },
    primaryButton: {
      backgroundColor: "#d4af37",
      color: "white",
      boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)"
    },
    secondaryButton: {
      backgroundColor: "#e8dcc8",
      color: "#2c2c2c",
      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)"
    },
    dateGroup: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "15px"
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={modalStyles.header}>
          <h2 style={modalStyles.title}>
            {isViewOnly ? "Member Details" : reactivateMode ? "Reactivate Member" : member ? "Edit Member" : "Add New Member"}
          </h2>
        </div>

        {isViewOnly ? (
          /* ── Document-style View ── */
          <div>
            {/* Member Name Banner */}
            <div style={{
              textAlign: "center",
              padding: "20px 0 16px",
              borderBottom: "2px solid #e8dcc8",
              marginBottom: 24
            }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#2c2c2c", letterSpacing: "0.5px" }}>
                {formData.name || "—"}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 8 }}>
                {formData.isSenior && (
                  <span style={{ padding: "3px 12px", borderRadius: 20, backgroundColor: "#fff3e0", color: "#e65100", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Senior</span>
                )}
                {formData.isPWD && (
                  <span style={{ padding: "3px 12px", borderRadius: 20, backgroundColor: "#e8eaf6", color: "#283593", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>PWD</span>
                )}
              </div>
            </div>

            {/* Book Value Highlight */}
            <div style={{
              backgroundColor: "#f1f8e9",
              border: "1px solid #c5e1a5",
              borderRadius: 10,
              padding: "16px 20px",
              textAlign: "center",
              marginBottom: 24
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#558b2f", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Lifetime Book Value</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#2e7d32" }}>₱{parseFloat(formData.bookValue || 0).toFixed(2)}</div>
            </div>

            {/* Personal Information Section */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#d4af37", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid #f5f0e5" }}>Personal Information</div>
              <div className="member-modal-view-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>Gender</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#2c2c2c" }}>{formData.gender || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>Birth Date</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#2c2c2c" }}>{formData.birthDate ? new Date(formData.birthDate + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}</div>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#d4af37", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid #f5f0e5" }}>Contact Information</div>
              <div className="member-modal-view-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>Email</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#2c2c2c", wordBreak: "break-all" }}>{formData.email || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>Mobile</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#2c2c2c" }}>{formData.mobile || "—"}</div>
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>Address</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: "#2c2c2c" }}>{formData.address || "—"}</div>
              </div>
            </div>

            {/* Identification Section */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#d4af37", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid #f5f0e5" }}>Proof of Identity</div>
              <div className="member-modal-view-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>ID Type</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#2c2c2c" }}>{formData.idType || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>ID Number</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#2c2c2c" }}>{formData.idNumber || "—"}</div>
                </div>
              </div>
            </div>

            {/* Membership Period Section */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#d4af37", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid #f5f0e5" }}>Membership Period</div>
              <div className="member-modal-view-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>Start Date</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#2c2c2c" }}>{formData.startDate ? new Date(formData.startDate + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>End Date</div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#2c2c2c" }}>{formData.endDate ? new Date(formData.endDate + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}</div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div style={modalStyles.buttonContainer}>
              <button
                type="button"
                style={{ ...modalStyles.button, width: "100%" }}
                onClick={onClose}
                onMouseEnter={(e) => { e.target.style.backgroundColor = "#d4c4a8"; }}
                onMouseLeave={(e) => { e.target.style.backgroundColor = "#e8dcc8"; }}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* ── Edit/Add Form ── */
          <form onSubmit={handleSubmit}>
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>
              Member Name {requiredFields.includes("name") && <span style={{ color: "#c62828" }}>*</span>}
            </label>
            <input
              style={{
                ...modalStyles.input,
                ...(errors.name && modalStyles.inputError)
              }}
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter member name"
              onFocus={(e) => {
                e.target.style.borderColor = "#d4af37";
                e.target.style.boxShadow = "0 0 0 3px rgba(212, 175, 55, 0.1)";
              }}
              onBlur={(e) => {
                if (!errors.name) {
                  e.target.style.borderColor = "#e8dcc8";
                  e.target.style.boxShadow = "none";
                }
              }}
            />
            {errors.name && <div style={modalStyles.errorText}>{errors.name}</div>}
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>
              Lifetime Book Value
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                style={{
                  ...modalStyles.input,
                  ...modalStyles.inputDisabled,
                  flex: 1,
                  fontWeight: 700,
                  fontSize: 16,
                  color: "#2e7d32"
                }}
                type="text"
                value={`₱${parseFloat(formData.bookValue || 0).toFixed(2)}`}
                disabled
                readOnly
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <input
                style={{
                  ...modalStyles.input,
                  flex: 1
                }}
                type="number"
                min="0"
                step="0.01"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="Amount to add"
                onFocus={(e) => {
                  e.target.style.borderColor = "#d4af37";
                  e.target.style.boxShadow = "0 0 0 3px rgba(212, 175, 55, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#e8dcc8";
                  e.target.style.boxShadow = "none";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddBookValue();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddBookValue}
                style={{
                  padding: "10px 18px",
                  backgroundColor: "#2e7d32",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 13,
                  whiteSpace: "nowrap"
                }}
              >
                + Add
              </button>
            </div>
          </div>
 
          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Birth Date</label>
            <input
              style={modalStyles.input}
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>
              Email Address {requiredFields.includes("email") && <span style={{ color: "#c62828" }}>*</span>}
            </label>
            <input
              style={{
                ...modalStyles.input,
                ...(errors.email && modalStyles.inputError)
              }}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
            />
            {errors.email && <div style={modalStyles.errorText}>{errors.email}</div>}
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>
              Mobile Number {requiredFields.includes("mobile") && <span style={{ color: "#c62828" }}>*</span>}
            </label>
            <input
              style={{
                ...modalStyles.input,
                ...(errors.mobile && modalStyles.inputError)
              }}
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="09XXXXXXXXX"
            />
            {errors.mobile && <div style={modalStyles.errorText}>{errors.mobile}</div>}
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Residential Address</label>
            <textarea
              style={{
                ...modalStyles.input,
                height: "80px",
                resize: "vertical"
              }}
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Street, City, Province"
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              style={modalStyles.input}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input type="checkbox" name="isSenior" checked={formData.isSenior} onChange={handleChange} /> Senior
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input type="checkbox" name="isPWD" checked={formData.isPWD} onChange={handleChange} /> PWD
            </label>
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Proof of Identity - Type</label>
            <input
              style={modalStyles.input}
              type="text"
              name="idType"
              value={formData.idType}
              onChange={handleChange}
              placeholder="e.g., Passport, Driver's License"
            />
          </div>

          <div style={modalStyles.formGroup}>
            <label style={modalStyles.label}>Proof of Identity - I.D. No</label>
            <input
              style={modalStyles.input}
              type="text"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleChange}
              placeholder="ID Number"
            />
          </div>

          <div style={modalStyles.dateGroup}>
            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>
                Start Date {requiredFields.includes("startDate") && <span style={{ color: "#c62828" }}>*</span>}
              </label>
              <input
                style={{
                  ...modalStyles.input,
                  ...(errors.startDate && modalStyles.inputError)
                }}
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                onFocus={(e) => {
                  e.target.style.borderColor = "#d4af37";
                  e.target.style.boxShadow = "0 0 0 3px rgba(212, 175, 55, 0.1)";
                }}
                onBlur={(e) => {
                  if (!errors.startDate) {
                    e.target.style.borderColor = "#e8dcc8";
                    e.target.style.boxShadow = "none";
                  }
                }}
              />
              {errors.startDate && <div style={modalStyles.errorText}>{errors.startDate}</div>}
              {reactivateMode && <small style={{ color: "#666", marginTop: "4px", display: "block" }}>New start date</small>}
            </div>

            <div style={modalStyles.formGroup}>
              <label style={modalStyles.label}>
                End Date {requiredFields.includes("endDate") && <span style={{ color: "#c62828" }}>*</span>}
              </label>
              <input
                style={{
                  ...modalStyles.input,
                  ...(errors.endDate && modalStyles.inputError)
                }}
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                onFocus={(e) => {
                  e.target.style.borderColor = "#d4af37";
                  e.target.style.boxShadow = "0 0 0 3px rgba(212, 175, 55, 0.1)";
                }}
                onBlur={(e) => {
                  if (!errors.endDate) {
                    e.target.style.borderColor = "#e8dcc8";
                    e.target.style.boxShadow = "none";
                  }
                }}
              />
              {errors.endDate && <div style={modalStyles.errorText}>{errors.endDate}</div>}
              {reactivateMode && <small style={{ color: "#666", marginTop: "4px", display: "block" }}>New end date</small>}
            </div>
          </div>

          <div style={modalStyles.buttonContainer}>
            <button
              type="button"
              style={modalStyles.button}
              onClick={onClose}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#d4c4a8";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#e8dcc8";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ ...modalStyles.button, ...modalStyles.primaryButton }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#b8860b";
                e.target.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#d4af37";
                e.target.style.transform = "none";
              }}
            >
              {reactivateMode ? "Reactivate" : member ? "Update" : "Add"} Member
            </button>
          </div>
        </form>
        )}

        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
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

          @media (max-width: 480px) {
            .member-modal-view-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default MemberModal;
