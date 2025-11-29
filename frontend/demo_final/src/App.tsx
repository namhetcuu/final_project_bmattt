import { useEffect, useState } from "react";

export default function App() {
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("upload");
  const [isLoading, setIsLoading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: form
      });
      const data = await res.json();
      setResult(data);
      fetchHistory();
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("http://localhost:5000/history");
      const data = await res.json();
      setHistory(data);
    } catch (error) {
      console.error("Fetch history error:", error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const stats = {
    total: history.length,
    spam: history.filter(e => e.label === "Spam").length,
    phishing: history.filter(e => e.label === "Phishing").length,
    hoax: history.filter(e => e.label === "Hoax").length,
    clean: history.filter(e => e.label === "Clean").length
  };

  const getLabelColor = (label) => {
    switch(label) {
      case "Spam": return "#ef4444";
      case "Phishing": return "#f59e0b";
      case "Hoax": return "#8b5cf6";
      case "Clean": return "#10b981";
      default: return "#6b7280";
    }
  };

  const getLabelIcon = (label) => {
    switch(label) {
      case "Spam": return "🚫";
      case "Phishing": return "🎣";
      case "Hoax": return "⚠️";
      case "Clean": return "✅";
      default: return "📧";
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh",
      minWidth: "100vw",
      backgroundColor: "#f8fafc",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Main Container */}
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "2rem 1.5rem"
      }}>
        
        {/* Header */}
        <header style={{
          textAlign: "center",
          marginBottom: "3rem",
          paddingBottom: "2rem",
          borderBottom: "1px solid #e2e8f0"
        }}>
          <div style={{
            width: "80px",
            height: "80px",
            backgroundColor: "#3b82f6",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)"
          }}>
            <span style={{ fontSize: "2rem", color: "white" }}>📧</span>
          </div>
          <h1 style={{
            color: "#1e293b",
            margin: "0 0 0.75rem 0",
            fontSize: "2.75rem",
            fontWeight: "800",
            background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            Email Security Analyzer
          </h1>
          <p style={{
            color: "#64748b",
            fontSize: "1.125rem",
            margin: 0,
            fontWeight: "500"
          }}>
            Bảo vệ bạn khỏi email độc hại với AI phân tích thông minh
          </p>
        </header>

        {/* Navigation Tabs */}
        <nav style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "3rem",
          backgroundColor: "white",
          padding: "0.75rem",
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          border: "1px solid #f1f5f9"
        }}>
          {[
            { id: "upload", label: "Upload Email", icon: "📤" },
            { id: "dashboard", label: "Dashboard", icon: "📊" },
            { id: "history", label: "Lịch sử", icon: "📋" }
          ].map((tabItem) => (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id)}
              style={{
                flex: 1,
                padding: "1rem 1.5rem",
                border: "none",
                borderRadius: "12px",
                backgroundColor: tab === tabItem.id ? "#3b82f6" : "transparent",
                color: tab === tabItem.id ? "white" : "#64748b",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                fontSize: "0.95rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem"
              }}
              onMouseOver={(e) => {
                if (tab !== tabItem.id) {
                  e.target.style.backgroundColor = "#f8fafc";
                  e.target.style.color = "#3b82f6";
                }
              }}
              onMouseOut={(e) => {
                if (tab !== tabItem.id) {
                  e.target.style.backgroundColor = "transparent";
                  e.target.style.color = "#64748b";
                }
              }}
            >
              <span>{tabItem.icon}</span>
              {tabItem.label}
            </button>
          ))}
        </nav>

        {/* UPLOAD TAB */}
        {tab === "upload" && (
          <div style={{
            backgroundColor: "white",
            padding: "2.5rem",
            borderRadius: "20px",
            boxShadow: "0 8px 40px rgba(0, 0, 0, 0.08)",
            border: "1px solid #f1f5f9"
          }}>
            {/* Upload Area */}
            <div style={{
              border: "2px dashed #cbd5e1",
              borderRadius: "16px",
              padding: "4rem 2rem",
              textAlign: "center",
              marginBottom: "2.5rem",
              backgroundColor: "#f8fafc",
              transition: "all 0.3s ease",
              cursor: "pointer",
              position: "relative"
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = "#3b82f6";
              e.currentTarget.style.backgroundColor = "#eff6ff";
            }}
            onDragLeave={(e) => {
              e.currentTarget.style.borderColor = "#cbd5e1";
              e.currentTarget.style.backgroundColor = "#f8fafc";
            }}
            >
              <input 
                type="file" 
                onChange={handleUpload}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: "pointer"
                }}
              />
              <div style={{
                width: "80px",
                height: "80px",
                backgroundColor: "#e2e8f0",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
                fontSize: "2rem"
              }}>
                {isLoading ? "⏳" : "📁"}
              </div>
              <h3 style={{
                color: "#1e293b",
                margin: "0 0 0.75rem 0",
                fontSize: "1.5rem",
                fontWeight: "700"
              }}>
                {isLoading ? "Đang phân tích..." : "Chọn file email"}
              </h3>
              <p style={{
                color: "#64748b",
                margin: "0 0 1rem 0",
                fontSize: "1rem"
              }}>
                Kéo thả file hoặc click để chọn
              </p>
              <div style={{
                display: "inline-block",
                padding: "0.75rem 1.5rem",
                backgroundColor: "#3b82f6",
                color: "white",
                borderRadius: "10px",
                fontWeight: "600",
                fontSize: "0.9rem"
              }}>
                Chọn file
              </div>
            </div>

            {/* Results */}
            {result && (
              <div style={{ marginTop: "2rem" }}>
                {/* Result Header */}
                <div style={{
                  padding: "2rem",
                  borderRadius: "16px",
                  backgroundColor: getLabelColor(result.label) + "10",
                  border: `2px solid ${getLabelColor(result.label)}`,
                  marginBottom: "2.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem"
                }}>
                  <div style={{
                    width: "60px",
                    height: "60px",
                    backgroundColor: getLabelColor(result.label),
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    color: "white"
                  }}>
                    {getLabelIcon(result.label)}
                  </div>
                  <div>
                    <h2 style={{
                      margin: "0 0 0.25rem 0",
                      color: getLabelColor(result.label),
                      fontSize: "1.75rem",
                      fontWeight: "700"
                    }}>
                      {result.label}
                    </h2>
                    <p style={{
                      margin: 0,
                      color: "#64748b",
                      fontWeight: "500"
                    }}>
                      Email đã được phân tích thành công
                    </p>
                  </div>
                </div>

                {/* Content Grid */}
                <div style={{ 
                  display: "grid", 
                  gap: "2rem",
                  gridTemplateColumns: "1fr 1fr",
                  alignItems: "start"
                }}>
                  
                  {/* Left Column */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    {/* Metadata */}
                    <section>
                      <h3 style={{
                        color: "#1e293b",
                        marginBottom: "1rem",
                        fontSize: "1.25rem",
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem"
                      }}>
                        <span>📄</span> Thông tin email
                      </h3>
                      <div style={{
                        backgroundColor: "#f8fafc",
                        padding: "1.5rem",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0"
                      }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                          <div>
                            <div style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.25rem" }}>
                              FROM
                            </div>
                            <div style={{ color: "#1e293b", fontWeight: "500" }}>
                              {result.headers.from}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.25rem" }}>
                              TO
                            </div>
                            <div style={{ color: "#1e293b", fontWeight: "500" }}>
                              {result.headers.to}
                            </div>
                          </div>
                          <div>
                            <div style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.25rem" }}>
                              SUBJECT
                            </div>
                            <div style={{ color: "#1e293b", fontWeight: "500" }}>
                              {result.headers.subject}
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Signs */}
                    <section>
                      <h3 style={{
                        color: "#1e293b",
                        marginBottom: "1rem",
                        fontSize: "1.25rem",
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem"
                      }}>
                        <span>🔍</span> Dấu hiệu nhận diện
                      </h3>
                      <div style={{
                        backgroundColor: "#f8fafc",
                        padding: "1.5rem",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        maxHeight: "300px",
                        overflowY: "auto"
                      }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          {result.signs.map((s, i) => (
                            <div key={i} style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "0.75rem",
                              padding: "0.75rem",
                              backgroundColor: "white",
                              borderRadius: "8px",
                              border: "1px solid #e2e8f0"
                            }}>
                              <div style={{
                                width: "20px",
                                height: "20px",
                                backgroundColor: "#3b82f6",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.75rem",
                                color: "white",
                                flexShrink: 0
                              }}>
                                {i + 1}
                              </div>
                              <div style={{ color: "#475569", fontSize: "0.9rem", lineHeight: "1.4" }}>
                                {s}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  </div>

                  {/* Right Column */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    {/* Warnings */}
                    {result.spoof_warnings.length > 0 && (
                      <section>
                        <h3 style={{
                          color: "#dc2626",
                          marginBottom: "1rem",
                          fontSize: "1.25rem",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem"
                        }}>
                          <span>🚨</span> Cảnh báo bảo mật
                        </h3>
                        <div style={{
                          backgroundColor: "#fef2f2",
                          padding: "1.5rem",
                          borderRadius: "12px",
                          border: "1px solid #fecaca"
                        }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {result.spoof_warnings.map((w, i) => (
                              <div key={i} style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "0.75rem",
                                padding: "1rem",
                                backgroundColor: "#fef2f2",
                                borderRadius: "8px",
                                border: "1px solid #fecaca"
                              }}>
                                <span style={{ color: "#dc2626", flexShrink: 0 }}>⚠️</span>
                                <div style={{ color: "#dc2626", fontSize: "0.9rem", lineHeight: "1.4" }}>
                                  {w}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Email Content */}
                    <section style={{ gridColumn: result.spoof_warnings.length > 0 ? "span 1" : "span 2" }}>
                      <h3 style={{
                        color: "#1e293b",
                        marginBottom: "1rem",
                        fontSize: "1.25rem",
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem"
                      }}>
                        <span>📝</span> Nội dung email
                      </h3>
                      <div
                        style={{
                          border: "1px solid #e2e8f0",
                          padding: "1.5rem",
                          background: "#f8fafc",
                          whiteSpace: "pre-wrap",
                          borderRadius: "12px",
                          maxHeight: "400px",
                          overflow: "auto",
                          fontSize: "0.875rem",
                          lineHeight: "1.6",
                          color: "#475569"
                        }}
                        dangerouslySetInnerHTML={{ __html: result.body }}
                      />
                    </section>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DASHBOARD TAB */}
        {tab === "dashboard" && (
          <div style={{
            backgroundColor: "white",
            padding: "2.5rem",
            borderRadius: "20px",
            boxShadow: "0 8px 40px rgba(0, 0, 0, 0.08)",
            border: "1px solid #f1f5f9"
          }}>
            <h2 style={{
              color: "#1e293b",
              marginBottom: "2rem",
              fontSize: "1.75rem",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem"
            }}>
              <span>📊</span> Dashboard thống kê
            </h2>

            {/* Stats Grid */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.5rem",
              marginBottom: "3rem"
            }}>
              {[
                { label: "Tổng email", value: stats.total, color: "#3b82f6", icon: "📨" },
                { label: "Spam", value: stats.spam, color: "#ef4444", icon: "🚫" },
                { label: "Phishing", value: stats.phishing, color: "#f59e0b", icon: "🎣" },
                { label: "Hoax", value: stats.hoax, color: "#8b5cf6", icon: "⚠️" },
                { label: "Clean", value: stats.clean, color: "#10b981", icon: "✅" }
              ].map((stat, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: "white",
                    padding: "2rem 1.5rem",
                    borderRadius: "16px",
                    border: `2px solid ${stat.color}20`,
                    textAlign: "center",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px)";
                    e.currentTarget.style.boxShadow = `0 12px 24px ${stat.color}20`;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.05)";
                  }}
                >
                  <div style={{ fontSize: "2.5rem", marginBottom: "1rem", opacity: 0.9 }}>
                    {stat.icon}
                  </div>
                  <div style={{ fontSize: "2.5rem", fontWeight: "800", color: stat.color, marginBottom: "0.5rem", lineHeight: "1" }}>
                    {stat.value}
                  </div>
                  <div style={{ color: "#64748b", fontWeight: "600", fontSize: "0.95rem" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Analytics */}
            <div style={{
              backgroundColor: "#f8fafc",
              padding: "2rem",
              borderRadius: "16px",
              border: "1px solid #e2e8f0"
            }}>
              <h3 style={{ color: "#1e293b", marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: "600" }}>
                Phân tích tổng quan
              </h3>
              <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                <div style={{ flex: "1", minWidth: "200px" }}>
                  <div style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Email an toàn</div>
                  <div style={{ color: "#10b981", fontSize: "1.5rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {stats.clean} <span style={{ fontSize: "1rem", color: "#64748b" }}>/ {stats.total}</span>
                  </div>
                </div>
                <div style={{ flex: "1", minWidth: "200px" }}>
                  <div style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Email nguy hiểm</div>
                  <div style={{ color: "#ef4444", fontSize: "1.5rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {stats.spam + stats.phishing + stats.hoax} <span style={{ fontSize: "1rem", color: "#64748b" }}>/ {stats.total}</span>
                  </div>
                </div>
              </div>

              {/* File đính kèm tổng quan */}
              {history.some(h => h.attachments && h.attachments.length > 0) && (
                <div style={{ marginTop: "2rem" }}>
                  <h3>📎 File đính kèm đã quét</h3>
                  <ul>
                    {history.map((entry, i) => (
                      entry.attachments.map((att, j) => (
                        <li key={`${i}-${j}`} style={{ marginBottom: "0.75rem" }}>
                          <b>{att.filename}</b> ({att.mime}, {att.size} bytes)
                          {att.warnings.length > 0 && (
                            <ul style={{ color: "red", marginTop: "0.25rem" }}>
                              {att.warnings.map((w, k) => <li key={k}>{w}</li>)}
                            </ul>
                          )}
                        </li>
                      ))
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}


        {/* HISTORY TAB */}
        {tab === "history" && (
          <div style={{
            backgroundColor: "white",
            padding: "2.5rem",
            borderRadius: "20px",
            boxShadow: "0 8px 40px rgba(0, 0, 0, 0.08)",
            border: "1px solid #f1f5f9"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "2rem"
            }}>
              <h2 style={{
                color: "#1e293b",
                fontSize: "1.75rem",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                margin: 0
              }}>
                <span>📋</span> Lịch sử phân tích
              </h2>
              <div style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#3b82f6",
                color: "white",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "0.875rem"
              }}>
                {history.length} emails
              </div>
            </div>

            {history.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "4rem 2rem",
                color: "#64748b"
              }}>
                <div style={{ 
                  fontSize: "4rem", 
                  marginBottom: "1.5rem",
                  opacity: 0.5
                }}>
                  📭
                </div>
                <h3 style={{
                  color: "#64748b",
                  margin: "0 0 0.5rem 0",
                  fontSize: "1.25rem",
                  fontWeight: "600"
                }}>
                  Chưa có dữ liệu
                </h3>
                <p style={{ margin: 0, color: "#94a3b8" }}>
                  Upload email đầu tiên để bắt đầu phân tích
                </p>
              </div>
            ) : (
              <div style={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                overflow: "hidden"
              }}>
                <div style={{
                  overflow: "auto",
                  maxHeight: "600px"
                }}>
                  <table style={{ 
                    width: "100%", 
                    borderCollapse: "collapse",
                    minWidth: "600px"
                  }}>
                    <thead>
                      <tr style={{ 
                        backgroundColor: "#f8fafc",
                        borderBottom: "1px solid #e2e8f0"
                      }}>
                        <th style={{ 
                          padding: "1.25rem 1.5rem",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#475569",
                          fontSize: "0.875rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em"
                        }}>
                          Phân loại
                        </th>
                        <th style={{ 
                          padding: "1.25rem 1.5rem",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#475569",
                          fontSize: "0.875rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em"
                        }}>
                          Người gửi
                        </th>
                        <th style={{ 
                          padding: "1.25rem 1.5rem",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "#475569",
                          fontSize: "0.875rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em"
                        }}>
                          Chủ đề
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h, i) => (
                        <tr 
                          key={i}
                          style={{ 
                            borderBottom: "1px solid #f1f5f9",
                            transition: "background-color 0.2s ease"
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "#f8fafc";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <td style={{ 
                            padding: "1.25rem 1.5rem",
                            verticalAlign: "top"
                          }}>
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem"
                            }}>
                              <div style={{
                                width: "32px",
                                height: "32px",
                                backgroundColor: getLabelColor(h.label) + "20",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.875rem",
                                color: getLabelColor(h.label),
                                fontWeight: "600"
                              }}>
                                {getLabelIcon(h.label)}
                              </div>
                              <span
                                style={{
                                  padding: "0.375rem 0.75rem",
                                  borderRadius: "8px",
                                  fontSize: "0.75rem",
                                  fontWeight: "700",
                                  backgroundColor: getLabelColor(h.label) + "20",
                                  color: getLabelColor(h.label),
                                  border: `1px solid ${getLabelColor(h.label)}30`
                                }}
                              >
                                {h.label}
                              </span>
                            </div>
                          </td>
                          <td style={{ 
                            padding: "1.25rem 1.5rem",
                            color: "#475569",
                            fontSize: "0.9rem",
                            fontWeight: "500",
                            verticalAlign: "top"
                          }}>
                            {h.headers.from}
                          </td>
                          <td style={{ 
                            padding: "1.25rem 1.5rem",
                            color: "#1e293b",
                            fontSize: "0.9rem",
                            fontWeight: "500",
                            verticalAlign: "top"
                          }}>
                            {h.headers.subject}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}