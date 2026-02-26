/**
 * CustomerSearch - Autocomplete + Thêm khách mới inline
 * 
 * Features:
 * - Gõ 1 ký tự → dropdown kết quả (từ SX + pos_registrations)
 * - Không tìm thấy → hiện option "Thêm khách mới"
 * - Form thêm khách inline trong dropdown
 * - Auto-detect: gõ số = SĐT, gõ chữ = Tên
 * 
 * Theme: Đỏ Tứ Quý Đường
 * API: Giữ nguyên chuẩn project - API_BASE = /api/pos
 */

import { useState, useEffect, useRef } from "react";
import { Search, User, Wallet, AlertCircle, X, Plus, Phone, Loader2, CheckCircle } from "lucide-react";

// QUAN TRỌNG: Giữ nguyên chuẩn API_BASE của project
const API_BASE = import.meta.env.VITE_API_URL || "/api/pos";

// Normalize phone: bỏ +84, 84 -> 0
const normalizePhone = (phone) => {
  if (!phone) return '';
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('84') && p.length >= 11) {
    p = '0' + p.slice(2);
  }
  return p;
};

// Check if query looks like a phone number (8+ digits)
const isPhoneNumber = (query) => {
  const digits = query.replace(/\D/g, '');
  return digits.length >= 8;
};

export default function CustomerSearch({
  onSelect,
  selectedCustomer,
  onClear,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  
  // State cho form thêm khách mới
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
        setShowAddForm(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search - 300ms delay
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query || query.length < 1) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("pos_token");
        // API V2 - merge SX + POS registrations
        const res = await fetch(
          `${API_BASE}/v2/customers/search/${encodeURIComponent(query)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        const customers = data.results || data || [];
        setResults(customers);
        setShowDropdown(true);
        setHighlightIndex(-1);
        setShowAddForm(false);
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown) return;

    const totalItems = results.length + 1; // +1 cho option "Thêm mới"

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < results.length) {
          handleSelect(results[highlightIndex]);
        } else if (highlightIndex === results.length) {
          handleShowAddForm();
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setShowAddForm(false);
        setHighlightIndex(-1);
        break;
    }
  };

  const handleSelect = (customer) => {
    setQuery("");
    setShowDropdown(false);
    setShowAddForm(false);
    setHighlightIndex(-1);
    onSelect(customer);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    setShowAddForm(false);
    onClear();
    inputRef.current?.focus();
  };

  // Hiện form thêm khách với data pre-filled
  const handleShowAddForm = () => {
    setShowAddForm(true);
    setAddError("");
    
    // Auto-detect: gõ số = SĐT, gõ chữ = Tên
    if (isPhoneNumber(query)) {
      setNewPhone(normalizePhone(query));
      setNewName("");
    } else {
      setNewPhone("");
      setNewName(query);
    }
  };

  // Submit tạo khách mới
  const handleAddCustomer = async () => {
    const phone = normalizePhone(newPhone);
    const name = newName.trim();

    if (!phone || phone.length < 10) {
      setAddError("SĐT phải có ít nhất 10 số");
      return;
    }
    if (!name) {
      setAddError("Vui lòng nhập tên khách hàng");
      return;
    }

    setAddLoading(true);
    setAddError("");

    try {
      const token = localStorage.getItem("pos_token");
      // Dùng API registrations có sẵn
      const res = await fetch(`${API_BASE}/registrations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone,
          name,
          notes: "Tạo nhanh từ POS - Bán hàng",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Không thể thêm khách hàng");
      }

      // Thành công - auto select khách vừa tạo
      const newCustomer = {
        phone: data.registration.phone,
        name: data.registration.name,
        balance: 0,
        total_debt: 0,
        source: "pos",
        is_pending: true,
        isNew: true,
      };

      handleSelect(newCustomer);
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  // Highlight text match
  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    try {
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
      const parts = String(text).split(regex);
      return parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} style={{ background: "#FEE2E2", color: "#991B1B", padding: 0, borderRadius: "2px" }}>
            {part}
          </mark>
        ) : (
          part
        )
      );
    } catch {
      return text;
    }
  };

  const formatPrice = (p) => (p || 0).toLocaleString() + "đ";

  // ═══════════════════════════════════════════════════════════════
  // RENDER: Đã chọn khách hàng
  // ═══════════════════════════════════════════════════════════════
  if (selectedCustomer) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.75rem 1rem",
          background: "linear-gradient(135deg, #FEF7ED 0%, #FEE2E2 100%)",
          borderRadius: "8px",
          border: "1px solid rgba(185, 28, 28, 0.2)",
        }}
      >
        <User size={20} style={{ color: "#B91C1C" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "600", color: "#991B1B", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            {selectedCustomer.name}
            {selectedCustomer.source === "sx" && (
              <span style={{
                fontSize: "0.65rem",
                background: "linear-gradient(135deg, #DBEAFE, #BFDBFE)",
                color: "#1d4ed8",
                padding: "2px 6px",
                borderRadius: "4px",
              }}>
                SX
              </span>
            )}
            {selectedCustomer.is_pending && (
              <span style={{
                fontSize: "0.65rem",
                background: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
                color: "#92400E",
                padding: "2px 6px",
                borderRadius: "4px",
              }}>
                Chờ duyệt
              </span>
            )}
            {selectedCustomer.isNew && (
              <span style={{
                fontSize: "0.65rem",
                background: "linear-gradient(135deg, #D1FAE5, #A7F3D0)",
                color: "#065F46",
                padding: "2px 6px",
                borderRadius: "4px",
              }}>
                Mới
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: "0.85rem",
              color: "#B91C1C",
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
              marginTop: "2px",
            }}
          >
            <span>📱 {selectedCustomer.phone}</span>
            {selectedCustomer.balance > 0 && (
              <span style={{ color: "#16a34a" }}>
                💰 Dư: {formatPrice(selectedCustomer.balance)}
              </span>
            )}
            {selectedCustomer.total_debt > 0 && (
              <span style={{ color: "#dc2626" }}>
                📕 Nợ: {formatPrice(selectedCustomer.total_debt)}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleClear}
          style={{
            background: "rgba(185, 28, 28, 0.1)",
            border: "none",
            cursor: "pointer",
            padding: "6px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Bỏ chọn khách hàng"
        >
          <X size={18} color="#B91C1C" />
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: Input search + Dropdown
  // ═══════════════════════════════════════════════════════════════
  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      {/* Search Input */}
      <div style={{ position: "relative" }}>
        <Search
          size={18}
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#DC2626",
            opacity: 0.6,
          }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 1 && setShowDropdown(true)}
          placeholder="Tìm khách hàng (tên hoặc SĐT)..."
          style={{
            width: "100%",
            padding: "0.75rem 1rem 0.75rem 2.5rem",
            border: "1px solid rgba(185, 28, 28, 0.2)",
            borderRadius: "8px",
            fontSize: "1rem",
            outline: "none",
            transition: "border-color 0.2s, box-shadow 0.2s",
            color: "#991B1B",
            background: "rgba(255, 255, 255, 0.8)",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#DC2626";
            e.target.style.boxShadow = "0 0 0 3px rgba(220, 38, 38, 0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "rgba(185, 28, 28, 0.2)";
            e.target.style.boxShadow = "none";
          }}
        />
        {loading && (
          <div style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#DC2626",
            fontSize: "0.85rem",
          }}>
            Đang tìm...
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(185, 28, 28, 0.15)",
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(185, 28, 28, 0.15)",
            zIndex: 100,
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          {/* Kết quả tìm kiếm */}
          {results.length > 0 && results.map((customer, index) => (
            <div
              key={customer.id || customer.phone || index}
              onClick={() => handleSelect(customer)}
              style={{
                padding: "0.75rem 1rem",
                cursor: "pointer",
                borderBottom: "1px solid rgba(185, 28, 28, 0.08)",
                background: highlightIndex === index ? "rgba(254, 226, 226, 0.5)" : "transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={() => setHighlightIndex(index)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <User size={16} color="#B91C1C" />
                <span style={{ fontWeight: "500", color: "#991B1B" }}>
                  {highlightMatch(customer.name, query)}
                </span>
                <span style={{ color: "#DC2626", fontSize: "0.9rem" }}>
                  - {highlightMatch(customer.phone, query)}
                </span>
                {customer.source === "sx" && (
                  <span style={{
                    fontSize: "0.65rem",
                    background: "linear-gradient(135deg, #DBEAFE, #BFDBFE)",
                    color: "#1d4ed8",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}>
                    SX
                  </span>
                )}
                {customer.is_pending && (
                  <span style={{
                    fontSize: "0.65rem",
                    background: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
                    color: "#b45309",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}>
                    Chờ duyệt
                  </span>
                )}
              </div>
              <div style={{
                display: "flex",
                gap: "1rem",
                marginTop: "4px",
                fontSize: "0.85rem",
                marginLeft: "24px",
              }}>
                {customer.balance > 0 ? (
                  <span style={{ color: "#16a34a", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Wallet size={14} />
                    Dư: {formatPrice(customer.balance)}
                  </span>
                ) : (
                  <span style={{ color: "#DC2626", opacity: 0.5 }}>💰 Dư: 0đ</span>
                )}
                {customer.total_debt > 0 ? (
                  <span style={{ color: "#dc2626", display: "flex", alignItems: "center", gap: "4px" }}>
                    <AlertCircle size={14} />
                    Nợ: {formatPrice(customer.total_debt)}
                  </span>
                ) : (
                  <span style={{ color: "#16a34a" }}>✓ Không nợ</span>
                )}
              </div>
            </div>
          ))}

          {/* Không tìm thấy */}
          {results.length === 0 && !loading && query.length >= 1 && !showAddForm && (
            <div style={{
              padding: "1rem",
              textAlign: "center",
              color: "#B91C1C",
              opacity: 0.8,
            }}>
              Không tìm thấy khách hàng "{query}"
            </div>
          )}

          {/* Option thêm khách mới */}
          {!showAddForm && (
            <div
              onClick={handleShowAddForm}
              style={{
                padding: "0.75rem 1rem",
                cursor: "pointer",
                background: highlightIndex === results.length ? "rgba(220, 38, 38, 0.1)" : "rgba(254, 247, 237, 0.5)",
                borderTop: results.length > 0 ? "1px solid rgba(185, 28, 28, 0.15)" : "none",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                color: "#B91C1C",
                fontWeight: "500",
                transition: "background 0.15s",
              }}
              onMouseEnter={() => setHighlightIndex(results.length)}
            >
              <Plus size={18} />
              <span>Thêm khách mới{query ? `: "${query}"` : "..."}</span>
            </div>
          )}

          {/* Form thêm khách mới */}
          {showAddForm && (
            <div style={{
              padding: "1rem",
              background: "linear-gradient(135deg, #FEF7ED 0%, #FEE2E2 100%)",
              borderTop: results.length > 0 ? "1px solid rgba(185, 28, 28, 0.15)" : "none",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.75rem",
                color: "#991B1B",
                fontWeight: "600",
              }}>
                <Plus size={18} />
                Thêm khách hàng mới
              </div>

              {/* SĐT */}
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ 
                  display: "block", 
                  fontSize: "0.8rem", 
                  color: "#B91C1C", 
                  marginBottom: "0.25rem",
                  fontWeight: "500",
                }}>
                  Số điện thoại *
                </label>
                <div style={{ position: "relative" }}>
                  <Phone size={16} style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#DC2626",
                    opacity: 0.6,
                  }} />
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0901234567"
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem 0.6rem 2rem",
                      border: "1px solid rgba(185, 28, 28, 0.2)",
                      borderRadius: "6px",
                      fontSize: "0.9rem",
                      color: "#991B1B",
                      background: "white",
                      boxSizing: "border-box",
                    }}
                  />
                  {newPhone && normalizePhone(newPhone).length >= 10 && (
                    <CheckCircle size={16} style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#16a34a",
                    }} />
                  )}
                </div>
              </div>

              {/* Họ tên */}
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ 
                  display: "block", 
                  fontSize: "0.8rem", 
                  color: "#B91C1C", 
                  marginBottom: "0.25rem",
                  fontWeight: "500",
                }}>
                  Họ tên *
                </label>
                <div style={{ position: "relative" }}>
                  <User size={16} style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#DC2626",
                    opacity: 0.6,
                  }} />
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.75rem 0.6rem 2rem",
                      border: "1px solid rgba(185, 28, 28, 0.2)",
                      borderRadius: "6px",
                      fontSize: "0.9rem",
                      color: "#991B1B",
                      background: "white",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Error message */}
              {addError && (
                <div style={{
                  padding: "0.5rem 0.75rem",
                  background: "#FEE2E2",
                  borderRadius: "6px",
                  color: "#991B1B",
                  fontSize: "0.85rem",
                  marginBottom: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}>
                  <AlertCircle size={16} />
                  {addError}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowAddForm(false)}
                  style={{
                    padding: "0.5rem 1rem",
                    border: "1px solid rgba(185, 28, 28, 0.2)",
                    borderRadius: "6px",
                    background: "white",
                    color: "#B91C1C",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontFamily: "inherit",
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddCustomer}
                  disabled={addLoading}
                  style={{
                    padding: "0.5rem 1rem",
                    border: "none",
                    borderRadius: "6px",
                    background: addLoading ? "#D6D3D1" : "linear-gradient(135deg, #DC2626, #B91C1C)",
                    color: "white",
                    cursor: addLoading ? "not-allowed" : "pointer",
                    fontWeight: "500",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {addLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Đang thêm...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Thêm &amp; Chọn
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
