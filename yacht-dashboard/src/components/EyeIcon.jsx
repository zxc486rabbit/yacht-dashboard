import React from "react";

// Material Design style eye icon
export default function EyeIcon({ open = false, ...props }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M1 12C2.73 7.61 7.27 4.5 12 4.5C16.73 4.5 21.27 7.61 23 12C21.27 16.39 16.73 19.5 12 19.5C7.27 19.5 2.73 16.39 1 12Z" stroke="#888" strokeWidth="2"/>
      <circle cx="12" cy="12" r="3.5" stroke="#888" strokeWidth="2"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M1 12C2.73 7.61 7.27 4.5 12 4.5C16.73 4.5 21.27 7.61 23 12C21.27 16.39 16.73 19.5 12 19.5C7.27 19.5 2.73 16.39 1 12Z" stroke="#888" strokeWidth="2"/>
      <path d="M4 4L20 20" stroke="#888" strokeWidth="2"/>
    </svg>
  );
}
