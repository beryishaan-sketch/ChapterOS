import React from 'react';

function getStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score === 2) return { score, label: 'Fair', color: 'bg-amber-500' };
  if (score === 3) return { score, label: 'Good', color: 'bg-yellow-500' };
  if (score === 4) return { score, label: 'Strong', color: 'bg-emerald-500' };
  return { score, label: 'Very strong', color: 'bg-emerald-600' };
}

export default function PasswordStrength({ password }) {
  if (!password) return null;
  const { score, label, color } = getStrength(password);
  const pct = (score / 5) * 100;

  return (
    <div className="mt-1.5">
      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {label && (
        <p className={`text-xs mt-1 font-medium
          ${score <= 1 ? 'text-red-500' : score === 2 ? 'text-amber-500' : score === 3 ? 'text-yellow-600' : 'text-emerald-600'}`}>
          {label}
          {score <= 2 && password.length > 0 && (
            <span className="text-gray-400 font-normal"> — add uppercase, numbers, or symbols</span>
          )}
        </p>
      )}
    </div>
  );
}
