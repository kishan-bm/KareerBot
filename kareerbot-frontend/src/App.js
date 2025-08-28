import React, { useState } from "react";
import axios from "axios";

function App() {
  const [resumeText, setResumeText] = useState("");
  const [file, setFile] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle text input submit
  const handleTextSubmit = async () => {
    if (!resumeText.trim()) return alert("Please paste your resume text.");
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/api/review-resume", {
        resumeText,
      });
      setFeedback(res.data.feedback);
    } catch (err) {
      console.error(err);
      setFeedback("❌ Error fetching feedback (text).");
    }
    setLoading(false);
  };

  // Handle file upload submit
  const handleFileSubmit = async () => {
    if (!file) return alert("Please upload a file first.");
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:5000/api/upload-resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFeedback(res.data.feedback);
    } catch (err) {
      console.error(err);
      setFeedback("❌ Error uploading file.");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "650px", margin: "40px auto", textAlign: "center" }}>
      <h1>💼 KareerBot</h1>
      <p>Get instant AI feedback on your resume</p>

      {/* Paste Resume Section */}
      <textarea
        rows="8"
        placeholder="Paste your resume here..."
        value={resumeText}
        onChange={(e) => setResumeText(e.target.value)}
        style={{ width: "100%", padding: "10px", marginBottom: "10px" }}
      />
      <br />
      <button onClick={handleTextSubmit} disabled={loading}>
        {loading ? "Analyzing..." : "Get Feedback (Text)"}
      </button>

      <hr style={{ margin: "25px 0" }} />

      {/* File Upload Section */}
      <input
        type="file"
        accept=".pdf,.docx"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <br />
      <button onClick={handleFileSubmit} disabled={loading} style={{ marginTop: "10px" }}>
        {loading ? "Analyzing..." : "Get Feedback (File)"}
      </button>

      {/* Output */}
      <div style={{ marginTop: "30px", textAlign: "left", whiteSpace: "pre-wrap" }}>
        {feedback && <h3>🔍 Feedback:</h3>}
        <p>{feedback}</p>
      </div>
    </div>
  );
}

export default App;
