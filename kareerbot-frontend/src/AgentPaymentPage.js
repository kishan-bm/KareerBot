import React, { useState } from 'react';
import './AgentPaymentPage.css'; // New CSS file for payment page

// You'll need icons for UPI, Scanner, and Account payment methods.
// Assuming they are in your src/icons folder:
import UpiIcon from './icons/upi-icon.png';       // e.g., a generic UPI icon
import ScannerIcon from './icons/scanner-icon.png'; // e.g., a camera/scanner icon
import AccountIcon from './icons/bank-icon.png';    // e.g., a bank building or account icon
import CopyIcon from './icons/copy-icon.png'; 
import UploadIcon from './icons/upload-icon.png'; 

const AgentPaymentPage = ({ orderSummary, totalDue, onConfirmPayment }) => {
  const [selectedPaymentOption, setSelectedPaymentOption] = useState('upi'); // Default to UPI

  const handlePaymentConfirmation = () => {
    // This is where you'd trigger the actual payment process
    // based on `selectedPaymentOption` and `orderSummary`
    console.log(`Confirming payment via: ${selectedPaymentOption}`);
    onConfirmPayment(selectedPaymentOption);
  };
  // --- UPI Payment Detail Component ---
const UpiDetailPanel = ({ onConfirmPayment, orderSummary, totalDue }) => {
    // State to handle the receipt file
    const [receiptFile, setReceiptFile] = useState(null);
    const [isUploaded, setIsUploaded] = useState(false);
    
    // Simulate copying the UPI ID (optional feedback logic)
    const handleCopy = (upiId) => {
        navigator.clipboard.writeText(upiId);
        alert(`Copied ${upiId} to clipboard!`);
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
        
        // Simulating success as per user instruction
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

// --- Main Payment Page Component ---
const AgentPaymentPage = ({ orderSummary, totalDue, onConfirmPayment }) => {
    // Initially set to null, so no detail panel is open
    const [activeDetailPanel, setActiveDetailPanel] = useState(null); 

    const renderDetailPanel = () => {
        switch (activeDetailPanel) {
            case 'upi':
                return <UpiDetailPanel onConfirmPayment={onConfirmPayment} orderSummary={orderSummary} totalDue={totalDue} />;
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

  return (
    <div className="payment-page-container">
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
              className={`payment-option-btn ${selectedPaymentOption === 'upi' ? 'active' : ''}`}
              onClick={() => setSelectedPaymentOption('upi')}
            >
              <img src={UpiIcon} alt="Pay by UPI" className="option-icon" />
              <span>Pay by UPI</span>
            </button>

            <button
              className={`payment-option-btn ${selectedPaymentOption === 'scanner' ? 'active' : ''}`}
              onClick={() => setSelectedPaymentOption('scanner')}
            >
              <img src={ScannerIcon} alt="Pay by Scanner" className="option-icon" />
              <span>Pay by Scanner</span>
            </button>

            <button
              className={`payment-option-btn ${selectedPaymentOption === 'account' ? 'active' : ''}`}
              onClick={() => setSelectedPaymentOption('account')}
            >
              <img src={AccountIcon} alt="Pay to Account" className="option-icon" />
              <span>Pay to Account</span>
            </button>
          </div>
        </div>

        {/* Confirmation Button */}
        <button onClick={handlePaymentConfirmation} className="confirm-payment-btn">
          Confirm & Pay
        </button>

        <p className="secure-payment-info">
          Secure payment powered by <span>[Company Name]</span>
        </p>
      </div>
    </div>
  );
};
}
export default AgentPaymentPage;