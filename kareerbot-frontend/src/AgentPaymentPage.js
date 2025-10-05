import React, { useState } from 'react';
import './AgentPaymentPage.css';

// Import Icons
import UpiIcon from './icons/upi-icon.png';
import ScannerIcon from './icons/scanner-icon.png';
import AccountIcon from './icons/bank-icon.png';
import CopyIcon from './icons/copy-icon.png';
import UploadIcon from './icons/upload-icon.png';
// --- NEW IMPORTS FOR QR CODES ---
import QR1 from './icons/QR1.png';
import QR2 from './icons/QR2.png';
// ---------------------------------

// --- Utility function for state management (moved outside main component)
// This is used by all detail panels for file upload and confirmation
const usePaymentState = (method) => {
    const [receiptFile, setReceiptFile] = useState(null);
    const [isUploaded, setIsUploaded] = useState(false);
    
    const handleFileChange = (event) => {
        if (event.target.files.length > 0) {
            setReceiptFile(event.target.files[0]);
            setIsUploaded(true);
        }
    };
    
    return { receiptFile, isUploaded, handleFileChange, setIsUploaded, setReceiptFile };
};
// ---------------------------------

// --- Main Payment Page Component (Exports this) ---
const AgentPaymentPage = ({ orderSummary, totalDue, onConfirmPayment }) => {
    const [activeDetailPanel, setActiveDetailPanel] = useState(null);

    // -------------------- UPI Detail Panel (UNCHANGED LOGIC, using new utility hook) --------------------
    const UpiDetailPanel = ({ onConfirmPayment }) => {
        const { receiptFile, isUploaded, handleFileChange } = usePaymentState('upi');

        const handleCopy = (upiId) => {
            navigator.clipboard.writeText(upiId);
        };

        const handleFinalConfirmation = () => {
            if (!receiptFile) {
                alert("Please upload your payment receipt/screenshot.");
                return;
            }
            onConfirmPayment('upi');
        };

        const upiIds = [
            { id: 'agentpay.01@bankname', name: 'AgentPay Primary' },
            { id: 'agentpay.02@otherbank', name: 'AgentPay Secondary' },
            { id: 'agentpay.03@otherbank', name: 'AgentPay Secondary' }
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
                    <label htmlFor="receipt-upload-upi" className={`upload-label ${isUploaded ? 'uploaded' : ''}`}>
                        <img src={UploadIcon} alt="Upload" className="upload-icon-lg" />
                        <p className="upload-text">
                            {isUploaded ? `Receipt Uploaded: ${receiptFile.name}` : 'Upload Payment Receipt/Screenshot'}
                        </p>
                        <input
                            type="file"
                            id="receipt-upload-upi"
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>

                <button
                    onClick={handleFinalConfirmation}
                    className="confirm-payment-btn detail-confirm-btn"
                    disabled={!isUploaded}
                >
                    Confirm Payment
                </button>
            </div>
        );
    };

    // -------------------- SCANNER DETAIL PANEL (UPDATED FOR POPUP LOGIC) --------------------
    const ScannerDetailPanel = ({ onConfirmPayment }) => {
        const { receiptFile, isUploaded, handleFileChange } = usePaymentState('scanner');
        // State to track which QR code is selected (null, 'primary', or 'secondary')
        const [activeQr, setActiveQr] = useState(null); 

        const qrCodes = [
            { key: 'primary', name: 'Payment Gateway (Primary)', status: 'High Reliability', image: QR1 },
            { key: 'secondary', name: 'Third-Party Partner', status: 'High Availability', image: QR2 },
        ];

        const handleQrClick = (key) => {
            setActiveQr(key); // Opens the popup
        };
        
        const currentQrData = qrCodes.find(qr => qr.key === activeQr);
        
        const handleFinalConfirmation = () => {
            if (!receiptFile) {
                alert("Please upload your payment receipt/screenshot.");
                return;
            }
            onConfirmPayment('scanner');
        };

        return (
            <div className="detail-panel">
                <h3 className="detail-title">Pay via QR Scanner</h3>
                <p className="detail-subtitle">Select a payment option below to generate the QR code.</p>

                <div className="qr-code-list">
                    {qrCodes.map((qr) => (
                        // Clickable card to open the QR pop-up
                        <div 
                            key={qr.key} 
                            className={`qr-option-card ${activeQr === qr.key ? 'active-qr-option' : ''}`}
                            onClick={() => handleQrClick(qr.key)}
                        >
                            <div className="qr-option-info">
                                <p className="qr-name">{qr.name}</p>
                                <p className="qr-status">{qr.status}</p>
                            </div>
                            <span className="qr-arrow">→</span>
                        </div>
                    ))}
                </div>

                {/* --- QR Code POP-UP Overlay (Conditional Rendering) --- */}
                {activeQr && currentQrData && (
                    // Click the overlay background to close the popup
                    <div className="qr-popup-overlay" onClick={() => setActiveQr(null)}>
                        {/* Prevent clicks inside the content from closing the popup */}
                        <div className="qr-popup-content" onClick={e => e.stopPropagation()}>
                            <button className="qr-popup-close" onClick={() => setActiveQr(null)}>X</button>
                            <h4 className="qr-popup-title">Scan {currentQrData.name}</h4>
                            
                            <div className="qr-image-display">
                                <img src={currentQrData.image} alt={`${currentQrData.name} QR Code`} className="large-qr-image" />
                            </div>
                            <p className="qr-popup-instruction">Scan this code using any UPI or banking app.</p>
                        </div>
                    </div>
                )}
                {/* --- END QR Code POP-UP Overlay --- */}

                <div className="upload-section">
                    <label htmlFor="proof-upload-scanner" className={`upload-label ${isUploaded ? 'uploaded' : ''}`}>
                        <img src={UploadIcon} alt="Upload" className="upload-icon-lg" />
                        <span className="upload-text">
                            {isUploaded ? `File Uploaded: ${receiptFile.name}` : 'Upload Screenshot of Payment'}
                        </span>
                        <input
                            type="file"
                            id="proof-upload-scanner"
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>

                <button
                    className="confirm-payment-btn detail-confirm-btn"
                    disabled={!isUploaded}
                    onClick={handleFinalConfirmation}
                >
                    Confirm Payment 
                </button>
            </div>
        );
    };

    // -------------------- ACCOUNT DETAIL PANEL (UPDATED FOR SCROLLING) --------------------
    const AccountDetailPanel = ({ onConfirmPayment }) => {
        const { receiptFile, isUploaded, handleFileChange } = usePaymentState('account');

        const handleCopy = (text) => {
            navigator.clipboard.writeText(text);
            // Optional: Show copy success feedback
        };

        const bankAccounts = [
            { 
                name: 'HDFC BANK', status: 'Standard', 
                account: '11223344556677', ifsc: 'HDFC0001234', 
                holder: 'Company Name Tech', branch: 'Mumbai Branch' 
            },
            { 
                name: 'SBI BANK', status: 'Alternative', 
                account: '65432109876543', ifsc: 'SBI0009988', 
                holder: 'Company Name Tech', branch: 'Chennai Branch' 
            }
        ];
        
        const handleFinalConfirmation = () => {
            if (!receiptFile) {
                alert("Please upload your transaction proof.");
                return;
            }
            onConfirmPayment('account');
        };

        return (
            <div className="detail-panel">
                <h3 className="detail-title">Direct Bank Transfer (NEFT/IMPS)</h3>
                <p className="detail-subtitle">Select a bank to view account details for transfer.</p>

                {/* --- SCROLLABLE CONTAINER ADDED HERE --- */}
                <div className="scrollable-content-area"> 
                    <div className="bank-account-list">
                        {bankAccounts.map((bank, index) => (
                            <details key={index} className="bank-details-accordion">
                                <summary className="bank-summary">
                                    <span className="bank-name">{bank.name}</span>
                                    <span className="bank-status">{bank.status}</span>
                                </summary>
                                <div className="account-details-content">
                                    <div className="account-detail-row">
                                        <span className="detail-label">A/C Number:</span>
                                        <span className="detail-value">{bank.account}</span>
                                        <button className="copy-btn" onClick={() => handleCopy(bank.account)}>
                                            <img src={CopyIcon} alt="Copy" className="copy-icon" />
                                        </button>
                                    </div>
                                    <div className="account-detail-row">
                                        <span className="detail-label">IFSC Code:</span>
                                        <span className="detail-value">{bank.ifsc}</span>
                                        <button className="copy-btn" onClick={() => handleCopy(bank.ifsc)}>
                                            <img src={CopyIcon} alt="Copy" className="copy-icon" />
                                        </button>
                                    </div>
                                    <div className="account-detail-row">
                                        <span className="detail-label">Holder Name:</span>
                                        <span className="detail-value">{bank.holder}</span>
                                    </div>
                                    <div className="account-detail-row">
                                        <span className="detail-label">Branch:</span>
                                        <span className="detail-value">{bank.branch}</span>
                                    </div>
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
                {/* --- END SCROLLABLE CONTAINER --- */}

                <div className="upload-section">
                    <label htmlFor="proof-upload-account" className={`upload-label ${isUploaded ? 'uploaded' : ''}`}>
                        <img src={UploadIcon} alt="Upload" className="upload-icon-lg" />
                        <span className="upload-text">
                            {isUploaded ? `File Uploaded: ${receiptFile.name}` : 'Upload Transaction Reference Proof'}
                        </span>
                        <input
                            type="file"
                            id="proof-upload-account"
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>

                <button
                    className="confirm-payment-btn detail-confirm-btn"
                    disabled={!isUploaded}
                    onClick={handleFinalConfirmation}
                >
                    Confirm Payment
                </button>
            </div>
        );
    };

    // -------------------- Render Selected Detail Panel --------------------
    const renderDetailPanel = () => {
        // Pass the onConfirmPayment prop down to the detail components
        switch (activeDetailPanel) {
            case 'upi':
                return <UpiDetailPanel onConfirmPayment={onConfirmPayment} />;
            case 'scanner':
                return <ScannerDetailPanel onConfirmPayment={onConfirmPayment} />;
            case 'account':
                return <AccountDetailPanel onConfirmPayment={onConfirmPayment} />;
            default:
                return null;
        }
    };

    // -------------------- Main JSX --------------------
    return (
        <div className="payment-page-container">
            <div className={`payment-card-wrapper ${activeDetailPanel ? 'shifted' : ''}`}>
                <div className="payment-card">
                    <h2 className="payment-title">Complete Your Purchase</h2>
                    <p className="payment-subtitle">Unlock your dedicated career partner.</p>

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

            {activeDetailPanel && (
                <div className="detail-panel-wrapper">
                    {renderDetailPanel()}
                </div>
            )}
        </div>
    );
};

export default AgentPaymentPage;


// import React, { useState } from 'react';
// import './AgentPaymentPage.css';

// // Import Icons
// import UpiIcon from './icons/upi-icon.png';
// import ScannerIcon from './icons/scanner-icon.png';
// import AccountIcon from './icons/bank-icon.png';
// import CopyIcon from './icons/copy-icon.png';
// import UploadIcon from './icons/upload-icon.png';

// // --- Main Payment Page Component ---
// const AgentPaymentPage = ({ orderSummary, totalDue, onConfirmPayment }) => {
//     const [activeDetailPanel, setActiveDetailPanel] = useState(null);

//     // -------------------- UPI Detail Panel --------------------
//     const UpiDetailPanel = () => {
//         const [receiptFile, setReceiptFile] = useState(null);
//         const [isUploaded, setIsUploaded] = useState(false);

//         const handleCopy = (upiId) => {
//             navigator.clipboard.writeText(upiId);
//         };

//         const handleFileChange = (event) => {
//             if (event.target.files.length > 0) {
//                 setReceiptFile(event.target.files[0]);
//                 setIsUploaded(true);
//             }
//         };

//         const handleFinalConfirmation = () => {
//             if (!receiptFile) {
//                 alert("Please upload your payment receipt/screenshot.");
//                 return;
//             }
//             onConfirmPayment('upi');
//         };

//         const upiIds = [
//             { id: 'agentpay.01@bankname', name: 'AgentPay Primary' },
//             { id: 'agentpay.02@otherbank', name: 'AgentPay Secondary' },
//             { id: 'agentpay.03@otherbank', name: 'AgentPay Secondary' }
//         ];

//         return (
//             <div className="detail-panel">
//                 <h3 className="detail-title">Pay via UPI App</h3>
//                 <p className="detail-subtitle">Use any UPI app (GPay, PhonePe, Paytm, etc.) to pay this amount.</p>

//                 <div className="upi-id-list">
//                     {upiIds.map((upi) => (
//                         <div key={upi.id} className="upi-id-item">
//                             <div className="upi-id-info">
//                                 <span className="upi-name">{upi.name}</span>
//                                 <span className="upi-id">{upi.id}</span>
//                             </div>
//                             <button className="copy-btn" onClick={() => handleCopy(upi.id)}>
//                                 <img src={CopyIcon} alt="Copy" className="copy-icon" />
//                             </button>
//                         </div>
//                     ))}
//                 </div>

//                 <div className="upload-section">
//                     <label htmlFor="receipt-upload" className={`upload-label ${isUploaded ? 'uploaded' : ''}`}>
//                         <img src={UploadIcon} alt="Upload" className="upload-icon-lg" />
//                         <p className="upload-text">
//                             {isUploaded ? `Receipt Uploaded: ${receiptFile.name}` : 'Upload Payment Receipt/Screenshot'}
//                         </p>
//                         <input
//                             type="file"
//                             id="receipt-upload"
//                             accept="image/*,.pdf"
//                             onChange={handleFileChange}
//                             style={{ display: 'none' }}
//                         />
//                     </label>
//                 </div>

//                 <button
//                     onClick={handleFinalConfirmation}
//                     className="confirm-payment-btn detail-confirm-btn"
//                     disabled={!isUploaded}
//                 >
//                     Confirm Payment
//                 </button>
//             </div>
//         );
//     };

//     // -------------------- SCANNER DETAIL PANEL --------------------
//     const ScannerDetailPanel = () => {
//         const [isUploaded, setIsUploaded] = useState(false);
//         const [proofFile, setProofFile] = useState(null);

//         const handleFileChange = (event) => {
//             if (event.target.files.length > 0) {
//                 setProofFile(event.target.files[0]);
//                 setIsUploaded(true);
//             }
//         };

//         return (
//             <div className="detail-panel">
//                 <h3 className="detail-title">Pay via QR Scanner</h3>
//                 <p className="detail-subtitle">Scan the QR code below using any UPI app or Net Banking app.</p>

//                 <div className="qr-code-list">
//                     <div className="qr-code-item">
//                         <div className="qr-image-placeholder">
//                             <p>QR Code 1</p>
//                         </div>
//                         <div className="qr-code-info">
//                             <p className="qr-name">Payment Gateway (Primary)</p>
//                             <p className="qr-status">High Reliability</p>
//                         </div>
//                     </div>

//                     <div className="qr-code-item">
//                         <div className="qr-image-placeholder secondary">
//                             <p>QR Code 2</p>
//                         </div>
//                         <div className="qr-code-info">
//                             <p className="qr-name">Third-Party Partner</p>
//                             <p className="qr-status">High Availability</p>
//                         </div>
//                     </div>
//                 </div>

//                 <div className="upload-section">
//                     <label htmlFor="proof-upload-scanner" className={`upload-label ${isUploaded ? 'uploaded' : ''}`}>
//                         <img src={UploadIcon} alt="Upload" className="upload-icon-lg" />
//                         <span className="upload-text">
//                             {isUploaded ? `File Uploaded: ${proofFile.name}` : 'Upload Screenshot of Payment'}
//                         </span>
//                         <input
//                             type="file"
//                             id="proof-upload-scanner"
//                             onChange={handleFileChange}
//                             style={{ display: 'none' }}
//                         />
//                     </label>
//                 </div>

//                 <button
//                     className="confirm-payment-btn detail-confirm-btn"
//                     disabled={!isUploaded}
//                     onClick={() => onConfirmPayment('scanner')}
//                 >
//                     Confirm Payment
//                 </button>
//             </div>
//         );
//     };

//     // -------------------- ACCOUNT DETAIL PANEL --------------------
//     const AccountDetailPanel = () => {
//         const [isUploaded, setIsUploaded] = useState(false);
//         const [proofFile, setProofFile] = useState(null);

//         const handleCopy = (text) => {
//             navigator.clipboard.writeText(text);
//         };

//         const handleFileChange = (event) => {
//             if (event.target.files.length > 0) {
//                 setProofFile(event.target.files[0]);
//                 setIsUploaded(true);
//             }
//         };

//         return (
//             <div className="detail-panel">
//                 <h3 className="detail-title">Direct Bank Transfer (NEFT/IMPS)</h3>
//                 <p className="detail-subtitle">Select a bank to view account details for transfer.</p>

//                 <div className="bank-account-list">
//                     <details className="bank-details-accordion">
//                         <summary className="bank-summary">
//                             <span className="bank-name">AXIS BANK LTD.</span>
//                             <span className="bank-status">Preferred</span>
//                         </summary>
//                         <div className="account-details-content">
//                             <div className="account-detail-row">
//                                 <span className="detail-label">A/C Number:</span>
//                                 <span className="detail-value">98765432109876</span>
//                                 <button className="copy-btn" onClick={() => handleCopy("98765432109876")}>
//                                     <img src={CopyIcon} alt="Copy" className="copy-icon" />
//                                 </button>
//                             </div>
//                             <div className="account-detail-row">
//                                 <span className="detail-label">IFSC Code:</span>
//                                 <span className="detail-value">AXIS0009876</span>
//                                 <button className="copy-btn" onClick={() => handleCopy("AXIS0009876")}>
//                                     <img src={CopyIcon} alt="Copy" className="copy-icon" />
//                                 </button>
//                             </div>
//                             <div className="account-detail-row">
//                                 <span className="detail-label">Holder Name:</span>
//                                 <span className="detail-value">Company Name Tech</span>
//                             </div>
//                             <div className="account-detail-row">
//                                 <span className="detail-label">Branch:</span>
//                                 <span className="detail-value">Bengaluru Main Branch</span>
//                             </div>
//                         </div>
//                     </details>

//                     <details className="bank-details-accordion">
//                         <summary className="bank-summary">
//                             <span className="bank-name">ICICI BANK</span>
//                             <span className="bank-status">Standard</span>
//                         </summary>
//                         <div className="account-details-content">
//                             <div className="account-detail-row">
//                                 <span className="detail-label">A/C Number:</span>
//                                 <span className="detail-value">54321098765432</span>
//                                 <button className="copy-btn" onClick={() => handleCopy("54321098765432")}>
//                                     <img src={CopyIcon} alt="Copy" className="copy-icon" />
//                                 </button>
//                             </div>
//                             <div className="account-detail-row">
//                                 <span className="detail-label">IFSC Code:</span>
//                                 <span className="detail-value">ICIC0007654</span>
//                                 <button className="copy-btn" onClick={() => handleCopy("ICIC0007654")}>
//                                     <img src={CopyIcon} alt="Copy" className="copy-icon" />
//                                 </button>
//                             </div>
//                             <div className="account-detail-row">
//                                 <span className="detail-label">Holder Name:</span>
//                                 <span className="detail-value">Company Name Tech</span>
//                             </div>
//                             <div className="account-detail-row">
//                                 <span className="detail-label">Branch:</span>
//                                 <span className="detail-value">Electronic City Branch</span>
//                             </div>
//                         </div>
//                     </details>
//                 </div>

//                 <div className="upload-section">
//                     <label htmlFor="proof-upload-account" className={`upload-label ${isUploaded ? 'uploaded' : ''}`}>
//                         <img src={UploadIcon} alt="Upload" className="upload-icon-lg" />
//                         <span className="upload-text">
//                             {isUploaded ? `File Uploaded: ${proofFile.name}` : 'Upload Transaction Reference Proof'}
//                         </span>
//                         <input
//                             type="file"
//                             id="proof-upload-account"
//                             onChange={handleFileChange}
//                             style={{ display: 'none' }}
//                         />
//                     </label>
//                 </div>

//                 <button
//                     className="confirm-payment-btn detail-confirm-btn"
//                     disabled={!isUploaded}
//                     onClick={() => onConfirmPayment('account')}
//                 >
//                     Confirm Payment
//                 </button>
//             </div>
//         );
//     };

//     // -------------------- Render Selected Detail Panel --------------------
//     const renderDetailPanel = () => {
//         switch (activeDetailPanel) {
//             case 'upi':
//                 return <UpiDetailPanel />;
//             case 'scanner':
//                 return <ScannerDetailPanel />;
//             case 'account':
//                 return <AccountDetailPanel />;
//             default:
//                 return null;
//         }
//     };

//     // -------------------- Main JSX --------------------
//     return (
//         <div className="payment-page-container">
//             <div className={`payment-card-wrapper ${activeDetailPanel ? 'shifted' : ''}`}>
//                 <div className="payment-card">
//                     <h2 className="payment-title">Complete Your Purchase</h2>
//                     <p className="payment-subtitle">Unlock your dedicated career partner.</p>

//                     <div className="order-summary-section">
//                         <h3 className="section-title">Order Summary</h3>
//                         <div className="order-item">
//                             <span>{orderSummary.item}</span>
//                             <span className="item-price">{orderSummary.price}</span>
//                         </div>
//                         <div className="order-total">
//                             <span>Total Due:</span>
//                             <span className="total-amount">{totalDue}</span>
//                         </div>
//                     </div>

//                     <div className="payment-options-section">
//                         <h3 className="section-title">Payment Method</h3>
//                         <div className="options-grid">
//                             <button
//                                 className={`payment-option-btn ${activeDetailPanel === 'upi' ? 'active' : ''}`}
//                                 onClick={() => setActiveDetailPanel('upi')}
//                             >
//                                 <img src={UpiIcon} alt="Pay by UPI" className="option-icon" />
//                                 <span>Pay by UPI</span>
//                             </button>

//                             <button
//                                 className={`payment-option-btn ${activeDetailPanel === 'scanner' ? 'active' : ''}`}
//                                 onClick={() => setActiveDetailPanel('scanner')}
//                             >
//                                 <img src={ScannerIcon} alt="Pay by Scanner" className="option-icon" />
//                                 <span>Pay by Scanner</span>
//                             </button>

//                             <button
//                                 className={`payment-option-btn ${activeDetailPanel === 'account' ? 'active' : ''}`}
//                                 onClick={() => setActiveDetailPanel('account')}
//                             >
//                                 <img src={AccountIcon} alt="Pay to Account" className="option-icon" />
//                                 <span>Pay to Account</span>
//                             </button>
//                         </div>
//                     </div>

//                     <p className="secure-payment-info">
//                         Secure payment powered by <span>[Company Name]</span>
//                     </p>
//                 </div>
//             </div>

//             {activeDetailPanel && (
//                 <div className="detail-panel-wrapper">
//                     {renderDetailPanel()}
//                 </div>
//             )}
//         </div>
//     );
// };

// export default AgentPaymentPage;
