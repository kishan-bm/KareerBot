import React, { useState } from "react";
import axios from "axios";

function App() {
  const [resumeText, setResumeText] = useState("");
  const [file, setFile] = useState(null);
  const [textFeedback, setTextFeedback] = useState(null);
  const [fileFeedback, setFileFeedback] = useState(null);
  const [loadingText, setLoadingText] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);

  // Handle text input submit
  const handleTextSubmit = async () => {
    if (!resumeText.trim()) return alert("Please paste your resume text.");
    setLoadingText(true);
    setTextFeedback(null);
    try {
      const res = await axios.post("http://localhost:5000/api/review-resume", {
        resumeText,
      });
      setTextFeedback(res.data.feedback || res.data); // backend returns { feedback }
    } catch (err) {
      console.error(err);
      setTextFeedback("❌ Error fetching feedback (text).");
    }
    setLoadingText(false);
  };

  // Handle file upload submit
  const handleFileSubmit = async () => {
    if (!file) return alert("Please upload a file first.");
    setLoadingFile(true);
    setFileFeedback(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:5000/api/upload-resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFileFeedback(res.data.feedback || res.data);
    } catch (err) {
      console.error(err);
      setFileFeedback("❌ Error uploading file.");
    }
    setLoadingFile(false);
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
      <button onClick={handleTextSubmit} disabled={loadingText}>
        {loadingText ? "Analyzing..." : "Get Feedback (Text)"}
      </button>

      {/* Output for Text */}
      <div style={{ marginTop: "20px", textAlign: "left" }}>
        {textFeedback && (
          <>
            <h3>🔍 Feedback (Text):</h3>
            {typeof textFeedback === "string" ? (
              <div>{textFeedback}</div>
            ) : (
              <>
                {textFeedback.strengths && (
                  <div>
                    <h4>💪 Strengths</h4>
                    <ul>
                      {textFeedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {textFeedback.improvements && (
                  <div>
                    <h4>⚡ Improvements</h4>
                    <ul>
                      {textFeedback.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                    </ul>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <hr style={{ margin: "25px 0" }} />

      {/* File Upload Section */}
      <input
        type="file"
        accept=".pdf,.docx"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <br />
      <button onClick={handleFileSubmit} disabled={loadingFile} style={{ marginTop: "10px" }}>
        {loadingFile ? "Analyzing..." : "Get Feedback (File)"}
      </button>

      {/* Output for File */}
      <div style={{ marginTop: "20px", textAlign: "left" }}>
        {fileFeedback && (
          <>
            <h3>🔍 Feedback (File):</h3>
            {typeof fileFeedback === "string" ? (
              <div>{fileFeedback}</div>
            ) : (
              <>
                {fileFeedback.strengths && (
                  <div>
                    <h4>💪 Strengths</h4>
                    <ul>
                      {fileFeedback.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {fileFeedback.improvements && (
                  <div>
                    <h4>⚡ Improvements</h4>
                    <ul>
                      {fileFeedback.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                    </ul>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;