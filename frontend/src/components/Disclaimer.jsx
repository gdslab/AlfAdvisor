import { useState } from 'react';
import './Disclaimer.css';

const Disclaimer = () => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="disclaimer-overlay" onClick={handleClose}>
      <div className="disclaimer-modal" onClick={(e) => e.stopPropagation()}>
        <button className="disclaimer-close-btn" onClick={handleClose}>
          &times;
        </button>
        <h1>Disclaimer</h1>
        <ul>
          <li>
            This web tool is specifically designed for alfalfa and should be used
            only on verified alfalfa fields. Results generated for other crops or
            non-crop areas are not valid.
          </li>
          <li>
            The yield and quality estimates may involve uncertainties due to data
            limitations and environmental variability. As more diverse training data
            become available, the tool's performance and accuracy are expected to
            improve.
          </li>
          <li>
            The information and predictions provided by this web platform are
            intended for research and informational purposes only. Users should not
            rely solely on these results for agricultural, financial, or management
            decisions.
          </li>
        </ul>
        <button className="disclaimer-acknowledge-btn" onClick={handleClose}>
          I Understand
        </button>
      </div>
    </div>
  );
};

export default Disclaimer;
