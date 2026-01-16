/**
 * CustomerSearch - Autocomplete component tìm kiếm khách hàng
 * Hiển thị: tên, SĐT, số dư, công nợ
 * SỬ DỤNG API V2 - merge data từ SX + POS
 */

import { useState, useEffect, useRef } from "react";
import { Search, User, Wallet, AlertCircle, X } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api/pos";

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
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
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
        // Sử dụng API V2 - merge SX + POS
        const res = await fetch(
          `${API_BASE}/v2/customers/search/${encodeURIComponent(query)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const data = await res.json();
        // API v2 trả về { results: [...] }
        const customers = data.results || data || [];
        setResults(customers);
        setShowDropdown(customers.length > 0);
        setHighlightIndex(-1);
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
    if (!showDropdown || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < results.length) {
          handleSelect(results[highlightIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setHighlightIndex(-1);
        break;
    }
  };

  const handleSelect = (customer) => {
    setQuery("");
    setShowDropdown(false);
    setHighlightIndex(-1);
    onSelect(customer);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    onClear();
    inputRef.current?.focus();
  };

  // Highlight matching text
  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    const regex = new RegExp(`(${query})`, "gi");
    const parts = String(text).split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} style={{ background: "#fef08a", padding: 0 }}>
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  const formatPrice = (p) => (p || 0).toLocaleString() + "đ";

  // Nếu đã chọn khách hàng, hiển thị thông tin
  if (selectedCustomer) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.75rem 1rem",
          background: "#f0fdf4",
          borderRadius: "8px",
          border: "1px solid #86efac",
        }}
      >
        <User size={20} style={{ color: "#16a34a" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: "600", color: "#166534" }}>
            {selectedCustomer.name}
          </div>
          <div
            style={{
              fontSize: "0.85rem",
              color: "#666",
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
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
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Bỏ chọn"
        >
          <X size={18} color="#666" />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      {/* Input search */}
      <div style={{ position: "relative" }}>
        <Search
          size={18}
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#9ca3af",
          }}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="Tìm khách hàng (nhập ít nhất 2 ký tự)..."
          style={{
            width: "100%",
            padding: "0.75rem 1rem 0.75rem 2.5rem",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "1rem",
            outline: "none",
            transition: "border-color 0.2s",
          }}
        />
        {loading && (
          <div
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af",
              fontSize: "0.85rem",
            }}
          >
            Đang tìm...
          </div>
        )}
      </div>

      {/* Dropdown results */}
      {showDropdown && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
            zIndex: 100,
            maxHeight: "320px",
            overflowY: "auto",
          }}
        >
          {results.map((customer, index) => (
            <div
              key={customer.id || customer.phone || index}
              onClick={() => handleSelect(customer)}
              style={{
                padding: "0.75rem 1rem",
                cursor: "pointer",
                borderBottom:
                  index < results.length - 1 ? "1px solid #f3f4f6" : "none",
                background: highlightIndex === index ? "#f3f4f6" : "white",
                transition: "background 0.15s",
              }}
              onMouseEnter={() => setHighlightIndex(index)}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <User size={16} color="#6b7280" />
                <span style={{ fontWeight: "500" }}>
                  {highlightMatch(customer.name, query)}
                </span>
                <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                  - {highlightMatch(customer.phone, query)}
                </span>
                {customer.source === "sx" && (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      background: "#dbeafe",
                      color: "#1d4ed8",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    SX
                  </span>
                )}
                {customer.is_pending && (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      background: "#fef3c7",
                      color: "#b45309",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    Chờ duyệt
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  marginTop: "4px",
                  fontSize: "0.85rem",
                  marginLeft: "24px",
                }}
              >
                {customer.balance > 0 ? (
                  <span
                    style={{
                      color: "#16a34a",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Wallet size={14} />
                    Dư: {formatPrice(customer.balance)}
                  </span>
                ) : (
                  <span style={{ color: "#9ca3af" }}>💰 Dư: 0đ</span>
                )}
                {customer.total_debt > 0 ? (
                  <span
                    style={{
                      color: "#dc2626",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <AlertCircle size={14} />
                    Nợ: {formatPrice(customer.total_debt)}
                  </span>
                ) : (
                  <span style={{ color: "#16a34a" }}>✓ Không nợ</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {showDropdown &&
        query.length >= 1 &&
        results.length === 0 &&
        !loading && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: "4px",
              padding: "1rem",
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              textAlign: "center",
              color: "#6b7280",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              zIndex: 100,
            }}
          >
            Không tìm thấy khách hàng "{query}"
          </div>
        )}
    </div>
  );
}
