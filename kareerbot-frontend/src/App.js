import React, { useState } from "react";
import axios from "axios";

function App() {
  const [resumeText, setResumeText] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setFeedback(""); 

    try {
      const res = await axios.post("http://localhost:5000/api/review-resume", {
        resumeText,
      });
      setFeedback(res.data.feedback);
    } catch (err) {
      setFeedback("❌ Error fetching feedback. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "50px auto", textAlign: "center" }}>
      <h1>💼 KareerBot</h1>
      <textarea
        rows="10"
        cols="50"
        placeholder="Paste your resume here..."
        value={resumeText}
        onChange={(e) => setResumeText(e.target.value)}
        style={{ width: "100%", padding: "10px" }}
      />
      <br />
      <button onClick={handleSubmit} style={{ marginTop: "10px", padding: "10px 20px" }}>
        {loading ? "Analyzing..." : "Get Feedback"}
      </button>

      <div style={{ marginTop: "20px", textAlign: "left", whiteSpace: "pre-wrap" }}>
        {feedback && <h3>🔍 Feedback:</h3>}
        <p>{feedback}</p>
      </div>
    </div>
  );
}

export default App;
