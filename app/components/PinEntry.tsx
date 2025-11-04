'use client';

import { useState } from 'react';
import './PinEntry.css';

interface PinEntryProps {
  onSuccess: () => void;
}

export default function PinEntry({ onSuccess }: PinEntryProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);

      // Auto-submit when 4 digits are entered
      if (newPin.length === 4) {
        verifyPin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  const verifyPin = async (pinToVerify: string) => {
    setIsVerifying(true);
    try {
      const response = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinToVerify }),
      });

      const data = await response.json();

      if (data.valid) {
        // Store in sessionStorage so it persists during the session
        sessionStorage.setItem('admin_authenticated', 'true');
        onSuccess();
      } else {
        setError(true);
        setPin('');
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      setError(true);
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  };

  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  return (
    <div className="pin-entry-container">
      <div className="pin-entry-card">
        <div className="pin-header">
          <h2>🔒 Admin Access</h2>
          <p>Enter 4-digit PIN</p>
        </div>

        <div className="pin-display">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`pin-dot ${i < pin.length ? 'filled' : ''} ${
                error ? 'error' : ''
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="pin-error">
            ❌ Incorrect PIN. Try again.
          </div>
        )}

        {isVerifying && (
          <div className="pin-verifying">
            🔄 Verifying...
          </div>
        )}

        <div className="number-pad">
          {numbers.map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              className="number-btn"
              disabled={isVerifying}
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleBackspace}
            className="number-btn backspace-btn"
            disabled={isVerifying || pin.length === 0}
          >
            ⌫
          </button>
          <button
            onClick={handleClear}
            className="number-btn clear-btn"
            disabled={isVerifying || pin.length === 0}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
