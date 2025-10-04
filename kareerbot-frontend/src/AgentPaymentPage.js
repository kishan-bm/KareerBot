import React, { useState } from 'react';
import './AgentPaymentPage.css';

// Import Icons (Ensure these paths are correct relative to AgentPaymentPage.js)
import UpiIcon from './icons/upi-icon.png';
import ScannerIcon from './icons/scanner-icon.png';
import AccountIcon from './icons/bank-icon.png';
import CopyIcon from './icons/copy-icon.png'; 
import UploadIcon from './icons/upload-icon.png'; 


// --- Main Payment Page Component (Exports this) ---
const AgentPaymentPage = ({ orderSummary, totalDue, onConfirmPayment }) => {
    // 🎯 CRITICAL CHANGE 1: Initially set to null, so no detail panel is open
    const [activeDetailPanel, setActiveDetailPanel] = useState(null); 
    
    // --- UPI Payment Detail Component (Defined internally) ---
    const UpiDetailPanel = () => {
        // State to handle the receipt file
        const [receiptFile, setReceiptFile] = useState(null);
        const [isUploaded, setIsUploaded] = useState(false);
        
        // Simulate copying the UPI ID (optional feedback logic)
        const handleCopy = (upiId) => {
            navigator.clipboard.writeText(upiId);
            // Optional: alert(`Copied ${upiId} to clipboard!`);
        };

        const handleFileChange = (event) => {
            if (event.target.files.length > 0) {
                setReceiptFile(event.target.files[0]);
                setIsUploaded(true);
            }
        };

        const handleFinalConfirmation = () => {
            if (!receiptFile) {
                alert("Please upload your payment receipt/screenshot.");
                return;
            }
            
            // Call the prop function to signal success back to AgentPage.js
            onConfirmPayment('upi'); 
        };

        const upiIds = [
            { id: 'agentpay.01@bankname', name: 'AgentPay Primary' },
            { id: 'agentpay.02@otherbank', name: 'AgentPay Secondary' },
        ];

        return (
            <div className="detail-panel">
                <h3 className="detail-title">Pay via UPI App</h3>
                <p className="detail-subtitle">Use any UPI app (GPay, PhonePe, Paytm, etc.) to pay this amount.</p>
                
                <div className="upi-id-list">
                    {upiIds.map((upi) => (
                        <div key={upi.id} className="upi-id-item">
                            <div className="upi-id-info">
                                <span className="upi-name">{upi.name}</span>
                                <span className="upi-id">{upi.id}</span>
                            </div>
                            <button className="copy-btn" onClick={() => handleCopy(upi.id)}>
                                <img src={CopyIcon} alt="Copy" className="copy-icon" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="upload-section">
                    <label htmlFor="receipt-upload" className={`upload-label ${isUploaded ? 'uploaded' : ''}`}>
                        <img src={UploadIcon} alt="Upload" className="upload-icon-lg" />
                        <p className="upload-text">
                            {isUploaded ? `Receipt Uploaded: ${receiptFile.name}` : 'Upload Payment Receipt/Screenshot'}
                        </p>
                        <input 
                            type="file" 
                            id="receipt-upload" 
                            accept="image/*,.pdf" 
                            onChange={handleFileChange} 
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>

                <button 
                    onClick={handleFinalConfirmation} 
                    className="confirm-payment-btn detail-confirm-btn"
                    disabled={!isUploaded} // Disable until file is uploaded
                >
                    Confirm Payment & Unlock Agent
                </button>
            </div>
        );
    };

    // --- Detail Panel Renderer for the selected option ---
    const renderDetailPanel = () => {
        switch (activeDetailPanel) {
            case 'upi':
                return <UpiDetailPanel />;
            case 'scanner':
                // Placeholder for Scanner Detail Panel
                return <div className="detail-panel"><h3>Scanner Payment Details (Coming Soon)</h3></div>;
            case 'account':
                // Placeholder for Account Detail Panel
                return <div className="detail-panel"><h3>Account Transfer Details (Coming Soon)</h3></div>;
            default:
                return null;
        }
    };

    // --- Main Component JSX Return ---
    return (
        <div className="payment-page-container">
            {/* Payment Card Wrapper (Left Side) 
                🎯 CRITICAL CHANGE 2: Apply 'shifted' class only when a detail panel is active */}
            <div className={`payment-card-wrapper ${activeDetailPanel ? 'shifted' : ''}`}>
                <div className="payment-card">
                    <h2 className="payment-title">Complete Your Purchase</h2>
                    <p className="payment-subtitle">Unlock your dedicated career partner.</p>

                    {/* Order Summary Section */}
                    <div className="order-summary-section">
                        <h3 className="section-title">Order Summary</h3>
                        <div className="order-item">
                            <span>{orderSummary.item}</span>
                            <span className="item-price">{orderSummary.price}</span>
                        </div>
                        <div className="order-total">
                            <span>Total Due:</span>
                            <span className="total-amount">{totalDue}</span>
                        </div>
                    </div>

                    {/* Payment Options Section */}
                    <div className="payment-options-section">
                        <h3 className="section-title">Payment Method</h3>
                        <div className="options-grid">
                            <button
                                className={`payment-option-btn ${activeDetailPanel === 'upi' ? 'active' : ''}`}
                                onClick={() => setActiveDetailPanel('upi')}
                            >
                                <img src={UpiIcon} alt="Pay by UPI" className="option-icon" />
                                <span>Pay by UPI</span>
                            </button>

                            <button
                                className={`payment-option-btn ${activeDetailPanel === 'scanner' ? 'active' : ''}`}
                                onClick={() => setActiveDetailPanel('scanner')}
                            >
                                <img src={ScannerIcon} alt="Pay by Scanner" className="option-icon" />
                                <span>Pay by Scanner</span>
                            </button>

                            <button
                                className={`payment-option-btn ${activeDetailPanel === 'account' ? 'active' : ''}`}
                                onClick={() => setActiveDetailPanel('account')}
                            >
                                <img src={AccountIcon} alt="Pay to Account" className="option-icon" />
                                <span>Pay to Account</span>
                            </button>
                        </div>
                    </div>

                    <p className="secure-payment-info">
                        Secure payment powered by <span>[Company Name]</span>
                    </p>
                </div>
            </div>
            
            {/* Detail Panel Wrapper (Right Side) 
                🎯 CRITICAL CHANGE 3: Only render this div if activeDetailPanel is NOT null */}
            {activeDetailPanel && (
                <div className="detail-panel-wrapper">
                    {renderDetailPanel()}
                </div>
            )}
        </div>
    );
};

export default AgentPaymentPage;