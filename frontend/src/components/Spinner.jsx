import React from "react";
import "../styles/Spinner.css";

function Spinner() {
  return (
    <div className="spinner-container">
      <div className="quantum-loader">
        <div className="quantum-core">
          <div className="energy-field"></div>
          <div className="particle-ring"></div>
          <div className="quantum-sphere"></div>
        </div>
        <div className="quantum-waves">
          <div className="wave"></div>
          <div className="wave"></div>
          <div className="wave"></div>
        </div>
      </div>
    </div>
  );
}

export default Spinner;
