import { useEffect, useState } from "react";

export default function App() {
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const res = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      setResults(data);
      fetchHistory();
    } catch (error) {
      console.error("Upload error:", error);
      alert("Có lỗi xảy ra khi upload file!");
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

  // Hàm đánh giá mức độ nguy hiểm - ĐÃ THÊM VÀO
  const calculateRiskLevel = (result) => {
    let riskScore = 0;
    let factors = [];

    // Cơ sở tính điểm rủi ro
    if (result.label === "Phishing") riskScore += 80;
    else if (result.label === "Spam") riskScore += 60;
    else if (result.label === "Hoax") riskScore += 70;
    else if (result.label === "Clean") riskScore += 10;

    // Điểm từ các cảnh báo
    if (result.spoof_warnings && result.spoof_warnings.length > 0) {
      riskScore += result.spoof_warnings.length * 15;
      factors.push(`${result.spoof_warnings.length} cảnh báo giả mạo`);
    }

    if (result.urls && result.urls.filter(u => u.status !== "safe").length > 0) {
      const dangerousUrls = result.urls.filter(u => u.status !== "safe");
      riskScore += dangerousUrls.length * 20;
      factors.push(`${dangerousUrls.length} URL độc hại`);
    }

    if (result.signs && result.signs.filter(s => s.type === "template").length > 0) {
      const phishingTemplates = result.signs.filter(s => s.type === "template");
      riskScore += phishingTemplates.length * 25;
      factors.push(`${phishingTemplates.length} template phishing`);
    }

    if (result.attachments && result.attachments.length > 0) {
      const dangerousAttachments = result.attachments.filter(a => 
        a.threat_level && a.threat_level !== "low"
      );
      riskScore += dangerousAttachments.length * 30;
      if (dangerousAttachments.length > 0) {
        factors.push(`${dangerousAttachments.length} file đính kèm nguy hiểm`);
      }
    }

    // Giới hạn điểm tối đa
    riskScore = Math.min(riskScore, 100);

    // Xác định mức độ rủi ro
    let riskLevel, riskColor, riskIcon;
    if (riskScore >= 80) {
      riskLevel = "RẤT NGUY HIỂM";
      riskColor = "#dc2626";
      riskIcon = "🔴";
    } else if (riskScore >= 60) {
      riskLevel = "NGUY HIỂM";
      riskColor = "#ef4444";
      riskIcon = "🟠";
    } else if (riskScore >= 40) {
      riskLevel = "CẢNH BÁO";
      riskColor = "#f59e0b";
      riskIcon = "🟡";
    } else if (riskScore >= 20) {
      riskLevel = "AN TOÀN MỨC THẤP";
      riskColor = "#10b981";
      riskIcon = "🟢";
    } else {
      riskLevel = "AN TOÀN";
      riskColor = "#059669";
      riskIcon = "✅";
    }

    return {
      score: riskScore,
      level: riskLevel,
      color: riskColor,
      icon: riskIcon,
      factors: factors
    };
  };

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

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case "blacklisted": return "#ef4444";
      case "suspicious": return "#f59e0b";
      case "safe": return "#10b981";
      case "malicious": return "#dc2626";
      case "suspicious_file": return "#d97706";
      default: return "#6b7280";
    }
  };

  const getThreatLevel = (threatLevel) => {
    switch(threatLevel?.toLowerCase()) {
      case "high": return "#dc2626";
      case "medium": return "#d97706";
      case "low": return "#f59e0b";
      default: return "#6b7280";
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const fileInput = document.getElementById('file-input');
      const dataTransfer = new DataTransfer();
      for (let i = 0; i < files.length; i++) {
        if (files[i].name.endsWith('.eml')) {
          dataTransfer.items.add(files[i]);
        }
      }
      fileInput.files = dataTransfer.files;
      if (dataTransfer.files.length > 0) {
        handleUpload({ target: { files: dataTransfer.files } });
      }
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh",
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
            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            borderRadius: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
            boxShadow: "0 8px 20px rgba(59, 130, 246, 0.3)"
          }}>
            <span style={{ fontSize: "2rem", color: "white" }}>🛡️</span>
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
            Phân tích và bảo vệ bạn khỏi email độc hại
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
          border: "1px solid #f1f5f9",
          position: "relative",
          zIndex: 10
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
                gap: "0.5rem",
                position: "relative",
                zIndex: 20
              }}
            >
              <span>{tabItem.icon}</span>
              {tabItem.label}
            </button>
          ))}
        </nav>

        {/* UPLOAD TAB */}
        {tab === "upload" && (
          <div>
            {/* Upload Section */}
            <div style={{
              backgroundColor: "white",
              padding: "2.5rem",
              borderRadius: "20px",
              boxShadow: "0 8px 40px rgba(0, 0, 0, 0.08)",
              border: "1px solid #f1f5f9",
              marginBottom: "2rem",
              position: "relative"
            }}>
              <div 
                style={{
                  border: `2px dashed ${isDragging ? "#3b82f6" : "#cbd5e1"}`,
                  borderRadius: "16px",
                  padding: "4rem 2rem",
                  textAlign: "center",
                  backgroundColor: isDragging ? "#eff6ff" : "#f8fafc",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  position: "relative"
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input 
                  id="file-input"
                  type="file" 
                  multiple 
                  accept=".eml" 
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
                  backgroundColor: isDragging ? "#3b82f6" : "#e2e8f0",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1.5rem",
                  fontSize: "2rem",
                  transition: "all 0.3s ease",
                  color: isDragging ? "white" : "#64748b"
                }}>
                  {isLoading ? "⏳" : (isDragging ? "📂" : "📁")}
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
                  Kéo thả file .eml hoặc click để chọn nhiều file
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
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div style={{ marginBottom: "2rem" }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "1.5rem",
                  padding: "1rem 1.5rem",
                  backgroundColor: "white",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)"
                }}>
                  <h2 style={{
                    color: "#1e293b",
                    margin: 0,
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}>
                    <span>📨</span> Kết quả phân tích ({results.length} email)
                  </h2>
                  <div style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "0.875rem"
                  }}>
                    {results.filter(r => r.label === "Clean").length} an toàn • {results.filter(r => r.label !== "Clean").length} cảnh báo
                  </div>
                </div>

                {results.map((result, index) => {
                  const riskAssessment = calculateRiskLevel(result);
                  
                  return (
                  <div key={index} style={{
                    backgroundColor: "white",
                    padding: "2rem",
                    borderRadius: "16px",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                    border: "1px solid #f1f5f9",
                    marginBottom: "1.5rem"
                  }}>
                    {/* Result Header với Đánh giá rủi ro */}
                    <div style={{
                      padding: "1.5rem",
                      borderRadius: "12px",
                      backgroundColor: getLabelColor(result.label) + "10",
                      border: `2px solid ${getLabelColor(result.label)}`,
                      marginBottom: "2rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{
                          width: "50px",
                          height: "50px",
                          backgroundColor: getLabelColor(result.label),
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.25rem",
                          color: "white"
                        }}>
                          {getLabelIcon(result.label)}
                        </div>
                        <div>
                          <h2 style={{
                            margin: "0 0 0.25rem 0",
                            color: getLabelColor(result.label),
                            fontSize: "1.5rem",
                            fontWeight: "700"
                          }}>
                            {result.label}
                          </h2>
                          <p style={{
                            margin: 0,
                            color: "#64748b",
                            fontWeight: "500"
                          }}>
                            {result.filename}
                          </p>
                        </div>
                      </div>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem"
                      }}>
                        {/* Đánh giá mức độ nguy hiểm */}
                        <div style={{
                          padding: "0.75rem 1rem",
                          backgroundColor: riskAssessment.color + "20",
                          borderRadius: "10px",
                          border: `2px solid ${riskAssessment.color}`,
                          textAlign: "center"
                        }}>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginBottom: "0.25rem"
                          }}>
                            <span style={{ fontSize: "1.25rem" }}>{riskAssessment.icon}</span>
                            <div style={{
                              color: riskAssessment.color,
                              fontWeight: "700",
                              fontSize: "0.8rem"
                            }}>
                              {riskAssessment.level}
                            </div>
                          </div>
                          <div style={{
                            color: riskAssessment.color,
                            fontWeight: "800",
                            fontSize: "1.1rem"
                          }}>
                            {riskAssessment.score}/100
                          </div>
                        </div>
                        
                        <div style={{
                          padding: "0.5rem 1rem",
                          backgroundColor: getLabelColor(result.label) + "20",
                          color: getLabelColor(result.label),
                          borderRadius: "8px",
                          fontWeight: "600",
                          fontSize: "0.875rem"
                        }}>
                          Email #{index + 1}
                        </div>
                      </div>
                    </div>

                    {/* Risk Assessment Summary */}
                    <div style={{
                      backgroundColor: "#f8fafc",
                      padding: "1.5rem",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      marginBottom: "2rem"
                    }}>
                      <h3 style={{
                        color: "#1e293b",
                        marginBottom: "1rem",
                        fontSize: "1.25rem",
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem"
                      }}>
                        <span>📊</span> Đánh giá mức độ nguy hiểm
                      </h3>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "1rem"
                      }}>
                        <div style={{
                          padding: "1rem",
                          backgroundColor: "white",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0"
                        }}>
                          <div style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                            Điểm rủi ro
                          </div>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem"
                          }}>
                            <div style={{
                              width: "60px",
                              height: "8px",
                              backgroundColor: "#e2e8f0",
                              borderRadius: "4px",
                              overflow: "hidden"
                            }}>
                              <div style={{
                                width: `${riskAssessment.score}%`,
                                height: "100%",
                                backgroundColor: riskAssessment.color,
                                borderRadius: "4px",
                                transition: "width 0.3s ease"
                              }} />
                            </div>
                            <span style={{
                              color: riskAssessment.color,
                              fontWeight: "700",
                              fontSize: "1.1rem"
                            }}>
                              {riskAssessment.score}
                            </span>
                          </div>
                        </div>

                        <div style={{
                          padding: "1rem",
                          backgroundColor: "white",
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0"
                        }}>
                          <div style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                            Mức độ
                          </div>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem"
                          }}>
                            <span style={{ fontSize: "1.25rem" }}>{riskAssessment.icon}</span>
                            <span style={{
                              color: riskAssessment.color,
                              fontWeight: "600",
                              fontSize: "0.9rem"
                            }}>
                              {riskAssessment.level}
                            </span>
                          </div>
                        </div>

                        {riskAssessment.factors.length > 0 && (
                          <div style={{
                            padding: "1rem",
                            backgroundColor: "white",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0"
                          }}>
                            <div style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                              Yếu tố rủi ro
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                              {riskAssessment.factors.map((factor, i) => (
                                <div key={i} style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                  fontSize: "0.8rem",
                                  color: "#475569"
                                }}>
                                  <span style={{ color: "#ef4444" }}>•</span>
                                  {factor}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Security Analysis Grid */}
                    <div style={{ 
                      display: "grid", 
                      gap: "2rem",
                      gridTemplateColumns: "1fr 1fr",
                      alignItems: "start",
                      marginBottom: "2rem"
                    }}>
                      
                      {/* Left Column - Basic Info */}
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
                                  {result.headers?.from || "Không có thông tin"}
                                </div>
                              </div>
                              <div>
                                <div style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.25rem" }}>
                                  TO
                                </div>
                                <div style={{ color: "#1e293b", fontWeight: "500" }}>
                                  {result.headers?.to || "Không có thông tin"}
                                </div>
                              </div>
                              <div>
                                <div style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.25rem" }}>
                                  SUBJECT
                                </div>
                                <div style={{ color: "#1e293b", fontWeight: "500" }}>
                                  {result.headers?.subject || "Không có thông tin"}
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
                            {result.signs && result.signs.length > 0 ? (
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
                                      {typeof s === 'string' ? s : JSON.stringify(s)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ 
                                textAlign: "center", 
                                color: "#64748b",
                                padding: "2rem"
                              }}>
                                Không có dấu hiệu nhận diện
                              </div>
                            )}
                          </div>
                        </section>
                      </div>

                      {/* Right Column - Security Warnings */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                        {/* Spoof Warnings */}
                        {result.spoof_warnings && result.spoof_warnings.length > 0 && (
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
                              <span>🚨</span> Cảnh báo giả mạo
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

                        {/* URL Warnings */}
                        {result.urls && result.urls.filter(u => u.status !== "safe").length > 0 && (
                          <section>
                            <h3 style={{
                              color: "#d97706",
                              marginBottom: "1rem",
                              fontSize: "1.25rem",
                              fontWeight: "700",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem"
                            }}>
                              <span>🌐</span> Cảnh báo URL độc hại
                            </h3>
                            <div style={{
                              backgroundColor: "#fffbeb",
                              padding: "1.5rem",
                              borderRadius: "12px",
                              border: "1px solid #fed7aa"
                            }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {result.urls.filter(u => u.status !== "safe").map((url, i) => (
                                  <div key={i} style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "0.75rem",
                                    padding: "1rem",
                                    backgroundColor: "#fffbeb",
                                    borderRadius: "8px",
                                    border: "1px solid #fed7aa"
                                  }}>
                                    <span style={{ 
                                      color: getStatusColor(url.status), 
                                      flexShrink: 0 
                                    }}>
                                      {url.status === "BLACKLISTED" ? "🔴" : "🟡"}
                                    </span>
                                    <div>
                                      <div style={{ 
                                        color: getStatusColor(url.status), 
                                        fontWeight: "600",
                                        marginBottom: "0.25rem"
                                      }}>
                                        {url.url}
                                      </div>
                                      <div style={{ 
                                        color: getStatusColor(url.status), 
                                        fontSize: "0.8rem",
                                        fontWeight: "500"
                                      }}>
                                        Trạng thái: {url.status}
                                        {url.reason && ` - ${url.reason}`}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </section>
                        )}

                        {/* Template Phishing Detection */}
                        {result.signs && result.signs.filter(s => s.type === "template").length > 0 && (
                          <section>
                            <h3 style={{
                              color: "#7c3aed",
                              marginBottom: "1rem",
                              fontSize: "1.25rem",
                              fontWeight: "700",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem"
                            }}>
                              <span>🛡️</span> Phát hiện template phishing
                            </h3>
                            <div style={{
                              backgroundColor: "#faf5ff",
                              padding: "1.5rem",
                              borderRadius: "12px",
                              border: "1px solid #e9d5ff"
                            }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {result.signs.filter(s => s.type === "template").map((template, i) => (
                                  <div key={i} style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "0.75rem",
                                    padding: "1rem",
                                    backgroundColor: "#faf5ff",
                                    borderRadius: "8px",
                                    border: "1px solid #e9d5ff"
                                  }}>
                                    <span style={{ color: "#7c3aed", flexShrink: 0 }}>🎯</span>
                                    <div>
                                      <div style={{ 
                                        color: "#7c3aed", 
                                        fontWeight: "600",
                                        marginBottom: "0.25rem"
                                      }}>
                                        {template.name}
                                      </div>
                                      <div style={{ 
                                        color: "#7c3aed", 
                                        fontSize: "0.8rem"
                                      }}>
                                        Độ khớp: <strong>{template.score}%</strong>
                                        {template.description && ` - ${template.description}`}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </section>
                        )}

                        {/* File Attachment Scan */}
                        {result.attachments && result.attachments.length > 0 && (
                          <section>
                            <h3 style={{
                              color: "#059669",
                              marginBottom: "1rem",
                              fontSize: "1.25rem",
                              fontWeight: "700",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem"
                            }}>
                              <span>📎</span> Scan file đính kèm
                            </h3>
                            <div style={{
                              backgroundColor: "#f0fdf4",
                              padding: "1.5rem",
                              borderRadius: "12px",
                              border: "1px solid #bbf7d0"
                            }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                {result.attachments.map((attachment, i) => (
                                  <div key={i} style={{
                                    padding: "1rem",
                                    backgroundColor: "white",
                                    borderRadius: "8px",
                                    border: "1px solid #dcfce7"
                                  }}>
                                    {/* File Info */}
                                    <div style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      marginBottom: "0.75rem"
                                    }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                        <span style={{ fontSize: "1.25rem" }}>
                                          {attachment.filename?.includes('.exe') ? '💻' : 
                                           attachment.filename?.includes('.zip') ? '📦' :
                                           attachment.filename?.includes('.pdf') ? '📄' :
                                           attachment.filename?.includes('.doc') ? '📝' : '📎'}
                                        </span>
                                        <div>
                                          <div style={{ 
                                            fontWeight: "600", 
                                            color: "#1e293b",
                                            fontSize: "0.9rem"
                                          }}>
                                            {attachment.filename || "Unknown file"}
                                          </div>
                                          <div style={{ 
                                            color: "#64748b", 
                                            fontSize: "0.75rem" 
                                          }}>
                                            {attachment.mime_type || "Unknown type"} • {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : "Unknown size"}
                                          </div>
                                        </div>
                                      </div>
                                      {attachment.threat_level && (
                                        <span style={{
                                          padding: "0.25rem 0.5rem",
                                          borderRadius: "6px",
                                          fontSize: "0.7rem",
                                          fontWeight: "700",
                                          backgroundColor: getThreatLevel(attachment.threat_level) + "20",
                                          color: getThreatLevel(attachment.threat_level),
                                          border: `1px solid ${getThreatLevel(attachment.threat_level)}30`
                                        }}>
                                          {attachment.threat_level.toUpperCase()}
                                        </span>
                                      )}
                                    </div>

                                    {/* Scan Results */}
                                    {attachment.scan_results && (
                                      <div style={{
                                        marginTop: "0.5rem",
                                        padding: "0.75rem",
                                        backgroundColor: "#f8fafc",
                                        borderRadius: "6px",
                                        border: "1px solid #e2e8f0"
                                      }}>
                                        <div style={{ 
                                          fontSize: "0.8rem", 
                                          fontWeight: "600",
                                          color: "#475569",
                                          marginBottom: "0.5rem"
                                        }}>
                                          Kết quả scan:
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                          {attachment.scan_results.detections > 0 ? (
                                            <div style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "0.5rem",
                                              color: "#dc2626",
                                              fontSize: "0.75rem"
                                            }}>
                                              <span>🔴</span>
                                              <span>Phát hiện {attachment.scan_results.detections} mối đe dọa</span>
                                            </div>
                                          ) : (
                                            <div style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "0.5rem",
                                              color: "#059669",
                                              fontSize: "0.75rem"
                                            }}>
                                              <span>✅</span>
                                              <span>File an toàn</span>
                                            </div>
                                          )}
                                          {attachment.scan_results.engines && (
                                            <div style={{
                                              color: "#64748b",
                                              fontSize: "0.7rem"
                                            }}>
                                              Quét bởi {attachment.scan_results.engines} engine
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Warnings */}
                                    {attachment.warnings && attachment.warnings.length > 0 && (
                                      <div style={{
                                        marginTop: "0.5rem",
                                        padding: "0.75rem",
                                        backgroundColor: "#fef2f2",
                                        borderRadius: "6px",
                                        border: "1px solid #fecaca"
                                      }}>
                                        <div style={{ 
                                          fontSize: "0.8rem", 
                                          fontWeight: "600",
                                          color: "#dc2626",
                                          marginBottom: "0.25rem"
                                        }}>
                                          Cảnh báo:
                                        </div>
                                        {attachment.warnings.map((warning, j) => (
                                          <div key={j} style={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: "0.5rem",
                                            color: "#dc2626",
                                            fontSize: "0.75rem",
                                            marginBottom: "0.25rem"
                                          }}>
                                            <span>⚠️</span>
                                            <span>{warning}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </section>
                        )}
                      </div>
                    </div>

                    {/* Email Content - Full Width */}
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
                )})}
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
                display: "flex",
                flexDirection: "column",
                gap: "1rem"
              }}>
                {history.map((h, i) => (
                  <div key={i} style={{
                    padding: "1.5rem",
                    backgroundColor: "#f8fafc",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "all 0.3s ease"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{
                        width: "50px",
                        height: "50px",
                        backgroundColor: getLabelColor(h.label) + "20",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.25rem",
                        color: getLabelColor(h.label)
                      }}>
                        {getLabelIcon(h.label)}
                      </div>
                      <div>
                        <div style={{ 
                          fontWeight: "600", 
                          color: "#1e293b",
                          marginBottom: "0.25rem"
                        }}>
                          {h.filename}
                        </div>
                        <div style={{ 
                          fontSize: "0.875rem", 
                          color: "#64748b" 
                        }}>
                          👤 {h.headers?.from}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "0.5rem 1.25rem",
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
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}