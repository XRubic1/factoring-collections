import React, { useState } from 'react';
import { X, AlertTriangle, FileText } from 'lucide-react';
import { ManualInstallmentClosure } from '../types';

interface ManualCloseInstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: {
    installmentNumber: number;
    dueDate: string;
    amount: number;
  };
  onCloseInstallment: (closureData: ManualInstallmentClosure) => void;
}

const ManualCloseInstallmentModal: React.FC<ManualCloseInstallmentModalProps> = ({
  isOpen,
  onClose,
  installment,
  onCloseInstallment
}) => {
  const [note, setNote] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!showWarning) {
      setShowWarning(true);
      return;
    }

    const closureData: ManualInstallmentClosure = {
      installmentNumber: installment.installmentNumber,
      dueDate: installment.dueDate,
      closedDate: new Date().toISOString().split('T')[0],
      amount: installment.amount,
      note: note.trim() || undefined
    };

    onCloseInstallment(closureData);
    onClose();
    setNote('');
    setShowWarning(false);
  };

  const handleCancel = () => {
    setNote('');
    setShowWarning(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content close-installment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Manual Close Installment</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Installment Summary */}
          <div className="installment-summary">
            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-label">Installment #</div>
                <div className="summary-value">{installment.installmentNumber}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Due Date</div>
                <div className="summary-value">{formatDate(installment.dueDate)}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Amount</div>
                <div className="summary-value">{formatCurrency(installment.amount)}</div>
              </div>
              <div className="summary-item">
                <div className="summary-label">Action</div>
                <div className="summary-value">
                  <div className="status-badge overdue">
                    Manual Closure
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!showWarning ? (
            <>
              {/* Important Notice */}
              <div className="section">
                <div className="section-header">
                  <AlertTriangle size={18} color="#f59e0b" />
                  <h3>Important Notice</h3>
                </div>
                <div className="validation-warning">
                  <p className="warning-text">
                    This action will only mark the installment as closed. It will <strong>NOT</strong> affect the loan balance or create any payment records.
                  </p>
                  <p className="warning-text" style={{ marginTop: '0.5rem' }}>
                    <strong>Proper way to close installments:</strong> Use the Dashboard to record actual payments, which will automatically close installments and update balances.
                  </p>
                </div>
              </div>

              {/* Manual Close Form */}
              <div className="section">
                <div className="section-header">
                  <FileText size={18} color="#6b7280" />
                  <h3>Manual Closure Details</h3>
                </div>
                <div className="close-installment-form">
                  <p className="form-description">
                    Add an optional note explaining why this installment is being manually closed without a payment record.
                  </p>
                  
                  <form onSubmit={handleSubmit}>
                    <div className="form-placeholder">
                      <div className="placeholder-item">
                        <label>Closure Reason (Optional)</label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className="form-input"
                          placeholder="Explain why this installment is being closed manually..."
                          rows={4}
                        />
                        <small className="form-help">
                          This note will be visible as a yellow question mark icon in the installment timeline.
                        </small>
                      </div>
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-warning"
                      >
                        Continue to Final Confirmation
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Final Warning */}
              <div className="section">
                <div className="section-header">
                  <AlertTriangle size={18} color="#ef4444" />
                  <h3>Final Confirmation</h3>
                </div>
                <div className="validation-warning">
                  <p className="warning-text">
                    You are about to manually close Installment #{installment.installmentNumber} without recording any payment.
                  </p>
                  <p className="warning-text" style={{ marginTop: '0.5rem' }}>
                    <strong>This action will NOT:</strong>
                  </p>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', color: '#dc2626', fontSize: '0.875rem' }}>
                    <li>Reduce the loan balance</li>
                    <li>Create any payment records</li>
                    <li>Update the loan's financial status</li>
                    <li>Affect any financial calculations</li>
                  </ul>
                  
                  {note && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
                      <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}>
                        <strong>Note:</strong> {note}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowWarning(false)}
                  className="btn-secondary"
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="btn-danger"
                >
                  Yes, Manually Close Installment
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManualCloseInstallmentModal;
