export default function AboutUsDoc() {
    /* ---------- shared palette ---------- */
    const brand      = "#2a7d45";        // UW-Madison / agriculture-green accent
    const text       = "#222";
    const subtleText = "#555";
    const cardShadow =
      "0 3px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)";
  
    /* ---------- wrapper ---------- */
    const wrap = {
      maxWidth: 760,
      margin: "2.5rem auto",
      padding: "2rem 2.25rem",
      background: "#fff",
      borderRadius: 12,
      boxShadow: cardShadow,
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: text,
      lineHeight: 1.65,
    };
  
    /* ---------- headings & text ---------- */
    const h1 = {
      fontSize: "2.25rem",
      color: brand,
      margin: 0,
      letterSpacing: "-0.5px",
    };
  
    const h2 = {
      fontSize: "1.5rem",
      color: brand,
      margin: "1.75rem 0 0.75rem",
      borderLeft: "4px",
      paddingLeft: "0.6rem",
    };
  
    const p = {
      marginTop: "0.9rem",
      fontSize: "1rem",
    };
  
    const italicP = { ...p, fontStyle: "italic", color: subtleText };
  
    return (
      <div style={wrap}>
        <h1 style={h1}>About Us</h1>
  
        <h2 style={h2}>Project Introduction</h2>
        <p style={p}>
          <strong>AlfAdvisor</strong> is a free, publicly accessible cyber-platform
          that helps alfalfa growers make economically optimal harvest decisions.
          The tool provides user-friendly, science-based recommendations by
          explicitly incorporating crop growth &amp; quality dynamics, drying
          rates, and weather-related harvest risks. It lets growers evaluate
          different cutting strategies and create harvest plans that match their
          individual risk preferences.
        </p>
  
        <p style={p}>
          The project unites experts from the University&nbsp;of Wisconsin–Madison,
          Cornell University, and Purdue University. Our goal is to deliver
          practical value to alfalfa producers and the wider livestock industry by
          supporting data-driven forage-management decisions.
        </p>
  
        <p style={italicP}>
          Supported by the U.S. Department of Agriculture, National Institute of
          Food & Agriculture, Alfalfa & Forage Research Program
          (award&nbsp;#2021-70005-35694).
        </p>
      </div>
    );
  }
  